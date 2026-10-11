-- Restrict visibility of unpublished design versions to the appropriate administrators.
-- Published platform design is readable by authenticated users; platform drafts/archives
-- remain exclusive to the super-admin. Organization drafts/archives are limited to
-- organization admins; organization members can read only published organization design.
drop policy if exists design_config_versions_read on public.design_config_versions;
create policy design_config_versions_read on public.design_config_versions
  for select to authenticated
  using (
    private.is_super_admin()
    or (scope = 'platform' and status = 'published' and organization_id is null)
    or (
      organization_id is not null
      and private.is_org_admin(organization_id)
    )
    or (
      organization_id is not null
      and status = 'published'
      and private.is_org_member(organization_id)
    )
  );
