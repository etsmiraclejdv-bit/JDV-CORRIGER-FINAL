-- JDV CRM: minimal public storefront profile and published customer reviews.
-- This filename matches the version already recorded in Supabase migration history.
-- Only non-sensitive display fields are exposed. Contact details are deliberately excluded
-- until organizations have an explicit public-contact opt-in setting.

create or replace view public.public_business_profiles
with (security_barrier = true)
as
select
  id,
  name,
  legal_name,
  country,
  language,
  city,
  logo_url,
  website
from public.organizations
where status = 'active';

revoke all on public.public_business_profiles from public, anon, authenticated;
grant select on public.public_business_profiles to anon, authenticated;

-- Anonymous visitors can read only reviews that an organization has explicitly published.
drop policy if exists client_reviews_public_published_select on public.client_reviews;
create policy client_reviews_public_published_select
  on public.client_reviews
  for select
  to anon
  using (status = 'published');

revoke all on public.client_reviews from anon;
grant select (id, organization_id, customer_name, rating, comment, created_at)
  on public.client_reviews to anon;
