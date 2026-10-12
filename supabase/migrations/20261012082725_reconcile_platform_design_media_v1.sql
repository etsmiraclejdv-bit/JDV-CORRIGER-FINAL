-- Reconciled platform design studio media storage configuration.
-- This migration version matches the migration already recorded in Supabase
-- as 20261012082725_reconcile_platform_design_media_v1.
-- Platform files live under the "platform/" folder and require an authenticated super-admin.

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'video/mp4',
      'video/webm'
    ]::text[]
where id = 'jdv-dashboard-backgrounds';

drop policy if exists jdv_platform_media_super_admin_insert on storage.objects;
create policy jdv_platform_media_super_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] = 'platform'
    and (select private.is_super_admin())
  );

drop policy if exists jdv_platform_media_super_admin_update on storage.objects;
create policy jdv_platform_media_super_admin_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] = 'platform'
    and (select private.is_super_admin())
  )
  with check (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] = 'platform'
    and (select private.is_super_admin())
  );

drop policy if exists jdv_platform_media_super_admin_delete on storage.objects;
create policy jdv_platform_media_super_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] = 'platform'
    and (select private.is_super_admin())
  );
