import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync('db/migrations/0219_f_dfe_sin_variante_sf.sql', 'utf8');
const form = readFileSync('src/app/cotizaciones/[id]/AddLineForm.tsx', 'utf8');

test('el resolver devuelve la base y sanea variantes F-SF y DFE-SF', () => {
  assert.match(migration, /upper\(v_pref_base\) in \('F', 'PN', 'TK', 'DFE'\)/);
  assert.match(migration, /upper\(variante\.pref\) in \('F-SF', 'DFE-SF'\)/);
  assert.match(migration, /codigo_modulo = replace\(l\.codigo_modulo, '-SF', ''\)/);
  assert.match(migration, /set activo = false/);
});

test('el formulario fuerza la tipología independiente del fondo a su base', () => {
  assert.match(form, /const fuerzaConFondo = esMuebleSuperior\(prefTipo\) \|\| esIndependienteDeFondo\(prefTipo\)/);
  assert.match(form, /conFondo: fuerzaConFondo \? true : conFondo/);
});
