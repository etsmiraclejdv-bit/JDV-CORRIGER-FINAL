-- Enforce the product rule: only organization administrators and platform admins
-- may create or modify subwarehouse records. Warehouse managers can operate stock,
-- but cannot create or reconfigure subwarehouses.
drop policy if exists warehouse_subwarehouses_admin_insert on public.warehouse_subwarehouses;
create policy warehouse_subwarehouses_admin_insert
  on public.warehouse_subwarehouses
  for insert
  to authenticated
  with check (
    private.is_org_admin(organization_id)
    or private.is_super_admin()
  );

drop policy if exists warehouse_subwarehouses_admin_update on public.warehouse_subwarehouses;
create policy warehouse_subwarehouses_admin_update
  on public.warehouse_subwarehouses
  for update
  to authenticated
  using (
    private.is_org_admin(organization_id)
    or private.is_super_admin()
  )
  with check (
    private.is_org_admin(organization_id)
    or private.is_super_admin()
  );
