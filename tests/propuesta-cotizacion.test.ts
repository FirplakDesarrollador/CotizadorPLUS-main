import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { separarPropuesta, esHerrajeOtroAdicional, type LineaPropuesta } from '../src/lib/propuesta-cotizacion';
import { HerrajesOtrosPdf, MaterialesProyectoPdf } from '../src/app/cotizaciones/[id]/imprimir/DetallesProyecto';
import { especificacionesProyecto } from '../src/lib/materiales-proyecto';

const modulo: LineaPropuesta = { id: 'm', tipo_mueble_id: 'B', cantidad: 2, codigo_modulo: 'BFD', precio_total_cop: 800, precio_total_usd: 0.2 };
const extra = (tipo: 'herraje' | 'tablero' | 'canto', id = tipo): LineaPropuesta => ({ id, cantidad: 1, codigo_modulo: 'BRAZOPUSH', precio_total_cop: 120, precio_total_usd: 0.03, config: { material: { tipo, codigo: id, cantidad: 1.5, precioUnitarioCop: 52 } } });

test('todos los tipos de Agregar herrajes/otros se separan, también en datos históricos sin marcador', () => {
  const r = separarPropuesta([{ nombre: 'Casa D - Closet M-07', cantidad: 37, lineas: [modulo, extra('herraje'), extra('tablero'), extra('canto')] }]);
  assert.deepEqual(r.muebles[0].lineas.map(l => l.id), ['m']);
  assert.equal(r.adicionales.length, 3);
  assert.deepEqual(r.adicionales.map(l => l.cantidad), [55.5, 55.5, 55.5]);
  assert.deepEqual(r.adicionales.map(l => l.unidad), ['und', 'm²', 'm']);
  assert.equal(r.totalMueblesCop, 29600);
  assert.equal(r.totalAdicionalCop, 13320);
  assert.equal(r.totalCop, 42920, 'muebles + adicionales, una sola vez');
  assert.ok(Math.abs(r.totalUsd - (0.2 + 0.03 * 3) * 37) < 1e-9);
});

test('la cantidad de material y la de línea se multiplican sin confundir precio del lote y precio unitario', () => {
  const r = separarPropuesta([{ nombre: 'Cocina', cantidad: 3, lineas: [{ ...extra('herraje'), cantidad: 2 }] }]);
  const h = r.adicionales[0];
  assert.equal(h.cantidad, 9);
  assert.equal(h.totalCop, 360, 'precio_total_cop ya incluye las unidades de línea');
  assert.equal(h.unitCop, 40);
  assert.equal(r.muebles[0].lineas.length, 0);
});

test('conserva el precio persistido aunque el breakdown tenga decimales anteriores al redondeo', () => {
  const r = separarPropuesta([{ nombre: 'A', lineas: [{ ...modulo, breakdown: { precioConHerrajesCop: 399.9999 } }] }]);
  assert.equal(r.totalCop, 800);
  assert.equal(esHerrajeOtroAdicional(modulo), false);
  assert.equal(esHerrajeOtroAdicional({ id: 'legacy', cantidad: 1, config: { clasificacionPdf: 'herrajes_otros' } }), true);
});

test('el HTML imprimible muestra los adicionales con cantidades, valores y unidades en su sección', () => {
  const r = separarPropuesta([{ nombre: 'Casa D - Closet M-07', cantidad: 37, lineas: [modulo, extra('herraje')] }]);
  const html = renderToStaticMarkup(createElement(HerrajesOtrosPdf, { filas: r.adicionales, moneda: 'COP' }));
  assert.match(html, /data-pdf="herrajes-otros"/);
  assert.match(html, /55,5/);
  assert.match(html, /4\.440/);
  assert.match(html, /Valor unitario/);
  assert.match(html, /Casa D - Closet M-07/);
  assert.doesNotMatch(html, />BFD</);
  const usd = renderToStaticMarkup(createElement(HerrajesOtrosPdf, { filas: r.adicionales, moneda: 'USD' }));
  assert.match(usd, /\$1\.11/);
});

test('las especificaciones impresas corresponden a las características y no a textos genéricos', () => {
  const bloques = especificacionesProyecto({ materialesCloset: { preset: { caja: 'RH18', frente: 'RH18', fondo: 'RH18' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' } }, [{ codigo: 'RH18', proveedor: 'PRIMADERA', sustrato: 'RH', espesor_mm: 18, color_nombre: 'ARTICO' }]);
  const html = renderToStaticMarkup(createElement(MaterialesProyectoPdf, { bloques }));
  assert.match(html, /RH18 · RH · 18 mm · ARTICO · PRIMADERA/);
  assert.match(html, /19x0,45/);
  assert.match(html, /22x1/);
  assert.doesNotMatch(html, /Tablero STANDARD|15 mm|5\.5 mm|por definir/);
});
