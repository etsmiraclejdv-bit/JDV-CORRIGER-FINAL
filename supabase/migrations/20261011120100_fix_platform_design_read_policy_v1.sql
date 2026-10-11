-- Allow signed-in users to read only the published platform design.
-- Drafts and archived platform versions remain visible to the platform super-admin only.
drop policy if exists design_config_versions_read on public.design_config_versions;
create policy design_config_versions_read on public.design_config_versions
  for select to authenticated
  using (
    private.is_super_admin()
    or (scope = 'platform' and status = 'published' and organization_id is null)
    or (organization_id is not null and private.is_org_member(organization_id))
  );
