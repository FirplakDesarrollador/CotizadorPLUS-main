import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { calcAreaM2, calcPrecio, calcPrecioM2, parseFormatoAnchoAlto } from '../src/lib/catalogo-tableros-calculos';

test('calcula el área de formatos válidos con X o x y espacios', () => {
  assert.deepEqual(parseFormatoAnchoAlto('124 X 246'), { anchoCm: 124, altoCm: 246 });
  assert.deepEqual(parseFormatoAnchoAlto('183x244'), { anchoCm: 183, altoCm: 244 });
  assert.equal(calcAreaM2('122X244'), 2.9768);
});

test('un formato inválido no produce un área que sobrescriba el valor manual', () => {
  const areaManual = 3.25;
  assert.equal(calcAreaM2('122 por 244'), null);
  assert.equal(calcAreaM2('122 por 244') ?? areaManual, areaManual);
});

test('calcula precio por metro cuadrado desde el precio', () => {
  assert.equal(calcPrecioM2(218000, 2.9768), 73233);
});

test('calcula precio desde el precio por metro cuadrado', () => {
  assert.equal(calcPrecio(400, 2.5), 1000);
});

test('no calcula precios con área cero o vacía', () => {
  assert.equal(calcPrecioM2(1000, 0), null);
  assert.equal(calcPrecioM2(1000, ''), null);
  assert.equal(calcPrecio(400, 0), null);
  assert.equal(calcPrecio(400, ''), null);
});

test('el formulario limita los cálculos automáticos a cot_tableros', () => {
  const source = readFileSync(new URL('../src/app/admin/AdminCatalogos.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(tabla !== 'cot_tableros'\) return next/);
  assert.match(source, /onChange=\{\(e\) => updateField\(f, e\.target\.value\)\}/);
});
