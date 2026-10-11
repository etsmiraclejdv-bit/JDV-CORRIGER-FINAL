-- JDV CRM: animated dashboard backgrounds, news hub support, and client reviews
alter table public.organization_personalization
  add column if not exists dashboard_background_opacity numeric not null default 0.14
    check (dashboard_background_opacity >= 0 and dashboard_background_opacity <= 1),
  add column if not exists dashboard_background_fit text not null default 'cover'
    check (dashboard_background_fit in ('cover','contain','auto')),
  add column if not exists dashboard_background_motion boolean not null default false,
  add column if not exists dashboard_background_updated_at timestamptz;

create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  customer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  source text not null default 'in_person'
    check (source in ('in_person','phone','whatsapp','email','online')),
  status text not null default 'published'
    check (status in ('pending','published','hidden')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_reviews_comment_length check (char_length(trim(comment)) between 2 and 3000),
  constraint client_reviews_customer_name_length check (char_length(trim(customer_name)) between 2 and 160)
);

create index if not exists client_reviews_org_created_idx
  on public.client_reviews (organization_id, created_at desc);
create index if not exists client_reviews_org_status_idx
  on public.client_reviews (organization_id, status, created_at desc);

alter table public.client_reviews enable row level security;

drop policy if exists client_reviews_member_select on public.client_reviews;
create policy client_reviews_member_select on public.client_reviews
  for select to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin());

drop policy if exists client_reviews_member_insert on public.client_reviews;
create policy client_reviews_member_insert on public.client_reviews
  for insert to authenticated
  with check (
    (private.is_org_member(organization_id) or private.is_super_admin())
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists client_reviews_admin_update on public.client_reviews;
create policy client_reviews_admin_update on public.client_reviews
  for update to authenticated
  using (private.is_org_admin(organization_id) or private.is_super_admin())
  with check (private.is_org_admin(organization_id) or private.is_super_admin());

drop policy if exists client_reviews_admin_delete on public.client_reviews;
create policy client_reviews_admin_delete on public.client_reviews
  for delete to authenticated
  using (private.is_org_admin(organization_id) or private.is_super_admin());

grant select, insert, update, delete on public.client_reviews to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jdv-dashboard-backgrounds',
  'jdv-dashboard-backgrounds',
  true,
  12582912,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists jdv_backgrounds_public_read on storage.objects;
create policy jdv_backgrounds_public_read on storage.objects
  for select to public
  using (bucket_id = 'jdv-dashboard-backgrounds');

drop policy if exists jdv_backgrounds_org_admin_insert on storage.objects;
create policy jdv_backgrounds_org_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and private.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists jdv_backgrounds_org_admin_update on storage.objects;
create policy jdv_backgrounds_org_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and private.is_org_admin(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and private.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists jdv_backgrounds_org_admin_delete on storage.objects;
create policy jdv_backgrounds_org_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'jdv-dashboard-backgrounds'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and private.is_org_admin(((storage.foldername(name))[1])::uuid)
  );
