-- JDV CRM: safe public storefront profile and published customer reviews.
-- This migration is staged in GitHub only. Do not apply to production until schema reconciliation is approved.

create or replace view public.public_business_profiles
with (security_barrier = true)
as
select
  id,
  name,
  legal_name,
  email,
  phone,
  whatsapp,
  country,
  language,
  address,
  city,
  logo_url,
  website,
  primary_color,
  secondary_color
from public.organizations
where status = 'active';

revoke all on public.public_business_profiles from public, anon, authenticated;
grant select on public.public_business_profiles to anon, authenticated;

-- The public role may read only safe display fields, and only rows explicitly published.
drop policy if exists client_reviews_public_published_select on public.client_reviews;
create policy client_reviews_public_published_select
  on public.client_reviews
  for select
  to anon
  using (status = 'published');

revoke all on public.client_reviews from anon;
grant select (id, organization_id, customer_name, rating, comment, created_at)
  on public.client_reviews to anon;
