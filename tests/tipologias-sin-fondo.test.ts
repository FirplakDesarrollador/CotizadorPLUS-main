import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../db/migrations/0186_tipologias_sin_fondo_bajo_demanda.sql', import.meta.url), 'utf8');

test('la creación SF es idempotente y segura ante concurrencia', () => {
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /select id into v_destino[\s\S]*where pref = v_pref_destino/);
  assert.match(sql, /if v_destino is not null then return v_destino/);
});

test('la variante SF omite solo el respaldo y ajusta la base a P-TC', () => {
  assert.match(sql, /lower\(p\.nombre\)<>'fondo'/);
  assert.match(sql, /lower\(p\.nombre\)='base'/);
  assert.match(sql, /then 'P-TC'/);
});

test('la función solo puede ejecutarla un usuario autenticado', () => {
  assert.match(sql, /if not public\.cot_is_authenticated\(\)/);
  assert.match(sql, /grant execute[\s\S]*to authenticated/);
  assert.match(sql, /revoke all[\s\S]*from public, anon/);
});
