import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8');

test('F, PN y TK consumen el mismo tablero de los frentes', () => {
  const migration = read('db', 'migrations', '0209_frente_compartido_elementos_planos.sql');
  assert.match(migration, /set rol_tablero = 'frente'/);
  assert.match(migration, /t\.pref in \('F', 'PN', 'TK'\)/);
});

test('la creacion permite elegir familias y no muestra perfiles predefinidos', () => {
  const form = read('src', 'app', 'cotizaciones', 'NuevoCotizacionForm.tsx');
  assert.match(form, /familiasMaterialesActivas/);
  assert.match(form, /inferioresActivo && 'inferior'/);
  assert.match(form, /superioresActivo && 'superior'/);
  assert.match(form, /closetActivo && 'closet'/);
  assert.match(form, /banosActivo && 'banos'/);
  assert.doesNotMatch(form, /Perfil de material|Cargar perfil predefinido/);
  assert.match(form, /Tablero frente \(también Filler, Panel y Zócalo\)/);
  assert.doesNotMatch(form, /F label="Filler"|F label="Panel"|F label="Zócalo"/);
});

test('caracteristicas del proyecto edita las cuatro familias seleccionadas', () => {
  const panel = read('src', 'app', 'cotizaciones', '[id]', 'ProjectConfigPanel.tsx');
  const addLine = read('src', 'app', 'cotizaciones', '[id]', 'AddLineForm.tsx');
  assert.match(panel, /FAMILIAS_MATERIAL\.map/);
  assert.match(panel, /\['frente', 'Tablero frente \(también Filler, Panel y Zócalo\)'\]/);
  assert.doesNotMatch(panel, /\['filler'|\['panel'|\['zocalo'/);
  assert.doesNotMatch(panel, /Cargar perfil predefinido|Perfil de material/);
  assert.doesNotMatch(addLine, /Cargar perfil predefinido|Perfil de material/);
  assert.match(addLine, /tipos\.filter\(\(tipo\) => esElementoPlano\(tipo\.pref\) \|\| familiasActivas\.includes/);
  assert.match(addLine, /if \(esElementoPlano\(pref\).*return familiasActivas\[0\]/);
});
