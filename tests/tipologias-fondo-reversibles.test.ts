import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../db/migrations/0187_resolver_tipologia_con_sin_fondo.sql', import.meta.url), 'utf8');

test('Con fondo quita exactamente el sufijo final SF y exige que exista la base', () => {
  assert.match(sql, /not like '%-SF'/);
  assert.match(sql, /left\(v_actual\.pref, length\(v_actual\.pref\) - 3\)/);
  assert.match(sql, /where pref = v_pref_base and activo = true/);
  assert.match(sql, /No existe la tipologia con fondo/);
});

test('Sin fondo delega en la creación idempotente existente', () => {
  assert.match(sql, /p_con_fondo is not true/);
  assert.match(sql, /cot_asegurar_tipologia_sin_fondo\(v_actual\.id\)/);
});
