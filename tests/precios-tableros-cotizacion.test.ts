import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  aplicarPreciosTableros,
  normalizarPreciosTableros,
  precioTableroCotizacion,
} from '../src/lib/precios-tableros';

test('el precio de una cotización se aplica sobre una copia y no muta el catálogo global', () => {
  const catalogo = {
    CAJA15: { codigo: 'CAJA15', precio_m2: 40_000, espesor_mm: 15 },
    FRENTE18: { codigo: 'FRENTE18', precio_m2: 90_000, espesor_mm: 18 },
  };
  const ajustado = aplicarPreciosTableros(catalogo, { CAJA15: 52_500 });

  assert.equal(ajustado.CAJA15.precio_m2, 52_500);
  assert.equal(ajustado.FRENTE18.precio_m2, 90_000);
  assert.equal(catalogo.CAJA15.precio_m2, 40_000);
  assert.notEqual(ajustado.CAJA15, catalogo.CAJA15);
});

test('otra cotización sin override conserva el precio por defecto', () => {
  const tableros = [{ codigo: 'CAJA15', precio_m2: 40_000 }];
  assert.equal(precioTableroCotizacion('CAJA15', tableros, { CAJA15: 52_500 }), 52_500);
  assert.equal(precioTableroCotizacion('CAJA15', tableros, undefined), 40_000);
});

test('solo admite precios de tablero finitos y no negativos', () => {
  assert.deepEqual(normalizarPreciosTableros({ A: 0, B: '1200', C: -1, D: 'x' }), { A: 0, B: 1200 });
});

test('las seis selecciones de tablero del panel muestran el valor editable', () => {
  const source = fs.readFileSync('src/app/cotizaciones/[id]/ProjectConfigPanel.tsx', 'utf8');
  assert.equal(source.match(/tableroField\('Tablero /g)?.length, 6);
  assert.match(source, /Valor tablero \(COP\/m²\)/);
});

test('el override viaja con cada línea y dispara recálculo al cambiar', () => {
  const source = fs.readFileSync('src/lib/cotizaciones.ts', 'utf8');
  assert.match(source, /preciosTableros: normalizarPreciosTableros\(input\.preciosTableros\)/);
  assert.match(source, /preciosTablerosCambiaron/);
  assert.match(source, /configUpdates\.preciosTableros/);
});
