import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { esIndependienteDeFondo, tkPredeterminadoTorre } from '@/lib/muebles';

const migration = readFileSync('db/migrations/0227_pcfd_sin_sf_y_tk_sin_predeterminado.sql', 'utf8');

test('PCFD no genera variante SF y la migracion sanea la existente', () => {
  assert.equal(esIndependienteDeFondo('PCFD'), true);
  assert.equal(esIndependienteDeFondo('PCFD-SF'), true);
  assert.match(migration, /upper\(v_pref_base\) in \('F', 'PN', 'TK', 'DFE', 'PCFD'\)/);
  assert.match(migration, /where upper\(pref\) = 'PCFD-SF'/);
  assert.match(migration, /codigo_modulo = replace\(l\.codigo_modulo, '-SF', ''\)/);
});

test('PC, PCFD, PCFD-MO y OVPC no tienen TK predeterminado', () => {
  for (const pref of ['PC', 'PCFD', 'PCFD-MO', 'OVPC']) assert.equal(tkPredeterminadoTorre(pref), null, pref);
  assert.equal(tkPredeterminadoTorre('VPC'), 0);
  assert.match(migration, /upper\(t\.pref\) in \('PC', 'PCFD', 'PCFD-MO', 'OVPC'\)/);
});
