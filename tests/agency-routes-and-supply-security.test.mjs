import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const agencyRouteFiles = [
  'appels',
  'approvisionnement',
  'cloture-stock',
  'codes-produits',
  'expeditions-prospecteurs',
  'fin-de-service',
  'journal-stock',
  'prospecteurs',
  'tracabilite',
];

test('les neuf routes opérationnelles Agence existent et restent raccordées', async () => {
  for (const route of agencyRouteFiles) {
    const file = new URL(`../src/app/agence/dashboard/${route}/page.tsx`, import.meta.url);
    const source = await readFile(file, 'utf8');
    assert.match(source, /export\s*\{\s*default\s*\}\s*from\s*['"]@\/app\/entrepot\/dashboard\//,
      `La route Agence "${route}" doit réutiliser un écran existant, sans page vide ni lien cassé.`);
  }
});

test('le parcours d’approvisionnement appelle le RPC actuel, pas le RPC historique', async () => {
  const service = await readFile(new URL('../src/lib/services/prospecteurSupplyService.ts', import.meta.url), 'utf8');
  assert.match(service, /rpc\(['"]jdvcrm_create_prospecteur_supply_request_v1['"]/);
  assert.doesNotMatch(service, /rpc\(['"]jdvcrm_request_prospecteur_supply_v1['"]/);
});

test('la migration de verrouillage retire l’exécution directe du RPC historique', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20261101183945_lockdown_legacy_prospecteur_supply_rpc_v1.sql', import.meta.url),
    'utf8',
  );
  assert.match(migration, /revoke\s+all\s+on\s+function\s+public\.jdvcrm_request_prospecteur_supply_v1\(uuid,\s*jsonb\)/i);
  assert.match(migration, /from\s+public,\s*anon,\s*authenticated/i);
  assert.match(migration, /grant\s+execute\s+on\s+function\s+public\.jdvcrm_request_prospecteur_supply_v1\(uuid,\s*jsonb\)\s+to\s+service_role/i);
});
