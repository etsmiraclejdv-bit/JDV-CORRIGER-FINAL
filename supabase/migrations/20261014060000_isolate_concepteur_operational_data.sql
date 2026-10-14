-- Separate the platform's super-admin role from organization-level operational access.
-- This migration is intentionally reviewed through GitHub first and is NOT applied to production here.

CREATE OR REPLACE FUNCTION private.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (
      SELECT o.id
      FROM public.organizations o
      JOIN public.super_admins sa ON sa.user_id = o.owner_user_id
      WHERE sa.user_id = (SELECT auth.uid())
        AND sa.status = 'active'
        AND COALESCE(sa.actif, true) = true
      ORDER BY o.created_at
      LIMIT 1
    ),
    (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
      ORDER BY om.created_at
      LIMIT 1
    ),
    (
      SELECT p.organization_id
      FROM public.prospecteurs p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.status = 'active'
      ORDER BY p.created_at
      LIMIT 1
    )
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.status = 'active'
      AND lower(om.role) IN ('business_admin', 'admin')
  );
$function$;

-- Remove global super-admin bypass policies from organization-owned operational data.
-- The normal organization/member/prospecteur policies remain in place.
DO $migration$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'article_categories',
        'article_serial_assignments',
        'articles',
        'audit_events',
        'commissions',
        'daily_tokens',
        'field_visits',
        'follow_up_reminders',
        'goods_receipt_items',
        'goods_receipts',
        'prospecteur_stocks',
        'prospecteurs',
        'purchase_order_items',
        'purchase_orders',
        'sale_items',
        'sales',
        'sales_return_items',
        'sales_returns',
        'serial_numbers',
        'stock_movements',
        'stock_transfer_items',
        'stock_transfers',
        'stocks',
        'supplier_payments',
        'suppliers',
        'unit_code_events',
        'unit_codes',
        'warehouse_inventory',
        'warehouses',
        'prospecteur_supply_scan_events',
        'prospecteur_supply_shipment_items',
        'prospecteur_supply_shipment_units',
        'prospecteur_supply_shipments',
        'prospecteur_supply_requests'
      ])
      AND (
        lower(policyname) LIKE '%super admin full access%'
        OR lower(policyname) = 'super_admin_full_access'
        OR lower(policyname) LIKE '%_super_admin_all'
        OR lower(policyname) LIKE '%_super_admin'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$migration$;

-- Articles and categories: organization members can read; only that organization's admins write.
DROP POLICY IF EXISTS articles_insert ON public.articles;
DROP POLICY IF EXISTS articles_select ON public.articles;
DROP POLICY IF EXISTS articles_update ON public.articles;
DROP POLICY IF EXISTS "JDV Super Admin Full Access articles" ON public.articles;

CREATE POLICY articles_insert ON public.articles
  FOR INSERT TO authenticated
  WITH CHECK (private.is_org_admin(organization_id));

CREATE POLICY articles_select ON public.articles
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY articles_update ON public.articles
  FOR UPDATE TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.article_categories;
CREATE POLICY admin_full_access ON public.article_categories
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

-- Stock and stock ledger.
DROP POLICY IF EXISTS jdvcrm_stocks_admin_all ON public.stocks;
DROP POLICY IF EXISTS stocks_insert ON public.stocks;
DROP POLICY IF EXISTS stocks_select ON public.stocks;
DROP POLICY IF EXISTS stocks_update ON public.stocks;

CREATE POLICY jdvcrm_stocks_admin_all ON public.stocks
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

CREATE POLICY stocks_select ON public.stocks
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS jdvcrm_stock_movements_admin_all ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_admin_full_access ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_admin_insert ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_select ON public.stock_movements;

CREATE POLICY jdvcrm_stock_movements_admin_all ON public.stock_movements
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

CREATE POLICY stock_movements_select ON public.stock_movements
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

-- Prospecteurs: no platform-wide access; users may only see/update their own row or be
-- an administrator in that row's organization.
DROP POLICY IF EXISTS prospecteurs_insert ON public.prospecteurs;
DROP POLICY IF EXISTS prospecteurs_select ON public.prospecteurs;
DROP POLICY IF EXISTS prospecteurs_update ON public.prospecteurs;

CREATE POLICY prospecteurs_insert ON public.prospecteurs
  FOR INSERT TO authenticated
  WITH CHECK (private.is_org_admin(organization_id));

CREATE POLICY prospecteurs_select ON public.prospecteurs
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.is_org_admin(organization_id)
  );

CREATE POLICY prospecteurs_update ON public.prospecteurs
  FOR UPDATE TO authenticated
  USING (
    (user_id = (SELECT auth.uid()) AND organization_id = private.current_org_id())
    OR private.is_org_admin(organization_id)
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()) AND organization_id = private.current_org_id())
    OR private.is_org_admin(organization_id)
  );

DROP POLICY IF EXISTS jdvcrm_prospecteur_stocks_admin_all ON public.prospecteur_stocks;
DROP POLICY IF EXISTS prospecteur_stocks_select ON public.prospecteur_stocks;

CREATE POLICY jdvcrm_prospecteur_stocks_admin_all ON public.prospecteur_stocks
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

CREATE POLICY prospecteur_stocks_select ON public.prospecteur_stocks
  FOR SELECT TO authenticated
  USING (
    private.is_org_admin(organization_id)
    OR (
      private.is_prospecteur(organization_id)
      AND EXISTS (
        SELECT 1
        FROM public.prospecteurs p
        WHERE p.id = prospecteur_stocks.prospecteur_id
          AND p.user_id = (SELECT auth.uid())
          AND p.organization_id = prospecteur_stocks.organization_id
      )
    )
  );

-- Receiving, purchasing, suppliers, warehouses and inventory remain organization-admin only.
DROP POLICY IF EXISTS admin_full_access ON public.goods_receipt_items;
CREATE POLICY admin_full_access ON public.goods_receipt_items
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.goods_receipts;
CREATE POLICY admin_full_access ON public.goods_receipts
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.purchase_order_items;
CREATE POLICY admin_full_access ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.purchase_orders;
CREATE POLICY admin_full_access ON public.purchase_orders
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.suppliers;
CREATE POLICY admin_full_access ON public.suppliers
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.supplier_payments;
CREATE POLICY admin_full_access ON public.supplier_payments
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.warehouse_inventory;
CREATE POLICY admin_full_access ON public.warehouse_inventory
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS admin_full_access ON public.warehouses;
CREATE POLICY admin_full_access ON public.warehouses
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

-- Daily usage counters are scoped to the user's organization and own prospecteur.
DROP POLICY IF EXISTS daily_tokens_insert ON public.daily_tokens;
DROP POLICY IF EXISTS daily_tokens_select ON public.daily_tokens;
DROP POLICY IF EXISTS daily_tokens_update ON public.daily_tokens;

CREATE POLICY daily_tokens_insert ON public.daily_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_org_admin(organization_id)
    OR (
      private.is_prospecteur(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.prospecteurs p
        WHERE p.id = daily_tokens.prospecteur_id
          AND p.organization_id = daily_tokens.organization_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'active'
      )
    )
  );

CREATE POLICY daily_tokens_select ON public.daily_tokens
  FOR SELECT TO authenticated
  USING (
    private.is_org_admin(organization_id)
    OR (
      private.is_prospecteur(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.prospecteurs p
        WHERE p.id = daily_tokens.prospecteur_id
          AND p.organization_id = daily_tokens.organization_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'active'
      )
    )
  );

CREATE POLICY daily_tokens_update ON public.daily_tokens
  FOR UPDATE TO authenticated
  USING (
    private.is_org_admin(organization_id)
    OR (
      private.is_prospecteur(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.prospecteurs p
        WHERE p.id = daily_tokens.prospecteur_id
          AND p.organization_id = daily_tokens.organization_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'active'
      )
    )
  )
  WITH CHECK (
    private.is_org_admin(organization_id)
    OR (
      private.is_prospecteur(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.prospecteurs p
        WHERE p.id = daily_tokens.prospecteur_id
          AND p.organization_id = daily_tokens.organization_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'active'
      )
    )
  );

-- Business settings and reviews are private to their own organization.
DROP POLICY IF EXISTS super_admin_full_access ON public.company_settings;
CREATE POLICY company_settings_org_admin ON public.company_settings
  FOR ALL TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS organization_settings_insert ON public.organization_settings;
DROP POLICY IF EXISTS organization_settings_select ON public.organization_settings;
DROP POLICY IF EXISTS organization_settings_update ON public.organization_settings;
CREATE POLICY organization_settings_insert ON public.organization_settings
  FOR INSERT TO authenticated
  WITH CHECK (private.is_org_admin(organization_id));
CREATE POLICY organization_settings_select ON public.organization_settings
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY organization_settings_update ON public.organization_settings
  FOR UPDATE TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS organization_personalization_insert ON public.organization_personalization;
DROP POLICY IF EXISTS organization_personalization_select ON public.organization_personalization;
DROP POLICY IF EXISTS organization_personalization_update ON public.organization_personalization;
CREATE POLICY organization_personalization_insert ON public.organization_personalization
  FOR INSERT TO authenticated
  WITH CHECK (private.is_org_admin(organization_id));
CREATE POLICY organization_personalization_select ON public.organization_personalization
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY organization_personalization_update ON public.organization_personalization
  FOR UPDATE TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS client_reviews_admin_delete ON public.client_reviews;
DROP POLICY IF EXISTS client_reviews_admin_update ON public.client_reviews;
DROP POLICY IF EXISTS client_reviews_member_insert ON public.client_reviews;
DROP POLICY IF EXISTS client_reviews_member_select ON public.client_reviews;
CREATE POLICY client_reviews_admin_delete ON public.client_reviews
  FOR DELETE TO authenticated
  USING (private.is_org_admin(organization_id));
CREATE POLICY client_reviews_admin_update ON public.client_reviews
  FOR UPDATE TO authenticated
  USING (private.is_org_admin(organization_id))
  WITH CHECK (private.is_org_admin(organization_id));
CREATE POLICY client_reviews_member_insert ON public.client_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND (created_by IS NULL OR created_by = (SELECT auth.uid()))
  );
CREATE POLICY client_reviews_member_select ON public.client_reviews
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

-- Notifications and audit records belong to the user/organization, not to the platform operator.
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS audit_logs_super_admin ON public.audit_logs;
DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (private.is_org_admin(organization_id));

DROP POLICY IF EXISTS super_admin_full_access ON public.audit_events;
CREATE POLICY audit_events_org_admin_select ON public.audit_events
  FOR SELECT TO authenticated
  USING (private.is_org_admin(organization_id));

-- The concepteur keeps platform/account/subscription administration through platform
-- metadata tables, but does not receive global RLS access to company operations.
