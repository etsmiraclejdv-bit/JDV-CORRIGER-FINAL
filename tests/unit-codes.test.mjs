import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCodeList,
  codeListProblem,
  unitCodeStatusLabel,
  unitCodeEventLabel,
  friendlyRpcError,
  MAX_CODES_PER_OPERATION,
} from '../src/lib/unitCodes/helpers.ts';

test('parseCodeList : un code par ligne, séparateurs mixtes, majuscules', () => {
  const r = parseCodeList('az100-0001\nAZ100-0002, az100-0003;AZ100-0004\t AZ100-0005\n\n');
  assert.deepEqual(r.codes, [
    'AZ100-0001',
    'AZ100-0002',
    'AZ100-0003',
    'AZ100-0004',
    'AZ100-0005',
  ]);
  assert.deepEqual(r.invalid, []);
  assert.deepEqual(r.duplicates, []);
});

test('parseCodeList : signale invalides et doublons sans les mélanger', () => {
  const r = parseCodeList('ABC\nAAAA-1\nAAAA-1\nBB BB\n#@!x');
  assert.deepEqual(r.codes, ['AAAA-1']);
  assert.deepEqual(r.duplicates, ['AAAA-1']);
  assert.ok(r.invalid.includes('ABC'));
  assert.ok(r.invalid.includes('BB') || r.invalid.includes('#@!X'));
});

test('parseCodeList : texte vide ou null', () => {
  assert.deepEqual(parseCodeList('').codes, []);
  assert.deepEqual(parseCodeList(null).codes, []);
  assert.deepEqual(parseCodeList('  \n ; , ').codes, []);
});

test('parseCodeList : longueur 4 à 64 et caractères autorisés', () => {
  assert.deepEqual(parseCodeList('ABCD').codes, ['ABCD']);
  assert.deepEqual(parseCodeList('A'.repeat(64)).codes, ['A'.repeat(64)]);
  assert.deepEqual(parseCodeList('A'.repeat(65)).codes, []);
  assert.deepEqual(parseCodeList('A.B_C/D-9').codes, ['A.B_C/D-9']);
  assert.deepEqual(parseCodeList('-ABCD').codes, []);
});

test('codeListProblem : message pour invalide, doublon et excès', () => {
  assert.match(codeListProblem(parseCodeList('ABC')) ?? '', /Code invalide/);
  assert.match(codeListProblem(parseCodeList('ABCD ABCD')) ?? '', /plusieurs fois/);
  const many = Array.from({ length: MAX_CODES_PER_OPERATION + 1 }, (_, i) => 'CODE-' + (1000 + i));
  assert.match(codeListProblem(parseCodeList(many.join('\n'))) ?? '', /maximum/);
  assert.equal(codeListProblem(parseCodeList('ABCD-1\nABCD-2')), null);
});

test('libellés de statut et d’événement, avec repli sur la valeur brute', () => {
  assert.equal(unitCodeStatusLabel('in_transit'), 'En transit');
  assert.equal(unitCodeStatusLabel('with_prospecteur'), 'Chez le prospecteur');
  assert.equal(unitCodeStatusLabel('inconnu'), 'inconnu');
  assert.equal(unitCodeStatusLabel(null), '—');
  assert.equal(unitCodeEventLabel('received'), 'Reçu par le prospecteur');
  assert.equal(unitCodeEventLabel('missing_on_receipt'), 'Non reçu (manquant)');
});

test('friendlyRpcError : fonction absente et message vide', () => {
  assert.match(friendlyRpcError('Could not find the function public.x'), /migration/);
  assert.equal(friendlyRpcError('Code inconnu'), 'Code inconnu');
  assert.equal(friendlyRpcError(''), 'Erreur inconnue.');
  assert.equal(friendlyRpcError(undefined), 'Erreur inconnue.');
});
