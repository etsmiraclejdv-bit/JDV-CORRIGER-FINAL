-- Fix ambiguous output-column reference in company application finalization.
CREATE OR REPLACE FUNCTION public.jdvcrm_finalize_company_application_v1(p_application_id uuid)
RETURNS TABLE(organization_id uuid, status text, trial_expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_app public.organization_applications%rowtype;
  v_org_id uuid;
  v_trial_plan public.subscription_plans%rowtype;
  v_trial_expires timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;

  SELECT *
    INTO v_app
    FROM public.organization_applications a
   WHERE a.id = p_application_id
     AND a.applicant_user_id = auth.uid()
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND';
  END IF;

  IF v_app.status = 'activated' THEN
    SELECT o.id
      INTO v_org_id
      FROM public.organizations o
     WHERE o.owner_user_id = auth.uid()
     ORDER BY o.created_at DESC
     LIMIT 1;

    SELECT os.expires_at
      INTO v_trial_expires
      FROM public.organization_subscriptions os
     WHERE os.organization_id = v_org_id
     ORDER BY os.created_at DESC
     LIMIT 1;

    RETURN QUERY SELECT v_org_id, 'activated'::text, v_trial_expires;
    RETURN;
  END IF;

  IF v_app.status <> 'approved_pending_email' THEN
    RAISE EXCEPTION 'APPLICATION_NOT_APPROVED';
  END IF;

  SELECT o.id
    INTO v_org_id
    FROM public.organizations o
   WHERE o.owner_user_id = auth.uid()
   ORDER BY o.created_at DESC
   LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations(
      name, legal_name, registration_number, tax_number, email, phone,
      country, address, city, website, owner_user_id, status,
      subscription_status, language, currency, timezone
    )
    VALUES (
      v_app.company_name, v_app.legal_name, v_app.registration_number,
      v_app.tax_number, v_app.professional_email, v_app.phone,
      v_app.country, v_app.address, v_app.city, v_app.website,
      auth.uid(), 'active', 'trial', 'fr', 'XOF', 'Africa/Porto-Novo'
    )
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members(organization_id, user_id, role, status)
    VALUES (v_org_id, auth.uid(), 'business_admin', 'active');

    INSERT INTO public.organization_settings(organization_id, settings)
    VALUES (v_org_id, '{}'::jsonb)
    ON CONFLICT ON CONSTRAINT organization_settings_organization_id_key DO NOTHING;
  ELSE
    UPDATE public.organizations o
       SET status = 'active',
           subscription_status = 'trial',
           updated_at = now()
     WHERE o.id = v_org_id;

    INSERT INTO public.organization_members(organization_id, user_id, role, status)
    VALUES (v_org_id, auth.uid(), 'business_admin', 'active')
    ON CONFLICT ON CONSTRAINT organization_members_organization_id_user_id_key
    DO UPDATE SET role = 'business_admin', status = 'active', updated_at = now();
  END IF;

  SELECT *
    INTO v_trial_plan
    FROM public.subscription_plans sp
   WHERE sp.code = 'TRIAL'
     AND sp.active = true
   ORDER BY sp.duration_days ASC
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRIAL_PLAN_NOT_FOUND';
  END IF;

  SELECT os.expires_at
    INTO v_trial_expires
    FROM public.organization_subscriptions os
   WHERE os.organization_id = v_org_id
     AND os.status IN ('trial', 'active', 'past_due')
   ORDER BY os.created_at DESC
   LIMIT 1;

  IF v_trial_expires IS NULL THEN
    v_trial_expires := now() + make_interval(days => v_trial_plan.duration_days);

    INSERT INTO public.organization_subscriptions(
      organization_id, plan_id, status, started_at, expires_at, auto_renew
    )
    VALUES (v_org_id, v_trial_plan.id, 'trial', now(), v_trial_expires, false);
  END IF;

  UPDATE public.organization_applications a
     SET status = 'activated',
         email_verified_at = coalesce(a.email_verified_at, now()),
         activated_at = now(),
         updated_at = now()
   WHERE a.id = v_app.id;

  RETURN QUERY SELECT v_org_id, 'activated'::text, v_trial_expires;
END;
$function$;

REVOKE ALL ON FUNCTION public.jdvcrm_finalize_company_application_v1(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.jdvcrm_finalize_company_application_v1(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
