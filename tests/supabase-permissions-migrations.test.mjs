import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = async (name) =>
  readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');

test('Concepteur isolation removes global super-admin bypass from organization admin checks', async () => {
  const sql = await migration('20261101183935_isolate_concepteur_operational_data_v1.sql');
  const start = sql.indexOf('CREATE OR REPLACE FUNCTION private.is_org_admin');
  const end = sql.indexOf('$function$;', start);
  assert.ok(start >= 0 && end > start, 'private.is_org_admin definition is present');
  const functionBody = sql.slice(start, end);
  assert.match(functionBody, /om\.organization_id = p_org_id/);
  assert.match(functionBody, /om\.user_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(functionBody, /lower\(om\.role\) IN \('business_admin', 'admin'\)/);
  assert.doesNotMatch(functionBody, /private\.is_super_admin\(\)/);
});

test('Concepteur isolation keeps organization operations scoped and does not delete business data', async () => {
  const sql = await migration('20261101183935_isolate_concepteur_operational_data_v1.sql');
  assert.match(sql, /CREATE POLICY company_settings_org_admin/);
  assert.match(sql, /CREATE POLICY organization_personalization_select[\s\S]*private\.is_org_member\(organization_id\)/);
  assert.match(sql, /CREATE POLICY prospecteurs_select[\s\S]*user_id = \(SELECT auth\.uid\(\)\)/);
  assert.doesNotMatch(sql, /\b(TRUNCATE|DELETE FROM|DROP TABLE)\b/i);
});

test('plan-limit bypass is limited to service_role or the Concepteur-owned organization', async () => {
  const sql = await migration('20261101184525_scope_plan_limit_bypass_to_owned_org_v1.sql');
  assert.match(sql, /COALESCE\(auth\.role\(\), ''\) = 'service_role'/);
  assert.match(sql, /o\.id = v_org AND o\.owner_user_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /public\.jdvcrm_plan_limit_exceeded_v1\(v_org, v_res\)/);
  assert.doesNotMatch(sql, /IF private\.is_super_admin\(\) THEN\s+RETURN NEW/i);
});

test('legacy supply RPC is no longer executable by browser roles', async () => {
  const sql = await migration('20261101183945_lockdown_legacy_prospecteur_supply_rpc_v1.sql');
  assert.match(sql, /revoke all on function public\.jdvcrm_request_prospecteur_supply_v1\(uuid, jsonb\)\s+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.jdvcrm_request_prospecteur_supply_v1\(uuid, jsonb\)\s+to service_role/i);
});
