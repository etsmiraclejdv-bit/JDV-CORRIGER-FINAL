-- Reconcile live Supabase policy drift: subwarehouse mutations are administrator-only.
-- Warehouse managers may view assigned subwarehouses, but cannot create, update, or delete them.
-- Safe to apply once after review; does not alter business data.

drop policy if exists warehouse_subwarehouses_admin_insert on public.warehouse_subwarehouses;
create policy warehouse_subwarehouses_admin_insert
on public.warehouse_subwarehouses
for insert to authenticated
with check ((select private.is_org_admin(organization_id)));

drop policy if exists warehouse_subwarehouses_admin_update on public.warehouse_subwarehouses;
create policy warehouse_subwarehouses_admin_update
on public.warehouse_subwarehouses
for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

drop policy if exists warehouse_subwarehouses_admin_delete on public.warehouse_subwarehouses;
create policy warehouse_subwarehouses_admin_delete
on public.warehouse_subwarehouses
for delete to authenticated
using ((select private.is_org_admin(organization_id)));

-- Keep role-based UI permissions aligned with the database enforcement.
delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and rp.role in ('manager', 'supervisor')
  and p.code in (
    'warehouses.subwarehouses.create',
    'warehouses.subwarehouses.update',
    'warehouses.subwarehouses.deactivate'
  );
