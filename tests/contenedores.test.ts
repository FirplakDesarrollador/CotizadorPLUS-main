import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  calcularContenedores, DENSIDAD_TABLERO_KG_M3, FACTOR_PESO_NETO,
  type AreaPeso, type LineaPeso,
} from '../src/lib/contenedores';
import EntregaPanel from '../src/app/cotizaciones/[id]/EntregaPanel';
import { EntregaPdf } from '../src/app/cotizaciones/[id]/imprimir/DetallesProyecto';
import { calcularRecargoEntrega, normalizarEntrega, resumirEntrega, type AreaEntrega } from '../src/lib/entrega-cotizacion';

const tablero = { codigo: 'T', espesor_mm: 15 };
const linea = (cantidad = 1): LineaPeso => ({
  cantidad, breakdown: { maderaPorRol: [{ rol: 'caja', codigo: 'T', cm2: 10000 }] },
});
const area = (cantidad: number, lineas: LineaPeso[], nombre = 'Cocina'): AreaPeso => ({ nombre, cantidad, lineas });

for (const [espesor_mm, factorPeso, esperado] of [
  [15, 1, 10.8], [15, FACTOR_PESO_NETO, 10.557],
  [18, FACTOR_PESO_NETO, 12.6684], [6, FACTOR_PESO_NETO, 4.2228],
]) {
  test(`1 m² de ${espesor_mm} mm con factor ${factorPeso} pesa ${esperado} kg`, () => {
    const resultado = calcularContenedores([area(1, [linea()])], [{ ...tablero, espesor_mm }], { factorPeso });
    assert.ok(Math.abs(resultado.pesoTotalKg - esperado) < 1e-9);
  });
}

test('multiplica cantidades de líneas y repeticiones de cada área', () => {
  const resultado = calcularContenedores([area(20, [linea(2)])], [tablero]);
  assert.equal(resultado.unidadesTotales, 40);
  assert.equal(resultado.detallePorArea[0].unidades, 40);
  assert.equal(resultado.detallePorArea[0].repeticiones, 20);
  assert.ok(Math.abs(resultado.pesoTotalKg - 422.28) < 1e-9);
  assert.ok(Math.abs(resultado.detallePorArea[0].pesoPorUnidadKg! - 10.557) < 1e-9);
  assert.equal(calcularContenedores([area(20, Array.from({ length: 10 }, () => linea(2)))], [tablero]).unidadesTotales, 400);
  assert.equal(calcularContenedores([area(20, [linea(12)]), area(40, [linea(6)], 'Baño')], [tablero]).unidadesTotales, 480);
});

test('cantidades ausentes, nulas o NaN valen 1 y cantidades cero o negativas valen 0', () => {
  for (const cantidad of [undefined, null, NaN]) {
    const historica = { ...linea(), cantidad } as LineaPeso;
    const resultado = calcularContenedores([{ ...area(1, [historica]), cantidad } as AreaPeso], [tablero]);
    assert.equal(resultado.unidadesTotales, 1);
    assert.ok(Math.abs(resultado.pesoTotalKg - 10.557) < 1e-9);
  }
  for (const cantidad of [0, -2]) {
    const resultado = calcularContenedores([area(4, [linea(cantidad)]), area(cantidad, [linea(2)])], [tablero]);
    assert.equal(resultado.unidadesTotales, 0);
    assert.equal(resultado.pesoTotalKg, 0);
  }
});

// Cabinets!G47:G79 y columnas AM:AY de madera en el vínculo guardado por pb shore.xlsx.
const areasConDesperdicio = [
  [0.7213824282, 0, 1.731779310628, 0.73451466, 0, 0.15345420922, 0], // SBFD33
  [0.3207380682, 0, 1.338565419638, 0.3295425247846, 0, 0.29735230852, 0], // BFD15
  [0.3207380682, 0, 1.338565419638, 0.3295425247846, 0, 0.29735230852, 0], // BFD15
  [0, 0, 0, 0, 0, 0, 0], // DB15-1s: peso fijo en Cabinets!AG50, tratado abajo.
  [0.3523059502254, 0, 0.86930922912, 0.373934736, 0, 0.16792192222, 0], // W3614
  [0.5108127299854, 0, 0.94053489312, 0.53419248, 0, 0.4656006817, 0], // W2430
  [0.7071952404454, 0, 1.10079263712, 0.73451466, 0, 0.6492293467, 0], // W3330
  [0.5762735668054, 0, 0.99395414112, 0.60096654, 0, 0.5268102367, 0], // W2730
  [0.5762735668054, 0, 0.99395414112, 0.60096654, 0, 0.5268102367, 0], // W2730
  [0.2707896616454, 0, 0.74466431712, 0.28935426, 0, 0.13898649622, 0], // W3013
  [0.3131309447046, 0, 0.78027714912, 0.3338703, 0, 0.2819720167, 0], // W1530
  [0, 0, 0, 0.6505601908125, 0, 0, 0], // PN24 7/835 1/4
  [0, 0, 0, 0.2865720075, 0, 0, 0], // PN12 7/830
  [0, 0, 0, 0.1337336035, 0, 0, 0], // PN12 7/814
  [0, 0, 0, 0.214418926, 0, 0, 0], // PN1717
  [0, 0, 0, 0.17806416, 0, 0, 0], // F830
  [0, 0, 0, 0.17806416, 0, 0, 0], // F830
  [0, 0, 0, 0.17806416, 0, 0, 0], // F830
  [0, 0, 0, 0.373934736, 0, 0, 0], // TK5 1/496
  [0.5210602482, 0, 1.514515067738, 0.53419248, 0, 0.49099708252, 0], // BFD24
  [0.5210602482, 0, 1.514515067738, 0.53419248, 0, 0.49099708252, 0], // BFD24
  [0, 0, 0, 0.6505601908125, 0, 0, 0], // PN24 7/835 1/4
  [0, 0, 0, 0.6505601908125, 0, 0, 0], // PN24 7/835 1/4
  [0, 0, 0, 1.29458208825, 0, 0, 0], // PN49 1/235 1/4
  [0, 0, 0, 0.373934736, 0, 0, 0], // TK5 1/496
  [0.7881564882, 0, 1.794324346828, 0.80128872, 0, 0.16792192222, 0], // SBFD36
  [0, 0, 0, 0.13354812, 0, 0, 0], // F630
  [0, 0, 0, 0.559928315625, 0, 0, 0], // PN21 7/834 1/2
  [0, 0, 0, 0.320515488, 0, 0, 0], // TK4 1/296
  [0.7881564882, 0, 1.794324346828, 0.80128872, 0, 0.16792192222, 0], // SBFD36
  [0, 0, 0, 0.13354812, 0, 0, 0], // F630
  [0, 0, 0, 0.559928315625, 0, 0, 0], // PN21 7/834 1/2
  [0, 0, 0, 0.320515488, 0, 0, 0], // TK4 1/296
];
const espesores = [5.5, 5.5, 15, 18, 18, 15, 15];
const tablerosPB = espesores.map((espesor_mm, i) => ({ codigo: String(i), espesor_mm }));
const lineasPB = areasConDesperdicio.map((areas, i): LineaPeso => {
  const maderaPorRol = areas.map((m2, columna) => ({
    rol: 'tablero', codigo: String(columna), cm2: m2 * 10000 / 1.15,
  }));
  if (i === 3) {
    // AG50 guarda un peso fijo para 80 repeticiones. Se convierte a área neta equivalente.
    const kgM2 = (espesores[2] / 1000) * DENSIDAD_TABLERO_KG_M3 * FACTOR_PESO_NETO;
    maderaPorRol[2].cm2 = 1893.9137368391441 / 80 / kgM2 * 10000;
  }
  return { cantidad: 1, breakdown: { maderaPorRol } };
});

test('PB SHORE: 33 líneas en 80 repeticiones', () => {
  assert.equal(lineasPB.length, 33);
  const resultado = calcularContenedores([area(80, lineasPB, 'PB SHORE')], tablerosPB);
  assert.equal(resultado.pesoTotalKg.toFixed(2), '33189.47');
  assert.equal(resultado.unidadesTotales, 2640);
  assert.equal(resultado.pesoPorUnidadKg?.toFixed(4), '12.5718');
  assert.equal(resultado.ocupacionPct.toFixed(2), '73.75');
  assert.equal(resultado.contenedores, 2);
  assert.deepEqual(resultado.advertencias, []);
});

test('PB SHORE: peso y contenedores para 60 y 1 viviendas equivalentes', () => {
  const sesenta = calcularContenedores([area(60, lineasPB)], tablerosPB);
  const una = calcularContenedores([area(1, lineasPB)], tablerosPB);
  assert.equal(sesenta.pesoTotalKg.toFixed(2), '24892.10');
  assert.equal(sesenta.contenedores, 2);
  assert.equal(una.pesoTotalKg.toFixed(4), '414.8683');
  assert.equal(una.contenedores, 1);
});

test('cotización vacía y área sin líneas producen ceros y promedio nulo', () => {
  for (const areas of [[], [area(20, [])]]) {
    const resultado = calcularContenedores(areas, []);
    assert.equal(resultado.pesoTotalKg, 0);
    assert.equal(resultado.unidadesTotales, 0);
    assert.equal(resultado.contenedores, 0);
    assert.equal(resultado.ocupacionPct, 0);
    assert.equal(resultado.pesoPorUnidadKg, null);
  }
});

test('líneas sin despiece y tableros sin espesor conservan unidades y advierten', () => {
  const resultado = calcularContenedores([area(2, [{ cantidad: 3 }, linea()])], [{ ...tablero, espesor_mm: null }]);
  assert.equal(resultado.unidadesTotales, 8);
  assert.equal(resultado.pesoTotalKg, 0);
  assert.match(resultado.advertencias[0], /Línea sin despiece/);
  assert.match(resultado.advertencias[1], /Tablero sin espesor/);
});

test('líneas agrupadas cuentan una vez cada una y adicionales quedan fuera', () => {
  const agrupadas = [linea(2), linea(3)].map(pieza => ({ ...pieza, grupo_id: 'G' }));
  const resultado = calcularContenedores([area(2, [...agrupadas, { ...linea(100), clasificacion: 'herrajes_otros' }])], [tablero]);
  assert.equal(resultado.unidadesTotales, 10);
  assert.ok(Math.abs(resultado.pesoTotalKg - 105.57) < 1e-9);
});

test('capacidad no positiva conserva el peso y advierte', () => {
  for (const capacidadKg of [0, -1]) {
    const resultado = calcularContenedores([area(1, [linea()])], [tablero], { capacidadKg });
    assert.ok(resultado.pesoTotalKg > 0);
    assert.equal(resultado.contenedores, 0);
    assert.equal(resultado.ocupacionPct, 0);
    assert.match(resultado.advertencias[0], /Capacidad/);
  }
});

test('ignora áreas de madera no finitas o no positivas y respeta densidad por tablero', () => {
  const maderaPorRol = [10000, 0, -1, NaN, Infinity].map(cm2 => ({ rol: 'caja', codigo: 'T', cm2 }));
  const resultado = calcularContenedores([area(1, [{ cantidad: 1, breakdown: { maderaPorRol } }])],
    [{ ...tablero, densidad_kg_m3: 600 }], { factorPeso: 1 });
  assert.equal(resultado.pesoTotalKg, 9);
});

test('panel sin peso promedio y PDF bilingüe con solo la cantidad de contenedores', () => {
  const areas: AreaEntrega[] = [{ id: 'a', ...area(20, []), lineas: [{ id: '1', cantidad: 2 }, { id: '2', cantidad: 3 }] }];
  const config = normalizarEntrega({ modo: 'total' });
  const panel = renderToStaticMarkup(createElement(EntregaPanel, {
    config, areas, resultados: resumirEntrega(config, areas, [tablero]), onChange() {}, async onSave() { return { ok: true }; },
  }));
  assert.match(panel, /Unidades del proyecto \(derivadas\)/);
  assert.match(panel, /Línea sin despiece/);
  assert.doesNotMatch(panel, /Peso promedio por unidad/);
  const espanol = renderToStaticMarkup(createElement(EntregaPdf, { contenedores: 1, idioma: 'es' }));
  assert.match(espanol, /Contenedores<\/dt><dd[^>]*>1<\/dd>/);
  assert.doesNotMatch(espanol, /Peso|Unidades|Ocupación| kg/);
  const ingles = renderToStaticMarkup(createElement(EntregaPdf, { contenedores: 0, idioma: 'en' }));
  assert.match(ingles, /Containers<\/dt><dd[^>]*>0<\/dd>/);
  assert.doesNotMatch(ingles, /weight|Project units|Occupancy| kg/);
});

test('parciales distribuyen áreas sin duplicarlas y su porcentaje se basa en unidades repetidas', () => {
  const config = normalizarEntrega({ modo: 'parcial', parciales: [
    { contenedor: '20T', areas: ['cocina'] }, { contenedor: '40T', areas: ['cocina', 'baño'] },
  ] });
  const areas: AreaEntrega[] = [
    { id: 'cocina', nombre: 'Cocina', cantidad: 20, lineas: [{ ...linea(2), id: '1' }] },
    { id: 'baño', nombre: 'Baño', cantidad: 20, lineas: [{ ...linea(6), id: '2' }] },
  ];
  const capacidadesPrueba = { '20T': 250, '40T': 800 };
  const resultados = resumirEntrega(config, areas, [tablero], capacidadesPrueba);
  assert.deepEqual(resultados.map(r => r.unidades), [40, 120]);
  assert.deepEqual(resultados.map(r => r.porcentaje), [25, 75]);
  assert.deepEqual(resultados.map(r => r.contenedores), [2, 2]);
  const total = resumirEntrega(normalizarEntrega({ modo: 'total', contenedor: '40T' }), areas, [tablero], capacidadesPrueba);
  assert.equal(total[0].unidades, 160);
  assert.equal(total[0].contenedores, 3);
});

test('FOB no recarga, CIF convierte una vez y DDP usa venta de componentes', () => {
  const ddp = { tableroPct: 10, herrajesPct: 20 };
  const areas = [{ nombre: 'Cocina', cantidad: 3, lineas: [{
    id: '1', cantidad: 2, breakdown: {
      costoMadera: 50, costoSinHerrajes: 100, precioCop: 200, precioUsd: 0.05,
      precioHerrajesCop: 50, precioHerrajesUsd: 0.0125,
    },
  }] }];
  assert.deepEqual(calcularRecargoEntrega(normalizarEntrega({ incoterm: 'FOB' }), ddp, areas, 4000), { cop: 0, usd: 0 });
  assert.deepEqual(calcularRecargoEntrega(normalizarEntrega({ incoterm: 'CIF', cif: { importe: 20, moneda: 'USD' } }), ddp, areas, 4000), { cop: 80000, usd: 20 });
  assert.deepEqual(calcularRecargoEntrega(normalizarEntrega({ incoterm: 'CIF', cif: { importe: 80000, moneda: 'COP' } }), ddp, areas, 4000), { cop: 80000, usd: 20 });
  const recargo = calcularRecargoEntrega(normalizarEntrega({ incoterm: 'DDP' }), ddp, areas, 4000);
  assert.equal(recargo.cop, 120);
  assert.ok(Math.abs(recargo.usd - 0.03) < 1e-9);

  const soloTransporte = normalizarEntrega({ incoterm: 'DDP', ddp: {
    aplicarTarifas: false, transporte: { importe: 80_000, moneda: 'COP' },
  } });
  assert.deepEqual(calcularRecargoEntrega(soloTransporte, ddp, areas, 4000), { cop: 80_000, usd: 20 });
  const ambos = normalizarEntrega({ incoterm: 'DDP', ddp: {
    aplicarTarifas: true, transporte: { importe: 20, moneda: 'USD' },
  } });
  const combinado = calcularRecargoEntrega(ambos, ddp, areas, 4000);
  assert.equal(combinado.cop, 80_120);
  assert.ok(Math.abs(combinado.usd - 20.03) < 1e-9);
  assert.deepEqual(calcularRecargoEntrega({ ...ambos, incoterm: 'FOB' }, ddp, areas, 4000), { cop: 0, usd: 0 });
});

test('la carga útil confirmada cambia el número de contenedores para el mismo peso', () => {
  const cocina: AreaEntrega = {
    id: 'cocina', nombre: 'Cocina', cantidad: 1700, lineas: [{ ...linea(), id: '1' }],
  };
  const total = resumirEntrega(normalizarEntrega({ modo: 'total', contenedor: '20T' }), [cocina], [tablero]);
  const parcial = resumirEntrega(normalizarEntrega({ modo: 'parcial', parciales: [
    { contenedor: '40T', areas: ['cocina'] },
  ] }), [cocina], [tablero]);
  assert.equal(total[0].capacidadKg, 15_000);
  assert.equal(parcial[0].capacidadKg, 22_000);
  assert.equal(total[0].pesoKg, parcial[0].pesoKg);
  assert.equal(total[0].contenedores, 2);
  assert.equal(parcial[0].contenedores, 1);
});

test('un área única permite repartir módulos por línea y conserva repeticiones y selecciones anteriores', () => {
  const areas: AreaEntrega[] = [{
    id: 'closet', nombre: 'Clóset principal', cantidad: 20,
    lineas: [
      { ...linea(2), id: 'a', codigo_modulo: 'CLO-01' },
      { ...linea(3), id: 'b', codigo_modulo: 'CLO-02' },
      { ...linea(50), id: 'extra', codigo_modulo: 'EXTRA', config: { clasificacionPdf: 'herrajes_otros' } },
    ],
  }];
  const config = normalizarEntrega({ modo: 'parcial', parciales: [
    { contenedor: '20T', modulos: ['a', 'extra'] },
    { contenedor: '40T', modulos: ['a', 'b', 'eliminado'] },
  ] });
  const resultados = resumirEntrega(config, areas, [tablero]);
  assert.deepEqual(resultados.map(r => r.unidades), [40, 60]);
  assert.deepEqual(resultados.map(r => r.porcentaje), [40, 60]);
  assert.deepEqual(resultados.map(r => r.pesoKg.toFixed(2)), ['422.28', '633.42']);

  const html = renderToStaticMarkup(createElement(EntregaPanel, {
    config, areas, resultados, onChange() {}, async onSave() { return { ok: true }; },
  }));
  assert.match(html, /aria-label="Ver módulos de entrega parcial 1"/);
  assert.match(html, /Contenido de entrega parcial 1/);
  assert.match(html, /<option value="2" selected="">2<\/option>/);
  assert.doesNotMatch(html, /CLO-01|EXTRA|Áreas de la cotización/);

  const anterior = normalizarEntrega({ modo: 'parcial', parciales: [
    { contenedor: '20T', areas: ['closet'] }, { contenedor: '40T', modulos: ['b'] },
  ] });
  assert.deepEqual(resumirEntrega(anterior, areas, [tablero]).map(r => r.unidades), [100, 0]);
});

test('PDF parcial imprime total y tamaño por lote en español e inglés', () => {
  const parciales = [{ contenedores: 2, tamano: '20T' }, { contenedores: 1, tamano: '40T' }] as const;
  for (const idioma of ['es', 'en'] as const) {
    const html = renderToStaticMarkup(createElement(EntregaPdf, { contenedores: 3, parciales: [...parciales], idioma }));
    assert.match(html, /(?:Contenedores|Containers)<\/dt><dd[^>]*>3<\/dd>/);
    assert.match(html, /(?:Entrega parcial|Partial delivery) 1<\/dt><dd[^>]*>2 · 20 (?:pies|ft)<\/dd>/);
    assert.match(html, /(?:Entrega parcial|Partial delivery) 2<\/dt><dd[^>]*>1 · 40 (?:pies|ft)<\/dd>/);
    assert.doesNotMatch(html, /Peso|weight|kg|Ocupación|Occupancy/);
  }
});
