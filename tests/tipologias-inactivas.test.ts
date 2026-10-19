import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migration = fs.readFileSync('db/migrations/0192_desactivar_superiores_legacy.sql', 'utf8');
const alMigration = fs.readFileSync('db/migrations/0193_desactivar_al.sql', 'utf8');
const catalog = fs.readFileSync('src/lib/cotizar.ts', 'utf8');

test('S, SA, SBAS, SLOC y SMO quedan inactivas sin eliminar datos históricos', () => {
  assert.match(migration, /set activo = false/i);
  for (const pref of ['S', 'SA', 'SBAS', 'SLOC', 'SMO']) {
    assert.match(migration, new RegExp(`'${pref}'`));
  }
  assert.doesNotMatch(migration, /delete\s+from\s+public\.cot_tipos_mueble/i);
});

test('AL queda inactiva sin eliminar sus referencias históricas', () => {
  assert.match(alMigration, /set activo = false/i);
  assert.match(alMigration, /where pref = 'AL'/i);
  assert.doesNotMatch(alMigration, /delete\s+from\s+public\.cot_tipos_mueble/i);
});

test('los catálogos compartidos por Simulador y Cotizaciones consultan solo tipos activos', () => {
  assert.match(
    catalog,
    /from\('cot_tipos_mueble'\)[\s\S]*?\.eq\('activo', true\)\.order\('pref'\)/,
  );
});
