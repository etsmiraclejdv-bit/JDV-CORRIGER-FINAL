-- Restrict plan-limit bypass to service_role or the Concepteur's own organization.
-- Platform super-admin status alone must not bypass a customer's plan limits.
CREATE OR REPLACE FUNCTION public.jdvcrm_enforce_plan_limit_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_res text := TG_ARGV[0];
  v_row jsonb := to_jsonb(NEW);
  v_org uuid := nullif(to_jsonb(NEW)->>'organization_id', '')::uuid;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF v_org IS NULL THEN
    RETURN NEW;
  END IF;

  IF private.is_super_admin()
     AND EXISTS (
       SELECT 1 FROM public.organizations o
       WHERE o.id = v_org AND o.owner_user_id = (SELECT auth.uid())
     ) THEN
    RETURN NEW;
  END IF;

  IF v_res = 'prospecteurs' AND COALESCE(v_row->>'status', 'active') <> 'active' THEN
    RETURN NEW;
  END IF;
  IF v_res = 'warehouses' AND COALESCE(v_row->>'active', 'true') <> 'true' THEN
    RETURN NEW;
  END IF;
  IF public.jdvcrm_plan_limit_exceeded_v1(v_org, v_res) THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED:%', v_res;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.jdvcrm_enforce_plan_limit_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jdvcrm_enforce_plan_limit_v1() TO service_role;
