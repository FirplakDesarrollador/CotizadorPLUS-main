import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('la migracion solo actualiza las descripciones visibles de las tres W-SM', () => {
  const sql = readFileSync('db/migrations/0210_descripciones_w_sm_sin_manija.sql', 'utf8');
  assert.match(sql, /set nombre_es = case pref/);
  assert.match(sql, /when 'W-SM' then 'Mueble Superior Sin Manija'/);
  assert.match(sql, /when 'W-SM-LOC' then 'Mueble Superior Locero Sin Manija'/);
  assert.match(sql, /when 'W-SM-PUSH' then 'Mueble Superior Sin Manija con PUSH'/);
  assert.doesNotMatch(sql, /update public\.cot_piezas_plantilla|update public\.cot_reglas_config|update public\.cot_herrajes_tipo/);
});
