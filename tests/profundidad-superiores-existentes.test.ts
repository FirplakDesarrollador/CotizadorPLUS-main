import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync('db/migrations/0215_profundidad_nombres_superiores_existentes.sql', 'utf8');
const groupSql = readFileSync('db/migrations/0216_recomponer_codigos_grupo_profundidad.sql', 'utf8');

test('la migración añade profundidad solo al formato histórico y actualiza el grupo', () => {
  assert.match(sql, /c\.base_actual = c\.base_antigua/);
  assert.match(sql, /c\.base_antigua \|\| c\.profundidad/);
  assert.match(sql, /upper\(t\.pref\) <> 'WCC'/);
  assert.match(sql, /update public\.cot_grupos_modulos/);
  assert.match(sql, /string_agg\(l\.codigo_modulo, '\.'/);
  assert.match(sql, /Quedaron códigos superiores con el formato anterior/);
});

test('la corrección posterior recompone y verifica los códigos de todos los grupos', () => {
  assert.match(groupSql, /update public\.cot_grupos_modulos/);
  assert.match(groupSql, /string_agg\(l\.codigo_modulo, '\.'/);
  assert.match(groupSql, /is distinct from x\.codigo_grupo/);
  assert.match(groupSql, /Quedaron códigos de grupo desincronizados/);
});

test('la migración conserva la presentación imperial en fracciones de dieciseisavo', () => {
  assert.match(sql, /round\(v \* 16\)/);
  assert.match(sql, /gcd\(v_numerador, 16\)/);
  assert.match(sql, /p_valor \/ 25\.4/);
});
