-- Page d'accueil : messages de contact (écrits par le serveur) et témoignages vérifiés (lus par le public).

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  subject text check (subject is null or char_length(subject) <= 160),
  message text not null check (char_length(message) between 5 and 2000),
  source text not null default 'site',
  status text not null default 'new' check (status in ('new','read','answered','spam')),
  check (email is not null or phone is not null)
);
alter table public.contact_messages enable row level security;
create index if not exists idx_contact_messages_status_created on public.contact_messages (status, created_at desc);

-- Lecture et traitement réservés au super admin ; l'écriture se fait uniquement côté serveur (clé de service).
drop policy if exists contact_messages_super_admin_read on public.contact_messages;
create policy contact_messages_super_admin_read on public.contact_messages for select to authenticated
  using ((select private.is_super_admin()));
drop policy if exists contact_messages_super_admin_update on public.contact_messages;
create policy contact_messages_super_admin_update on public.contact_messages for update to authenticated
  using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
revoke all on public.contact_messages from anon, authenticated;
grant select, update on public.contact_messages to authenticated;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_name text not null check (char_length(author_name) between 2 and 120),
  author_role text check (author_role is null or char_length(author_role) <= 120),
  company_name text check (company_name is null or char_length(company_name) <= 160),
  quote text not null check (char_length(quote) between 10 and 600),
  rating smallint check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  sort_order integer not null default 100,
  approved_at timestamptz
);
alter table public.testimonials enable row level security;
create index if not exists idx_testimonials_status_order on public.testimonials (status, sort_order);

-- Le public ne voit que les témoignages approuvés ; seul le super admin les gère.
drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read on public.testimonials for select to anon, authenticated
  using (status = 'approved');
drop policy if exists testimonials_super_admin_all on public.testimonials;
create policy testimonials_super_admin_all on public.testimonials for all to authenticated
  using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
revoke all on public.testimonials from anon, authenticated;
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
