import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migration = fs.readFileSync('db/migrations/0192_desactivar_superiores_legacy.sql', 'utf8');
const alMigration = fs.readFileSync('db/migrations/0193_desactivar_al.sql', 'utf8');
const tiposSolicitadosMigration = fs.readFileSync('db/migrations/0194_desactivar_f_oilvp_ilvp.sql', 'utf8');
const legacyAdicionalMigration = fs.readFileSync('db/migrations/0195_desactivar_tipologias_legacy_adicionales.sql', 'utf8');
const reactivarBfdMigration = fs.readFileSync('db/migrations/0196_reactivar_bfd.sql', 'utf8');
const reactivarFMigration = fs.readFileSync('db/migrations/0203_reactivar_f.sql', 'utf8');
const reactivarDbMigration = fs.readFileSync('db/migrations/0204_reactivar_tipologias_db.sql', 'utf8');
const catalog = fs.readFileSync('src/lib/cotizar.ts', 'utf8');
const muebles = fs.readFileSync('src/lib/muebles.ts', 'utf8');
const simulador = fs.readFileSync('src/app/cotizador/CotizadorForm.tsx', 'utf8');
const cotizaciones = fs.readFileSync('src/app/cotizaciones/[id]/AddLineForm.tsx', 'utf8');

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

test('la migración histórica desactivó F, OILVP e ILVP sin eliminar referencias', () => {
  assert.match(tiposSolicitadosMigration, /set activo = false/i);
  // OILVP e ILVP son los alias métricos de las filas OSBFD y SBFD.
  for (const pref of ['F', 'OSBFD', 'SBFD']) {
    assert.match(tiposSolicitadosMigration, new RegExp(`'${pref}'`));
  }
  assert.doesNotMatch(tiposSolicitadosMigration, /delete\s+from\s+public\.cot_tipos_mueble/i);
});

test('F se reactiva y deja de pertenecer a la exclusión defensiva compartida', () => {
  assert.match(reactivarFMigration, /set activo = true/i);
  assert.match(reactivarFMigration, /where pref = 'F'/i);
  assert.doesNotMatch(
    catalog,
    /TIPOLOGIAS_NO_COTIZABLES\s*=\s*new Set\(\[[\s\S]*?'F'[\s\S]*?\]\)/,
  );
});

test('los códigos legacy adicionales se desactivan incluyendo alias métricos', () => {
  assert.match(legacyAdicionalMigration, /set activo = false/i);
  assert.match(legacyAdicionalMigration, /pref_imperial in/i);
  assert.match(legacyAdicionalMigration, /pref_metrico in/i);
  for (const pref of ['S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH']) {
    assert.match(legacyAdicionalMigration, new RegExp(`'${pref}'`));
  }
  assert.doesNotMatch(legacyAdicionalMigration, /'IP'/);
  assert.doesNotMatch(legacyAdicionalMigration, /delete\s+from\s+public\.cot_tipos_mueble/i);
});

test('BFD permanece activa aunque su alias métrico sea IP', () => {
  assert.match(reactivarBfdMigration, /set activo = true/i);
  assert.match(reactivarBfdMigration, /where pref = 'BFD'/i);
});

test('todas las configuraciones DB se ofrecen en Simulador y Cotizaciones', () => {
  assert.match(muebles, /DB_TIPOLOGIAS_COTIZABLES\s*=\s*DB_TIPOLOGIAS/);
  assert.doesNotMatch(muebles, /DB_TIPOLOGIAS_NO_COTIZABLES/);
  for (const key of ['DB-1S', 'DB-2S', 'DB-2', 'DB-3', 'DB-4', 'DB2-1OP']) {
    assert.match(muebles, new RegExp(`key: '${key}'`));
  }
  assert.match(simulador, /DB_TIPOLOGIAS_COTIZABLES\.map/);
  assert.match(cotizaciones, /DB_TIPOLOGIAS_COTIZABLES\.map/);
});

test('todas las filas DB e IC se reactivan sin afectar otras familias', () => {
  assert.match(reactivarDbMigration, /set activo = true/i);
  assert.match(reactivarDbMigration, /pref like 'DB-%'/i);
  assert.match(reactivarDbMigration, /pref_metrico like 'IC-%'/i);
  assert.doesNotMatch(reactivarDbMigration, /set activo = false/i);
});

test('los catálogos compartidos por Simulador y Cotizaciones consultan solo tipos activos', () => {
  assert.match(
    catalog,
    /from\('cot_tipos_mueble'\)[\s\S]*?\.eq\('activo', true\)\.order\('pref'\)/,
  );
  for (const pref of ['S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH']) {
    assert.match(catalog, new RegExp(`TIPOLOGIAS_NO_COTIZABLES[\\s\\S]*?'${pref}'`));
  }
  assert.doesNotMatch(catalog, /TIPOLOGIAS_NO_COTIZABLES\s*=\s*new Set\(\[[^\]]*'IP'/);
  assert.match(catalog, /\[tipo\.pref, tipo\.pref_imperial, tipo\.pref_metrico\]\.some/);
  assert.match(catalog, /tipos:\s*\(tipos \?\? \[\]\)\.filter\([\s\S]*?!esTipologiaNoCotizable\(tipo\)\)/);
});
