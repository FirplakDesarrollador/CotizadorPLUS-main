import assert from 'node:assert/strict';
import test from 'node:test';
import {
  anchoCodigo,
  codigoGrupo,
  codigoModulo,
  convertirExacto,
  distribuirResiduoMoneda,
  indiceALetras,
  letrasAIndice,
  normalizarEtiquetaGrupo,
  parseMedida,
  redondearMoneda,
  sufijoSistemaFrente,
  codigoComercial,
  incluyeAltoEnCodigo,
} from '@/lib/module-groups';
import { DB_SM_TIPOLOGIAS, DB_SM_FE_TIPOLOGIAS, esMuebleSuperior, esTipologiaDbSm, esTipologiaDbSmFe, familiaMaterialPorPrefijo, nombrePieza, ordenarPiezasDespiece, orientarPieza, permiteTipologiaDb, usaPuertaParametrica } from '@/lib/muebles';

test('clasifica materiales por la primera B o W del prefijo', () => {
  assert.equal(familiaMaterialPorPrefijo('BBLFD'), 'inferior');
  assert.equal(familiaMaterialPorPrefijo('W'), 'superior');
  assert.equal(familiaMaterialPorPrefijo('WBL'), 'superior');
  assert.equal(familiaMaterialPorPrefijo('TW'), 'superior');
  assert.equal(familiaMaterialPorPrefijo('TW-SM-PUSH'), 'superior');
  assert.equal(esMuebleSuperior('TW-SM-PUSH'), true);
  assert.equal(esMuebleSuperior('WBL-D-L/R-SM'), true);
  assert.equal(usaPuertaParametrica('WBL-D-L/R-SM'), true);
  assert.equal(usaPuertaParametrica('BBLFD-D-L/R-SM'), true);
  assert.equal(familiaMaterialPorPrefijo('B-W'), 'inferior');
  assert.equal(familiaMaterialPorPrefijo('PN'), 'inferior');
});

test('ordena el despiece agrupado por piezas unificadas y luego por módulo', () => {
  const piezas = ordenarPiezasDespiece([
    { pieza: 'frente', origen: 'A2 BFD15-SM' },
    { pieza: 'base_gaveta', origen: 'A1 DB30-2S-SM' },
    { pieza: 'refuerzo_trasero', origen: 'Grupo A (A1 + A2)', compartida: true },
    { pieza: 'gola_madera', origen: 'A1 DB30-2S-SM' },
    { pieza: 'base', origen: 'Grupo A (A1 + A2)', compartida: true },
  ]);
  assert.deepEqual(piezas.map((p) => p.pieza), [
    'base', 'refuerzo_trasero', 'base_gaveta', 'gola_madera', 'frente',
  ]);
});

test('convierte índices de grupo en letras de Excel y permite el camino inverso', () => {
  const cases = new Map([
    [0, 'A'], [25, 'Z'], [26, 'AA'], [51, 'AZ'], [52, 'BA'], [701, 'ZZ'], [702, 'AAA'],
  ]);
  for (const [index, letters] of cases) {
    assert.equal(indiceALetras(index), letters);
    assert.equal(letrasAIndice(letters), index);
  }
});

test('cierra el residuo monetario en la última línea del grupo', () => {
  const distributed = distribuirResiduoMoneda([10.005, 10.005, 10.005]);
  assert.deepEqual(distributed, [10.01, 10.01, 10]);
  assert.equal(redondearMoneda(distributed.reduce((sum, value) => sum + value, 0)), 30.02);
  assert.deepEqual(distribuirResiduoMoneda([123.456]), [123.46]);
});

test('normaliza etiquetas editables y rechaza posiciones inválidas', () => {
  assert.deepEqual(normalizarEtiquetaGrupo(' a2 '), { letra: 'A', posicion: 2 });
  assert.deepEqual(normalizarEtiquetaGrupo('aa'), { letra: 'AA', posicion: null });
  assert.throws(() => normalizarEtiquetaGrupo('A0'), /Usa una letra/);
  assert.throws(() => normalizarEtiquetaGrupo('2A'), /Usa una letra/);
  assert.throws(() => normalizarEtiquetaGrupo('A-2'), /Usa una letra/);
});

test('convierte dimensiones y construye códigos sin redondear a anchos de catálogo', () => {
  assert.equal(convertirExacto(12, 'in', 'cm'), 30.48);
  assert.equal(convertirExacto(30.48, 'cm', 'in'), 12);
  assert.equal(anchoCodigo(12, 'in', 'imperial'), '12');
  assert.equal(anchoCodigo(12.75, 'in', 'imperial'), '12 3/4');
  assert.equal(anchoCodigo(12.875, 'in', 'imperial'), '12 7/8');
  assert.equal(anchoCodigo(0.5, 'in', 'imperial'), '1/2');
  assert.equal(anchoCodigo(Number.NaN, 'in', 'imperial'), '');
  assert.equal(anchoCodigo(Number.POSITIVE_INFINITY, 'in', 'imperial'), '');
  assert.equal(anchoCodigo(30.48, 'cm', 'metrico'), '30.48');
  assert.equal(codigoModulo('B', 12, 'in', 'imperial'), 'B12');
  assert.equal(codigoModulo('IP', 50, 'cm', 'metrico'), 'IP50');
  assert.equal(codigoGrupo(['B12', 'DB10', 'BFD20']), 'B12.DB10.BFD20');
});

test('en prefijos con sufijo (FE) la medida va después de la letra base, no al final', () => {
  assert.equal(codigoModulo('B-FE', 12, 'in', 'imperial'), 'B12-FE');
  assert.equal(codigoModulo('UB-FE', 12, 'in', 'imperial'), 'UB12-FE');
  assert.equal(codigoModulo('V-FE', 30, 'in', 'imperial'), 'V30-FE');
  assert.equal(codigoModulo('BLS-RS-SM', 36, 'in', 'imperial'), 'BLS36-RS-SM');
  assert.equal(codigoModulo('B-FE', 30.48, 'cm', 'metrico'), 'B30.48-FE');
  // Los prefijos sin guion conservan la medida al final: cotizaciones.ts les
  // concatena después el alto (W/PN) o la tipología (DB).
  assert.equal(codigoModulo('SBFD', 30, 'in', 'imperial'), 'SBFD30');
  assert.equal(codigoModulo('W', 36, 'in', 'imperial') + anchoCodigo(14, 'in', 'imperial'), 'W3614');
  assert.equal(codigoModulo('DB', 18, 'in', 'imperial') + '-1S', 'DB18-1S');
});

test('sistema de frente gola agrega sufijo comercial SM', () => {
  assert.equal(sufijoSistemaFrente('manija'), '');
  assert.equal(sufijoSistemaFrente('gola'), '-SM');
  assert.equal(codigoModulo('W', 29, 'in', 'imperial') + anchoCodigo(36, 'in', 'imperial') + sufijoSistemaFrente('gola'), 'W2936-SM');
});

test('los superiores W, paneles PN, fillers F y zocalos TK llevan el alto en el código', () => {
  for (const pref of ['W', 'UW', 'OW', 'WBL', 'WER', 'WLD', 'WPC', 'WSM', 'PN', 'F', 'TK']) {
    assert.equal(incluyeAltoEnCodigo(pref), true, pref);
  }
  // WCC es un módulo de clóset, no un superior de pared; B/DB/SBFD tienen alto implícito.
  for (const pref of ['WCC', 'B', 'DB', 'SBFD', 'S']) {
    assert.equal(incluyeAltoEnCodigo(pref), false, pref);
  }
});

test('codigoComercial arma el código final completo', () => {
  const base = { unidad: 'in', sistema: 'imperial' } as const;
  // El caso del reporte: superior de pared con gola.
  assert.equal(codigoComercial({ ...base, pref: 'W', largo: 29, alto: 36, sistemaFrente: 'gola' }), 'W2936-SM');
  assert.equal(codigoComercial({ ...base, pref: 'W', largo: 29, alto: 36, sistemaFrente: 'manija' }), 'W2936');
  assert.equal(codigoComercial({ ...base, pref: 'W', largo: 30, alto: 20, prof: 24 }), 'W302024');
  assert.equal(codigoComercial({ ...base, pref: 'W', largo: 30, alto: 20, prof: 12 }), 'W3020');
  assert.equal(codigoComercial({ ...base, pref: 'BFD-SM', largo: 16, alto: 30 }), 'BFD16-SM');
  assert.equal(codigoComercial({ ...base, pref: 'BMW-1', largo: 36, alto: 30, prof: 24 }), 'BMW36-1');
  assert.equal(codigoComercial({ ...base, pref: 'BMW-1-FE', largo: 36, alto: 30, prof: 24 }), 'BMW36-1-FE');
  assert.equal(codigoComercial({ ...base, pref: 'SBFD-SM', largo: 16, alto: 30 }), 'SBFD16-SM');
  assert.equal(codigoComercial({ ...base, pref: 'SB-SM', largo: 30, alto: 30 }), 'SB30-SM');
  assert.equal(codigoComercial({ ...base, pref: 'OW-MO', largo: 24, alto: 25, prof: 12 }), 'OW2425-MO');
  assert.equal(codigoComercial({ ...base, pref: 'W-SM', largo: 34, alto: 36, prof: 12 }), 'W3436-SM');
  assert.equal(codigoComercial({ ...base, pref: 'W-SM-LOC', largo: 34, alto: 36, prof: 12 }), 'W3436-SM-LOC');
  assert.equal(codigoComercial({ ...base, pref: 'W-SM-PUSH', largo: 33, alto: 21, prof: 24 }), 'W332124-SM-PUSH');
  assert.equal(codigoComercial({ ...base, pref: 'TW-SM-PUSH', largo: 30, alto: 24, prof: 12 }), 'TW302412-SM-PUSH');
  assert.equal(codigoComercial({ ...base, pref: 'TW-SM-PUSH', largo: 30, alto: 18, prof: 15 }), 'TW301815-SM-PUSH');
  assert.equal(codigoComercial({ ...base, pref: 'TW', largo: 30, alto: 24, prof: 12 }), 'TW302412');
  assert.equal(codigoComercial({ ...base, pref: 'BBLFD', largo: 42, alto: 30, prof: 24, door: 17.875, doorHand: 'R' }), 'BBLFD42-D17 7/8R');
  assert.equal(codigoComercial({ ...base, pref: 'BBLFD', largo: 42, alto: 30, prof: 24, door: 17.875, doorHand: 'L' }), 'BBLFD42-D17 7/8L');
  assert.equal(codigoComercial({ ...base, pref: 'BBLFD', largo: 42, alto: 30, prof: 24, door: Number.NaN, doorHand: 'R' }), 'BBLFD42');
  assert.equal(codigoComercial({ ...base, pref: 'WBL-D-L/R-SM', largo: 38, alto: 40, prof: 12, door: 22.875, doorHand: 'L' }), 'WBL3840-D22 7/8L-SM');
  assert.equal(codigoComercial({ ...base, pref: 'WBL-D-L/R-SM', largo: 38, alto: 40, prof: 12, door: 22.875, doorHand: 'R' }), 'WBL3840-D22 7/8R-SM');
  assert.equal(codigoComercial({ ...base, pref: 'BBLFD-D-L/R-SM', largo: 42, alto: 30, prof: 24, door: 17.875, doorHand: 'L' }), 'BBLFD42-D17 7/8L-SM');
  assert.equal(codigoComercial({ ...base, pref: 'BBLFD-D-L/R-SM', largo: 42, alto: 30, prof: 24, door: 17.875, doorHand: 'R' }), 'BBLFD42-D17 7/8R-SM');
  assert.equal(codigoComercial({ ...base, pref: 'WSM', largo: 9, alto: 36, prof: 14 }), 'WSM93614');
  assert.equal(codigoComercial({ ...base, pref: 'WER', largo: 24, alto: 36, sistemaFrente: 'gola' }), 'WER2436-SM');
  assert.equal(codigoComercial({ ...base, pref: 'UW', largo: 12, alto: 36 }), 'UW1236');
  assert.equal(codigoComercial({ ...base, pref: 'OW', largo: 30, alto: 18 }), 'OW3018');
  // Sin alto en el código: el alto no entra aunque venga en el input.
  assert.equal(codigoComercial({ ...base, pref: 'B', largo: 12, alto: 34.5, sistemaFrente: 'gola' }), 'B12-SM');
  // DB tradicional nunca adopta SM: las cajoneras con Gola son tipos separados.
  assert.equal(codigoComercial({ ...base, pref: 'DB', largo: 18, alto: 34.5, dbTipo: 'DB-1S', sistemaFrente: 'gola' }), 'DB18-1S');
  for (const dbTipo of ['DB-1S', 'DB-2S', 'DB-2', 'DB-3', 'DB-4', 'DB2-1OP']) {
    assert.equal(codigoComercial({ ...base, pref: 'DB', largo: 30, alto: 30, dbTipo, sistemaFrente: 'gola' }).includes('-SM'), false, dbTipo);
  }
  assert.equal(codigoComercial({ ...base, pref: 'DB-2S-SM', largo: 26, alto: 30 }), 'DB26-2S-SM');
  assert.equal(codigoComercial({ ...base, pref: 'DB-2S-SM-FE', largo: 12, alto: 30 }), 'DB12-2S-SM-FE');
  assert.equal(codigoComercial({ ...base, pref: 'DB-2-SM', largo: 26, alto: 30 }), 'DB26-2-SM');
  assert.equal(codigoComercial({ ...base, pref: 'DB-3-SM', largo: 26, alto: 30 }), 'DB26-3-SM');
  assert.equal(codigoComercial({ ...base, pref: 'UDB', largo: 18, alto: 28.75, dbTipo: 'DB-2S' }), 'UDB18-2S');
  assert.equal(codigoComercial({ ...base, pref: 'UDV', largo: 24, alto: 28.75, dbTipo: 'DB-3' }), 'UDV24-3');
  assert.equal(codigoComercial({ ...base, pref: 'B-FE', largo: 12, alto: 34.5, sistemaFrente: 'gola' }), 'B12-FE-SM');
  assert.equal(codigoComercial({ ...base, pref: 'F', largo: 6, alto: 30, sistemaFrente: 'manija' }), 'F630');
  assert.equal(codigoComercial({ ...base, pref: 'PN', largo: 12.875, alto: 36 }), 'PN12 7/836');
  assert.equal(codigoComercial({ ...base, pref: 'PN', largo: 12.875, alto: 36.75 }), 'PN12 7/836 3/4');
  assert.equal(codigoComercial({ ...base, pref: 'TK', largo: 4.25, alto: 36.5 }), 'TK4 1/436 1/2');
  // PCFD con gavetas ocultas.
  assert.equal(codigoComercial({ ...base, pref: 'PCFD', largo: 12, alto: 96, pcfdCajones: 2 }), 'PCFD12-2OP-PUSH');
  // Sistema métrico.
  assert.equal(codigoComercial({ pref: 'W', largo: 73.66, alto: 91.44, unidad: 'cm', sistema: 'metrico', sistemaFrente: 'gola' }), 'W73.6691.44-SM');
});

test('codigoComercial agrega 18MM solo cuando caja y frente son de 18mm', () => {
  const base = { pref: 'WSM', largo: 25, alto: 15, prof: 14, unidad: 'in', sistema: 'imperial' } as const;
  assert.equal(codigoComercial({ ...base, espesorCajaMm: 18, espesorFrenteMm: 18 }), 'WSM251514-18MM');
  assert.equal(codigoComercial({ ...base, espesorCajaMm: 15, espesorFrenteMm: 18 }), 'WSM251514');
  assert.equal(codigoComercial({ ...base, espesorCajaMm: 18, espesorFrenteMm: 15 }), 'WSM251514');
  assert.equal(codigoComercial({ ...base, espesorCajaMm: null, espesorFrenteMm: 18 }), 'WSM251514');
  assert.equal(codigoComercial({
    ...base, pref: 'W-SM-PUSH', largo: 33, alto: 21, prof: 24,
    espesorCajaMm: 18, espesorFrenteMm: 18,
  }), 'W332124-SM18-PUSH');
  assert.equal(codigoComercial({
    ...base, pref: 'W', largo: 26, alto: 36, prof: 12, sistemaFrente: 'gola',
    espesorCajaMm: 18, espesorFrenteMm: 18,
  }), 'W2636-SM18');
  assert.equal(codigoComercial({
    ...base, pref: 'WLD', largo: 30, alto: 30, prof: 12, sistemaFrente: 'gola',
    espesorCajaMm: 18, espesorFrenteMm: 18,
  }), 'WLD3030-SM18');
  assert.equal(codigoComercial({
    ...base, pref: 'TW-SM-PUSH', largo: 30, alto: 24, prof: 12,
    espesorCajaMm: 18, espesorFrenteMm: 18,
  }), 'TW302412-SM18-PUSH');
  assert.equal(codigoComercial({
    ...base, pref: 'TW', largo: 30, alto: 24, prof: 12, sistemaFrente: 'gola',
    espesorCajaMm: 18, espesorFrenteMm: 18,
  }), 'TW302412-SM18');
});

test('codigoComercial agrega 15MM con las mismas reglas de integración SM', () => {
  const base = { pref: 'WSM', largo: 25, alto: 15, prof: 14, unidad: 'in', sistema: 'imperial' } as const;
  assert.equal(codigoComercial({ ...base, espesorCajaMm: 15, espesorFrenteMm: 15 }), 'WSM251514-15MM');
  assert.equal(codigoComercial({ ...base, pref: 'B', largo: 30, alto: 34.5, espesorCajaMm: 15, espesorFrenteMm: 15 }), 'B30-15MM');
  assert.equal(codigoComercial({
    ...base, pref: 'W-SM-PUSH', largo: 33, alto: 21, prof: 24,
    espesorCajaMm: 15, espesorFrenteMm: 15,
  }), 'W332124-SM15-PUSH');
  assert.equal(codigoComercial({
    ...base, pref: 'TW-SM-PUSH', largo: 30, alto: 24, prof: 12,
    espesorCajaMm: 15, espesorFrenteMm: 15,
  }), 'TW302412-SM15-PUSH');
  assert.equal(codigoComercial({
    ...base, pref: 'WBL-D-L/R-SM', largo: 38, alto: 40, prof: 12, door: 22.875, doorHand: 'L',
    espesorCajaMm: 15, espesorFrenteMm: 15,
  }), 'WBL3840-D22 7/8L-SM15');
  assert.equal(codigoComercial({ ...base, espesorCajaMm: 15, espesorFrenteMm: 18 }), 'WSM251514');
});

test('interpreta medidas en fracción imperial sin corromperse a NaN/0', () => {
  assert.equal(parseMedida('24 7/8'), 24.875);
  assert.equal(parseMedida('24-7/8'), 24.875);
  assert.equal(parseMedida('7/8'), 0.875);
  assert.equal(parseMedida('24.875'), 24.875);
  assert.equal(parseMedida('24'), 24);
  assert.equal(parseMedida('  30  '), 30);
  assert.equal(parseMedida('24 7/8"'), 24.875);
  assert.ok(Number.isNaN(parseMedida('')));
  assert.ok(Number.isNaN(parseMedida('abc')));
});

test('habilita tipologia DB solo en las familias de cajoneras compatibles', () => {
  for (const pref of ['DB', 'UDB', 'UDV', 'udb']) assert.equal(permiteTipologiaDb(pref), true, pref);
  for (const pref of ['B', 'DV', 'DBL', 'PCFD', '', null]) assert.equal(permiteTipologiaDb(pref), false, String(pref));
});

test('agrupa solo las tres tipologias DB-SM sin ampliar la familia DB existente', () => {
  assert.deepEqual(DB_SM_TIPOLOGIAS.map((tipologia) => tipologia.pref), ['DB-2S-SM', 'DB-2-SM', 'DB-3-SM']);
  for (const pref of ['DB-2S-SM', 'DB-2-SM', 'DB-3-SM', 'db-3-sm']) assert.equal(esTipologiaDbSm(pref), true, pref);
  for (const pref of ['DB', 'UDB', 'UDV', 'DB-2S', '', null]) assert.equal(esTipologiaDbSm(pref), false, String(pref));
  assert.equal(permiteTipologiaDb('DB-2S-SM'), false);
});

test('agrupa las tres tipologias DB-SM-FE como familia independiente', () => {
  assert.deepEqual(DB_SM_FE_TIPOLOGIAS.map((tipologia) => tipologia.pref), ['DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE']);
  for (const pref of ['DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE', 'db-3-sm-fe']) assert.equal(esTipologiaDbSmFe(pref), true, pref);
  for (const pref of ['DB', 'DB-2S-SM', 'B-FE', '', null]) assert.equal(esTipologiaDbSmFe(pref), false, String(pref));
});

test('ordena el despiece de produccion y normaliza el shelf mal escrito', () => {
  const piezas = ['fondo', 'shlef', 'refuerzo_trasero', 'lateral', 'frente', 'tapa', 'base', 'refuerzo_delantero_removible']
    .map((pieza) => ({ pieza }));
  assert.deepEqual(
    ordenarPiezasDespiece(piezas).map((p) => p.pieza),
    ['base', 'tapa', 'lateral', 'refuerzo_delantero_removible', 'refuerzo_trasero', 'shlef', 'frente', 'fondo'],
  );
  assert.equal(nombrePieza('shlef', false), 'entrepano');
  assert.equal(nombrePieza('shelf', false), 'entrepano');
});

test('presenta los frentes de gaveta como alto por ancho una sola vez', () => {
  // DB26-2S-SM: el motor conserva ancho del módulo × alto del frente y la
  // tabla es la única que lo orienta para reproducir la hoja de ruta.
  assert.deepEqual(
    orientarPieza({ rol: 'frente', largoIn: 657.2 / 25.4, anchoIn: 173.9 / 25.4 }),
    { largoIn: 173.9 / 25.4, anchoIn: 657.2 / 25.4 },
  );
});
