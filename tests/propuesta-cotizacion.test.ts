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

test('el HTML imprimible muestra los adicionales con cantidades y unidades sin precios en su sección', () => {
  const r = separarPropuesta([{ nombre: 'Casa D - Closet M-07', cantidad: 37, lineas: [modulo, extra('herraje')] }]);
  const html = renderToStaticMarkup(createElement(HerrajesOtrosPdf, { filas: r.adicionales, moneda: 'COP' }));
  assert.match(html, /data-pdf="herrajes-otros"/);
  assert.match(html, /55,5/);
  assert.doesNotMatch(html, /Valor unitario|Valor total|Subtotal|4\.440|\$/);
  assert.match(html, /Casa D - Closet M-07/);
  assert.doesNotMatch(html, />BFD</);
  const usd = renderToStaticMarkup(createElement(HerrajesOtrosPdf, { filas: r.adicionales, moneda: 'USD' }));
  assert.equal(usd, html, 'el detalle sin precios es igual en ambas monedas');
});

test('las especificaciones impresas corresponden a las características y no a textos genéricos', () => {
  const bloques = especificacionesProyecto({ materialesCloset: { preset: { caja: 'RH18', frente: 'RH18', fondo: 'RH18' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' } }, [{ codigo: 'RH18', proveedor: 'PRIMADERA', sustrato: 'RH', espesor_mm: 18, color_nombre: 'ARTICO' }]);
  const html = renderToStaticMarkup(createElement(MaterialesProyectoPdf, { bloques }));
  assert.match(html, /RH18 · RH · 18 mm · ARTICO · PRIMADERA/);
  assert.match(html, /19x0,45/);
  assert.match(html, /22x1/);
  assert.doesNotMatch(html, /Tablero STANDARD|15 mm|5\.5 mm|por definir/);
});


test('agrupa referencias iguales entre áreas, suma cantidades y conserva unidades distintas', () => {
  const linea = (id: string, codigo: string, cantidad: number, tipo: 'herraje' | 'canto' = 'herraje'): LineaPropuesta => ({
    id, cantidad: 1, descripcion_es: `Herraje ${codigo} · ${cantidad} und`, precio_total_cop: 120, precio_total_usd: 0.03,
    config: { material: { tipo, codigo, cantidad, precioUnitarioCop: 52 } },
  });
  const r = separarPropuesta([
    { nombre: 'Cocina', cantidad: 1, lineas: [linea('1', 'CPTK', 5), linea('2', 'PTK4', 1)] },
    { nombre: 'Isla', cantidad: 1, lineas: [linea('3', 'CPTK', 3), linea('4', 'PTK4', 1)] },
    { nombre: 'Pilas', cantidad: 1, lineas: [linea('5', 'CPTK', 1)] },
    { nombre: 'Baño', cantidad: 3, lineas: [linea('6', 'GFSM', 2), linea('7', 'LGP4118', 1), linea('8', 'CPTK', 0.5, 'canto')] },
  ]);
  const snapshot = structuredClone(r);
  const html = renderToStaticMarkup(createElement(HerrajesOtrosPdf, { filas: r.adicionales, moneda: 'USD' }));
  assert.equal((html.match(/<tbody>[\s\S]*<\/tbody>/)![0].match(/<tr /g) || []).length, 5);
  assert.match(html, /Cocina, Isla, Pilas/);
  for (const [codigo, cantidad] of [['CPTK', '9'], ['PTK4', '2'], ['GFSM', '6'], ['LGP4118', '3']]) {
    assert.match(html, new RegExp(`<b>${codigo}</b></td><td[^>]*>.*?</td><td[^>]*>${cantidad}</td>`));
  }
  assert.match(html, />1,5<\/td><td[^>]*>m<\/td>/);
  assert.doesNotMatch(html, /Valor unitario|Valor total|Subtotal|\$|· 5 und|· 3 und/);
  assert.deepEqual(r, snapshot, 'agrupar para imprimir no modifica filas ni importes');
  assert.equal(r.totalCop, 1680, 'las áreas repetidas conservan su importe en el total');
});
