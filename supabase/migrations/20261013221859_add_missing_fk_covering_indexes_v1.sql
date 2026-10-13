-- Déjà appliquée sur Supabase (version 20261013221859).
-- Ajoute les index manquants sur 12 clés étrangères signalées par l'advisor de performance.
DO $$
DECLARE
  r record;
  idx_name text;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl, a.attname AS col, cl.relname AS relname
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE n.nspname = 'public'
      AND c.contype = 'f'
      AND array_length(c.conkey, 1) = 1
      AND c.conname IN (
        'client_reviews_client_id_fkey',
        'client_reviews_created_by_fkey',
        'custom_form_definitions_created_by_fkey',
        'custom_form_versions_created_by_fkey',
        'design_config_versions_created_by_fkey',
        'prospecteur_supply_scan_events_actor_user_id_fkey',
        'prospecteur_supply_scan_events_article_id_fkey',
        'prospecteur_supply_scan_events_shipment_item_id_fkey',
        'prospecteur_supply_shipment_items_article_id_fkey',
        'prospecteur_supply_shipments_dispatched_by_fkey',
        'prospecteur_supply_shipments_received_by_fkey',
        'subscription_invoices_subscription_id_fkey'
      )
  LOOP
    idx_name := left('idx_fk_' || r.relname || '_' || r.col, 63);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)', idx_name, r.tbl, r.col);
  END LOOP;
END $$;
