import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { separarPropuesta, esHerrajeOtroAdicional, type LineaPropuesta } from '../src/lib/propuesta-cotizacion';
import { catalogoInicialMesones, calcularMeson, medidasMesonDesdeMuebles, mueblesParaMeson, parametrosParaMeson, type MedidasMeson } from '../src/lib/mesones';
import { esModuloLinea } from '../src/lib/materiales-linea';
import { MesonesPdf, HerrajesOtrosPdf, MaterialesProyectoPdf } from '../src/app/cotizaciones/[id]/imprimir/DetallesProyecto';
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

const tramo: MedidasMeson = {
  largo: 72, profundidad: 24, largoBacksplash: 72, backsplash: 4, espesor: 0.75,
  voladizo: 0, extensionLateral: 0, waterfalls: 0, cantoExpuesto: 72, huecos: 1, pulirHuecos: false,
};
const { materiales: catalogoPbShore, parametros: pMeson } = catalogoInicialMesones;
const cerca = (actual: number, esperado: number) => assert.ok(Math.abs(actual - esperado) < 1e-8, `${actual} ≠ ${esperado}`);

test('mesón USA usa las tarifas PB Shore y cobra una sola perforación', () => {
  const quartz = catalogoPbShore.find(m => m.id === 'quarztone-us')!;
  const r = calcularMeson(tramo, quartz, pMeson, 4000);
  cerca(r.areaSqft, 14.7);
  cerca(r.piesPulidos, 6);
  cerca(r.costoUsd, 14.7 * (9.9 + 6) + 25);
  cerca(r.precioUsd, 14.7 * 9.9 / 0.6401 + 14.7 * 6 / 0.641467 + 25 / 0.641);
  cerca(r.precioCop, r.precioUsd * 4000);
});

test('Colombia conserva costo real, aplica los márgenes en cadena y exige costo de material', () => {
  const granito = catalogoPbShore.find(m => m.id === 'granito-col')!;
  const d = { ...tramo, espesor: 1.5, waterfalls: 1, voladizo: 3, extensionLateral: 2, pulirHuecos: true };
  const r = calcularMeson(d, granito, pMeson, 4000);
  const area = (74 * 27 + 72 * 4 + 27 * 36 + 72 * 4) / 144 * 1.05;
  cerca(r.areaSqft, area);
  const suministro = area * (180000 + 16357) / 10.76;
  const acabados = 6 * 77800 / 3.28 + 50000;
  cerca(r.costoCop, suministro + acabados);
  cerca(r.precioCop, suministro / 0.5 / 0.6401 + acabados / 0.7 / 0.641);
  assert.throws(() => calcularMeson(d, catalogoPbShore[0], pMeson, 4000), /tarifa/);
  assert.throws(() => calcularMeson({ ...d, huecos: 1.5 }, granito, pMeson, 4000), /cantidades/);
});

test('la sección impresa de mesones usa material real y aplica las repeticiones exactamente una vez', () => {
  const material = catalogoPbShore.find(m => m.id === 'polar')!;
  const resultado = calcularMeson(tramo, material, pMeson, 4000);
  const meson = { id: 'meson', cantidad: 1, precio_total_cop: 2300000, precio_total_usd: 575,
    config: { clasificacionPdf: 'mesones', meson: { material, medidas: tramo, resultado } } };
  const r = separarPropuesta([{ nombre: 'Cocina', cantidad: 80, lineas: [modulo, extra('herraje'), meson] }]);
  assert.equal(esModuloLinea(meson), false);
  assert.equal(r.muebles[0].lineas.length, 1);
  assert.equal(r.adicionales.length, 1);
  assert.equal(r.mesones[0].cantidad, 80);
  cerca(r.mesones[0].areaSqft, 1176);
  assert.equal(r.totalMesonesUsd, 46000);
  assert.equal(r.totalCop, (2300000 + 800 + 120) * 80);
  const html = renderToStaticMarkup(createElement(MesonesPdf, { filas: r.mesones, moneda: 'USD', idioma: 'en' }));
  assert.match(html, /data-pdf="mesones"/);
  assert.match(html, /Quarztone Blanco Polar/);
  assert.match(html, /46,000.00/);
  assert.doesNotMatch(html, /BRAZOPUSH|BFD/);
});

test('mesón calcula la isla una vez, agrega muros y cascadas y cobra la perforación del cooktop', () => {
  const tipo = (categoria: string, pref: string) => ({ categoria, pref });
  const muebles = mueblesParaMeson([
    { id: 'bajo', largo: 24, cantidad: 2, unidad_dim: 'in', tipo: tipo('inferior', 'BFD') },
    { id: 'isla', largo: 762, cantidad: 1, unidad_dim: 'mm', tipo: tipo('inferior', 'DB') },
    { id: 'torre', largo: 24, cantidad: 1, unidad_dim: 'in', tipo: tipo('inferior', 'PCFD') },
    { id: 'panel', largo: 100, cantidad: 2, unidad_dim: 'cm', tipo: tipo('inferior', 'PN') },
    { id: 'suelto', largo: 50, cantidad: 3, unidad_dim: 'in', tipo: null },
  ]);
  assert.deepEqual(muebles.map(m => m.id), ['bajo', 'isla']);
  const opciones = {
    profundidad: 24, backsplash: 4, espesor: 0.75, dishwasher: 18, equipo: 'cooktop' as const, anchoRange: 30,
    murosLaterales: 1, cantosPulidos: 2, waterfalls: 1, huecos: 1, pulirHuecos: false,
    isla: { largo: 48, voladizoFrontal: 3, voladizoLateral: 2, cantosPulidos: 1, waterfalls: 2, mueblesIds: ['isla'] },
  };
  const d = medidasMesonDesdeMuebles(muebles, opciones);
  const cocina = medidasMesonDesdeMuebles(muebles, {
    ...opciones, tipo: 'cocina', isla: null, mueblesExcluidos: ['isla'],
  });
  assert.equal(cocina.largo, 66);
  assert.equal(d.largo, 66);
  assert.equal(d.largoBacksplash, 66);
  assert.equal(d.huecos, 2);
  assert.equal(d.cantoExpuesto, 83);
  const material = catalogoPbShore.find(m => m.id === 'quarztone-us')!;
  const r = calcularMeson(d, material, pMeson, 4000);
  const area = (66 * 24 + 66 * 4 + 24 * 36 + 24 * 7 + 50 * 27 + 2 * 27 * 36) / 144 * 1.05;
  cerca(r.areaSqft, area);
  cerca(r.costoUsd, area * (9.9 + 6) + 50);
  const aislada = medidasMesonDesdeMuebles([], { ...opciones, dishwasher: null,
    murosLaterales: 0, cantosPulidos: 0, waterfalls: 0, isla: { ...opciones.isla, mueblesIds: [] } });
  assert.equal(aislada.largo, 0);
  assert.equal(aislada.huecos, 2);
  cerca(calcularMeson(aislada, material, pMeson, 4000).areaSqft, (50 * 27 + 2 * 27 * 36) / 144 * 1.05);
  assert.throws(() => medidasMesonDesdeMuebles([], { ...opciones, isla: null }), /muebles inferiores/);
});

test('isla y baño usan parámetros separados y el refuerzo agrega superficie sin cobrar perforaciones en obra', () => {
  const base = catalogoInicialMesones.parametros;
  const catalogo = { ...catalogoInicialMesones, parametrosPorTipo: {
    cocina: base, isla: { ...base, merma: 0 }, bano: { ...base, profundidad: 22.5 },
  } };
  assert.equal(parametrosParaMeson(catalogo, 'bano').profundidad, 22.5);
  assert.equal(parametrosParaMeson(catalogo, 'cocina').profundidad, 25.5);
  const p = parametrosParaMeson(catalogo, 'isla');
  const opciones = {
    tipo: 'isla' as const, profundidad: 30, backsplash: 4, espesor: p.espesorReforzado,
    dishwasher: null, equipo: 'cooktop' as const, anchoRange: 30, murosLaterales: 0,
    cantosPulidos: 0, waterfalls: 0, huecos: 2, pulirHuecos: false,
    isla: { largo: 48, voladizoFrontal: 3, voladizoLateral: 2, cantosPulidos: 1, waterfalls: 0, mueblesIds: [] },
  };
  const material = catalogo.materiales.find(m => m.id === 'quarztone-us')!;
  const medidas = (refuerzo: boolean, perforacionesEn: 'fabricacion' | 'instalacion') =>
    medidasMesonDesdeMuebles([{ id: 'b', etiqueta: 'B', categoria: 'inferior', largo: 100 }],
      { ...opciones, refuerzo, perforacionesEn });
  const sinRefuerzo = calcularMeson(medidas(false, 'instalacion'), material, p, 4000);
  const enObra = calcularMeson(medidas(true, 'instalacion'), material, p, 4000);
  const enFabrica = calcularMeson(medidas(true, 'fabricacion'), material, p, 4000);
  cerca(sinRefuerzo.areaSqft, (50 * 33 + 50 * 4) / 144);
  cerca(enObra.areaSqft - sinRefuerzo.areaSqft, 33 * 4 / 144);
  cerca(enFabrica.costoUsd - enObra.costoUsd, 3 * material.hueco);
  cerca(enFabrica.precioUsd - enObra.precioUsd, 3 * material.hueco / (1 - p.margenAcabados / 100));
});
