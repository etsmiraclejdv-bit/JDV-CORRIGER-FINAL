import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const pack = JSON.parse(await readFile(resolve(root, 'docs/demo/scenarios.json'), 'utf8'));

test('A-Z demo journey: all fixtures are synthetic and cannot target production', () => {
  assert.equal(pack.safety.syntheticOnly, true);
  assert.equal(pack.safety.productionWrites, false);
  assert.equal(pack.safety.identifierPrefix, 'DEMO-');
  assert.ok(pack.users.length >= 2);
  assert.ok(pack.users.every((u) => u.email.endsWith('@example.test')));
  assert.ok([...pack.organizations, ...pack.users, ...pack.products, ...pack.people,
    ...pack.sales, ...pack.stock, ...pack.reviews].every((item) => item.ref?.startsWith('DEMO-')));
});

test('A-Z demo journey: all fixture references are unique and relationships resolve', () => {
  const all = [...pack.organizations, ...pack.users, ...pack.products, ...pack.people,
    ...pack.sales, ...pack.stock, ...pack.reviews];
  const refs = all.map((item) => item.ref);
  assert.equal(new Set(refs).size, refs.length, 'duplicate demo reference');
  const known = new Set(refs);
  for (const user of pack.users) if (user.organization) assert.ok(known.has(user.organization), user.ref);
  for (const person of pack.people) if (person.assignedTo) assert.ok(known.has(person.assignedTo), person.ref);
  for (const item of [...pack.sales, ...pack.stock]) assert.ok(known.has(item.product), item.ref);
});

test('A-Z demo journey: role and organization isolation fixtures exist', () => {
  const roles = new Set(pack.users.map((u) => u.role));
  for (const role of ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PROSPECTEUR', 'GESTIONNAIRE_ENTREPOT', 'LECTURE_SEULE']) {
    assert.ok(roles.has(role), `missing role fixture: ${role}`);
  }
  assert.ok(pack.organizations.some((o) => o.status === 'active'));
  assert.ok(pack.organizations.some((o) => o.status === 'inactive'));
  assert.ok(pack.people.some((p) => p.assignedTo === 'DEMO-USER-P1'));
  assert.ok(pack.people.some((p) => p.assignedTo === 'DEMO-USER-P2'));
});

test('A-Z demo journey: sales totals and payment statuses are mathematically consistent', () => {
  for (const sale of pack.sales) {
    const total = sale.quantity * sale.unitPriceXof;
    assert.ok(Number.isFinite(total) && total > 0, sale.ref);
    assert.ok(sale.paidXof >= 0 && sale.paidXof <= total, sale.ref);
    const expected = sale.paidXof === total ? 'paid' : sale.paidXof === 0 ? 'unpaid' : 'partial';
    assert.equal(sale.expectedStatus, expected, sale.ref);
  }
});

test('A-Z demo journey: stock movement arithmetic never produces negative stock', () => {
  for (const product of pack.products) {
    const moves = pack.stock.filter((m) => m.product === product.ref);
    let quantity = product.initialQuantity;
    for (const move of moves) {
      assert.ok(Number.isInteger(move.quantity) && move.quantity > 0, move.ref);
      quantity += move.type === 'receipt' || move.type === 'return' ? move.quantity : -move.quantity;
      assert.ok(quantity >= 0, `negative stock after ${move.ref}`);
    }
  }
});

test('A-Z demo journey: public reviews require moderation before display', () => {
  assert.ok(pack.reviews.length > 0);
  assert.ok(pack.reviews.every((r) => r.status === 'pending'));
  assert.ok(pack.reviews.every((r) => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5));
});

test('A-Z demo journey: acceptance matrix spans core functional areas', () => {
  const areas = new Set(pack.acceptance.map((item) => item.area));
  for (const area of ['Accès', 'Rendez-vous', 'Stock', 'Sous-entrepôt', 'Avis plateforme', 'Studio de design', 'Migrations']) {
    assert.ok(areas.has(area), `missing acceptance area: ${area}`);
  }
  assert.ok(pack.acceptance.every((item) => item.id && item.test && item.expected));
});

test('A-Z demo journey: test scripts do not embed production credentials or real email addresses', async () => {
  const files = await readdir(resolve(root, 'tests'));
  const source = await Promise.all(files.filter((f) => f.endsWith('.mjs')).map((f) =>
    readFile(resolve(root, 'tests', f), 'utf8')));
  const combined = source.join('\n');
  assert.doesNotMatch(combined, /service_role|SUPABASE_DB_PASSWORD|sk_live_[A-Za-z0-9]+/i);
  assert.doesNotMatch(combined, /@gmail\.com|@yahoo\.com|@outlook\.com/i);
});
