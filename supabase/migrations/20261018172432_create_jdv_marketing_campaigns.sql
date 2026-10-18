-- Durable, per-user marketing campaign drafts for the JDV CRM designer workspace.
-- This migration is intentionally additive. Do not apply directly to production
-- until reviewed and tested against the project's migration history.
create table if not exists public.jdv_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  audience text not null default 'Grand public, entrepreneurs et professionnels'
    check (char_length(audience) <= 500),
  channels text[] not null default array['Vitrine publique', 'Réseaux sociaux']::text[]
    check (cardinality(channels) <= 10),
  objective text not null default 'visibilite'
    check (objective in ('visibilite', 'leads', 'conversion', 'fidelisation')),
  channel text not null default 'organic'
    check (channel in ('organic', 'paid')),
  budget numeric(12,2) not null default 0 check (budget >= 0),
  duration_days integer not null default 14 check (duration_days between 1 and 365),
  social_copy text not null default '' check (char_length(social_copy) <= 20000),
  storefront_copy text not null default '' check (char_length(storefront_copy) <= 20000),
  visual_paths jsonb not null default '[]'::jsonb
    check (jsonb_typeof(visual_paths) = 'array' and jsonb_array_length(visual_paths) <= 10),
  organic_tasks_done text[] not null default '{}'::text[]
    check (cardinality(organic_tasks_done) <= 100),
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jdv_marketing_campaigns_owner_updated_idx
  on public.jdv_marketing_campaigns (created_by, updated_at desc);

alter table public.jdv_marketing_campaigns enable row level security;
alter table public.jdv_marketing_campaigns force row level security;

drop policy if exists jdv_marketing_campaigns_select_own on public.jdv_marketing_campaigns;
create policy jdv_marketing_campaigns_select_own
  on public.jdv_marketing_campaigns for select to authenticated
  using (created_by = (select auth.uid()));

drop policy if exists jdv_marketing_campaigns_insert_own on public.jdv_marketing_campaigns;
create policy jdv_marketing_campaigns_insert_own
  on public.jdv_marketing_campaigns for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists jdv_marketing_campaigns_update_own on public.jdv_marketing_campaigns;
create policy jdv_marketing_campaigns_update_own
  on public.jdv_marketing_campaigns for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

drop policy if exists jdv_marketing_campaigns_delete_own on public.jdv_marketing_campaigns;
create policy jdv_marketing_campaigns_delete_own
  on public.jdv_marketing_campaigns for delete to authenticated
  using (created_by = (select auth.uid()));

revoke all on table public.jdv_marketing_campaigns from anon, public;
grant select, insert, update, delete on table public.jdv_marketing_campaigns to authenticated;

create or replace function public.jdv_marketing_campaigns_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists jdv_marketing_campaigns_updated_at on public.jdv_marketing_campaigns;
create trigger jdv_marketing_campaigns_updated_at
  before update on public.jdv_marketing_campaigns
  for each row execute function public.jdv_marketing_campaigns_set_updated_at();

comment on table public.jdv_marketing_campaigns is
  'Private per-user JDV CRM marketing campaign drafts. RLS limits all access to the authenticated creator.';
