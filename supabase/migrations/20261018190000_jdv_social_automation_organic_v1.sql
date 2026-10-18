-- JDV CRM organic social automation: schema only, intentionally not applied to Supabase here.
-- Publishing remains disabled until OAuth, scopes, platform review, and dry-run checks pass.

alter table public.jdv_marketing_campaigns
  add column if not exists automation_mode text not null default 'manual'
    check (automation_mode in ('manual', 'auto_14_days')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists automation_starts_at timestamptz,
  add column if not exists automation_ends_at timestamptz,
  add column if not exists timezone text not null default 'Africa/Porto-Novo',
  add column if not exists publication_paused_at timestamptz,
  add column if not exists approval_version integer not null default 1
    check (approval_version >= 1);

alter table public.jdv_marketing_campaigns
  drop constraint if exists jdv_marketing_campaigns_auto_14_days_organic_only_check;
alter table public.jdv_marketing_campaigns
  add constraint jdv_marketing_campaigns_auto_14_days_organic_only_check
  check (automation_mode <> 'auto_14_days' or (channel = 'organic' and budget = 0));

create table if not exists public.jdv_social_connections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'x', 'tiktok', 'threads', 'whatsapp_business')),
  platform_account_id text not null,
  account_label text not null default '',
  account_type text not null default 'unknown',
  granted_scopes text[] not null default '{}',
  connection_status text not null default 'pending'
    check (connection_status in ('pending', 'connected', 'needs_reauth', 'restricted', 'disconnected')),
  capabilities jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, platform, platform_account_id)
);

create table if not exists public.jdv_social_connection_secrets (
  connection_id uuid primary key references public.jdv_social_connections(id) on delete cascade,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  encryption_key_version text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.jdv_social_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jdv_marketing_campaigns(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.jdv_social_connections(id) on delete restrict,
  platform text not null check (platform in ('facebook', 'instagram', 'x', 'tiktok', 'threads', 'whatsapp_business')),
  scheduled_at timestamptz not null,
  timezone text not null default 'Africa/Porto-Novo',
  content_text text not null default '',
  media_urls jsonb not null default '[]'::jsonb
    check (jsonb_typeof(media_urls) = 'array' and jsonb_array_length(media_urls) <= 10),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'publishing', 'published', 'failed', 'cancelled', 'blocked')),
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  next_attempt_at timestamptz,
  platform_post_id text,
  published_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'queued' or scheduled_at is not null)
);

create index if not exists jdv_social_posts_due_idx
  on public.jdv_social_posts (status, scheduled_at)
  where status in ('queued', 'failed');
create index if not exists jdv_social_posts_owner_idx
  on public.jdv_social_posts (owner_user_id, created_at desc);
create index if not exists jdv_social_connections_owner_idx
  on public.jdv_social_connections (owner_user_id, platform, connection_status);

alter table public.jdv_social_connections enable row level security;
alter table public.jdv_social_connections force row level security;
alter table public.jdv_social_connection_secrets enable row level security;
alter table public.jdv_social_connection_secrets force row level security;
alter table public.jdv_social_posts enable row level security;
alter table public.jdv_social_posts force row level security;

drop policy if exists jdv_social_connections_owner_select on public.jdv_social_connections;
create policy jdv_social_connections_owner_select on public.jdv_social_connections
  for select to authenticated using (owner_user_id = (select auth.uid()));
-- Connection status, scopes, and account identifiers are written only by verified server-side OAuth handlers.
drop policy if exists jdv_social_connections_owner_insert on public.jdv_social_connections;
drop policy if exists jdv_social_connections_owner_update on public.jdv_social_connections;
drop policy if exists jdv_social_connections_owner_delete on public.jdv_social_connections;

drop policy if exists jdv_social_posts_owner_select on public.jdv_social_posts;
create policy jdv_social_posts_owner_select on public.jdv_social_posts
  for select to authenticated using (owner_user_id = (select auth.uid()));
drop policy if exists jdv_social_posts_owner_insert on public.jdv_social_posts;
create policy jdv_social_posts_owner_insert on public.jdv_social_posts
  for insert to authenticated with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1 from public.jdv_marketing_campaigns c
      where c.id = campaign_id and c.created_by = (select auth.uid())
        and c.channel = 'organic' and c.budget = 0
        and c.approved_at is not null
        and c.automation_ends_at > now()
    )
    and exists (
      select 1 from public.jdv_social_connections sc
      where sc.id = connection_id and sc.owner_user_id = (select auth.uid())
        and sc.connection_status = 'connected'
    )
  );
drop policy if exists jdv_social_posts_owner_update on public.jdv_social_posts;
create policy jdv_social_posts_owner_update on public.jdv_social_posts
  for update to authenticated using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));
drop policy if exists jdv_social_posts_owner_delete on public.jdv_social_posts;
create policy jdv_social_posts_owner_delete on public.jdv_social_posts
  for delete to authenticated using (owner_user_id = (select auth.uid()));

-- Tokens are never readable or writable through authenticated/anon PostgREST roles.
revoke all on public.jdv_social_connection_secrets from anon, authenticated;
revoke all on public.jdv_social_connection_secrets from public;
grant select, insert, update, delete on public.jdv_social_connection_secrets to service_role;
revoke all on public.jdv_social_connections from anon;
revoke all on public.jdv_social_posts from anon;
grant select on public.jdv_social_connections to authenticated;
grant select, insert, update, delete on public.jdv_social_posts to authenticated;

comment on table public.jdv_social_connection_secrets is
  'Encrypted OAuth tokens only. Service-role Edge Functions only; encryption key must live in Supabase secrets, never in client code.';
comment on table public.jdv_social_posts is
  'Organic post queue. A server-side scheduler must re-check approval, connection scopes, capability, 14-day window, and idempotency before any provider call.';
