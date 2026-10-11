-- JDV CRM — studio de design et formulaires personnalisés.
-- Cette migration est préparée dans une branche de travail.
-- NE PAS appliquer avant la réconciliation du registre des migrations Supabase.
begin;

create table if not exists public.design_config_versions (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('platform', 'organization')),
  organization_id uuid references public.organizations(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  check (
    (scope = 'platform' and organization_id is null)
    or (scope = 'organization' and organization_id is not null)
  )
);

create unique index if not exists design_config_versions_platform_version_uq
  on public.design_config_versions (version_no) where scope = 'platform';
create unique index if not exists design_config_versions_org_version_uq
  on public.design_config_versions (organization_id, version_no) where scope = 'organization';
create index if not exists design_config_versions_scope_status_idx
  on public.design_config_versions (scope, status, created_at desc);
create index if not exists design_config_versions_org_status_idx
  on public.design_config_versions (organization_id, status, created_at desc)
  where organization_id is not null;

alter table public.design_config_versions enable row level security;
drop policy if exists design_config_versions_read on public.design_config_versions;
create policy design_config_versions_read on public.design_config_versions
  for select to authenticated
  using (
    private.is_super_admin()
    or (organization_id is not null and private.is_org_member(organization_id))
  );
drop policy if exists design_config_versions_insert on public.design_config_versions;
create policy design_config_versions_insert on public.design_config_versions
  for insert to authenticated
  with check (
    (scope = 'platform' and organization_id is null and private.is_super_admin())
    or (scope = 'organization' and organization_id is not null and private.is_org_admin(organization_id))
  );
drop policy if exists design_config_versions_update on public.design_config_versions;
create policy design_config_versions_update on public.design_config_versions
  for update to authenticated
  using (
    (scope = 'platform' and private.is_super_admin())
    or (scope = 'organization' and organization_id is not null and private.is_org_admin(organization_id))
  )
  with check (
    (scope = 'platform' and organization_id is null and private.is_super_admin())
    or (scope = 'organization' and organization_id is not null and private.is_org_admin(organization_id))
  );
drop policy if exists design_config_versions_delete on public.design_config_versions;
create policy design_config_versions_delete on public.design_config_versions
  for delete to authenticated
  using (
    (scope = 'platform' and private.is_super_admin())
    or (scope = 'organization' and organization_id is not null and private.is_org_admin(organization_id))
  );

create table if not exists public.custom_form_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_key text not null check (form_key ~ '^[a-z][a-z0-9_]{1,79}$'),
  name text not null check (char_length(name) between 2 and 120),
  description text check (description is null or char_length(description) <= 500),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, form_key)
);

create table if not exists public.custom_form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.custom_form_definitions(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  schema_json jsonb not null default '{"fields":[]}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (form_id, version_no)
);

create index if not exists custom_form_definitions_org_status_idx
  on public.custom_form_definitions (organization_id, status, updated_at desc);
create index if not exists custom_form_versions_form_status_idx
  on public.custom_form_versions (form_id, status, version_no desc);

alter table public.custom_form_definitions enable row level security;
alter table public.custom_form_versions enable row level security;

drop policy if exists custom_form_definitions_read on public.custom_form_definitions;
create policy custom_form_definitions_read on public.custom_form_definitions
  for select to authenticated
  using (
    private.is_super_admin()
    or private.is_org_admin(organization_id)
    or (status = 'published' and private.is_org_member(organization_id))
  );
drop policy if exists custom_form_definitions_insert on public.custom_form_definitions;
create policy custom_form_definitions_insert on public.custom_form_definitions
  for insert to authenticated
  with check (private.is_super_admin() or private.is_org_admin(organization_id));
drop policy if exists custom_form_definitions_update on public.custom_form_definitions;
create policy custom_form_definitions_update on public.custom_form_definitions
  for update to authenticated
  using (private.is_super_admin() or private.is_org_admin(organization_id))
  with check (private.is_super_admin() or private.is_org_admin(organization_id));
drop policy if exists custom_form_definitions_delete on public.custom_form_definitions;
create policy custom_form_definitions_delete on public.custom_form_definitions
  for delete to authenticated
  using (private.is_super_admin() or private.is_org_admin(organization_id));

drop policy if exists custom_form_versions_read on public.custom_form_versions;
create policy custom_form_versions_read on public.custom_form_versions
  for select to authenticated
  using (
    private.is_super_admin()
    or exists (
      select 1 from public.custom_form_definitions f
      where f.id = form_id
        and (
          private.is_org_admin(f.organization_id)
          or (status = 'published' and private.is_org_member(f.organization_id))
        )
    )
  );
drop policy if exists custom_form_versions_insert on public.custom_form_versions;
create policy custom_form_versions_insert on public.custom_form_versions
  for insert to authenticated
  with check (
    private.is_super_admin()
    or exists (
      select 1 from public.custom_form_definitions f
      where f.id = form_id and private.is_org_admin(f.organization_id)
    )
  );
drop policy if exists custom_form_versions_update on public.custom_form_versions;
create policy custom_form_versions_update on public.custom_form_versions
  for update to authenticated
  using (
    private.is_super_admin()
    or exists (
      select 1 from public.custom_form_definitions f
      where f.id = form_id and private.is_org_admin(f.organization_id)
    )
  )
  with check (
    private.is_super_admin()
    or exists (
      select 1 from public.custom_form_definitions f
      where f.id = form_id and private.is_org_admin(f.organization_id)
    )
  );
drop policy if exists custom_form_versions_delete on public.custom_form_versions;
create policy custom_form_versions_delete on public.custom_form_versions
  for delete to authenticated
  using (
    private.is_super_admin()
    or exists (
      select 1 from public.custom_form_definitions f
      where f.id = form_id and private.is_org_admin(f.organization_id)
    )
  );

commit;
