-- Public company vitrine: expose only approved, non-sensitive information and published reviews.
-- This filename matches the version already recorded in Supabase migration history.
-- Never expose organization email, phone, WhatsApp, or street address through this public RPC.
create or replace function public.jdvcrm_public_company_vitrine_v1(p_organization_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'organization', jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'legal_name', o.legal_name,
      'country', o.country,
      'language', o.language,
      'city', o.city,
      'logo_url', o.logo_url,
      'website', o.website,
      'primary_color', o.primary_color,
      'secondary_color', o.secondary_color
    ),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'customer_name', r.customer_name,
        'rating', r.rating,
        'comment', r.comment,
        'created_at', r.created_at
      ) order by r.created_at desc)
      from public.client_reviews r
      where r.organization_id = o.id
        and r.status = 'published'
    ), '[]'::jsonb)
  )
  from public.organizations o
  where o.id = p_organization_id
    and o.status = 'active';
$function$;

revoke all on function public.jdvcrm_public_company_vitrine_v1(uuid) from public;
grant execute on function public.jdvcrm_public_company_vitrine_v1(uuid) to anon, authenticated;
