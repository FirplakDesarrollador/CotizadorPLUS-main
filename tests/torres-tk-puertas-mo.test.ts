import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { usaMoTorre, usaPuertaSupTorre, usaTkTorre } from '@/lib/muebles';

const sql = readFileSync('db/migrations/0218_torres_tk_puerta_sup_pcfd_mo.sql', 'utf8');

test('PC, PCFD, VPC y PCFD-MO exponen sus medidas especiales', () => {
  for (const pref of ['PC','PCFD','VPC','PCFD-MO']) assert.equal(usaTkTorre(pref), true, pref);
  assert.equal(usaPuertaSupTorre('PC'), true);
  assert.equal(usaPuertaSupTorre('VPC'), true);
  assert.equal(usaPuertaSupTorre('PCFD'), false);
  assert.equal(usaMoTorre('PCFD-MO'), true);
});

test('PC y VPC dividen puertas horizontalmente y por PUERTA_SUP', () => {
  assert.match(sql, /'\(L-n_puertas\*RV\)\/n_puertas','PUERTA_SUP-RV'/);
  assert.match(sql, /'A-zocalo-PUERTA_SUP-RV'/);
  assert.match(sql, /'n_puertas','L < 24','1'/);
});

test('PCFD-MO crea vano, dos entrepaños fijos y dos niveles de puertas', () => {
  assert.match(sql, /'PCFD-MO'/);
  assert.match(sql, /'entrepano_fijo','caja','2'/);
  assert.match(sql, /'\(A-zocalo-MO\)\/2-RV'/);
  assert.match(sql, /rol not in \('riel','push'\)/);
});
