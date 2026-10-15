import test from 'node:test';
import assert from 'node:assert/strict';
import { JDV_LOCALES, messages } from '../src/lib/i18n/messages.ts';

const frKeys = Object.keys(messages.fr).sort();

test('les 11 langues annoncées par le sélecteur existent', () => {
  assert.equal(JDV_LOCALES.length, 11);
  for (const { code } of JDV_LOCALES) {
    assert.ok(messages[code], 'catalogue manquant : ' + code);
  }
});

test('chaque langue contient exactement les mêmes clés que le français', () => {
  for (const { code } of JDV_LOCALES) {
    const keys = Object.keys(messages[code]).sort();
    const missing = frKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !frKeys.includes(k));
    assert.deepEqual(missing, [], code + ' : clés manquantes');
    assert.deepEqual(extra, [], code + ' : clés en trop');
  }
});

test('aucune traduction vide', () => {
  for (const { code } of JDV_LOCALES) {
    for (const [key, value] of Object.entries(messages[code])) {
      assert.ok(typeof value === 'string' && value.trim() !== '', code + '.' + key + ' est vide');
    }
  }
});

test('les langues autres que le français ne reprennent pas le texte français sauf mots identiques', () => {
  const allowedSame = new Set([
    'contact',
    'support',
    'privacy',
    'traceability',
    'email',
    'error',
    'menu',
    'date',
    'services',
  ]);
  for (const { code } of JDV_LOCALES) {
    if (code === 'fr') continue;
    const same = frKeys.filter((k) => messages[code][k] === messages.fr[k] && !allowedSame.has(k));
    assert.ok(
      same.length <= 6,
      code + ' : trop de textes identiques au français (' + same.slice(0, 8).join(', ') + ')'
    );
  }
});
