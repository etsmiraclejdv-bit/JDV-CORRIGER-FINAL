import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pack = JSON.parse(await readFile(new URL('../docs/demo/scenarios.json', import.meta.url), 'utf8'));

test('demo pack is synthetic and explicitly excludes production writes', () => {
  assert.equal(pack.safety.syntheticOnly, true);
  assert.equal(pack.safety.productionWrites, false);
  assert.equal(pack.safety.identifierPrefix, 'DEMO-');
  assert.ok(pack.users.every((user) => user.email.endsWith('.example.test')));
});

test('demo identities and fixture references are unique', () => {
  const refs = [
    ...pack.organizations,
    ...pack.users,
    ...pack.products,
    ...pack.people,
    ...pack.sales,
    ...pack.stock,
    ...pack.reviews,
  ].map((item) => item.ref);
  assert.equal(new Set(refs).size, refs.length);
  assert.ok(refs.every((ref) => ref.startsWith('DEMO-')));
});

test('demo stock arithmetic is deterministic', () => {
  const initial = pack.products.find((item) => item.ref === 'DEMO-ART-001').initialQuantity;
  const receipt = pack.stock.find((item) => item.ref === 'DEMO-MOVE-IN').quantity;
  const issue = pack.stock.find((item) => item.ref === 'DEMO-MOVE-OUT').quantity;
  const returned = pack.stock.find((item) => item.ref === 'DEMO-MOVE-RETURN').quantity;
  assert.equal(initial + receipt - issue + returned, 116);
});

test('public platform review fixture starts in moderation', () => {
  assert.ok(pack.reviews.length > 0);
  assert.ok(pack.reviews.every((review) => review.status === 'pending'));
  assert.ok(pack.reviews.every((review) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5));
});

test('acceptance scenarios cover each principal branch', () => {
  const areas = new Set(pack.acceptance.map((item) => item.area));
  for (const area of ['Accès', 'Rendez-vous', 'Stock', 'Sous-entrepôt', 'Avis plateforme', 'Studio de design', 'Migrations']) {
    assert.ok(areas.has(area), `missing acceptance area: ${area}`);
  }
});
