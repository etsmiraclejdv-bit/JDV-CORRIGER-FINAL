-- JDV CRM — Codes uniques par produit (mode sans lecteur de codes-barres).
--
-- Circuit : l'entreprise (ou le chef d'agence) inscrit chaque produit sous un code unique
-- → le code part de l'entreprise ou de l'agence dans un bon d'expédition
-- → le prospecteur accuse réception en SAISISSANT les codes inscrits sur les produits.
--
-- Principes :
--  * Additif uniquement : aucune table existante n'est modifiée, aucune quantité n'est touchée à la création.
--  * L'expédition et la réception RÉUTILISENT les fonctions existantes
--    jdvcrm_dispatch_prospecteur_shipment_v1 / jdvcrm_confirm_prospecteur_shipment_receipt_v1
--    (stock, mouvements, avoirs de stock prospecteur : une seule source de vérité).
--  * Le prospecteur ne voit jamais la liste des codes attendus : il doit les lire sur les produits.
--  * Journal d'événements immuable (aucune modification ni suppression possible).
-- À tester sur une base de développement avant toute application en production.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.unit_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  code text not null,
  status text not null default 'registered'
    check (status in ('registered','in_transit','with_prospecteur','damaged','missing','blocked')),
  -- Agence/entrepôt détenteur (ou dernière agence détentrice une fois le produit parti).
  warehouse_id uuid references public.warehouses(id) on delete restrict,
  -- Prospecteur détenteur après accusé de réception.
  prospecteur_id uuid references public.prospecteurs(id) on delete restrict,
  shipment_id uuid references public.prospecteur_supply_shipments(id) on delete set null,
  generated boolean not null default false,
  registered_by uuid references auth.users(id),
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unit_codes_code_format check (code ~ '^[A-Z0-9][A-Z0-9._/-]{3,63}$')
);

create unique index if not exists uq_unit_codes_org_code on public.unit_codes (organization_id, code);
create index if not exists idx_unit_codes_org_article_status on public.unit_codes (organization_id, article_id, status);
create index if not exists idx_unit_codes_warehouse_status on public.unit_codes (warehouse_id, status);
create index if not exists idx_unit_codes_prospecteur on public.unit_codes (prospecteur_id) where prospecteur_id is not null;
create index if not exists idx_unit_codes_shipment on public.unit_codes (shipment_id) where shipment_id is not null;
create index if not exists idx_unit_codes_article on public.unit_codes (article_id);
create index if not exists idx_unit_codes_registered_by on public.unit_codes (registered_by) where registered_by is not null;

create table if not exists public.prospecteur_supply_shipment_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shipment_id uuid not null references public.prospecteur_supply_shipments(id) on delete cascade,
  shipment_item_id uuid not null references public.prospecteur_supply_shipment_items(id) on delete cascade,
  unit_code_id uuid not null references public.unit_codes(id) on delete restrict,
  code_snapshot text not null,
  status text not null default 'expected' check (status in ('expected','received','damaged','missing')),
  received_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shipment_id, unit_code_id)
);

create index if not exists idx_supply_shipment_units_shipment on public.prospecteur_supply_shipment_units (shipment_id);
create index if not exists idx_supply_shipment_units_item on public.prospecteur_supply_shipment_units (shipment_item_id);
create index if not exists idx_supply_shipment_units_unit on public.prospecteur_supply_shipment_units (unit_code_id);
create index if not exists idx_supply_shipment_units_org on public.prospecteur_supply_shipment_units (organization_id);

create table if not exists public.unit_code_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_code_id uuid not null references public.unit_codes(id) on delete cascade,
  event_type text not null
    check (event_type in ('registered','dispatched','received','damaged_on_receipt','missing_on_receipt')),
  entry_mode text not null default 'manual' check (entry_mode in ('manual','generated','scanner')),
  actor_role text not null check (actor_role in ('company_admin','agency_head','prospecteur','concepteur')),
  from_warehouse_id uuid references public.warehouses(id) on delete set null,
  to_prospecteur_id uuid references public.prospecteurs(id) on delete set null,
  shipment_id uuid references public.prospecteur_supply_shipments(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_unit_code_events_unit_time on public.unit_code_events (unit_code_id, created_at);
create index if not exists idx_unit_code_events_org on public.unit_code_events (organization_id, created_at desc);
create index if not exists idx_unit_code_events_shipment on public.unit_code_events (shipment_id) where shipment_id is not null;
create index if not exists idx_unit_code_events_warehouse on public.unit_code_events (from_warehouse_id) where from_warehouse_id is not null;
create index if not exists idx_unit_code_events_prospecteur on public.unit_code_events (to_prospecteur_id) where to_prospecteur_id is not null;
create index if not exists idx_unit_code_events_actor on public.unit_code_events (actor_user_id) where actor_user_id is not null;

-- Journal immuable
-- Les modifications directes sont interdites. Les opérations de maintenance référentielle
-- (suppression en cascade d'une entreprise, FK « on delete set null ») s'exécutent dans un
-- déclencheur imbriqué (pg_trigger_depth() > 1) et restent autorisées.
create or replace function private.jdvcrm_unit_code_events_immutable_v1()
returns trigger language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;
  raise exception 'Le journal des codes uniques est immuable';
end;
$$;
drop trigger if exists trg_unit_code_events_immutable on public.unit_code_events;
create trigger trg_unit_code_events_immutable
  before update or delete on public.unit_code_events
  for each row execute function private.jdvcrm_unit_code_events_immutable_v1();

-- ---------------------------------------------------------------------------
-- 2. Sécurité (lecture seule côté client ; toute écriture passe par les fonctions ci-dessous)
-- ---------------------------------------------------------------------------
alter table public.unit_codes enable row level security;
alter table public.prospecteur_supply_shipment_units enable row level security;
alter table public.unit_code_events enable row level security;

drop policy if exists unit_codes_select on public.unit_codes;
create policy unit_codes_select on public.unit_codes
  for select to authenticated
  using (
    (select private.is_org_admin(organization_id))
    or (warehouse_id is not null and (select private.can_manage_warehouse(warehouse_id)))
    or prospecteur_id in (select p.id from public.prospecteurs p where p.user_id = (select auth.uid()))
  );

drop policy if exists supply_shipment_units_select on public.prospecteur_supply_shipment_units;
create policy supply_shipment_units_select on public.prospecteur_supply_shipment_units
  for select to authenticated
  using (
    (select private.is_org_admin(organization_id))
    or exists (
      select 1 from public.prospecteur_supply_shipments s
      where s.id = prospecteur_supply_shipment_units.shipment_id
        and (select private.can_manage_warehouse(s.warehouse_id))
    )
  );

drop policy if exists unit_code_events_select on public.unit_code_events;
create policy unit_code_events_select on public.unit_code_events
  for select to authenticated
  using (
    (select private.is_org_admin(organization_id))
    or (from_warehouse_id is not null and (select private.can_manage_warehouse(from_warehouse_id)))
  );

revoke all on public.unit_codes from anon, authenticated;
revoke all on public.prospecteur_supply_shipment_units from anon, authenticated;
revoke all on public.unit_code_events from anon, authenticated;
grant select on public.unit_codes to authenticated;
grant select on public.prospecteur_supply_shipment_units to authenticated;
grant select on public.unit_code_events to authenticated;
grant all on public.unit_codes to service_role;
grant all on public.prospecteur_supply_shipment_units to service_role;
grant all on public.unit_code_events to service_role;

-- ---------------------------------------------------------------------------
-- 3. Fonctions
-- ---------------------------------------------------------------------------
create or replace function private.jdvcrm_normalize_unit_codes_v1(p_codes text[])
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_out text[] := '{}';
  v_code text;
  v_bad text[] := '{}';
  v_dups text[] := '{}';
begin
  if p_codes is null then return v_out; end if;
  foreach v_code in array p_codes loop
    v_code := upper(btrim(coalesce(v_code, '')));
    if v_code = '' then continue; end if;
    if v_code !~ '^[A-Z0-9][A-Z0-9._/-]{3,63}$' then
      v_bad := array_append(v_bad, v_code);
    elsif v_code = any(v_out) then
      v_dups := array_append(v_dups, v_code);
    else
      v_out := array_append(v_out, v_code);
    end if;
  end loop;
  if array_length(v_bad, 1) is not null then
    raise exception 'Code invalide (4 à 64 caractères : lettres, chiffres, . _ / -) : %',
      array_to_string(v_bad[1:5], ', ');
  end if;
  if array_length(v_dups, 1) is not null then
    raise exception 'Code saisi plusieurs fois : %', array_to_string(v_dups[1:5], ', ');
  end if;
  return v_out;
end;
$$;

-- 3.1 Inscription des produits sous un code unique -------------------------------------
create or replace function public.jdvcrm_register_unit_codes_v1(
  p_warehouse_id uuid,
  p_article_id uuid,
  p_codes text[] default null,
  p_quantity integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_article_code text;
  v_codes text[];
  v_generated boolean := false;
  v_prefix text;
  v_candidate text;
  v_taken text[];
  v_role text;
  v_tries integer := 0;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_warehouse_id is null or p_article_id is null then
    raise exception 'Agence/entrepôt et article obligatoires';
  end if;

  select w.organization_id into v_org
  from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'Vous ne pouvez pas inscrire de produits dans cet entrepôt';
  end if;

  select a.code into v_article_code
  from public.articles a
  where a.id = p_article_id and a.organization_id = v_org and a.active = true;
  if not found then raise exception 'Article introuvable, inactif ou hors organisation'; end if;

  if p_codes is not null and array_length(p_codes, 1) is not null then
    v_codes := private.jdvcrm_normalize_unit_codes_v1(p_codes);
  else
    v_codes := '{}';
  end if;

  if coalesce(array_length(v_codes, 1), 0) = 0 then
    -- Génération automatique
    if p_quantity is null or p_quantity < 1 or p_quantity > 500 then
      raise exception 'Indiquez les codes à inscrire, ou une quantité entre 1 et 500 pour les générer';
    end if;
    v_generated := true;
    v_prefix := left(regexp_replace(upper(coalesce(v_article_code, '')), '[^A-Z0-9]', '', 'g'), 6);
    if v_prefix = '' then v_prefix := 'JDV'; end if;
    while coalesce(array_length(v_codes, 1), 0) < p_quantity loop
      v_tries := v_tries + 1;
      if v_tries > p_quantity * 5 + 50 then raise exception 'Génération de codes impossible, réessayez'; end if;
      v_candidate := v_prefix || '-' || to_char(clock_timestamp(), 'YYMMDD') || '-'
        || upper(substr(md5(random()::text || clock_timestamp()::text || v_tries::text), 1, 8));
      if v_candidate = any(v_codes) then continue; end if;
      if exists (select 1 from public.unit_codes u where u.organization_id = v_org and u.code = v_candidate) then continue; end if;
      v_codes := array_append(v_codes, v_candidate);
    end loop;
  else
    if array_length(v_codes, 1) > 500 then raise exception '500 codes maximum par opération'; end if;
    select coalesce(array_agg(u.code order by u.code), '{}') into v_taken
    from public.unit_codes u where u.organization_id = v_org and u.code = any(v_codes);
    if array_length(v_taken, 1) is not null then
      raise exception 'Code déjà inscrit dans cette entreprise : %', array_to_string(v_taken[1:5], ', ');
    end if;
  end if;

  v_role := case when private.is_super_admin() then 'concepteur'
                 when private.is_org_admin(v_org) then 'company_admin'
                 else 'agency_head' end;

  with ins as (
    insert into public.unit_codes (organization_id, article_id, code, status, warehouse_id, generated, registered_by)
    select v_org, p_article_id, c, 'registered', p_warehouse_id, v_generated, v_uid
    from unnest(v_codes) as c
    returning id
  )
  insert into public.unit_code_events (
    organization_id, unit_code_id, event_type, entry_mode, actor_role,
    from_warehouse_id, actor_user_id, details
  )
  select v_org, ins.id, 'registered', case when v_generated then 'generated' else 'manual' end,
         v_role, p_warehouse_id, v_uid, jsonb_build_object('article_id', p_article_id)
  from ins;

  return jsonb_build_object(
    'count', array_length(v_codes, 1),
    'generated', v_generated,
    'codes', to_jsonb(v_codes)
  );
end;
$$;

-- 3.2 Expédition d'une liste de codes vers un prospecteur ------------------------------
create or replace function public.jdvcrm_dispatch_unit_codes_v1(
  p_warehouse_id uuid,
  p_prospecteur_id uuid,
  p_codes text[],
  p_notes text default null,
  p_idempotency_key uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_org uuid;
  v_key uuid := coalesce(p_idempotency_key, gen_random_uuid());
  v_codes text[];
  v_found integer;
  v_unknown text[];
  v_invalid text[];
  v_items jsonb;
  v_result jsonb;
  v_shipment uuid;
  v_role text;
  v_existing public.prospecteur_supply_shipments%rowtype;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;
  if p_warehouse_id is null or p_prospecteur_id is null then
    raise exception 'Agence/entrepôt et prospecteur obligatoires';
  end if;

  perform pg_advisory_xact_lock(hashtext('unit-dispatch:' || v_key::text));
  select * into v_existing from public.prospecteur_supply_shipments where idempotency_key = v_key;
  if found then
    if v_existing.dispatched_by is distinct from v_uid then raise exception 'Clé d''opération déjà utilisée'; end if;
    return jsonb_build_object(
      'shipment_id', v_existing.id, 'shipment_number', v_existing.shipment_number,
      'status', v_existing.status, 'organization_id', v_existing.organization_id,
      'unit_count', (select count(*) from public.prospecteur_supply_shipment_units su where su.shipment_id = v_existing.id)
    );
  end if;

  select w.organization_id into v_org
  from public.warehouses w where w.id = p_warehouse_id and w.active = true;
  if v_org is null then raise exception 'Entrepôt introuvable ou inactif'; end if;
  if not private.can_manage_warehouse(p_warehouse_id) then
    raise exception 'Vous ne pouvez pas expédier depuis cet entrepôt';
  end if;

  v_codes := private.jdvcrm_normalize_unit_codes_v1(p_codes);
  if coalesce(array_length(v_codes, 1), 0) = 0 then raise exception 'Indiquez au moins un code'; end if;
  if array_length(v_codes, 1) > 500 then raise exception '500 codes maximum par bon'; end if;

  -- Verrouille les codes et contrôle leur état
  select count(*) into v_found
  from (
    select u.id from public.unit_codes u
    where u.organization_id = v_org and u.code = any(v_codes)
    for update
  ) locked;

  if v_found <> array_length(v_codes, 1) then
    select coalesce(array_agg(c order by c), '{}') into v_unknown
    from unnest(v_codes) c
    where not exists (select 1 from public.unit_codes u where u.organization_id = v_org and u.code = c);
    raise exception 'Code inconnu dans cette entreprise : %', array_to_string(v_unknown[1:5], ', ');
  end if;

  select coalesce(array_agg(u.code order by u.code), '{}') into v_invalid
  from public.unit_codes u
  where u.organization_id = v_org and u.code = any(v_codes)
    and (u.status <> 'registered' or u.warehouse_id is distinct from p_warehouse_id);
  if array_length(v_invalid, 1) is not null then
    raise exception 'Code indisponible (déjà expédié, ou rattaché à une autre agence) : %',
      array_to_string(v_invalid[1:5], ', ');
  end if;

  select jsonb_agg(jsonb_build_object('article_id', t.article_id, 'quantity', t.qty, 'device_type', 'manual'))
  into v_items
  from (
    select u.article_id, count(*)::integer as qty
    from public.unit_codes u
    where u.organization_id = v_org and u.code = any(v_codes)
    group by u.article_id
  ) t;

  -- Réutilise l'expédition existante : contrôle d'affectation, de stock, mouvements et traces.
  v_result := public.jdvcrm_dispatch_prospecteur_shipment_v1(
    p_warehouse_id, p_prospecteur_id, v_items, p_notes, v_key
  );
  v_shipment := (v_result ->> 'shipment_id')::uuid;

  insert into public.prospecteur_supply_shipment_units (
    organization_id, shipment_id, shipment_item_id, unit_code_id, code_snapshot
  )
  select v_org, v_shipment, si.id, u.id, u.code
  from public.unit_codes u
  join public.prospecteur_supply_shipment_items si
    on si.shipment_id = v_shipment and si.article_id = u.article_id
  where u.organization_id = v_org and u.code = any(v_codes);

  v_role := case when private.is_super_admin() then 'concepteur'
                 when private.is_org_admin(v_org) then 'company_admin'
                 else 'agency_head' end;

  update public.unit_codes u
  set status = 'in_transit', shipment_id = v_shipment, updated_at = now()
  where u.organization_id = v_org and u.code = any(v_codes);

  insert into public.unit_code_events (
    organization_id, unit_code_id, event_type, entry_mode, actor_role,
    from_warehouse_id, to_prospecteur_id, shipment_id, actor_user_id
  )
  select v_org, u.id, 'dispatched', 'manual', v_role, p_warehouse_id, p_prospecteur_id, v_shipment, v_uid
  from public.unit_codes u
  where u.organization_id = v_org and u.code = any(v_codes);

  return v_result || jsonb_build_object('unit_count', array_length(v_codes, 1));
end;
$$;

-- 3.3 Accusé de réception par le prospecteur : il saisit les codes lus sur les produits ---
create or replace function public.jdvcrm_confirm_unit_code_receipt_v1(
  p_shipment_id uuid,
  p_codes text[],
  p_damaged_codes text[] default '{}',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_shipment public.prospecteur_supply_shipments%rowtype;
  v_typed text[];
  v_damaged text[];
  v_unexpected text[];
  v_not_typed_damaged text[];
  v_items jsonb;
  v_result jsonb;
  v_units integer;
  v_received integer;
  v_damaged_count integer;
  v_missing integer;
begin
  if v_uid is null then raise exception 'Session utilisateur introuvable'; end if;

  select * into v_shipment from public.prospecteur_supply_shipments where id = p_shipment_id for update;
  if not found then raise exception 'Bon de livraison introuvable'; end if;
  if not exists (
    select 1 from public.prospecteurs p
    where p.id = v_shipment.prospecteur_id and p.user_id = v_uid and p.status = 'active'
  ) then raise exception 'Seul le prospecteur destinataire peut accuser réception'; end if;
  if v_shipment.status <> 'dispatched' then raise exception 'Ce bon n''est pas en attente de réception'; end if;

  select count(*) into v_units from public.prospecteur_supply_shipment_units su where su.shipment_id = p_shipment_id;
  if v_units = 0 then raise exception 'Ce bon ne fonctionne pas par codes uniques'; end if;

  v_typed := private.jdvcrm_normalize_unit_codes_v1(p_codes);
  v_damaged := private.jdvcrm_normalize_unit_codes_v1(p_damaged_codes);

  select coalesce(array_agg(c order by c), '{}') into v_unexpected
  from unnest(v_typed) c
  where not exists (
    select 1 from public.prospecteur_supply_shipment_units su
    where su.shipment_id = p_shipment_id and su.code_snapshot = c
  );
  if array_length(v_unexpected, 1) is not null then
    raise exception 'Code non reconnu pour ce bon : %. Relisez le code inscrit sur le produit.',
      array_to_string(v_unexpected[1:5], ', ');
  end if;

  select coalesce(array_agg(c order by c), '{}') into v_not_typed_damaged
  from unnest(v_damaged) c where not (c = any(v_typed));
  if array_length(v_not_typed_damaged, 1) is not null then
    raise exception 'Un produit endommagé doit aussi être saisi comme reçu : %',
      array_to_string(v_not_typed_damaged[1:5], ', ');
  end if;

  -- Quantités par article, calculées côté serveur à partir des codes saisis
  select jsonb_agg(jsonb_build_object(
    'article_id', si.article_id,
    'quantity_received', coalesce(x.received, 0),
    'quantity_accepted', coalesce(x.received, 0) - coalesce(x.damaged, 0),
    'quantity_damaged', coalesce(x.damaged, 0),
    'quantity_missing', greatest(si.quantity_dispatched - coalesce(x.received, 0), 0),
    'device_type', 'manual'
  ))
  into v_items
  from public.prospecteur_supply_shipment_items si
  left join (
    select su.shipment_item_id,
           count(*) filter (where su.code_snapshot = any(v_typed))::integer as received,
           count(*) filter (where su.code_snapshot = any(v_damaged))::integer as damaged
    from public.prospecteur_supply_shipment_units su
    where su.shipment_id = p_shipment_id
    group by su.shipment_item_id
  ) x on x.shipment_item_id = si.id
  where si.shipment_id = p_shipment_id;

  -- Réutilise la confirmation existante : stock prospecteur, mouvements, statut du bon.
  v_result := public.jdvcrm_confirm_prospecteur_shipment_receipt_v1(p_shipment_id, v_items, p_notes);

  update public.prospecteur_supply_shipment_units su
  set status = case when su.code_snapshot = any(v_damaged) then 'damaged'
                    when su.code_snapshot = any(v_typed) then 'received'
                    else 'missing' end,
      received_at = case when su.code_snapshot = any(v_typed) then now() else null end
  where su.shipment_id = p_shipment_id;

  update public.unit_codes u
  set status = case when u.code = any(v_damaged) then 'damaged'
                    when u.code = any(v_typed) then 'with_prospecteur'
                    else 'missing' end,
      prospecteur_id = case when u.code = any(v_typed) then v_shipment.prospecteur_id else null end,
      updated_at = now()
  where u.id in (select su.unit_code_id from public.prospecteur_supply_shipment_units su where su.shipment_id = p_shipment_id);

  insert into public.unit_code_events (
    organization_id, unit_code_id, event_type, entry_mode, actor_role,
    from_warehouse_id, to_prospecteur_id, shipment_id, actor_user_id
  )
  select su.organization_id, su.unit_code_id,
         case when su.status = 'damaged' then 'damaged_on_receipt'
              when su.status = 'received' then 'received'
              else 'missing_on_receipt' end,
         'manual', 'prospecteur', v_shipment.warehouse_id, v_shipment.prospecteur_id, p_shipment_id, v_uid
  from public.prospecteur_supply_shipment_units su
  where su.shipment_id = p_shipment_id;

  select count(*) filter (where status in ('received','damaged')),
         count(*) filter (where status = 'damaged'),
         count(*) filter (where status = 'missing')
  into v_received, v_damaged_count, v_missing
  from public.prospecteur_supply_shipment_units where shipment_id = p_shipment_id;

  return v_result || jsonb_build_object(
    'units_expected', v_units, 'units_received', v_received,
    'units_damaged', v_damaged_count, 'units_missing', v_missing
  );
end;
$$;

-- 3.4 Quels bons de l'utilisateur fonctionnent par codes uniques (sans révéler les codes) ----
create or replace function public.jdvcrm_shipment_unit_counts_v1(p_shipment_ids uuid[])
returns table (shipment_id uuid, unit_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select su.shipment_id, count(*)::integer
  from public.prospecteur_supply_shipment_units su
  join public.prospecteur_supply_shipments s on s.id = su.shipment_id
  where (select auth.uid()) is not null
    and su.shipment_id = any(p_shipment_ids)
    and (
      exists (select 1 from public.prospecteurs p where p.id = s.prospecteur_id and p.user_id = (select auth.uid()))
      or private.can_manage_warehouse(s.warehouse_id)
    )
  group by su.shipment_id;
$$;

-- 3.5 Traçabilité d'un code : où est ce produit, qui l'a eu entre les mains --------------
create or replace function public.jdvcrm_trace_unit_code_v1(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_out jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Session utilisateur introuvable'; end if;
  if length(v_code) < 4 then raise exception 'Saisissez au moins 4 caractères'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'unit_code_id', u.id,
    'code', u.code,
    'status', u.status,
    'generated', u.generated,
    'article_code', a.code,
    'article_name', a.name,
    'warehouse_id', u.warehouse_id,
    'warehouse_name', w.name,
    'prospecteur_id', u.prospecteur_id,
    'prospecteur_name', nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
    'shipment_id', u.shipment_id,
    'registered_at', u.registered_at,
    'events', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'event_type', e.event_type, 'entry_mode', e.entry_mode, 'actor_role', e.actor_role,
        'created_at', e.created_at, 'shipment_id', e.shipment_id
      ) order by e.created_at), '[]'::jsonb)
      from public.unit_code_events e where e.unit_code_id = u.id
    )
  )), '[]'::jsonb)
  into v_out
  from public.unit_codes u
  join public.articles a on a.id = u.article_id
  left join public.warehouses w on w.id = u.warehouse_id
  left join public.prospecteurs p on p.id = u.prospecteur_id
  where u.code = v_code
    and (
      private.is_org_admin(u.organization_id)
      or (u.warehouse_id is not null and private.can_manage_warehouse(u.warehouse_id))
    );

  return jsonb_build_object('units', v_out);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Droits d'exécution : jamais anonymes
-- ---------------------------------------------------------------------------
revoke all on function private.jdvcrm_normalize_unit_codes_v1(text[]) from public, anon, authenticated;
revoke all on function private.jdvcrm_unit_code_events_immutable_v1() from public, anon, authenticated;
revoke all on function public.jdvcrm_register_unit_codes_v1(uuid, uuid, text[], integer) from public, anon;
revoke all on function public.jdvcrm_dispatch_unit_codes_v1(uuid, uuid, text[], text, uuid) from public, anon;
revoke all on function public.jdvcrm_confirm_unit_code_receipt_v1(uuid, text[], text[], text) from public, anon;
revoke all on function public.jdvcrm_shipment_unit_counts_v1(uuid[]) from public, anon;
revoke all on function public.jdvcrm_trace_unit_code_v1(text) from public, anon;
grant execute on function public.jdvcrm_register_unit_codes_v1(uuid, uuid, text[], integer) to authenticated;
grant execute on function public.jdvcrm_dispatch_unit_codes_v1(uuid, uuid, text[], text, uuid) to authenticated;
grant execute on function public.jdvcrm_confirm_unit_code_receipt_v1(uuid, text[], text[], text) to authenticated;
grant execute on function public.jdvcrm_shipment_unit_counts_v1(uuid[]) to authenticated;
grant execute on function public.jdvcrm_trace_unit_code_v1(text) to authenticated;
