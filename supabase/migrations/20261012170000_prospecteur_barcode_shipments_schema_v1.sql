-- JDV CRM — scan codes-barres et réception contradictoire des approvisionnements.
-- Migration de structure uniquement : aucune quantité de stock n'est modifiée par ce fichier.
-- Les opérations de sortie/réception seront exécutées par des RPC atomiques dédiées.

alter table public.articles
  add column if not exists barcode text,
  add column if not exists barcode_type text not null default 'internal'
    check (barcode_type in ('internal', 'ean13', 'ean8', 'upca', 'code128', 'qr', 'other'));

create unique index if not exists uq_articles_org_barcode
  on public.articles (organization_id, barcode)
  where barcode is not null and btrim(barcode) <> '';

create index if not exists idx_articles_org_code
  on public.articles (organization_id, code);

create table if not exists public.prospecteur_supply_shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  prospecteur_id uuid not null references public.prospecteurs(id) on delete restrict,
  shipment_number text not null,
  status text not null default 'draft'
    check (status in ('draft','dispatched','partially_received','received','disputed','cancelled')),
  dispatched_by uuid references auth.users(id),
  dispatched_at timestamptz,
  received_by uuid references auth.users(id),
  received_at timestamptz,
  dispatch_notes text,
  receipt_notes text,
  idempotency_key uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, shipment_number),
  unique (idempotency_key)
);

create index if not exists idx_supply_shipments_org_status_date
  on public.prospecteur_supply_shipments (organization_id, status, created_at desc);
create index if not exists idx_supply_shipments_prospecteur_status
  on public.prospecteur_supply_shipments (prospecteur_id, status, created_at desc);
create index if not exists idx_supply_shipments_warehouse_status
  on public.prospecteur_supply_shipments (warehouse_id, status, created_at desc);

create table if not exists public.prospecteur_supply_shipment_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shipment_id uuid not null references public.prospecteur_supply_shipments(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  barcode_snapshot text,
  article_code_snapshot text not null,
  article_name_snapshot text not null,
  quantity_dispatched integer not null check (quantity_dispatched > 0),
  quantity_received integer check (quantity_received >= 0),
  quantity_accepted integer check (quantity_accepted >= 0),
  quantity_damaged integer not null default 0 check (quantity_damaged >= 0),
  quantity_missing integer check (quantity_missing >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_id, article_id),
  check (
    quantity_received is null
    or quantity_accepted is null
    or quantity_damaged + quantity_accepted <= quantity_received
  ),
  check (
    quantity_missing is null
    or quantity_received is null
    or quantity_missing = greatest(quantity_dispatched - quantity_received, 0)
  )
);

create index if not exists idx_supply_shipment_items_shipment
  on public.prospecteur_supply_shipment_items (shipment_id);
create index if not exists idx_supply_shipment_items_article
  on public.prospecteur_supply_shipment_items (organization_id, article_id);

create table if not exists public.prospecteur_supply_scan_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shipment_id uuid not null references public.prospecteur_supply_shipments(id) on delete cascade,
  shipment_item_id uuid references public.prospecteur_supply_shipment_items(id) on delete set null,
  phase text not null check (phase in ('preparation','dispatch','reception','verification')),
  scanned_code text not null,
  article_id uuid references public.articles(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  scan_result text not null default 'matched'
    check (scan_result in ('matched','unknown_code','unexpected_article','over_quantity','duplicate','manual_entry')),
  actor_user_id uuid references auth.users(id),
  device_type text not null default 'unknown'
    check (device_type in ('usb_bluetooth_reader','phone_camera','manual','unknown')),
  details jsonb not null default '{}'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists idx_supply_scan_events_shipment_time
  on public.prospecteur_supply_scan_events (shipment_id, scanned_at desc);
create index if not exists idx_supply_scan_events_org_code
  on public.prospecteur_supply_scan_events (organization_id, scanned_code);

alter table public.prospecteur_supply_shipments enable row level security;
alter table public.prospecteur_supply_shipment_items enable row level security;
alter table public.prospecteur_supply_scan_events enable row level security;

drop policy if exists "supply_shipments_select_participants" on public.prospecteur_supply_shipments;
create policy "supply_shipments_select_participants"
on public.prospecteur_supply_shipments
for select to authenticated
using (
  prospecteur_id in (
    select p.id from public.prospecteurs p where p.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = prospecteur_supply_shipments.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('business_admin','manager','accountant','viewer')
  )
  or exists (
    select 1 from public.warehouse_users wu
    where wu.warehouse_id = prospecteur_supply_shipments.warehouse_id
      and wu.user_id = (select auth.uid())
      and wu.active = true
  )
);

drop policy if exists "supply_shipment_items_select_participants" on public.prospecteur_supply_shipment_items;
create policy "supply_shipment_items_select_participants"
on public.prospecteur_supply_shipment_items
for select to authenticated
using (
  exists (
    select 1 from public.prospecteur_supply_shipments s
    where s.id = prospecteur_supply_shipment_items.shipment_id
      and (
        s.prospecteur_id in (
          select p.id from public.prospecteurs p where p.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = s.organization_id
            and om.user_id = (select auth.uid())
            and om.status = 'active'
            and om.role in ('business_admin','manager','accountant','viewer')
        )
        or exists (
          select 1 from public.warehouse_users wu
          where wu.warehouse_id = s.warehouse_id
            and wu.user_id = (select auth.uid())
            and wu.active = true
        )
      )
  )
);

drop policy if exists "supply_scan_events_select_participants" on public.prospecteur_supply_scan_events;
create policy "supply_scan_events_select_participants"
on public.prospecteur_supply_scan_events
for select to authenticated
using (
  exists (
    select 1 from public.prospecteur_supply_shipments s
    where s.id = prospecteur_supply_scan_events.shipment_id
      and (
        s.prospecteur_id in (
          select p.id from public.prospecteurs p where p.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = s.organization_id
            and om.user_id = (select auth.uid())
            and om.status = 'active'
            and om.role in ('business_admin','manager','accountant','viewer')
        )
        or exists (
          select 1 from public.warehouse_users wu
          where wu.warehouse_id = s.warehouse_id
            and wu.user_id = (select auth.uid())
            and wu.active = true
        )
      )
  )
);

-- Les mutations directes sont volontairement non exposées aux clients.
-- Les futures RPC devront valider le rôle, l'organisation et les quantités,
-- puis écrire stock, mouvements, bon de livraison et événement de scan dans une transaction.
revoke insert, update, delete on public.prospecteur_supply_shipments from anon, authenticated;
revoke insert, update, delete on public.prospecteur_supply_shipment_items from anon, authenticated;
revoke insert, update, delete on public.prospecteur_supply_scan_events from anon, authenticated;
grant select on public.prospecteur_supply_shipments to authenticated;
grant select on public.prospecteur_supply_shipment_items to authenticated;
grant select on public.prospecteur_supply_scan_events to authenticated;
