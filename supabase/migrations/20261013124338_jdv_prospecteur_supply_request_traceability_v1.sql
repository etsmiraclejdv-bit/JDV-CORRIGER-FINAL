-- JDV CRM — demandes d'approvisionnement liées aux expéditions traçables.
-- La demande ne modifie plus le stock : seules l'expédition validée et la réception
-- contradictoire modifient les quantités. À appliquer après revue sur une base de test.

alter table public.prospecteur_supply_requests
  add column if not exists shipment_id uuid references public.prospecteur_supply_shipments(id) on delete set null;

create index if not exists idx_prospecteur_supply_requests_shipment
  on public.prospecteur_supply_requests (shipment_id)
  where shipment_id is not null;

create or replace function public.jdvcrm_create_prospecteur_supply_request_v1(
  p_warehouse_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_prospecteur_id uuid;
  v_org_id uuid;
  v_request_id uuid;
  v_item record;
  v_blocked_count integer;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_warehouse_id is null then raise exception 'Entrepôt obligatoire'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sélectionnez au moins un article'; end if;

  select p.id, p.organization_id
    into v_prospecteur_id, v_org_id
  from public.prospecteurs p
  where p.user_id = v_uid and p.status = 'active'
  limit 1;
  if v_prospecteur_id is null then raise exception 'Compte prospecteur actif introuvable'; end if;

  if not exists (
    select 1 from public.warehouses w
    where w.id = p_warehouse_id and w.organization_id = v_org_id and w.active = true
  ) then raise exception 'Entrepôt invalide ou inactif'; end if;

  if not exists (
    select 1 from public.prospecteur_warehouse_assignments a
    where a.prospecteur_id = v_prospecteur_id and a.organization_id = v_org_id
      and a.warehouse_id = p_warehouse_id and a.active = true and a.is_primary = true
  ) then raise exception 'Ce prospecteur doit utiliser son entrepôt principal affecté'; end if;

  select count(*) into v_blocked_count
  from public.prospecteur_stock_holdings h
  where h.organization_id = v_org_id and h.prospecteur_id = v_prospecteur_id
    and h.remaining_quantity > 0 and h.status in ('active','overdue') and h.return_due_at <= now();
  if v_blocked_count > 0 then
    raise exception 'Approvisionnement bloqué : une marchandise doit être retournée à l''entrepôt';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
    where x.article_id is null or x.quantity is null or x.quantity <= 0 or x.quantity <> trunc(x.quantity)
  ) then raise exception 'Quantité invalide pour un article'; end if;
  if exists (
    select x.article_id from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
    group by x.article_id having count(*) > 1
  ) then raise exception 'Regroupez les quantités : un article ne peut apparaître qu''une fois'; end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
    left join public.articles a on a.id=x.article_id and a.organization_id=v_org_id and a.active=true
    where a.id is null
  ) then raise exception 'Un article est inconnu ou inactif'; end if;

  insert into public.prospecteur_supply_requests (
    organization_id, prospecteur_id, warehouse_id, status, requested_at, notes
  ) values (
    v_org_id, v_prospecteur_id, p_warehouse_id, 'pending', now(), nullif(btrim(p_notes), '')
  ) returning id into v_request_id;

  for v_item in
    select x.article_id, x.quantity::integer as quantity
    from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
  loop
    insert into public.prospecteur_supply_request_items (
      organization_id, request_id, article_id, quantity
    ) values (v_org_id, v_request_id, v_item.article_id, v_item.quantity);
  end loop;

  return jsonb_build_object(
    'request_id', v_request_id, 'status', 'pending',
    'prospecteur_id', v_prospecteur_id, 'warehouse_id', p_warehouse_id
  );
end;
$$;

create or replace function public.jdvcrm_dispatch_prospecteur_supply_request_v1(
  p_request_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_idempotency_key uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_request public.prospecteur_supply_requests%rowtype;
  v_result jsonb;
  v_shipment_id uuid;
  v_requested integer;
  v_submitted integer;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_request_id is null then raise exception 'Demande obligatoire'; end if;
  select * into v_request from public.prospecteur_supply_requests where id=p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if not private.can_manage_warehouse(v_request.warehouse_id) then
    raise exception 'Vous ne pouvez pas préparer les demandes de cet entrepôt';
  end if;

  if v_request.shipment_id is not null then
    select count(*) into v_submitted from public.prospecteur_supply_shipment_items
    where shipment_id=v_request.shipment_id;
    return jsonb_build_object(
      'request_id', v_request.id, 'shipment_id', v_request.shipment_id,
      'shipment_number', (select s.shipment_number from public.prospecteur_supply_shipments s where s.id=v_request.shipment_id),
      'status', 'dispatched', 'already_processed', true
    );
  end if;
  if v_request.status <> 'pending' then raise exception 'Cette demande a déjà été traitée'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'Scannez les articles de la demande'; end if;

  select count(*) into v_requested from public.prospecteur_supply_request_items where request_id=v_request.id;
  select count(*) into v_submitted from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric);
  if v_requested <> v_submitted then raise exception 'Scannez toutes les références demandées, sans ajout ni omission'; end if;
  if exists (
    select 1 from public.prospecteur_supply_request_items ri
    left join jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
      on x.article_id=ri.article_id and x.quantity=ri.quantity
    where ri.request_id=v_request.id and x.article_id is null
  ) or exists (
    select 1 from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
    left join public.prospecteur_supply_request_items ri
      on ri.request_id=v_request.id and ri.article_id=x.article_id and ri.quantity=x.quantity
    where ri.id is null
  ) then raise exception 'Les quantités scannées doivent correspondre exactement à la demande'; end if;

  v_result := public.jdvcrm_dispatch_prospecteur_shipment_v1(
    v_request.warehouse_id, v_request.prospecteur_id, p_items,
    coalesce(nullif(btrim(p_notes), ''), v_request.notes), p_idempotency_key
  );
  v_shipment_id := nullif(v_result->>'shipment_id', '')::uuid;
  if v_shipment_id is null then raise exception 'Le bon d''expédition n''a pas été créé'; end if;

  update public.prospecteur_supply_requests
  set status='approved', processed_at=now(), processed_by=v_uid,
      shipment_id=v_shipment_id, updated_at=now()
  where id=v_request.id;

  return v_result || jsonb_build_object('request_id',v_request.id,'status','dispatched');
end;
$$;

drop policy if exists "prospecteur_supply_request_select" on public.prospecteur_supply_requests;
create policy "prospecteur_supply_request_select"
on public.prospecteur_supply_requests
for select to authenticated
using (
  prospecteur_id in (select p.id from public.prospecteurs p where p.user_id=(select auth.uid()))
  or exists (
    select 1 from public.organization_members om
    where om.organization_id=prospecteur_supply_requests.organization_id
      and om.user_id=(select auth.uid()) and om.status='active'
      and om.role in ('business_admin','manager','accountant','viewer')
  )
  or exists (
    select 1 from public.warehouse_users wu
    where wu.warehouse_id=prospecteur_supply_requests.warehouse_id
      and wu.user_id=(select auth.uid()) and wu.active=true
  )
);

drop policy if exists "prospecteur_supply_request_item_select" on public.prospecteur_supply_request_items;
create policy "prospecteur_supply_request_item_select"
on public.prospecteur_supply_request_items
for select to authenticated
using (
  exists (
    select 1 from public.prospecteur_supply_requests r
    where r.id=prospecteur_supply_request_items.request_id
      and (
        r.prospecteur_id in (select p.id from public.prospecteurs p where p.user_id=(select auth.uid()))
        or exists (
          select 1 from public.organization_members om
          where om.organization_id=r.organization_id and om.user_id=(select auth.uid())
            and om.status='active' and om.role in ('business_admin','manager','accountant','viewer')
        )
        or exists (
          select 1 from public.warehouse_users wu
          where wu.warehouse_id=r.warehouse_id and wu.user_id=(select auth.uid()) and wu.active=true
        )
      )
  )
);

revoke all on function public.jdvcrm_create_prospecteur_supply_request_v1(uuid,jsonb,text) from public, anon;
revoke all on function public.jdvcrm_dispatch_prospecteur_supply_request_v1(uuid,jsonb,text,uuid) from public, anon;
grant execute on function public.jdvcrm_create_prospecteur_supply_request_v1(uuid,jsonb,text) to authenticated;
grant execute on function public.jdvcrm_dispatch_prospecteur_supply_request_v1(uuid,jsonb,text,uuid) to authenticated;
