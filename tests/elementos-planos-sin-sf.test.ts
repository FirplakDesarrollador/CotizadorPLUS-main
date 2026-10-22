import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync('db/migrations/0217_elementos_planos_sin_variante_sf.sql', 'utf8');
const form = readFileSync('src/app/cotizaciones/[id]/AddLineForm.tsx', 'utf8');

test('el resolver devuelve siempre la base para F, PN y TK y retira variantes accidentales', () => {
  assert.match(migration, /upper\(v_pref_base\) in \('F', 'PN', 'TK'\)/);
  assert.match(migration, /revoke execute on function public\.cot_asegurar_tipologia_sin_fondo/);
  assert.match(migration, /upper\(variante\.pref\) in \('F-SF', 'PN-SF', 'TK-SF'\)/);
  assert.match(migration, /codigo_modulo = replace\(l\.codigo_modulo, '-SF', ''\)/);
  assert.match(migration, /set activo = false/);
});

test('el formulario fuerza fondo para superiores y elementos planos', () => {
  assert.match(form, /const fuerzaConFondo = esMuebleSuperior\(prefTipo\) \|\| esElementoPlano\(prefTipo\)/);
  assert.match(form, /conFondo: fuerzaConFondo \? true : conFondo/);
  assert.match(form, /disabled=\{fuerzaConFondo\}/);
});
