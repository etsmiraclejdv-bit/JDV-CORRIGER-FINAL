-- Close remaining SECURITY DEFINER bypasses on company-operational RPCs.
-- Platform Concepteur privileges remain limited to platform administration and the Concepteur's own organization.
CREATE OR REPLACE FUNCTION private.is_concepteur_owner_org(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.super_admins sa ON sa.user_id = o.owner_user_id
    WHERE o.id = p_org_id
      AND o.owner_user_id = (SELECT auth.uid())
      AND sa.user_id = (SELECT auth.uid())
      AND sa.status = 'active'
      AND COALESCE(sa.actif, true) = true
  );
$function$;
REVOKE ALL ON FUNCTION private.is_concepteur_owner_org(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_concepteur_owner_org(uuid) TO service_role;

CREATE OR REPLACE FUNCTION private.can_manage_warehouse(p_warehouse_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.warehouses w
    where w.id = p_warehouse_id
      and (
        private.is_org_admin(w.organization_id) OR exists (
          select 1 from public.warehouse_managers m
          where m.warehouse_id = w.id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.ensure_organization_personalization(p_organization_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$

DECLARE
    v_id UUID;

BEGIN

    if not private.is_org_admin(p_organization_id) then

        RAISE EXCEPTION 'Accès refusé';

    END IF;


    INSERT INTO public.organization_personalization (
        organization_id
    )
    VALUES (
        p_organization_id
    )
    ON CONFLICT (organization_id)
    DO NOTHING
    RETURNING id INTO v_id;


    IF v_id IS NULL THEN

        SELECT id
        INTO v_id
        FROM public.organization_personalization
        WHERE organization_id = p_organization_id;

    END IF;


    RETURN v_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_admin_stock_entry_v1(p_organization_id uuid, p_article_id uuid, p_quantity integer, p_minimum_quantity integer DEFAULT 0, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_org uuid := p_organization_id;
  v_article_org uuid;
  v_qty integer;
  v_stock public.stocks%rowtype;
begin
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not private.is_org_admin(v_org) then
    raise exception 'ACCESS_DENIED';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'QUANTITY_MUST_BE_POSITIVE'; end if;
  if coalesce(p_minimum_quantity,0) < 0 then raise exception 'MINIMUM_QUANTITY_INVALID'; end if;

  select organization_id into v_article_org from public.articles where id=p_article_id and active=true;
  if v_article_org is null or v_article_org <> v_org then raise exception 'ARTICLE_NOT_IN_ORGANIZATION'; end if;

  insert into public.stocks(organization_id, article_id, quantity, reserved_quantity, minimum_quantity, updated_at)
  values (v_org, p_article_id, p_quantity, 0, coalesce(p_minimum_quantity,0), now())
  on conflict (organization_id, article_id)
  do update set quantity=public.stocks.quantity + excluded.quantity,
                minimum_quantity=excluded.minimum_quantity,
                updated_at=now()
  returning * into v_stock;

  insert into public.stock_movements(
    organization_id, article_id, movement_type, quantity, reference_type,
    source_location, destination_location, notes, created_by
  ) values (
    v_org, p_article_id, 'entry', p_quantity, 'admin_stock_entry',
    'supplier', 'stock_central', p_notes, v_uid
  );

  return jsonb_build_object('stock_id',v_stock.id,'article_id',p_article_id,'quantity',v_stock.quantity);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_admin_supply_warehouse_v1(p_organization_id uuid, p_warehouse_id uuid, p_article_id uuid, p_quantity integer, p_minimum_quantity integer DEFAULT 0, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_wh_org uuid;
  v_article_org uuid;
  v_stock public.stocks%rowtype;
  v_inventory public.warehouse_inventory%rowtype;
begin
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not private.is_org_admin(p_organization_id) then
    raise exception 'ACCESS_DENIED';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'QUANTITY_MUST_BE_POSITIVE'; end if;
  if coalesce(p_minimum_quantity,0) < 0 then raise exception 'MINIMUM_QUANTITY_INVALID'; end if;

  select organization_id into v_wh_org from public.warehouses
  where id=p_warehouse_id and active=true;
  if v_wh_org is null or v_wh_org <> p_organization_id then raise exception 'WAREHOUSE_NOT_IN_ORGANIZATION'; end if;

  select organization_id into v_article_org from public.articles
  where id=p_article_id and active=true;
  if v_article_org is null or v_article_org <> p_organization_id then raise exception 'ARTICLE_NOT_IN_ORGANIZATION'; end if;

  select * into v_stock
  from public.stocks
  where organization_id=p_organization_id and article_id=p_article_id
  for update;
  if not found or (v_stock.quantity - v_stock.reserved_quantity) < p_quantity then
    raise exception 'INSUFFICIENT_CENTRAL_STOCK';
  end if;

  update public.stocks
  set quantity=quantity-p_quantity, updated_at=now()
  where id=v_stock.id;

  insert into public.warehouse_inventory(
    organization_id, warehouse_id, article_id, quantity, reserved_quantity,
    minimum_quantity, updated_at
  ) values (
    p_organization_id, p_warehouse_id, p_article_id, p_quantity, 0,
    coalesce(p_minimum_quantity,0), now()
  )
  on conflict (warehouse_id, article_id) WHERE (subwarehouse_id IS NULL)
  do update set quantity=public.warehouse_inventory.quantity + excluded.quantity,
                minimum_quantity=excluded.minimum_quantity,
                updated_at=now()
  returning * into v_inventory;

  insert into public.stock_movements(
    organization_id, article_id, movement_type, quantity, reference_type,
    source_location, destination_location, notes, created_by
  ) values (
    p_organization_id, p_article_id, 'transfer_out', p_quantity, 'admin_warehouse_supply',
    'stock_central', p_warehouse_id::text, p_notes, v_uid
  );

  return jsonb_build_object(
    'warehouse_inventory_id',v_inventory.id,
    'article_id',p_article_id,
    'warehouse_id',p_warehouse_id,
    'warehouse_quantity',v_inventory.quantity,
    'central_quantity',v_stock.quantity-p_quantity
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_archive_inactive_clients_v1(p_organization_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare v_count integer;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if not private.is_org_admin(p_organization_id) then raise exception 'Accès refusé'; end if;
 update public.clients set status='archived',archived_at=coalesce(archived_at,now()),updated_at=now()
 where organization_id=p_organization_id and archived_at is null and coalesce(last_activity_at,created_at)<=now()-interval '3 months' and coalesce(status,'') not in ('archived','inactive');
 get diagnostics v_count=row_count; return v_count;
end $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_archive_old_prospects_v1(p_organization_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare v_count integer;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if not private.is_org_admin(p_organization_id) then raise exception 'Accès refusé'; end if;
 update public.prospects set status='archived',archived_at=coalesce(archived_at,now()),updated_at=now()
 where organization_id=p_organization_id and archived_at is null and coalesce(last_contact_at,created_at)<=now()-interval '3 months' and coalesce(status,'') not in ('converted','archived','closed');
 get diagnostics v_count=row_count; return v_count;
end $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_assign_prospecteur_warehouse_v1(p_organization_id uuid, p_prospecteur_id uuid, p_warehouse_id uuid, p_department text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_work_zone text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare v_uid uuid:=auth.uid(); v_porg uuid; v_worg uuid; v_id uuid;
begin
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not private.is_org_admin(p_organization_id) then raise exception 'ACCESS_DENIED'; end if;
  select organization_id into v_porg from public.prospecteurs where id=p_prospecteur_id and status='active';
  if v_porg is null or v_porg<>p_organization_id then raise exception 'PROSPECTEUR_NOT_IN_ORGANIZATION'; end if;
  select organization_id into v_worg from public.warehouses where id=p_warehouse_id and active=true;
  if v_worg is null or v_worg<>p_organization_id then raise exception 'WAREHOUSE_NOT_IN_ORGANIZATION'; end if;

  update public.prospecteur_warehouse_assignments
  set active=false,is_primary=false,unassigned_at=now()
  where organization_id=p_organization_id and prospecteur_id=p_prospecteur_id and active=true;

  insert into public.prospecteur_warehouse_assignments(
    organization_id,prospecteur_id,warehouse_id,department,city,work_zone,is_primary,active
  ) values (
    p_organization_id,p_prospecteur_id,p_warehouse_id,p_department,p_city,p_work_zone,true,true
  ) returning id into v_id;

  return jsonb_build_object('assignment_id',v_id,'prospecteur_id',p_prospecteur_id,'warehouse_id',p_warehouse_id);
end $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_cancel_purchase_order_v1(p_purchase_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  po public.purchase_orders%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into po from public.purchase_orders where id = p_purchase_order_id for update;
  if not found then raise exception 'Commande fournisseur introuvable'; end if;
  if not private.is_org_admin(po.organization_id) then raise exception 'Accès refusé'; end if;
  if po.status = 'cancelled' then raise exception 'Cette commande est déjà annulée'; end if;
  if exists (select 1 from public.goods_receipts where purchase_order_id = po.id and status = 'received') then
    raise exception 'Impossible d''annuler : des marchandises ont déjà été reçues';
  end if;
  if exists (select 1 from public.supplier_payments where purchase_order_id = po.id and status = 'paid') then
    raise exception 'Impossible d''annuler : des paiements ont déjà été enregistrés';
  end if;
  update public.purchase_orders set status = 'cancelled' where id = po.id;
  return jsonb_build_object('success', true, 'status', 'cancelled');
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_close_warehouse_day_v1(p_warehouse_id uuid, p_date date DEFAULT NULL::date, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_day date;
  v_report jsonb;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select w.organization_id into v_org from public.warehouses w where w.id = p_warehouse_id;
  if v_org is null then raise exception 'Entrepôt introuvable'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then raise exception 'Accès refusé à cet entrepôt'; end if;
  if not private.is_concepteur_owner_org(v_org) and not private.org_subscription_active(v_org) then raise exception 'Abonnement requis'; end if;

  v_day := coalesce(p_date, (now() at time zone 'Africa/Lagos')::date);
  if v_day > (now() at time zone 'Africa/Lagos')::date then raise exception 'Impossible de clôturer un jour futur'; end if;
  v_report := public.jdvcrm_warehouse_day_report_v1(p_warehouse_id, v_day);

  insert into public.warehouse_day_closures(organization_id, warehouse_id, service_date, closed_by, closed_at, notes, snapshot)
  values (v_org, p_warehouse_id, v_day, v_uid, now(), nullif(trim(p_notes), ''), v_report)
  on conflict (warehouse_id, service_date)
  do update set closed_by = excluded.closed_by, closed_at = now(), notes = excluded.notes, snapshot = excluded.snapshot;

  return jsonb_build_object('warehouse_id', p_warehouse_id, 'service_date', v_day, 'closed', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_convert_prospect_to_client_v1(p_prospect_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pr public.prospects%ROWTYPE;
  c_id uuid;
  v_portfolio uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  SELECT * INTO pr FROM public.prospects WHERE id = p_prospect_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prospect introuvable'; END IF;
  IF NOT (
    private.is_org_admin(pr.organization_id) OR (private.is_prospecteur(pr.organization_id)
        AND EXISTS (SELECT 1 FROM public.prospecteurs p
                    WHERE p.id = pr.prospecteur_id AND p.user_id = auth.uid() AND p.status = 'active'))
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  IF pr.client_id IS NOT NULL THEN RETURN pr.client_id; END IF;

  v_portfolio := pr.portfolio_id;
  IF v_portfolio IS NULL AND pr.prospecteur_id IS NOT NULL THEN
    SELECT cp.id INTO v_portfolio
    FROM public.client_portfolios cp
    JOIN public.prospecteurs p ON p.user_id = cp.owner_user_id
    WHERE p.id = pr.prospecteur_id AND cp.organization_id = pr.organization_id AND cp.status = 'active'
    ORDER BY cp.created_at LIMIT 1;
  END IF;

  INSERT INTO public.clients(organization_id, prospecteur_id, portfolio_id, first_name, last_name, phone, whatsapp,
                             address, city, status, temperature, notes, last_contact_at, last_activity_at)
  VALUES (pr.organization_id, pr.prospecteur_id, v_portfolio, pr.first_name, pr.last_name, pr.phone, pr.whatsapp,
          pr.address, pr.city, 'active', pr.temperature, pr.notes, COALESCE(pr.last_contact_at, now()), now())
  RETURNING id INTO c_id;

  UPDATE public.prospects SET client_id = c_id, status = 'converted', updated_at = now() WHERE id = pr.id;
  RETURN c_id;
END $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_create_purchase_order_v1(p_supplier_id uuid, p_expected_date date, p_notes text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org uuid;
  v_status text;
  v_item jsonb;
  v_article uuid;
  v_qty numeric;
  v_cost numeric;
  v_total numeric := 0;
  v_po uuid;
  v_prefix text;
  v_seq integer;
  v_number text;
  v_lines integer := 0;
  v_seen uuid[] := '{}';
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select organization_id, status into v_org, v_status from public.suppliers where id = p_supplier_id;
  if v_org is null then raise exception 'Fournisseur introuvable'; end if;
  if not private.is_org_admin(v_org) then raise exception 'Accès refusé'; end if;
  if v_status <> 'active' then raise exception 'Ce fournisseur n''est pas actif'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La commande doit contenir au moins une ligne';
  end if;
  if jsonb_array_length(p_items) > 200 then raise exception 'Trop de lignes (200 maximum)'; end if;
  if p_expected_date is not null and p_expected_date < current_date then
    raise exception 'La date de livraison prévue est dans le passé';
  end if;

  -- Contrôle des lignes et calcul du total
  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_article := (v_item ->> 'article_id')::uuid;
      v_qty := (v_item ->> 'quantity')::numeric;
      v_cost := coalesce((v_item ->> 'unit_cost')::numeric, 0);
    exception when others then
      raise exception 'Ligne de commande invalide';
    end;
    if v_article is null or v_qty is null or v_qty <= 0 or v_cost < 0 then raise exception 'Ligne de commande invalide'; end if;
    if v_qty > 1000000000 or v_cost > 100000000000 then raise exception 'Valeur trop élevée dans une ligne de commande'; end if;
    if v_article = any (v_seen) then raise exception 'Un article apparaît deux fois dans la commande'; end if;
    v_seen := v_seen || v_article;
    if not exists (select 1 from public.articles where id = v_article and organization_id = v_org) then
      raise exception 'Article introuvable dans cette entreprise';
    end if;
    v_total := v_total + round(v_qty * v_cost, 2);
  end loop;

  -- Numérotation CF-AAAAMMJJ-001, protégée contre deux créations simultanées
  perform pg_advisory_xact_lock(hashtext('jdvcrm_po:' || v_org::text));
  v_prefix := 'CF-' || to_char(current_date, 'YYYYMMDD') || '-';
  select coalesce(max((substring(order_number from '(\d+)$'))::integer), 0) + 1
    into v_seq
    from public.purchase_orders
   where organization_id = v_org and order_number like v_prefix || '%';
  v_number := v_prefix || lpad(v_seq::text, 3, '0');

  insert into public.purchase_orders
    (organization_id, supplier_id, order_number, order_date, expected_date,
     subtotal, discount_amount, tax_amount, total_amount, status, notes, created_by)
  values
    (v_org, p_supplier_id, v_number, current_date, p_expected_date,
     v_total, 0, 0, v_total, 'confirmed', nullif(left(trim(coalesce(p_notes, '')), 1000), ''), auth.uid())
  returning id into v_po;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::numeric;
    v_cost := coalesce((v_item ->> 'unit_cost')::numeric, 0);
    insert into public.purchase_order_items
      (organization_id, purchase_order_id, article_id, quantity, unit_cost, discount_amount, tax_amount, total_amount)
    values
      (v_org, v_po, (v_item ->> 'article_id')::uuid, v_qty, v_cost, 0, 0, round(v_qty * v_cost, 2));
    v_lines := v_lines + 1;
  end loop;

  return jsonb_build_object('success', true, 'purchase_order_id', v_po, 'order_number', v_number,
                            'total_amount', v_total, 'lines', v_lines);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_create_sale_return_v1(p_sale_id uuid, p_items jsonb DEFAULT NULL::jsonb, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_sale public.sales%rowtype;
  v_return_id uuid;
  v_number text;
  v_items jsonb;
  v_item record;
  v_unit numeric;
  v_line numeric;
  v_refund numeric := 0;
  v_updated integer;
  v_already numeric;
  v_left numeric;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select * into v_sale from public.sales where id = p_sale_id;
  if not found then raise exception 'Vente introuvable'; end if;
  if not (private.is_org_admin(v_sale.organization_id) OR private.can_manage_sale_warehouse(v_sale.id)) then
    raise exception 'Accès refusé : administrateur requis';
  end if;
  if not private.is_concepteur_owner_org(v_sale.organization_id) and not private.org_subscription_active(v_sale.organization_id) then
    raise exception 'Abonnement requis';
  end if;
  if v_sale.status = 'cancelled' then raise exception 'Vente annulée : retour impossible'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    select coalesce(sum(i.quantity), 0) into v_already
    from public.sales_return_items i
    join public.sales_returns sr on sr.id = i.return_id
    where sr.sale_id = v_sale.id and sr.status in ('approved', 'processed') and i.article_id = v_sale.article_id;
    v_left := coalesce(v_sale.quantity, 0) - v_already;
    if v_left <= 0 then raise exception 'Cette vente est déjà entièrement retournée'; end if;
    v_items := jsonb_build_array(jsonb_build_object('quantity', v_left));
  else
    v_items := p_items;
  end if;

  v_unit := case when v_sale.sale_type = 'cash' then v_sale.cash_price else v_sale.credit_price end;
  v_number := 'RET-' || to_char(now() at time zone 'utc', 'YYMMDD') || '-'
              || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.sales_returns(organization_id, sale_id, client_id, return_number, reason, refund_amount, status, created_by)
  values (v_sale.organization_id, v_sale.id, v_sale.client_id, v_number, p_reason, 0, 'pending', v_uid)
  returning id into v_return_id;

  for v_item in
    select x.article_id, x.quantity, x.serial_number_id, x.refund_amount
    from jsonb_to_recordset(v_items) as x(article_id uuid, quantity numeric, serial_number_id uuid, refund_amount numeric)
  loop
    if v_item.quantity is null or v_item.quantity <= 0 or v_item.quantity <> trunc(v_item.quantity) then
      raise exception 'Quantité de retour invalide';
    end if;
    v_line := coalesce(v_item.refund_amount, v_unit * v_item.quantity);
    insert into public.sales_return_items(organization_id, return_id, article_id, quantity, refund_amount, serial_number_id)
    values (v_sale.organization_id, v_return_id, coalesce(v_item.article_id, v_sale.article_id),
            v_item.quantity, v_line, v_item.serial_number_id);
    v_refund := v_refund + v_line;
  end loop;

  update public.sales_returns set refund_amount = v_refund, status = 'approved' where id = v_return_id;
  perform public.jdvcrm_process_sale_return(v_return_id);

  select count(*) into v_updated from public.commissions
  where sale_id = v_sale.id and calculation_snapshot ->> 'last_return_id' = v_return_id::text;

  return jsonb_build_object('return_id', v_return_id, 'return_number', v_number, 'status', 'processed',
                            'refund_amount', v_refund, 'commissions_updated', v_updated);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_create_unpaid_followup_reminders_v1(p_organization_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare v_count integer:=0; r record;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 if not private.is_org_admin(p_organization_id) then raise exception 'Accès refusé'; end if;
 for r in select ps.id schedule_id,s.client_id,s.prospecteur_id,ps.due_date,greatest(ps.expected_amount-ps.paid_amount,0) remaining from public.payment_schedules ps join public.sales s on s.id=ps.sale_id where ps.organization_id=p_organization_id and ps.status in ('late','partial') and ps.paid_amount<ps.expected_amount loop
   if not exists(select 1 from public.follow_up_reminders f where f.organization_id=p_organization_id and f.client_id=r.client_id and f.reminder_at::date=current_date and f.status='pending' and coalesce(f.message,'') like 'Échéance%') then
     insert into public.follow_up_reminders(organization_id,client_id,user_id,reminder_at,channel,status,message)
     values(p_organization_id,r.client_id,(select p.user_id from public.prospecteurs p where p.id=r.prospecteur_id),now(),'app','pending',format('Échéance impayée : reste %s XOF, échéance du %s.',r.remaining,r.due_date));
     v_count:=v_count+1;
   end if;
 end loop; return v_count;
end; $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_create_warehouse_v1(p_organization_id uuid, p_code text, p_name text, p_address text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_country text DEFAULT 'Bénin'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_organization_id is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;

  if not private.is_org_admin(p_organization_id) then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;

  if not private.is_concepteur_owner_org(p_organization_id) and not private.has_active_subscription(p_organization_id) then
    raise exception 'SUBSCRIPTION_REQUIRED';
  end if;

  if nullif(trim(p_code), '') is null then
    raise exception 'WAREHOUSE_CODE_REQUIRED';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'WAREHOUSE_NAME_REQUIRED';
  end if;

  if nullif(trim(p_city), '') is null then
    raise exception 'WAREHOUSE_CITY_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = v_uid
      and om.status = 'active'
  ) and not private.is_org_admin(p_organization_id) then
    raise exception 'ORGANIZATION_ACCESS_REQUIRED';
  end if;

  insert into public.warehouses (
    organization_id, code, name, address, city, country, active
  )
  values (
    p_organization_id,
    trim(p_code),
    trim(p_name),
    nullif(trim(p_address), ''),
    trim(p_city),
    coalesce(nullif(trim(p_country), ''), 'Bénin'),
    true
  )
  returning id into v_id;

  return jsonb_build_object(
    'success', true,
    'warehouse_id', v_id
  );

exception
  when unique_violation then
    raise exception 'WAREHOUSE_ALREADY_EXISTS';
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_dispatch_unit_codes_v1(p_warehouse_id uuid, p_prospecteur_id uuid, p_codes text[], p_notes text DEFAULT NULL::text, p_idempotency_key uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_key uuid := coalesce(p_idempotency_key, gen_random_uuid());
  v_codes text[];
  v_found integer;
  v_unknown text[];
  v_invalid text[];
  v_items jsonb;
  v_result jsonb;
  v_shipment uuid;
  v_role text;
  v_existing public.prospecteur_supply_shipments%rowtype;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_warehouse_id is null or p_prospecteur_id is null then
    raise exception 'Agence/entrepôt et prospecteur obligatoires';
  end if;

  perform pg_advisory_xact_lock(hashtext('unit-dispatch:' || v_key::text));
  select * into v_existing from public.prospecteur_supply_shipments where idempotency_key = v_key;
  if found then
    if v_existing.dispatched_by is distinct from v_uid then raise exception 'Clé d''opération déjà utilisée'; end if;
    return jsonb_build_object(
      'shipment_id', v_existing.id, 'shipment_number', v_existing.shipment_number,
      'status', v_existing.status, 'organization_id', v_existing.organization_id,
      'unit_count', (select count(*) from public.prospecteur_supply_shipment_units su where su.shipment_id = v_existing.id)
    );
  end if;

  select w.organization_id into v_org
  from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'Vous ne pouvez pas expédier depuis cet entrepôt';
  end if;

  v_codes := private.jdvcrm_normalize_unit_codes_v1(p_codes);
  if coalesce(array_length(v_codes, 1), 0) = 0 then raise exception 'Indiquez au moins un code'; end if;
  if array_length(v_codes, 1) > 500 then raise exception '500 codes maximum par bon'; end if;

  -- Verrouille les codes et contrôle leur état
  select count(*) into v_found
  from (
    select u.id from public.unit_codes u
    where u.organization_id = v_org and u.code = any(v_codes)
    for update
  ) locked;

  if v_found <> array_length(v_codes, 1) then
    select coalesce(array_agg(c order by c), '{}') into v_unknown
    from unnest(v_codes) c
    where not exists (select 1 from public.unit_codes u where u.organization_id = v_org and u.code = c);
    raise exception 'Code inconnu dans cette entreprise : %', array_to_string(v_unknown[1:5], ', ');
  end if;

  select coalesce(array_agg(u.code order by u.code), '{}') into v_invalid
  from public.unit_codes u
  where u.organization_id = v_org and u.code = any(v_codes)
    and (u.status <> 'registered' or u.warehouse_id is distinct from p_warehouse_id);
  if array_length(v_invalid, 1) is not null then
    raise exception 'Code indisponible (déjà expédié, ou rattaché à une autre agence) : %',
      array_to_string(v_invalid[1:5], ', ');
  end if;

  select jsonb_agg(jsonb_build_object('article_id', t.article_id, 'quantity', t.qty, 'device_type', 'manual'))
  into v_items
  from (
    select u.article_id, count(*)::integer as qty
    from public.unit_codes u
    where u.organization_id = v_org and u.code = any(v_codes)
    group by u.article_id
  ) t;

  -- Réutilise l'expédition existante : contrôle d'affectation, de stock, mouvements et traces.
  v_result := public.jdvcrm_dispatch_prospecteur_shipment_v1(
    p_warehouse_id, p_prospecteur_id, v_items, p_notes, v_key
  );
  v_shipment := (v_result ->> 'shipment_id')::uuid;

  insert into public.prospecteur_supply_shipment_units (
    organization_id, shipment_id, shipment_item_id, unit_code_id, code_snapshot
  )
  select v_org, v_shipment, si.id, u.id, u.code
  from public.unit_codes u
  join public.prospecteur_supply_shipment_items si
    on si.shipment_id = v_shipment and si.article_id = u.article_id
  where u.organization_id = v_org and u.code = any(v_codes);

  v_role := case when private.is_org_admin(v_org) then 'company_admin' else 'agency_head' end;

  update public.unit_codes u
  set status = 'in_transit', shipment_id = v_shipment, updated_at = now()
  where u.organization_id = v_org and u.code = any(v_codes);

  insert into public.unit_code_events (
    organization_id, unit_code_id, event_type, entry_mode, actor_role,
    from_warehouse_id, to_prospecteur_id, shipment_id, actor_user_id
  )
  select v_org, u.id, 'dispatched', 'manual', v_role, p_warehouse_id, p_prospecteur_id, v_shipment, v_uid
  from public.unit_codes u
  where u.organization_id = v_org and u.code = any(v_codes);

  return v_result || jsonb_build_object('unit_count', array_length(v_codes, 1));
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_ensure_my_portfolio_v1(p_organization_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_id uuid;
  v_type text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;
  IF private.is_concepteur_owner_org(p_organization_id) THEN
    v_type := 'super_admin';
  ELSIF private.is_prospecteur(p_organization_id) THEN
    v_type := 'prospecteur';
  ELSE
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT id INTO v_id
  FROM public.client_portfolios
  WHERE organization_id = p_organization_id
    AND owner_user_id = auth.uid()
    AND status = 'active'
  ORDER BY created_at
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.client_portfolios(organization_id, owner_user_id, owner_type, name)
    VALUES (
      p_organization_id, auth.uid(), v_type,
      CASE WHEN v_type = 'super_admin' THEN 'Portefeuille concepteur' ELSE 'Mon portefeuille clients' END
    )
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_pay_purchase_order_v1(p_purchase_order_id uuid, p_amount numeric, p_method text, p_reference text, p_notes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  po public.purchase_orders%rowtype;
  v_payment uuid;
  v_res jsonb;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into po from public.purchase_orders where id = p_purchase_order_id for update;
  if not found then raise exception 'Commande fournisseur introuvable'; end if;
  if not private.is_org_admin(po.organization_id) then raise exception 'Accès refusé'; end if;
  if po.status = 'cancelled' then raise exception 'Cette commande est annulée'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100000000000 then raise exception 'Montant du paiement invalide'; end if;
  if p_method is null or p_method not in ('cash', 'mobile_money', 'bank_transfer', 'cheque', 'other') then
    raise exception 'Mode de paiement invalide';
  end if;

  insert into public.supplier_payments
    (organization_id, supplier_id, purchase_order_id, amount, currency, payment_method,
     provider_reference, status, recorded_by, notes)
  values
    (po.organization_id, po.supplier_id, po.id, round(p_amount, 2), 'XOF', p_method,
     nullif(left(trim(coalesce(p_reference, '')), 120), ''), 'paid', auth.uid(),
     nullif(left(trim(coalesce(p_notes, '')), 1000), ''))
  returning id into v_payment;

  -- Lève une erreur (et annule tout) si le total payé dépasse le montant de la commande
  v_res := public.jdvcrm_process_supplier_payment_v1(v_payment);

  return jsonb_build_object('success', true, 'payment_id', v_payment,
                            'paid_total', v_res -> 'paid_total', 'remaining', v_res -> 'remaining');
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_process_sale_return(p_return_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  r public.sales_returns%rowtype;
  v_sale public.sales%rowtype;
  i record;
  v_stock_id uuid;
  v_stock_qty integer;
  v_ps_id uuid;
  v_ps_qty integer;
  v_existing boolean;
  v_serial_org uuid;
  v_serial_article uuid;
  v_serial_sale uuid;
  v_serial_client uuid;
  v_serial_status text;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into r from public.sales_returns where id=p_return_id for update;
  if not found then raise exception 'Retour introuvable'; end if;
  if not (private.is_org_admin(r.organization_id) OR private.can_manage_sale_warehouse(r.sale_id)) then
    raise exception 'Accès refusé : administrateur ou concepteur requis';
  end if;
  select * into v_sale from public.sales where id=r.sale_id for update;
  if not found or v_sale.organization_id<>r.organization_id then raise exception 'Vente incompatible avec le retour'; end if;
  if r.status='processed' then return true; end if;
  if r.status<>'approved' then raise exception 'Le retour doit être approuvé avant traitement'; end if;

  for i in select * from public.sales_return_items where return_id=r.id order by id loop
    select exists(
      select 1 from public.stock_movements
      where organization_id=r.organization_id and reference_type='sale_return'
        and reference_id=r.id and article_id=i.article_id
        and movement_type in ('return_from_prospecteur','entry')
        and ((i.serial_number_id is null and notes not like '%serial:%')
          or (i.serial_number_id is not null and notes like '%serial:'||i.serial_number_id::text||'%'))
    ) into v_existing;
    if v_existing then continue; end if;

    if i.serial_number_id is not null then
      select organization_id, article_id, sale_id, client_id, status
        into v_serial_org, v_serial_article, v_serial_sale, v_serial_client, v_serial_status
      from public.serial_numbers where id=i.serial_number_id for update;
      if not found or v_serial_org<>r.organization_id or v_serial_article<>i.article_id or v_serial_sale<>r.sale_id then
        raise exception 'Numéro de série incompatible avec le retour';
      end if;
      if v_sale.client_id is not null and v_serial_client is not null and v_serial_client<>v_sale.client_id then
        raise exception 'Client incompatible avec le numéro de série';
      end if;
      if v_serial_status not in ('sold','returned') then raise exception 'Numéro de série non retournable'; end if;
    end if;

    if v_sale.prospecteur_id is not null then
      select id, quantity into v_ps_id, v_ps_qty
      from public.prospecteur_stocks
      where organization_id=r.organization_id and prospecteur_id=v_sale.prospecteur_id and article_id=i.article_id
      for update;
      if not found then
        insert into public.prospecteur_stocks(organization_id,prospecteur_id,article_id,quantity,updated_at)
        values(r.organization_id,v_sale.prospecteur_id,i.article_id,i.quantity,now())
        returning id,quantity into v_ps_id,v_ps_qty;
      else
        update public.prospecteur_stocks set quantity=quantity+i.quantity,updated_at=now() where id=v_ps_id;
      end if;
      insert into public.stock_movements(
        organization_id,article_id,prospecteur_id,movement_type,quantity,
        reference_type,reference_id,source_location,destination_location,notes,created_by,created_at
      ) values(
        r.organization_id,i.article_id,v_sale.prospecteur_id,'return_from_prospecteur',i.quantity,
        'sale_return',r.id,'client','stock_prospecteur',
        'Réintégration retour '||r.return_number||case when i.serial_number_id is not null then ' serial:'||i.serial_number_id::text else '' end,
        auth.uid(),now()
      );
    else
      select id,quantity into v_stock_id,v_stock_qty from public.stocks
      where organization_id=r.organization_id and article_id=i.article_id for update;
      if not found then
        insert into public.stocks(organization_id,article_id,quantity,reserved_quantity,minimum_quantity,updated_at)
        values(r.organization_id,i.article_id,i.quantity,0,0,now());
      else
        update public.stocks set quantity=quantity+i.quantity,updated_at=now() where id=v_stock_id;
      end if;
      insert into public.stock_movements(
        organization_id,article_id,prospecteur_id,movement_type,quantity,
        reference_type,reference_id,source_location,destination_location,notes,created_by,created_at
      ) values(
        r.organization_id,i.article_id,null,'entry',i.quantity,
        'sale_return',r.id,'client','stock_principal',
        'Réintégration retour '||r.return_number||case when i.serial_number_id is not null then ' serial:'||i.serial_number_id::text else '' end,
        auth.uid(),now()
      );
    end if;

    if i.serial_number_id is not null then
      update public.article_serial_assignments set active=false,released_at=now()
      where serial_number_id=i.serial_number_id and active=true;
      update public.serial_numbers set status='returned',client_id=null,updated_at=now()
      where id=i.serial_number_id;
      if v_sale.prospecteur_id is not null then
        insert into public.article_serial_assignments(
          organization_id,serial_number_id,article_id,prospecteur_id,warehouse_id,assigned_at,released_at,active,created_by
        ) values(r.organization_id,i.serial_number_id,i.article_id,v_sale.prospecteur_id,null,now(),null,true,auth.uid());
      end if;
    end if;
  end loop;
  update public.sales_returns set status='processed',updated_at=now() where id=r.id;
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_receive_purchase_order_v1(p_purchase_order_id uuid, p_items jsonb, p_notes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  po public.purchase_orders%rowtype;
  v_item jsonb;
  v_article uuid;
  v_qty numeric;
  v_cost numeric;
  v_receipt uuid;
  v_prefix text;
  v_seq integer;
  v_number text;
  v_res jsonb;
  v_new_status text;
  v_seen uuid[] := '{}';
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into po from public.purchase_orders where id = p_purchase_order_id for update;
  if not found then raise exception 'Commande fournisseur introuvable'; end if;
  if not private.is_org_admin(po.organization_id) then raise exception 'Accès refusé'; end if;
  if po.status not in ('draft', 'sent', 'confirmed', 'partial') then
    raise exception 'Cette commande ne peut plus être réceptionnée (statut : %)', po.status;
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Indiquez au moins une quantité reçue';
  end if;
  if jsonb_array_length(p_items) > 200 then raise exception 'Trop de lignes (200 maximum)'; end if;

  perform pg_advisory_xact_lock(hashtext('jdvcrm_br:' || po.organization_id::text));
  v_prefix := 'BR-' || to_char(current_date, 'YYYYMMDD') || '-';
  select coalesce(max((substring(receipt_number from '(\d+)$'))::integer), 0) + 1
    into v_seq
    from public.goods_receipts
   where organization_id = po.organization_id and receipt_number like v_prefix || '%';
  v_number := v_prefix || lpad(v_seq::text, 3, '0');

  insert into public.goods_receipts
    (organization_id, purchase_order_id, receipt_number, receipt_date, status, notes, received_by)
  values
    (po.organization_id, po.id, v_number, current_date, 'received',
     nullif(left(trim(coalesce(p_notes, '')), 1000), ''), auth.uid())
  returning id into v_receipt;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_article := (v_item ->> 'article_id')::uuid;
      v_qty := (v_item ->> 'quantity_received')::numeric;
    exception when others then
      raise exception 'Ligne de réception invalide';
    end;
    if v_article is null or v_qty is null or v_qty <= 0 then raise exception 'Quantité reçue invalide'; end if;
    if v_qty > 1000000000 then raise exception 'Quantité reçue trop élevée'; end if;
    -- un même article deux fois contournerait le contrôle de quantité commandée
    if v_article = any (v_seen) then raise exception 'Un article apparaît deux fois dans la réception'; end if;
    v_seen := v_seen || v_article;
    select unit_cost into v_cost
      from public.purchase_order_items
     where purchase_order_id = po.id and article_id = v_article
     order by created_at limit 1;
    if not found then raise exception 'Article absent de la commande fournisseur'; end if;
    insert into public.goods_receipt_items (organization_id, receipt_id, article_id, quantity_received, unit_cost)
    values (po.organization_id, v_receipt, v_article, v_qty, v_cost);
  end loop;

  -- Contrôle des quantités et entrée en stock (lève une erreur, donc annule tout, si la réception dépasse la commande)
  v_res := public.jdvcrm_process_goods_receipt_v1(v_receipt);
  select status into v_new_status from public.purchase_orders where id = po.id;

  return jsonb_build_object('success', true, 'receipt_id', v_receipt, 'receipt_number', v_number,
                            'order_status', v_new_status, 'quantity_added', v_res -> 'quantity_added');
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_receive_stock_transfer_v1(p_transfer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_transfer public.stock_transfers%rowtype;
  v_item record;
  v_inv public.warehouse_inventory%rowtype;
  v_existing boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_transfer from public.stock_transfers where id=p_transfer_id for update;
  if not found then raise exception 'Transfert introuvable'; end if;
  if not private.is_org_admin(v_transfer.organization_id) then raise exception 'Accès refusé'; end if;
  if v_transfer.status='received' then return true; end if;
  if v_transfer.status<>'in_transit' then raise exception 'Le transfert doit être en transit avant réception'; end if;

  for v_item in select * from public.stock_transfer_items where transfer_id=v_transfer.id order by id loop
    select exists(select 1 from public.stock_movements where organization_id=v_transfer.organization_id and reference_type='stock_transfer' and reference_id=v_transfer.id and article_id=v_item.article_id and movement_type='transfer_in') into v_existing;
    if not v_existing then
      select * into v_inv from public.warehouse_inventory
        where organization_id=v_transfer.organization_id and warehouse_id=v_transfer.destination_warehouse_id and article_id=v_item.article_id
        for update;
      if found then
        update public.warehouse_inventory set quantity=quantity+v_item.quantity, updated_at=now() where id=v_inv.id;
      else
        insert into public.warehouse_inventory(organization_id,warehouse_id,article_id,quantity,reserved_quantity,minimum_quantity,updated_at)
        values(v_transfer.organization_id,v_transfer.destination_warehouse_id,v_item.article_id,v_item.quantity,0,0,now());
      end if;
      insert into public.stock_movements(organization_id,article_id,prospecteur_id,movement_type,quantity,reference_type,reference_id,source_location,destination_location,notes,created_by,created_at)
      values(v_transfer.organization_id,v_item.article_id,null,'transfer_in',v_item.quantity,'stock_transfer',v_transfer.id,'warehouse:'||v_transfer.source_warehouse_id::text,'warehouse:'||v_transfer.destination_warehouse_id::text,'Réception transfert '||v_transfer.transfer_number,auth.uid(),now());
    end if;
    update public.stock_transfer_items set received_quantity=quantity where id=v_item.id;
  end loop;
  update public.stock_transfers set status='received',received_by=auth.uid(),updated_at=now() where id=v_transfer.id;
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_register_unit_codes_v1(p_warehouse_id uuid, p_article_id uuid, p_codes text[] DEFAULT NULL::text[], p_quantity integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_article_code text;
  v_codes text[];
  v_generated boolean := false;
  v_prefix text;
  v_candidate text;
  v_taken text[];
  v_role text;
  v_tries integer := 0;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_warehouse_id is null or p_article_id is null then
    raise exception 'Agence/entrepôt et article obligatoires';
  end if;

  select w.organization_id into v_org
  from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'Vous ne pouvez pas inscrire de produits dans cet entrepôt';
  end if;

  select a.code into v_article_code
  from public.articles a
  where a.id = p_article_id and a.organization_id = v_org and a.active = true;
  if not found then raise exception 'Article introuvable, inactif ou hors organisation'; end if;

  if p_codes is not null and array_length(p_codes, 1) is not null then
    v_codes := private.jdvcrm_normalize_unit_codes_v1(p_codes);
  else
    v_codes := '{}';
  end if;

  if coalesce(array_length(v_codes, 1), 0) = 0 then
    -- Génération automatique
    if p_quantity is null or p_quantity < 1 or p_quantity > 500 then
      raise exception 'Indiquez les codes à inscrire, ou une quantité entre 1 et 500 pour les générer';
    end if;
    v_generated := true;
    v_prefix := left(regexp_replace(upper(coalesce(v_article_code, '')), '[^A-Z0-9]', '', 'g'), 6);
    if v_prefix = '' then v_prefix := 'JDV'; end if;
    while coalesce(array_length(v_codes, 1), 0) < p_quantity loop
      v_tries := v_tries + 1;
      if v_tries > p_quantity * 5 + 50 then raise exception 'Génération de codes impossible, réessayez'; end if;
      v_candidate := v_prefix || '-' || to_char(clock_timestamp(), 'YYMMDD') || '-'
        || upper(substr(md5(random()::text || clock_timestamp()::text || v_tries::text), 1, 8));
      if v_candidate = any(v_codes) then continue; end if;
      if exists (select 1 from public.unit_codes u where u.organization_id = v_org and u.code = v_candidate) then continue; end if;
      v_codes := array_append(v_codes, v_candidate);
    end loop;
  else
    if array_length(v_codes, 1) > 500 then raise exception '500 codes maximum par opération'; end if;
    select coalesce(array_agg(u.code order by u.code), '{}') into v_taken
    from public.unit_codes u where u.organization_id = v_org and u.code = any(v_codes);
    if array_length(v_taken, 1) is not null then
      raise exception 'Code déjà inscrit dans cette entreprise : %', array_to_string(v_taken[1:5], ', ');
    end if;
  end if;

  v_role := case when private.is_org_admin(v_org) then 'company_admin' else 'agency_head' end;

  with ins as (
    insert into public.unit_codes (organization_id, article_id, code, status, warehouse_id, generated, registered_by)
    select v_org, p_article_id, c, 'registered', p_warehouse_id, v_generated, v_uid
    from unnest(v_codes) as c
    returning id
  )
  insert into public.unit_code_events (
    organization_id, unit_code_id, event_type, entry_mode, actor_role,
    from_warehouse_id, actor_user_id, details
  )
  select v_org, ins.id, 'registered', case when v_generated then 'generated' else 'manual' end,
         v_role, p_warehouse_id, v_uid, jsonb_build_object('article_id', p_article_id)
  from ins;

  return jsonb_build_object(
    'count', array_length(v_codes, 1),
    'generated', v_generated,
    'codes', to_jsonb(v_codes)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_respond_warehouse_supply_v1(p_request_id uuid, p_decision text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  r public.warehouse_supply_requests%rowtype;
  i record;
  v_min numeric;
  v_remaining numeric;
  v_name text;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select * into r from public.warehouse_supply_requests where id = p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if not private.is_org_admin(r.organization_id) then
    raise exception 'Accès refusé : administrateur requis';
  end if;
  if r.target <> 'admin' then raise exception 'Cette demande est adressée à un fournisseur'; end if;
  if p_decision not in ('approved', 'rejected', 'fulfilled') then raise exception 'Décision invalide'; end if;
  if r.status not in ('sent', 'approved') then raise exception 'Cette demande a déjà été traitée'; end if;

  if p_decision = 'fulfilled' then
    begin
      for i in
        select it.id, it.article_id, it.quantity, it.received_quantity
        from public.warehouse_supply_request_items it
        where it.request_id = r.id and it.quantity - it.received_quantity > 0
        for update
      loop
        v_remaining := i.quantity - i.received_quantity;
        select coalesce(wi.minimum_quantity, 0) into v_min from public.warehouse_inventory wi
        where wi.warehouse_id = r.warehouse_id and wi.article_id = i.article_id;
        perform public.jdvcrm_admin_supply_warehouse_v1(r.organization_id, r.warehouse_id, i.article_id,
          v_remaining::integer, coalesce(v_min, 0)::integer, 'Demande ' || r.reference);
        update public.warehouse_supply_request_items set received_quantity = quantity where id = i.id;
      end loop;
    exception when others then
      raise exception 'Approvisionnement impossible : %', replace(sqlerrm, 'INSUFFICIENT_CENTRAL_STOCK', 'stock central insuffisant');
    end;
    update public.warehouse_supply_requests
       set status = 'received', processed_by = v_uid, processed_at = now(),
           response_notes = coalesce(nullif(trim(p_notes), ''), response_notes)
     where id = r.id;
  else
    update public.warehouse_supply_requests
       set status = p_decision, processed_by = v_uid, processed_at = now(),
           response_notes = coalesce(nullif(trim(p_notes), ''), response_notes)
     where id = r.id;
  end if;

  return jsonb_build_object('request_id', r.id, 'status', case when p_decision = 'fulfilled' then 'received' else p_decision end);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_send_stock_transfer_v1(p_transfer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_transfer public.stock_transfers%rowtype;
  v_item record;
  v_inv public.warehouse_inventory%rowtype;
  v_existing boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  select * into v_transfer from public.stock_transfers where id=p_transfer_id for update;
  if not found then raise exception 'Transfert introuvable'; end if;
  if not private.is_org_admin(v_transfer.organization_id) then raise exception 'Accès refusé'; end if;
  if v_transfer.status='in_transit' or v_transfer.status='received' then return true; end if;
  if v_transfer.status<>'draft' then raise exception 'Le transfert doit être en brouillon avant expédition'; end if;
  if not exists(select 1 from public.stock_transfer_items where transfer_id=v_transfer.id) then raise exception 'Le transfert ne contient aucun article'; end if;

  for v_item in select * from public.stock_transfer_items where transfer_id=v_transfer.id order by id loop
    select * into v_inv from public.warehouse_inventory
      where organization_id=v_transfer.organization_id and warehouse_id=v_transfer.source_warehouse_id and article_id=v_item.article_id
      for update;
    if not found then raise exception 'Stock source introuvable pour l''article %',v_item.article_id; end if;
    if v_inv.quantity - v_inv.reserved_quantity < v_item.quantity then
      raise exception 'Stock disponible insuffisant dans l''entrepôt source pour l''article %',v_item.article_id;
    end if;
    select exists(select 1 from public.stock_movements where organization_id=v_transfer.organization_id and reference_type='stock_transfer' and reference_id=v_transfer.id and article_id=v_item.article_id and movement_type='transfer_out') into v_existing;
    if not v_existing then
      update public.warehouse_inventory set quantity=quantity-v_item.quantity, updated_at=now() where id=v_inv.id;
      insert into public.stock_movements(organization_id,article_id,prospecteur_id,movement_type,quantity,reference_type,reference_id,source_location,destination_location,notes,created_by,created_at)
      values(v_transfer.organization_id,v_item.article_id,null,'transfer_out',v_item.quantity,'stock_transfer',v_transfer.id,'warehouse:'||v_transfer.source_warehouse_id::text,'warehouse:'||v_transfer.destination_warehouse_id::text,'Expédition transfert '||v_transfer.transfer_number,auth.uid(),now());
    end if;
  end loop;
  update public.stock_transfers set status='in_transit', updated_at=now() where id=v_transfer.id;
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_set_member_status_v1(p_member_id uuid, p_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
#variable_conflict use_column
declare m public.organization_members%rowtype; v_owner uuid; v_other int;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_status not in ('active','suspended') then raise exception 'INVALID_STATUS'; end if;
  select * into m from public.organization_members x where x.id = p_member_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if not private.is_org_admin(m.organization_id) then raise exception 'ACCESS_DENIED'; end if;
  if m.user_id = auth.uid() then raise exception 'CANNOT_CHANGE_OWN_STATUS'; end if;
  select o.owner_user_id into v_owner from public.organizations o where o.id = m.organization_id;
  if m.user_id = v_owner then raise exception 'OWNER_PROTECTED'; end if;
  if p_status = 'suspended' and m.role = 'business_admin' then
    select count(*) into v_other from public.organization_members x
     where x.organization_id = m.organization_id and x.role = 'business_admin' and x.status = 'active' and x.id <> m.id;
    if v_other = 0 then raise exception 'LAST_ADMIN'; end if;
  end if;
  update public.organization_members set status = p_status, updated_at = now() where id = m.id;
  if m.role = 'prospecteur' then
    update public.prospecteurs set status = case when p_status = 'active' then 'active' else 'suspended' end, updated_at = now()
     where user_id = m.user_id and organization_id = m.organization_id;
  end if;
  update public.warehouse_managers set status = p_status where user_id = m.user_id and organization_id = m.organization_id;
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_set_prospecteur_status_v1(p_prospecteur_id uuid, p_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
#variable_conflict use_column
declare pr public.prospecteurs%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_status not in ('active','suspended','blocked','inactive') then raise exception 'INVALID_STATUS'; end if;
  select * into pr from public.prospecteurs x where x.id = p_prospecteur_id for update;
  if not found then raise exception 'PROSPECTEUR_NOT_FOUND'; end if;
  if not (private.is_org_admin(pr.organization_id) OR exists (
        select 1 from public.organization_members x
        where x.organization_id = pr.organization_id and x.user_id = auth.uid() and x.status = 'active' and x.role = 'manager')) then
    raise exception 'ACCESS_DENIED';
  end if;
  update public.prospecteurs set status = p_status, updated_at = now() where id = pr.id;
  if pr.user_id is not null then
    update public.organization_members set status = case when p_status = 'active' then 'active' else 'suspended' end, updated_at = now()
     where user_id = pr.user_id and organization_id = pr.organization_id and role = 'prospecteur';
  end if;
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_set_warehouse_manager_status_v1(p_manager_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_org uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentification requise'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'Statut invalide'; end if;
  select m.organization_id into v_org from public.warehouse_managers m where m.id = p_manager_id;
  if v_org is null then raise exception 'Responsable introuvable'; end if;
  if not private.is_org_admin(v_org) then raise exception 'Accès refusé : administrateur requis'; end if;
  update public.warehouse_managers set status = p_status, updated_at = now() where id = p_manager_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_settle_commission_v1(p_commission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare v public.commissions%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 select * into v from public.commissions where id=p_commission_id for update;
 if not found then raise exception 'Commission introuvable'; end if;
 if not private.is_org_admin(v.organization_id) then raise exception 'Accès refusé'; end if;
 if v.status='cancelled' then raise exception 'Commission annulée'; end if;
 update public.commissions set status='paid',paid_at=coalesce(paid_at,now()),updated_at=now() where id=v.id;
 return jsonb_build_object('success',true,'commission_id',v.id,'status','paid','paid_at',coalesce(v.paid_at,now()));
end; $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_update_member_role_v1(p_member_id uuid, p_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
#variable_conflict use_column
declare m public.organization_members%rowtype; v_owner uuid; v_allowed boolean; v_other int;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into m from public.organization_members x where x.id = p_member_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if not private.is_org_admin(m.organization_id) then raise exception 'ACCESS_DENIED'; end if;
  if p_role not in ('business_admin','manager','supervisor','accountant','commercial','viewer') then raise exception 'INVALID_ROLE'; end if;
  if m.role = 'prospecteur' then raise exception 'USE_PROSPECTEURS_PAGE'; end if;
  if m.user_id = auth.uid() then raise exception 'CANNOT_CHANGE_OWN_ROLE'; end if;
  select o.owner_user_id into v_owner from public.organizations o where o.id = m.organization_id;
  if m.user_id = v_owner then raise exception 'OWNER_PROTECTED'; end if;
  if m.role = 'business_admin' and p_role <> 'business_admin' then
    select count(*) into v_other from public.organization_members x
     where x.organization_id = m.organization_id and x.role = 'business_admin' and x.status = 'active' and x.id <> m.id;
    if v_other = 0 then raise exception 'LAST_ADMIN'; end if;
  end if;
  if p_role = 'business_admin' and m.role <> 'business_admin' then
    select l.allowed into v_allowed from public.jdvcrm_check_subscription_limit_v1(m.organization_id, 'admins') l limit 1;
    if v_allowed is false then raise exception 'ADMIN_LIMIT_REACHED'; end if;
  end if;
  update public.organization_members set role = p_role, updated_at = now() where id = m.id;
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_warehouse_receive_return_v1(p_holding_id uuid, p_quantity numeric DEFAULT NULL::numeric, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  h public.prospecteur_stock_holdings%rowtype;
  v_qty numeric;
  v_ps_qty integer;
  v_left numeric;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select * into h from public.prospecteur_stock_holdings where id = p_holding_id for update;
  if not found then raise exception 'Marchandise confiée introuvable'; end if;
  if not private.can_manage_warehouse(h.warehouse_id) then raise exception 'Accès refusé à cet entrepôt'; end if;
  if not private.is_concepteur_owner_org(h.organization_id) and not private.org_subscription_active(h.organization_id) then
    raise exception 'Abonnement requis';
  end if;
  if h.remaining_quantity <= 0 or h.status in ('returned', 'sold') then
    raise exception 'Cette marchandise ne contient plus de quantité à retourner';
  end if;

  v_qty := coalesce(p_quantity, h.remaining_quantity);
  if v_qty <= 0 or v_qty <> trunc(v_qty) or v_qty > h.remaining_quantity then
    raise exception 'Quantité invalide : entre 1 et %', h.remaining_quantity;
  end if;

  select ps.quantity into v_ps_qty from public.prospecteur_stocks ps
  where ps.organization_id = h.organization_id and ps.prospecteur_id = h.prospecteur_id and ps.article_id = h.article_id
  for update;
  if not found or v_ps_qty < v_qty then raise exception 'Stock prospecteur incohérent pour cet article'; end if;

  update public.prospecteur_stocks set quantity = quantity - v_qty, updated_at = now()
  where organization_id = h.organization_id and prospecteur_id = h.prospecteur_id and article_id = h.article_id;

  insert into public.warehouse_inventory(organization_id, warehouse_id, article_id, quantity, reserved_quantity,
    minimum_quantity, updated_at)
  values (h.organization_id, h.warehouse_id, h.article_id, v_qty, 0, 0, now())
  on conflict (warehouse_id, article_id)
  do update set quantity = public.warehouse_inventory.quantity + excluded.quantity, updated_at = now();

  insert into public.stock_movements(organization_id, article_id, prospecteur_id, movement_type, quantity,
    reference_type, reference_id, source_location, destination_location, notes, created_by)
  values (h.organization_id, h.article_id, h.prospecteur_id, 'return_from_prospecteur', v_qty::integer,
    'prospecteur_stock_return', h.id, 'stock_prospecteur', private.jdvcrm_wh_label_v1(h.warehouse_id),
    coalesce(nullif(trim(p_note), ''), 'Retour de marchandise non vendue reçu par l''entrepôt; aucune commission générée'),
    v_uid);

  v_left := h.remaining_quantity - v_qty;
  update public.prospecteur_stock_holdings
     set remaining_quantity = v_left,
         status = case when v_left = 0 then 'returned' else status end,
         returned_at = case when v_left = 0 then now() else returned_at end,
         updated_at = now()
   where id = h.id;

  return jsonb_build_object('holding_id', h.id, 'returned_quantity', v_qty, 'remaining_quantity', v_left,
                            'status', case when v_left = 0 then 'returned' else h.status end);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_warehouse_receive_supply_v1(p_request_id uuid, p_items jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  r public.warehouse_supply_requests%rowtype;
  v_label text;
  v_line record;
  v_item public.warehouse_supply_request_items%rowtype;
  v_qty numeric;
  v_total numeric := 0;
  v_open integer;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select * into r from public.warehouse_supply_requests where id = p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if not private.can_manage_warehouse(r.warehouse_id) then raise exception 'Accès refusé à cet entrepôt'; end if;
  if not private.is_concepteur_owner_org(r.organization_id) and not private.org_subscription_active(r.organization_id) then raise exception 'Abonnement requis'; end if;
  if r.target <> 'supplier' then raise exception 'La réception directe concerne les demandes au fournisseur'; end if;
  if r.status not in ('sent', 'ordered', 'partially_received') then raise exception 'Cette demande ne peut pas recevoir de marchandise'; end if;
  v_label := private.jdvcrm_wh_label_v1(r.warehouse_id);

  for v_line in
    select x.article_id, x.quantity
    from jsonb_to_recordset(
      coalesce(p_items, (
        select coalesce(jsonb_agg(jsonb_build_object('article_id', i.article_id, 'quantity', i.quantity - i.received_quantity)), '[]'::jsonb)
        from public.warehouse_supply_request_items i
        where i.request_id = r.id and i.quantity - i.received_quantity > 0))
    ) as x(article_id uuid, quantity numeric)
  loop
    v_qty := v_line.quantity;
    if v_qty is null or v_qty <= 0 or v_qty <> trunc(v_qty) then raise exception 'Quantité reçue invalide'; end if;

    select * into v_item from public.warehouse_supply_request_items i
    where i.request_id = r.id and i.article_id = v_line.article_id and i.quantity - i.received_quantity >= v_qty
    order by i.created_at limit 1 for update;
    if not found then raise exception 'Quantité reçue supérieure au reste attendu pour un article'; end if;

    update public.warehouse_supply_request_items set received_quantity = received_quantity + v_qty where id = v_item.id;

    insert into public.warehouse_inventory(organization_id, warehouse_id, article_id, quantity, reserved_quantity,
      minimum_quantity, updated_at)
    values (r.organization_id, r.warehouse_id, v_line.article_id, v_qty, 0, 0, now())
    on conflict (warehouse_id, article_id)
    do update set quantity = public.warehouse_inventory.quantity + excluded.quantity, updated_at = now();

    insert into public.stock_movements(organization_id, article_id, movement_type, quantity, reference_type,
      reference_id, source_location, destination_location, notes, created_by)
    values (r.organization_id, v_line.article_id, 'entry', v_qty::integer, 'warehouse_supply_request',
      r.id, 'supplier', v_label, 'Réception de la demande ' || r.reference, v_uid);

    v_total := v_total + v_qty;
  end loop;

  select count(*) into v_open from public.warehouse_supply_request_items i
  where i.request_id = r.id and i.received_quantity < i.quantity;

  update public.warehouse_supply_requests
     set status = case when v_open = 0 then 'received' else 'partially_received' end,
         processed_by = v_uid, processed_at = now()
   where id = r.id;

  return jsonb_build_object('request_id', r.id, 'received_units', v_total,
                            'status', case when v_open = 0 then 'received' else 'partially_received' end);
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_warehouse_request_supply_v1(p_warehouse_id uuid, p_target text, p_supplier_id uuid, p_items jsonb, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_request_id uuid;
  v_ref text;
  v_item record;
  v_n integer := 0;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select w.organization_id into v_org from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then raise exception 'Accès refusé à cet entrepôt'; end if;
  if not private.is_concepteur_owner_org(v_org) and not private.org_subscription_active(v_org) then raise exception 'Abonnement requis'; end if;
  if p_target not in ('supplier', 'admin') then raise exception 'Destinataire invalide (fournisseur ou admin)'; end if;
  if p_target = 'supplier' and p_supplier_id is null then raise exception 'Choisissez un fournisseur'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sélectionnez au moins un article';
  end if;

  insert into public.warehouse_supply_requests(organization_id, warehouse_id, target, supplier_id, status, notes, requested_by)
  values (v_org, p_warehouse_id, p_target, case when p_target = 'supplier' then p_supplier_id end, 'sent',
          nullif(trim(p_notes), ''), v_uid)
  returning id, reference into v_request_id, v_ref;

  for v_item in
    select x.article_id, x.quantity from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
  loop
    if v_item.article_id is null or v_item.quantity is null or v_item.quantity <= 0
       or v_item.quantity <> trunc(v_item.quantity) then
      raise exception 'Quantité invalide pour un article';
    end if;
    insert into public.warehouse_supply_request_items(organization_id, warehouse_id, request_id, article_id, quantity)
    values (v_org, p_warehouse_id, v_request_id, v_item.article_id, v_item.quantity);
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('request_id', v_request_id, 'reference', v_ref, 'lines', v_n, 'status', 'sent');
end;
$function$;

CREATE OR REPLACE FUNCTION public.jdvcrm_warehouse_supply_prospecteur_v1(p_warehouse_id uuid, p_prospecteur_id uuid, p_items jsonb, p_override boolean DEFAULT false, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_label text;
  v_request_id uuid;
  v_item record;
  v_available numeric;
  v_article_name text;
  v_blocked integer;
  v_units numeric := 0;
  v_lines integer := 0;
  v_note text;
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  select w.organization_id into v_org from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then raise exception 'Accès refusé à cet entrepôt'; end if;
  if not private.is_concepteur_owner_org(v_org) and not private.org_subscription_active(v_org) then raise exception 'Abonnement requis'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sélectionnez au moins un article';
  end if;
  if not exists (select 1 from public.prospecteurs p
                 where p.id = p_prospecteur_id and p.organization_id = v_org and p.status = 'active') then
    raise exception 'Prospecteur introuvable ou inactif';
  end if;
  if not exists (select 1 from public.prospecteur_warehouse_assignments a
                 where a.prospecteur_id = p_prospecteur_id and a.organization_id = v_org
                   and a.warehouse_id = p_warehouse_id and a.active = true and a.is_primary = true) then
    raise exception 'Ce prospecteur n''est pas affecté à cet entrepôt';
  end if;

  select count(*) into v_blocked from public.prospecteur_stock_holdings h
  where h.organization_id = v_org and h.prospecteur_id = p_prospecteur_id
    and h.remaining_quantity > 0 and h.status in ('active', 'overdue') and h.return_due_at <= now();
  if v_blocked > 0 and not coalesce(p_override, false) then
    raise exception 'Ce prospecteur a % lot(s) à retourner en retard. Confirmez pour le fournir malgré tout.', v_blocked;
  end if;

  v_label := private.jdvcrm_wh_label_v1(p_warehouse_id);
  v_note := coalesce(nullif(trim(p_notes), ''), 'Approvisionnement par le responsable de l''entrepôt');

  insert into public.prospecteur_supply_requests(organization_id, prospecteur_id, warehouse_id, status,
    requested_at, processed_at, processed_by, notes)
  values (v_org, p_prospecteur_id, p_warehouse_id, 'approved', now(), now(), v_uid, v_note)
  returning id into v_request_id;

  for v_item in
    select x.article_id, x.quantity from jsonb_to_recordset(p_items) as x(article_id uuid, quantity numeric)
  loop
    if v_item.article_id is null or v_item.quantity is null or v_item.quantity <= 0
       or v_item.quantity <> trunc(v_item.quantity) then
      raise exception 'Quantité invalide pour un article';
    end if;

    v_article_name := null;
    select a.name into v_article_name from public.articles a
    where a.id = v_item.article_id and a.organization_id = v_org and a.active = true;
    if v_article_name is null then raise exception 'Article introuvable ou inactif'; end if;

    insert into public.prospecteur_supply_request_items(organization_id, request_id, article_id, quantity)
    values (v_org, v_request_id, v_item.article_id, v_item.quantity);

    v_available := null;
    select coalesce(wi.quantity - wi.reserved_quantity, 0) into v_available
    from public.warehouse_inventory wi
    where wi.organization_id = v_org and wi.warehouse_id = p_warehouse_id and wi.article_id = v_item.article_id
    for update;
    if coalesce(v_available, 0) < v_item.quantity then
      raise exception 'Stock insuffisant pour % (disponible: %, demandé: %)',
        v_article_name, coalesce(v_available, 0), v_item.quantity;
    end if;

    update public.warehouse_inventory set quantity = quantity - v_item.quantity, updated_at = now()
    where organization_id = v_org and warehouse_id = p_warehouse_id and article_id = v_item.article_id;

    insert into public.prospecteur_stocks(organization_id, prospecteur_id, article_id, quantity, updated_at)
    values (v_org, p_prospecteur_id, v_item.article_id, v_item.quantity::integer, now())
    on conflict (prospecteur_id, article_id)
    do update set quantity = public.prospecteur_stocks.quantity + excluded.quantity, updated_at = now();

    insert into public.prospecteur_stock_holdings(organization_id, prospecteur_id, article_id, warehouse_id,
      supply_request_id, quantity, remaining_quantity, supplied_at, return_due_at, hard_due_at, status, notes)
    values (v_org, p_prospecteur_id, v_item.article_id, p_warehouse_id, v_request_id, v_item.quantity,
      v_item.quantity, now(), now() + interval '10 days', now() + interval '20 days', 'active',
      'Marchandise confiée par le responsable de l''entrepôt; retour obligatoire si non vendue.');

    insert into public.stock_movements(organization_id, article_id, prospecteur_id, movement_type, quantity,
      reference_type, reference_id, source_location, destination_location, notes, created_by)
    values (v_org, v_item.article_id, p_prospecteur_id, 'transfer_to_prospecteur', v_item.quantity::integer,
      'prospecteur_supply_request', v_request_id, v_label, 'stock_prospecteur', v_note, v_uid);

    v_units := v_units + v_item.quantity;
    v_lines := v_lines + 1;
  end loop;

  return jsonb_build_object('request_id', v_request_id, 'lines', v_lines, 'units', v_units,
                            'override_used', v_blocked > 0);
end;
$function$;
NOTIFY pgrst, 'reload schema';
