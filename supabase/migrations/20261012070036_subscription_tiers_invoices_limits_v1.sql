-- Recovered from the applied Supabase catalog to restore the missing migration artifact.
-- Invoice and counter schema is idempotent; data is not seeded or overwritten.
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.organization_subscriptions(id) ON DELETE SET NULL,
  payment_id uuid NOT NULL REFERENCES public.subscription_payments(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'void')),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'XOF',
  plan_code text,
  plan_name text,
  period_start timestamptz,
  period_end timestamptz,
  issued_at timestamptz NOT NULL DEFAULT now(),
  customer jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT subscription_invoices_invoice_number_key UNIQUE (invoice_number),
  CONSTRAINT subscription_invoices_payment_id_key UNIQUE (payment_id)
);

CREATE INDEX IF NOT EXISTS idx_fk_subscription_invoices_subscription_id
  ON public.subscription_invoices (subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_org
  ON public.subscription_invoices (organization_id, issued_at DESC);

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_invoices_read ON public.subscription_invoices;
CREATE POLICY subscription_invoices_read ON public.subscription_invoices
  FOR SELECT TO authenticated
  USING (
    private.is_super_admin()
    OR private.is_org_admin(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = subscription_invoices.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.status = 'active'
        AND m.role = 'accountant'
    )
  );

GRANT SELECT ON public.subscription_invoices TO authenticated;
GRANT ALL ON public.invoice_counters, public.subscription_invoices TO service_role;

CREATE OR REPLACE FUNCTION public.jdvcrm_next_invoice_number_v1()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_year integer := extract(year from now())::integer; v_n integer;
begin
  insert into public.invoice_counters (year, last_number) values (v_year, 1)
  on conflict (year) do update set last_number = public.invoice_counters.last_number + 1
  returning last_number into v_n;
  return 'JDV-' || v_year || '-' || lpad(v_n::text, 6, '0');
end $function$;
REVOKE ALL ON FUNCTION public.jdvcrm_next_invoice_number_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jdvcrm_next_invoice_number_v1() TO service_role;

CREATE OR REPLACE FUNCTION public.jdvcrm_create_invoice_for_payment_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_plan public.subscription_plans; v_org record; v_start timestamptz;
begin
  if NEW.status <> 'successful' then return NEW; end if;
  if tg_op = 'UPDATE' and OLD.status = 'successful' then return NEW; end if;
  select * into v_plan from public.subscription_plans where id = nullif(NEW.metadata->>'plan_id', '')::uuid;
  select o.name, o.legal_name, o.phone, o.address, o.city, o.country, o.tax_number, o.registration_number into v_org from public.organizations o where o.id = NEW.organization_id;
  v_start := coalesce(NEW.paid_at, now());
  insert into public.subscription_invoices (organization_id, subscription_id, payment_id, invoice_number, amount, currency, plan_code, plan_name, period_start, period_end, issued_at, customer)
  values (NEW.organization_id, NEW.subscription_id, NEW.id, public.jdvcrm_next_invoice_number_v1(), NEW.amount, NEW.currency, v_plan.code, v_plan.name,
          v_start, v_start + make_interval(days => coalesce(v_plan.duration_days, 30)), v_start,
          jsonb_build_object('name', v_org.name, 'legal_name', v_org.legal_name, 'phone', v_org.phone, 'address', v_org.address, 'city', v_org.city, 'country', v_org.country, 'tax_number', v_org.tax_number, 'registration_number', v_org.registration_number))
  on conflict (payment_id) do nothing;
  return NEW;
end $function$;
REVOKE ALL ON FUNCTION public.jdvcrm_create_invoice_for_payment_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jdvcrm_create_invoice_for_payment_v1() TO service_role;

DROP TRIGGER IF EXISTS jdvcrm_create_invoice ON public.subscription_payments;
CREATE TRIGGER jdvcrm_create_invoice
  AFTER INSERT OR UPDATE OF status ON public.subscription_payments
  FOR EACH ROW EXECUTE FUNCTION public.jdvcrm_create_invoice_for_payment_v1();

NOTIFY pgrst, 'reload schema';
