-- QR traceability for serialized merchandise managed by warehouse staff.
create or replace function public.jdvcrm_warehouse_qr_inventory_v1(p_warehouse_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select w.organization_id
    into v_org
    from public.warehouses w
   where w.id = p_warehouse_id
     and w.active = true;

  if not found then
    raise exception 'WAREHOUSE_NOT_FOUND';
  end if;

  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'WAREHOUSE_ACCESS_REQUIRED';
  end if;

  return jsonb_build_object(
    'articles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'code', a.code
      ) order by a.name)
      from public.articles a
      where a.organization_id = v_org
        and a.active = true
    ), '[]'::jsonb),
    'serials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sn.id,
        'serial_number', sn.serial_number,
        'status', sn.status,
        'article_id', sn.article_id,
        'article_name', a.name,
        'article_code', a.code,
        'created_at', sn.created_at
      ) order by sn.created_at desc)
      from public.article_serial_assignments asa
      join public.serial_numbers sn on sn.id = asa.serial_number_id
      join public.articles a on a.id = sn.article_id
      where asa.organization_id = v_org
        and asa.warehouse_id = p_warehouse_id
        and asa.active = true
    ), '[]'::jsonb)
  );
end;
$function$;

create or replace function public.jdvcrm_register_serial_in_warehouse_v1(
  p_warehouse_id uuid,
  p_article_id uuid,
  p_serial_number text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_org uuid;
  v_serial_id uuid;
  v_serial text := nullif(trim(p_serial_number), '');
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_serial is null or char_length(v_serial) > 160 then
    raise exception 'SERIAL_NUMBER_REQUIRED';
  end if;

  select w.organization_id
    into v_org
    from public.warehouses w
   where w.id = p_warehouse_id
     and w.active = true;

  if not found then
    raise exception 'WAREHOUSE_NOT_FOUND';
  end if;

  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'WAREHOUSE_ACCESS_REQUIRED';
  end if;

  if not private.is_super_admin() and not private.has_active_subscription(v_org) then
    raise exception 'SUBSCRIPTION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.articles a
    where a.id = p_article_id
      and a.organization_id = v_org
      and a.active = true
  ) then
    raise exception 'ARTICLE_NOT_AVAILABLE';
  end if;

  insert into public.serial_numbers (
    organization_id, article_id, serial_number, status
  )
  values (v_org, p_article_id, v_serial, 'in_stock')
  returning id into v_serial_id;

  insert into public.article_serial_assignments (
    organization_id, serial_number_id, article_id, warehouse_id,
    prospecteur_id, active, created_by
  )
  values (
    v_org, v_serial_id, p_article_id, p_warehouse_id,
    null, true, auth.uid()
  );

  return jsonb_build_object(
    'success', true,
    'serial_id', v_serial_id,
    'serial_number', v_serial,
    'status', 'in_stock'
  );
exception
  when unique_violation then
    raise exception 'SERIAL_ALREADY_EXISTS';
end;
$function$;

create or replace function public.jdvcrm_lookup_serial_qr_v1(
  p_warehouse_id uuid,
  p_serial_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_org uuid;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select w.organization_id
    into v_org
    from public.warehouses w
   where w.id = p_warehouse_id
     and w.active = true;

  if not found or not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'WAREHOUSE_ACCESS_REQUIRED';
  end if;

  select jsonb_build_object(
    'id', sn.id,
    'serial_number', sn.serial_number,
    'status', sn.status,
    'article_name', a.name,
    'article_code', a.code,
    'sale_number', s.sale_number,
    'created_at', sn.created_at,
    'current_warehouse', (
      select jsonb_build_object('name', w2.name, 'code', w2.code)
      from public.article_serial_assignments asa
      join public.warehouses w2 on w2.id = asa.warehouse_id
      where asa.serial_number_id = sn.id
        and asa.active = true
      order by asa.assigned_at desc
      limit 1
    )
  )
    into v_result
    from public.serial_numbers sn
    join public.articles a on a.id = sn.article_id
    left join public.sales s on s.id = sn.sale_id
   where sn.id = p_serial_id
     and sn.organization_id = v_org;

  if v_result is null then
    raise exception 'SERIAL_NOT_FOUND_IN_ORGANIZATION';
  end if;

  return v_result;
end;
$function$;

revoke all on function public.jdvcrm_warehouse_qr_inventory_v1(uuid) from public;
revoke all on function public.jdvcrm_register_serial_in_warehouse_v1(uuid, uuid, text) from public;
revoke all on function public.jdvcrm_lookup_serial_qr_v1(uuid, uuid) from public;
grant execute on function public.jdvcrm_warehouse_qr_inventory_v1(uuid) to authenticated;
grant execute on function public.jdvcrm_register_serial_in_warehouse_v1(uuid, uuid, text) to authenticated;
grant execute on function public.jdvcrm_lookup_serial_qr_v1(uuid, uuid) to authenticated;
