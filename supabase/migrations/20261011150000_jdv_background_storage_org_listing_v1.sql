-- Restrict object listing to members of the organization that owns the folder.
-- The bucket remains public for rendering decorative backgrounds by URL; listing and
-- mutation operations remain organization-scoped.
drop policy if exists jdv_backgrounds_public_read on storage.objects;
drop policy if exists jdv_backgrounds_org_member_select on storage.objects;
create policy jdv_backgrounds_org_member_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and (private.is_org_member(((storage.foldername(name))[1])::uuid) or private.is_super_admin())
  );
