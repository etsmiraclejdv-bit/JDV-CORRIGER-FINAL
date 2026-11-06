-- Fail closed when the authenticated user has more than one possible organization context.
-- Callers handling multiple organizations must pass an explicit organization_id and verify membership.
CREATE OR REPLACE FUNCTION private.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  WITH owned_orgs AS (
    SELECT DISTINCT o.id
    FROM public.organizations o
    JOIN public.super_admins sa ON sa.user_id = o.owner_user_id
    WHERE sa.user_id = (SELECT auth.uid())
      AND sa.status = 'active'
      AND COALESCE(sa.actif, true) = true
  ),
  member_orgs AS (
    SELECT DISTINCT om.organization_id AS id
    FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.status = 'active'
  ),
  prospecteur_orgs AS (
    SELECT DISTINCT p.organization_id AS id
    FROM public.prospecteurs p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.status = 'active'
  ),
  candidates AS (
    SELECT id FROM owned_orgs
    UNION
    SELECT id FROM member_orgs
    WHERE NOT EXISTS (SELECT 1 FROM owned_orgs)
    UNION
    SELECT id FROM prospecteur_orgs
    WHERE NOT EXISTS (SELECT 1 FROM owned_orgs)
      AND NOT EXISTS (SELECT 1 FROM member_orgs)
  )
  SELECT id
  FROM candidates
  HAVING count(*) = 1;
$function$;

COMMENT ON FUNCTION private.current_org_id() IS
  'Returns an organization only when the user has one unambiguous context; otherwise NULL (fail closed).';
