import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../supabase/migrations/', import.meta.url);
const pendingRoot = new URL('../supabase/pending_migrations/', import.meta.url);

test('migration versions are unique and ordered files exist for the applied Supabase history', async () => {
  const files = (await readdir(root)).filter((name) => name.endsWith('.sql')).sort();
  const versions = files.map((name) => name.slice(0, 14));
  assert.ok(files.length > 150, 'Expected the complete JDV migration history');
  assert.equal(new Set(versions).size, versions.length, 'Duplicate migration version prefixes detected');
  for (const required of [
    '20261012070036_subscription_tiers_invoices_limits_v1.sql',
    '20261012070103_fix_enforce_plan_limit_generic_fields_v1.sql',
    '20261012140108_fix_ambiguous_organization_id_company_finalize_v1.sql',
    '20261012142248_fix_company_finalize_on_conflict_ambiguous_columns.sql',
    '20261012195019_jdv_prospecteur_barcode_shipments_schema_v1.sql',
    '20261012195023_jdv_prospecteur_barcode_shipment_rpcs_v1.sql',
    '20261101183935_isolate_concepteur_operational_data_v1.sql',
    '20261101183945_lockdown_legacy_prospecteur_supply_rpc_v1.sql',
    '20261101184525_scope_plan_limit_bypass_to_owned_org_v1.sql',
    '20261101185000_scope_operational_rpcs_to_org_v1.sql',
  ]) assert.ok(files.includes(required), `Missing reconciled migration: ${required}`);
});

test('social automation schema remains explicitly pending until provider authorization', async () => {
  const active = await readdir(root);
  const pending = await readdir(pendingRoot);
  assert.ok(!active.some((name) => name.includes('jdv_social_automation_organic_v1')));
  assert.ok(pending.includes('20261018190000_jdv_social_automation_organic_v1.sql'));
});
