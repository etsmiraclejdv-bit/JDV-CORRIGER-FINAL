-- Regression checks for warehouse subwarehouse security.
-- These checks are intentionally read-only; authenticated-session allow/deny tests
-- should be executed with Supabase's database test harness when credentials are available.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'warehouse_subwarehouses';

select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'warehouse_subwarehouses'
order by policyname;

select code
from public.permissions
where code like 'warehouses.subwarehouses.%'
order by code;

select
  p.code,
  rp.role
from public.role_permissions rp
join public.permissions p on p.id = rp.permission_id
where p.code like 'warehouses.subwarehouses.%'
order by p.code, rp.role;

select has_table_privilege('anon', 'public.warehouse_subwarehouses', 'INSERT') as anon_can_insert;
select has_table_privilege('anon', 'public.warehouse_subwarehouses', 'UPDATE') as anon_can_update;
select has_table_privilege('anon', 'public.warehouse_subwarehouses', 'DELETE') as anon_can_delete;

-- Fail the regression test if non-admin warehouse-management bypasses are reintroduced.
do $$
declare
  v_insert text;
  v_update_using text;
  v_update_check text;
  v_delete text;
begin
  select with_check into v_insert
  from pg_policies
  where schemaname = 'public'
    and tablename = 'warehouse_subwarehouses'
    and policyname = 'warehouse_subwarehouses_admin_insert';

  select qual, with_check into v_update_using, v_update_check
  from pg_policies
  where schemaname = 'public'
    and tablename = 'warehouse_subwarehouses'
    and policyname = 'warehouse_subwarehouses_admin_update';

  select qual into v_delete
  from pg_policies
  where schemaname = 'public'
    and tablename = 'warehouse_subwarehouses'
    and policyname = 'warehouse_subwarehouses_admin_delete';

  if v_insert is null or v_insert not ilike '%is_org_admin%' or v_insert ilike '%can_manage_warehouse%' then
    raise exception 'Subwarehouse INSERT must be restricted to organization admins/super admins';
  end if;
  if v_update_using is null or v_update_using not ilike '%is_org_admin%' or v_update_using ilike '%can_manage_warehouse%'
     or v_update_check is null or v_update_check not ilike '%is_org_admin%' or v_update_check ilike '%can_manage_warehouse%' then
    raise exception 'Subwarehouse UPDATE must be restricted to organization admins/super admins';
  end if;
  if v_delete is null or v_delete not ilike '%is_org_admin%' or v_delete ilike '%can_manage_warehouse%' then
    raise exception 'Subwarehouse DELETE must be restricted to organization admins/super admins';
  end if;
end;
$$;
