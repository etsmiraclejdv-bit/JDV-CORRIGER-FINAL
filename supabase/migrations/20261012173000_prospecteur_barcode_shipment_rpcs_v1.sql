-- JDV CRM — RPC atomiques d'expédition et d'accusé de réception.
-- À tester sur une branche/base de développement avant toute application en production.

create or replace function public.jdvcrm_warehouse_dispatch_catalog_v1(p_warehouse_id uuid)
returns table (
  article_id uuid,
  article_code text,
  article_name text,
  barcode text,
  quantity numeric,
  reserved_quantity numeric,
  available numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $
declare
  v_org uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentification requise'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then raise exception 'Accès refusé à cet entrepôt'; end if;
  select w.organization_id into v_org from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  return query
    select a.id, a.code, a.name, a.barcode,
           coalesce(wi.quantity, 0), coalesce(wi.reserved_quantity, 0),
           coalesce(wi.quantity, 0) - coalesce(wi.reserved_quantity, 0)
    from public.articles a
    left join public.warehouse_inventory wi
      on wi.article_id = a.id and wi.warehouse_id = p_warehouse_id and wi.subwarehouse_id is null
    where a.organization_id = v_org and a.active = true
    order by a.name;
end;
$;

revoke all on function public.jdvcrm_warehouse_dispatch_catalog_v1(uuid) from public, anon;
grant execute on function public.jdvcrm_warehouse_dispatch_catalog_v1(uuid) to authenticated;

create or replace function public.jdvcrm_dispatch_prospecteur_shipment_v1(
  p_warehouse_id uuid,
  p_prospecteur_id uuid,
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
  v_org uuid;
  v_number text;
  v_shipment uuid;
  v_item record;
  v_article record;
  v_available numeric;
  v_scanned_code text;
  v_device text;
  v_key uuid := coalesce(p_idempotency_key, gen_random_uuid());
  v_existing public.prospecteur_supply_shipments%rowtype;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  perform pg_advisory_xact_lock(hashtext(v_key::text));
  select * into v_existing from public.prospecteur_supply_shipments where idempotency_key = v_key;
  if found then
    if v_existing.dispatched_by <> v_uid then raise exception 'Clé d''opération déjà utilisée'; end if;
    return jsonb_build_object('shipment_id', v_existing.id, 'shipment_number', v_existing.shipment_number, 'status', v_existing.status, 'organization_id', v_existing.organization_id);
  end if;
  if p_warehouse_id is null or p_prospecteur_id is null then
    raise exception 'Entrepôt et prospecteur obligatoires';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Scannez au moins un article';
  end if;

  select p.organization_id into v_org
  from public.prospecteurs p
  where p.id = p_prospecteur_id and p.status = 'active';
  if v_org is null then raise exception 'Prospecteur actif introuvable'; end if;

  if not exists (
    select 1 from public.warehouses w
    where w.id = p_warehouse_id and w.organization_id = v_org and w.active = true
  ) then raise exception 'Entrepôt inactif ou hors organisation'; end if;

  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'Vous ne pouvez pas expédier depuis cet entrepôt';
  end if;

  if not exists (
    select 1 from public.prospecteur_warehouse_assignments a
    where a.organization_id = v_org and a.prospecteur_id = p_prospecteur_id
      and a.warehouse_id = p_warehouse_id and a.active = true
  ) then raise exception 'Ce prospecteur n''est pas affecté à cet entrepôt'; end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
    where x.article_id is null or x.quantity is null or x.quantity <= 0
      or x.quantity <> trunc(x.quantity)
  ) then raise exception 'Article ou quantité invalide'; end if;

  if exists (
    select x.article_id from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
    group by x.article_id having count(*) > 1
  ) then raise exception 'Une référence ne doit apparaître qu''une fois. Regroupez les scans par article.'; end if;

  v_number := 'JDV-EXP-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.prospecteur_supply_shipments (
    organization_id, warehouse_id, prospecteur_id, shipment_number,
    status, dispatched_by, dispatched_at, dispatch_notes, idempotency_key
  ) values (
    v_org, p_warehouse_id, p_prospecteur_id, v_number,
    'draft', v_uid, null, p_notes, v_key
  ) returning id into v_shipment;

  for v_item in
    select x.article_id, x.quantity::integer as quantity,
           nullif(btrim(x.scanned_code), '') as scanned_code,
           coalesce(x.device_type, 'unknown') as device_type
    from jsonb_to_recordset(p_items) as x(
      article_id uuid, quantity numeric, scanned_code text, device_type text
    )
  loop
    select a.id, a.code, a.barcode, a.name
      into v_article
    from public.articles a
    where a.id = v_item.article_id and a.organization_id = v_org and a.active = true;
    if v_article.id is null then raise exception 'Article inconnu ou inactif'; end if;
    if v_item.scanned_code is not null and v_item.scanned_code not in (v_article.barcode, v_article.code) then
      raise exception 'Le code scanné ne correspond pas à l''article %', v_article.name;
    end if;

    select wi.quantity - wi.reserved_quantity into v_available
    from public.warehouse_inventory wi
    where wi.organization_id = v_org and wi.warehouse_id = p_warehouse_id
      and wi.article_id = v_item.article_id and wi.subwarehouse_id is null
    for update;
    if not found or coalesce(v_available, 0) < v_item.quantity then
      raise exception 'Stock insuffisant pour % (disponible %, demandé %)',
        v_article.name, coalesce(v_available, 0), v_item.quantity;
    end if;

    insert into public.prospecteur_supply_shipment_items (
      organization_id, shipment_id, article_id, barcode_snapshot,
      article_code_snapshot, article_name_snapshot, quantity_dispatched
    ) values (
      v_org, v_shipment, v_article.id, v_article.barcode,
      v_article.code, v_article.name, v_item.quantity
    );

    update public.warehouse_inventory
      set quantity = quantity - v_item.quantity, updated_at = now()
    where organization_id = v_org and warehouse_id = p_warehouse_id
      and article_id = v_item.article_id and subwarehouse_id is null;

    insert into public.stock_movements (
      organization_id, article_id, prospecteur_id, movement_type, quantity,
      reference_type, reference_id, source_location, destination_location, notes, created_by
    ) values (
      v_org, v_item.article_id, p_prospecteur_id, 'transfer_to_prospecteur', v_item.quantity,
      'prospecteur_supply_shipment', v_shipment,
      (select w.name from public.warehouses w where w.id = p_warehouse_id),
      'EN_TRANSIT:' || v_number, 'Sortie entrepôt après scan et expédition', v_uid
    );

    v_scanned_code := coalesce(v_item.scanned_code, v_article.barcode, v_article.code);
    v_device := case when v_item.device_type in ('usb_bluetooth_reader','phone_camera','manual','unknown')
      then v_item.device_type else 'unknown' end;
    insert into public.prospecteur_supply_scan_events (
      organization_id, shipment_id, shipment_item_id, phase, scanned_code,
      article_id, quantity, scan_result, actor_user_id, device_type, details
    ) values (
      v_org, v_shipment,
      (select si.id from public.prospecteur_supply_shipment_items si
       where si.shipment_id = v_shipment and si.article_id = v_item.article_id),
      'dispatch', v_scanned_code, v_item.article_id, v_item.quantity,
      case when v_item.scanned_code is null then 'manual_entry' else 'matched' end,
      v_uid, v_device, jsonb_build_object('source', 'dispatch')
    );
  end loop;

  update public.prospecteur_supply_shipments
  set status = 'dispatched', dispatched_at = now(), updated_at = now()
  where id = v_shipment;

  return jsonb_build_object(
    'shipment_id', v_shipment, 'shipment_number', v_number,
    'status', 'dispatched', 'organization_id', v_org
  );
end;
$$;

create or replace function public.jdvcrm_confirm_prospecteur_shipment_receipt_v1(
  p_shipment_id uuid,
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
  v_shipment public.prospecteur_supply_shipments%rowtype;
  v_item record;
  v_line public.prospecteur_supply_shipment_items%rowtype;
  v_org uuid;
  v_has_variance boolean := false;
  v_accepted_delta integer;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Scannez les articles reçus avant de confirmer'; end if;

  select * into v_shipment
  from public.prospecteur_supply_shipments
  where id = p_shipment_id
  for update;
  if not found then raise exception 'Bon de livraison introuvable'; end if;

  select p.organization_id into v_org
  from public.prospecteurs p
  where p.id = v_shipment.prospecteur_id and p.user_id = v_uid and p.status = 'active';
  if v_org is null or v_org <> v_shipment.organization_id then
    raise exception 'Seul le prospecteur destinataire peut accuser réception'; end if;
  if v_shipment.status not in ('dispatched') then
    raise exception 'Ce bon n''est pas en attente de réception'; end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(
      article_id uuid, quantity_received integer, quantity_accepted integer,
      quantity_damaged integer, quantity_missing integer
    )
    where x.article_id is null or x.quantity_received is null or x.quantity_received < 0
       or x.quantity_accepted is null or x.quantity_accepted < 0
       or x.quantity_damaged is null or x.quantity_damaged < 0
       or x.quantity_missing is null or x.quantity_missing < 0
       or x.quantity_accepted + x.quantity_damaged <> x.quantity_received
  ) then raise exception 'Quantités de réception invalides'; end if;

  if exists (
    select x.article_id from jsonb_to_recordset(p_items) as x(
      article_id uuid, quantity_received integer, quantity_accepted integer,
      quantity_damaged integer, quantity_missing integer
    ) group by x.article_id having count(*) > 1
  ) then raise exception 'Une seule ligne de réception par article est autorisée'; end if;

  for v_item in
    select x.article_id, x.quantity_received, x.quantity_accepted,
           x.quantity_damaged, x.quantity_missing,
           nullif(btrim(x.scanned_code), '') as scanned_code,
           coalesce(x.device_type, 'phone_camera') as device_type
    from jsonb_to_recordset(p_items) as x(
      article_id uuid, quantity_received integer, quantity_accepted integer,
      quantity_damaged integer, quantity_missing integer, scanned_code text, device_type text
    )
  loop
    select * into v_line
    from public.prospecteur_supply_shipment_items si
    where si.shipment_id = v_shipment.id and si.article_id = v_item.article_id
    for update;
    if not found then raise exception 'Article scanné non prévu sur ce bon'; end if;
    if v_item.quantity_received > v_line.quantity_dispatched then
      raise exception 'La quantité reçue dépasse la quantité expédiée pour %', v_line.article_name_snapshot;
    end if;
    if v_item.quantity_missing <> greatest(v_line.quantity_dispatched - v_item.quantity_received, 0) then
      raise exception 'Le nombre manquant ne correspond pas à la différence pour %', v_line.article_name_snapshot;
    end if;

    v_accepted_delta := v_item.quantity_accepted - coalesce(v_line.quantity_accepted, 0);
    if v_accepted_delta < 0 then
      raise exception 'Une réception confirmée ne peut pas être diminuée; utiliser une correction traçable';
    end if;

    update public.prospecteur_supply_shipment_items
    set quantity_received = v_item.quantity_received,
        quantity_accepted = v_item.quantity_accepted,
        quantity_damaged = v_item.quantity_damaged,
        quantity_missing = v_item.quantity_missing,
        notes = nullif(btrim(p_notes), ''),
        updated_at = now()
    where id = v_line.id;

    if v_accepted_delta > 0 then
      insert into public.prospecteur_stocks (
        organization_id, prospecteur_id, article_id, quantity, updated_at
      ) values (
        v_shipment.organization_id, v_shipment.prospecteur_id,
        v_item.article_id, v_accepted_delta, now()
      )
      on conflict (prospecteur_id, article_id)
      do update set quantity = public.prospecteur_stocks.quantity + excluded.quantity,
                    updated_at = now();

      insert into public.prospecteur_stock_holdings (
        organization_id, prospecteur_id, article_id, warehouse_id, supply_request_id,
        quantity, remaining_quantity, supplied_at, return_due_at, hard_due_at, status, notes
      ) values (
        v_shipment.organization_id, v_shipment.prospecteur_id, v_item.article_id,
        v_shipment.warehouse_id, null, v_accepted_delta, v_accepted_delta,
        now(), now() + interval '10 days', now() + interval '20 days',
        'active', 'Lot accepté à la réception du bon ' || v_shipment.shipment_number
      );

      insert into public.stock_movements (
        organization_id, article_id, prospecteur_id, movement_type, quantity,
        reference_type, reference_id, source_location, destination_location, notes, created_by
      ) values (
        v_shipment.organization_id, v_item.article_id, v_shipment.prospecteur_id,
        'transfer_in', v_accepted_delta, 'prospecteur_supply_shipment', v_shipment.id,
        'EN_TRANSIT:' || v_shipment.shipment_number, 'stock_prospecteur',
        'Réception acceptée du bon ' || v_shipment.shipment_number, v_uid
      );
    end if;

    if v_item.quantity_missing > 0 or v_item.quantity_damaged > 0 then v_has_variance := true; end if;

    insert into public.prospecteur_supply_scan_events (
      organization_id, shipment_id, shipment_item_id, phase, scanned_code,
      article_id, quantity, scan_result, actor_user_id, device_type, details
    ) values (
      v_shipment.organization_id, v_shipment.id, v_line.id, 'reception',
      coalesce(v_item.scanned_code, v_line.barcode_snapshot, v_line.article_code_snapshot),
      v_item.article_id, v_item.quantity_received,
      case when v_item.scanned_code is null then 'manual_entry' else 'matched' end,
      v_uid,
      case when v_item.device_type in ('usb_bluetooth_reader','phone_camera','manual','unknown')
        then v_item.device_type else 'phone_camera' end,
      jsonb_build_object(
        'accepted', v_item.quantity_accepted,
        'damaged', v_item.quantity_damaged,
        'missing', v_item.quantity_missing
      )
    );
  end loop;

  if (select count(*) from public.prospecteur_supply_shipment_items
      where shipment_id = v_shipment.id and quantity_received is null) > 0 then
    raise exception 'Scannez et renseignez chaque ligne du bon avant de confirmer';
  end if;

  update public.prospecteur_supply_shipments
  set status = case when v_has_variance then 'disputed' else 'received' end,
      received_by = v_uid, received_at = now(),
      receipt_notes = nullif(btrim(p_notes), ''), updated_at = now()
  where id = v_shipment.id;

  return jsonb_build_object(
    'shipment_id', v_shipment.id,
    'shipment_number', v_shipment.shipment_number,
    'status', case when v_has_variance then 'disputed' else 'received' end,
    'has_variance', v_has_variance
  );
end;
$$;

revoke all on function public.jdvcrm_dispatch_prospecteur_shipment_v1(uuid,uuid,jsonb,text,uuid) from public, anon;
revoke all on function public.jdvcrm_confirm_prospecteur_shipment_receipt_v1(uuid,jsonb,text) from public, anon;
grant execute on function public.jdvcrm_dispatch_prospecteur_shipment_v1(uuid,uuid,jsonb,text,uuid) to authenticated;
grant execute on function public.jdvcrm_confirm_prospecteur_shipment_receipt_v1(uuid,jsonb,text) to authenticated;
