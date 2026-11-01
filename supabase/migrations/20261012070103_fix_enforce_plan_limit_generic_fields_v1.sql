-- Recovered from the applied Supabase schema to reconcile migration history.
-- This is the generic trigger function as it existed before the scoped owner-bypass follow-up.
CREATE OR REPLACE FUNCTION public.jdvcrm_enforce_plan_limit_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare v_res text := tg_argv[0]; v_row jsonb := to_jsonb(NEW); v_org uuid := nullif(to_jsonb(NEW)->>'organization_id', '')::uuid;
begin
  if coalesce(auth.role(), '') = 'service_role' or coalesce(private.is_super_admin(), false) then return NEW; end if;
  if v_org is null then return NEW; end if;
  if v_res = 'prospecteurs' and coalesce(v_row->>'status', 'active') <> 'active' then return NEW; end if;
  if v_res = 'warehouses' and coalesce(v_row->>'active', 'true') <> 'true' then return NEW; end if;
  if public.jdvcrm_plan_limit_exceeded_v1(v_org, v_res) then
    raise exception 'PLAN_LIMIT_REACHED:%', v_res;
  end if;
  return NEW;
end $function$;
REVOKE ALL ON FUNCTION public.jdvcrm_enforce_plan_limit_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jdvcrm_enforce_plan_limit_v1() TO service_role;
