import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularConsumos, normalizarDesperdicio, parseCantidad } from '../src/app/hdr/consumos';
import { construirFilas, type ResultadoHdr } from '../src/app/hdr/datosHdr';
import type { ModuloHDR } from '../src/app/hdr/actions';
import { calcularMueble } from '../src/lib/engine';
import ExcelJS from 'exceljs';
import { crearWorkbookConsumos, nombreExcelConsumos, fechaConsumos } from '../src/app/hdr/consumosExcel';

// La sección Consumos de la página HDR tiene que dar el MISMO número que ven las
// tablas HDR y el Simulador: tablero en m² (neto + el % que se ingresa), canto en
// metro lineal (con su merma de 5 cm por arista) y consumibles en unidades,
// SIEMPRE discriminados — por ROL + código de tablero, por calibre de canto y por
// tipo de consumible, nunca en una cifra única.
//
// Cada prueba reconcilia el resultado por dos caminos independientes: el desglose del
// motor (`maderaPorRol`/`cantoPorCalibre`/`cantidadesConsumibles`) y las filas que
// renderiza `construirFilas`. La última prueba replica la tabla «Materiales» del
// Simulador fila por fila, que es la referencia que usa producción.

const TABLEROS = [
  { codigo: 'C18', espesor_mm: 18 },
  { codigo: 'F18', espesor_mm: 18 },
  { codigo: 'FON6', espesor_mm: 6 },
];

const resultado = (desperdicio = 0.15): ResultadoHdr => ({
  ...calcularMueble({
    dims: { L: 24, A: 30, P: 24 },
    piezas: [
      { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 } },
      { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 1, anchos: 0 } },
      { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
      { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} },
    ],
    reglas: [],
    preset: { caja: 'C18', frente: 'F18', fondo: 'FON6' },
    tablerosByCode: {
      C18: { codigo: 'C18', precio_m2: 42000, espesor_mm: 18 },
      F18: { codigo: 'F18', precio_m2: 51000, espesor_mm: 18 },
      FON6: { codigo: 'FON6', precio_m2: 31000, espesor_mm: 6 },
    },
    cantosByCalibre: {
      '19X0,45': { calibre: '19x0,45', precio: 400 },
      '22X0,45': { calibre: '22x0,45', precio: 400 },
      '22X1': { calibre: '22x1', precio: 980 },
    },
    herrajesByCode: {},
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    margen: 0,
    trm: 4000,
    desperdicio,
  }),
  trm: 4000,
  margen: 0,
});

/**
 * Réplica del módulo real de la imagen (W96.27867-SM-PUSH): caja y refuerzo
 * comparten el MISMO tablero, que es justo el caso en que agrupar por código hacía
 * que Consumos no cuadrase con el Simulador.
 */
const resultadoCompartido = (desperdicio = 0.15): ResultadoHdr => ({
  ...calcularMueble({
    dims: { L: 96.2, A: 78, P: 67 },
    piezas: [
      { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 }, tarugos: 4 },
      { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 1, anchos: 0 }, tarugos: 8 },
      { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 1, anchos: 0 }, soportes: 4 },
      { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '2', formula_largo: 'L', formula_ancho: 'A', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
      { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} },
    ],
    reglas: [],
    preset: { caja: 'PRIRH15CONSTRUCTOR', refuerzo: 'PRIRH15CONSTRUCTOR', frente: 'PRICARB18CANDELARIA', fondo: 'PRIRH6CONSTRUCTOR' },
    tablerosByCode: {
      PRIRH15CONSTRUCTOR: { codigo: 'PRIRH15CONSTRUCTOR', precio_m2: 45000, espesor_mm: 15 },
      PRICARB18CANDELARIA: { codigo: 'PRICARB18CANDELARIA', precio_m2: 44652, espesor_mm: 18 },
      PRIRH6CONSTRUCTOR: { codigo: 'PRIRH6CONSTRUCTOR', precio_m2: 31000, espesor_mm: 6 },
    },
    cantosByCalibre: {
      '19X0,45': { calibre: '19x0,45', precio: 400 },
      '22X1': { calibre: '22x1', precio: 980 },
    },
    herrajesByCode: {},
    consumiblesBySelector: {},
    etiquetasUnd: 4,
    margen: 0.6,
    trm: 3200,
    desperdicio,
  }),
  trm: 3200,
  margen: 0.6,
});

function modulo(sobrescribir: Partial<ModuloHDR> = {}): ModuloHDR {
  return {
    lineaId: 'l1',
    codigoModulo: 'SBFD30',
    nombreDescriptivo: '2 PUERTAS',
    pref: 'SBFD',
    cocinaNombre: 'Cocina Norte',
    cantidad: 1,
    repeticionesArea: 1,
    grupoId: null,
    ok: true,
    result: resultado(),
    ...sobrescribir,
  } as ModuloHDR;
}

/** El despiece del fixture; falla pronto si el módulo de prueba queda sin resultado. */
function despieceDe(m: ModuloHDR): ResultadoHdr {
  if (!m.ok) throw new Error(`El módulo ${m.codigoModulo} no tiene despiece`);
  return m.result;
}

/** Desglose del motor agrupado igual que lo hace la sección: por rol + código y por calibre. */
function motorPorRol(res: ResultadoHdr): Map<string, number> {
  const map = new Map<string, number>();
  for (const x of res.maderaPorRol) {
    const clave = `${x.rol}\u0000${x.codigo}`;
    map.set(clave, (map.get(clave) ?? 0) + x.cm2);
  }
  return map;
}

test('el consumo se discrimina por cada rol, cada calibre de canto y cada consumible', () => {
  const m = modulo();
  const { filas } = calcularConsumos([m], 0);
  assert.equal(filas.length, 1);

  // Una entrada por ROL + código (la misma fila que dibuja el Simulador).
  assert.deepEqual(filas[0].materiales.map((x) => `${x.rol}:${x.codigo}`), ['caja:C18', 'frente:F18', 'fondo:FON6']);
  assert.deepEqual(filas[0].cantos.map((x) => x.calibre), ['22x0,45', '22x1']);
  // Nada de cifra única: los totales lumped desaparecieron del tipo.
  assert.equal('m2Tableros' in filas[0], false);
  assert.equal('metrosCanto' in filas[0], false);

  // Cada entrada cuadra con el desglose del motor para ese mismo rol + código.
  const esperado = motorPorRol(despieceDe(m));
  for (const mat of filas[0].materiales) {
    const clave = `${mat.rol}\u0000${mat.codigo}`;
    const cm2 = esperado.get(clave);
    assert.ok(cm2 !== undefined, `${mat.rol}/${mat.codigo} no aparece en maderaPorRol`);
    assert.ok(Math.abs(mat.m2Neto - cm2 / 10000) < 1e-6, `${mat.rol}/${mat.codigo}: ${mat.m2Neto} vs ${cm2 / 10000}`);
  }
  assert.equal(filas[0].materiales.length, esperado.size, 'ni partidas de más ni de menos');

  // Y cada calibre cuadra con el motor.
  const motorCantos = new Map(despieceDe(m).cantoPorCalibre.map((c) => [c.calibre, c.metros]));
  assert.equal(filas[0].cantos.length, motorCantos.size);
  for (const canto of filas[0].cantos) {
    assert.ok(Math.abs(canto.metros - (motorCantos.get(canto.calibre) ?? -1)) < 1e-9, canto.calibre);
  }
});

test('caja y refuerzo con el mismo tablero quedan en dos filas, como en el Simulador', () => {
  const m = modulo({ codigoModulo: 'W96.27867-SM-PUSH', result: resultadoCompartido() });
  const { filas } = calcularConsumos([m], 0);
  const f = filas[0];

  // El motor emite caja y refuerzo con el MISMO código: deben seguir siendo dos
  // partidas, porque así las lista la tabla Materiales del Simulador.
  const caja = f.materiales.filter((x) => x.rol === 'caja');
  const refuerzo = f.materiales.filter((x) => x.rol === 'refuerzo');
  assert.equal(caja.length, 1);
  assert.equal(refuerzo.length, 1);
  assert.equal(caja[0].codigo, refuerzo[0].codigo, 'comparten tablero');
  assert.ok(caja[0].m2Neto > 0 && refuerzo[0].m2Neto > 0);
  assert.ok(Math.abs(caja[0].m2Neto - refuerzo[0].m2Neto) > 1e-9, 'son partidas distintas, no la misma cifra');
  assert.equal(f.materiales.length, new Set(f.materiales.map((x) => `${x.rol}:${x.codigo}`)).size, 'sin duplicados de rol+código');
});

test('Consumos cuadra fila a fila con la tabla Materiales del Simulador', () => {
  const m = modulo({ codigoModulo: 'W96.27867-SM-PUSH', result: resultadoCompartido() });
  const res = despieceDe(m);
  const mermaProyecto = res.desperdicio * 100;

  // Con el % de la merma del proyecto, Consumos debe reproducir EXACTAMENTE la
  // columna «Cantidad» de la tabla Materiales del Simulador (m2 del motor).
  const { filas } = calcularConsumos([m], mermaProyecto);
  const f = filas[0];

  // 1) Tablero: misma cantidad de filas, mismo rol, mismo código, mismo m².
  assert.equal(f.materiales.length, res.maderaPorRol.length, 'una fila de Consumos por fila del Simulador');
  res.maderaPorRol.forEach((esperado, i) => {
    const visto = f.materiales[i];
    assert.equal(visto.rol, esperado.rol, `fila ${i}: rol`);
    assert.equal(visto.codigo, esperado.codigo, `fila ${i}: código`);
    assert.ok(Math.abs(visto.m2Tableros - esperado.m2) < 1e-6,
      `fila ${i} (${esperado.rol} ${esperado.codigo}): Consumos ${visto.m2Tableros} vs Simulador ${esperado.m2}`);
    // La medida neta, sin merma, es la que usa el Simulador en su título.
    assert.ok(Math.abs(visto.m2Neto * (1 + res.desperdicio) - esperado.m2) < 1e-6, `fila ${i}: neto × (1+merma) = m2`);
  });

  // 2) Canto: mismo calibre y mismos metros (la merma de 5 cm/arista ya está incluida).
  assert.equal(f.cantos.length, res.cantoPorCalibre.length);
  res.cantoPorCalibre.forEach((esperado, i) => {
    assert.equal(f.cantos[i].calibre, esperado.calibre, `canto ${i}: calibre`);
    assert.ok(Math.abs(f.cantos[i].metros - esperado.metros) < 1e-6,
      `canto ${i}: Consumos ${f.cantos[i].metros} vs Simulador ${esperado.metros}`);
  });

  // 3) Consumibles: mismos conteos en unidades (tarugos, soportes, cartón, etiquetas).
  const esperados = Object.entries(res.cantidadesConsumibles).filter(([, v]) => Number(v) > 0);
  assert.ok(esperados.length > 0, 'el fixture debe tener consumibles');
  assert.equal(f.consumibles.length, esperados.length);
  esperados.forEach(([clave, valor], i) => {
    assert.equal(f.consumibles[i].clave, clave, `consumible ${i}: clave`);
    assert.ok(Math.abs(f.consumibles[i].valor - Number(valor)) < 1e-9,
      `consumible ${clave}: Consumos ${f.consumibles[i].valor} vs Simulador ${valor}`);
  });

  // 4) Con 0% (el valor por defecto) se ve la medida NETA, sin la merma del proyecto.
  const neto = calcularConsumos([m], 0).filas[0];
  res.maderaPorRol.forEach((esperado, i) => {
    assert.ok(Math.abs(neto.materiales[i].m2Tableros - esperado.cm2 / 10000) < 1e-6, `neto fila ${i}`);
    assert.ok(neto.materiales[i].m2Tableros < esperado.m2, 'sin el % el consumo es el neto, no el del proyecto');
  });
});

test('la suma de los materiales se reconstruye desde las filas que dibuja la HDR', () => {
  const m = modulo();
  const { filas } = calcularConsumos([m], 0);

  // Camino independiente: largo × ancho de cada pieza de la tabla HDR.
  const filasHdr = construirFilas(despieceDe(m), TABLEROS);
  const m2DesdeFilas = filasHdr.reduce((s, f) => s + (f.largoMm * f.anchoMm) / 1e6, 0);
  const m2DesdeMateriales = filas[0].materiales.reduce((s, x) => s + x.m2Neto, 0);
  assert.ok(Math.abs(m2DesdeMateriales - m2DesdeFilas) < 0.01,
    `materiales ${m2DesdeMateriales} m² vs despiece ${m2DesdeFilas} m²`);

  // El conteo de piezas es el de las filas visibles en la HDR.
  assert.equal(filas[0].piezas, filasHdr.length);
});

test('el desperdicio indicado se aplica solo al tablero y nunca al canto', () => {
  const m = modulo();
  const sin = calcularConsumos([m], 0).filas[0];
  const con = calcularConsumos([m], 25).filas[0];

  assert.equal(con.materiales.length, sin.materiales.length);
  for (let i = 0; i < con.materiales.length; i++) {
    assert.ok(Math.abs(con.materiales[i].m2Tableros - sin.materiales[i].m2Neto * 1.25) < 1e-9,
      `${con.materiales[i].codigo}: 25% sobre el neto`);
    assert.equal(con.materiales[i].m2Neto, sin.materiales[i].m2Neto, 'la medida neta no cambia con el %');
  }

  // El canto y los consumibles quedan idénticos byte a byte: no reciben el porcentaje.
  assert.deepEqual(con.cantos, sin.cantos, 'el canto no recibe el porcentaje');
  assert.deepEqual(con.consumibles, sin.consumibles, 'los consumibles no reciben el porcentaje');

  // Con 0% el consumo facturable es exactamente la medida neta (no la merma del proyecto).
  for (const mat of sin.materiales) assert.equal(mat.m2Tableros, mat.m2Neto);

  // Neta: NO arrastra la merma del proyecto (15% del motor).
  const m2ConMerma = despieceDe(m).maderaPorRol.reduce((s, x) => s + x.m2, 0);
  assert.ok(m2DesdeMateriales(sin) < m2ConMerma, 'sin el % propio el consumo es el neto, no el del proyecto');
});

function m2DesdeMateriales(f: { materiales: { m2Neto: number }[] }): number {
  return f.materiales.reduce((s, x) => s + x.m2Neto, 0);
}

test('la cantidad de la cotización NUNCA es el valor por defecto: cada fila arranca en 1', () => {
  const deLaCotizacion = modulo({ cantidad: 3, repeticionesArea: 2 });
  const una = calcularConsumos([deLaCotizacion], 10).filas[0];

  assert.equal(una.cantidadCotizacion, 6, 'la cifra de la cotización solo queda como referencia');
  assert.equal(una.cantidad, 1, 'el consumo arranca en UNA unidad');
  // Mismo consumo que un módulo que de fábrica trajera cantidad 1.
  const base = calcularConsumos([modulo()], 10).filas[0];
  assert.deepEqual(una.materiales, base.materiales, 'sin edición, ningún material usa la cantidad de la cotización');
  assert.deepEqual(una.cantos, base.cantos);
  assert.equal(una.piezas, base.piezas);
});

test('la cantidad editable multiplica cada material, cada canto, cada consumible y las piezas', () => {
  const m = modulo({ cantidad: 7 });
  const base = calcularConsumos([m], 10).filas[0];
  const triple = calcularConsumos([m], 10, '', { l1: 3 }).filas[0];
  const cero = calcularConsumos([m], 10, '', { l1: 0 }).filas[0];

  assert.equal(base.cantidad, 1, 'por defecto, aunque la cotización diga 7');
  assert.equal(triple.cantidad, 3);
  assert.equal(triple.materiales.length, base.materiales.length);
  for (let i = 0; i < base.materiales.length; i++) {
    assert.ok(Math.abs(triple.materiales[i].m2Tableros - base.materiales[i].m2Tableros * 3) < 1e-9);
    assert.ok(Math.abs(triple.materiales[i].m2Neto - base.materiales[i].m2Neto * 3) < 1e-9);
  }
  for (let i = 0; i < base.cantos.length; i++) {
    assert.ok(Math.abs(triple.cantos[i].metros - base.cantos[i].metros * 3) < 1e-9);
  }
  assert.equal(triple.consumibles.length, base.consumibles.length);
  for (let i = 0; i < base.consumibles.length; i++) {
    assert.ok(Math.abs(triple.consumibles[i].valor - base.consumibles[i].valor * 3) < 1e-9,
      `consumible ${base.consumibles[i].clave} se multiplica por la cantidad`);
  }
  assert.equal(triple.piezas, base.piezas * 3);

  // Un cero explícito saca al mueble del consumo sin romper nada.
  assert.equal(cero.cantidad, 0);
  assert.ok(cero.materiales.every((x) => x.m2Tableros === 0));
  assert.ok(cero.cantos.every((x) => x.metros === 0));
  assert.ok(cero.consumibles.every((x) => x.valor === 0));
  assert.equal(cero.piezas, 0);
});

test('parseCantidad vuelve a 1 ante vacío, texto o negativo y acepta coma decimal', () => {
  assert.equal(parseCantidad(undefined), 1, 'sin edición');
  assert.equal(parseCantidad(''), 1, 'input vacío');
  assert.equal(parseCantidad('   '), 1);
  assert.equal(parseCantidad('abc'), 1, 'texto');
  assert.equal(parseCantidad('-4'), 1, 'negativo');
  assert.equal(parseCantidad('1'), 1);
  assert.equal(parseCantidad('3'), 3);
  assert.equal(parseCantidad('2,5'), 2.5, 'coma decimal');
  assert.equal(parseCantidad(' 4 '), 4);
  assert.equal(parseCantidad('0'), 0, 'cero explícito se respeta');
});

test('cada fila es un mueble individual: no se suman totales de la cotización', () => {
  const mods = [
    modulo(),
    modulo({ lineaId: 'l2', codigoModulo: 'DB12', nombreDescriptivo: '3 GAVETAS', cocinaNombre: 'Cocina Sur' }),
    modulo({ lineaId: 'l3', codigoModulo: 'PN4470', nombreDescriptivo: 'PN - Panel lateral', pref: 'PN', cocinaNombre: '—' }),
  ];
  const { filas } = calcularConsumos(mods, 0);
  assert.equal(filas.length, mods.length, 'una fila por mueble, sin agregados');
  assert.deepEqual(filas.map((f) => f.codigo), ['DB12', 'PN4470', 'SBFD30']);
  assert.equal(filas[2].titulo, 'SBFD30 2 PUERTAS');
});

test('el buscador encuentra por código, descripción y área, sin distinguir tildes ni mayúsculas', () => {
  const mods = [
    modulo(),
    modulo({ lineaId: 'l2', codigoModulo: 'DB12', nombreDescriptivo: '3 GAVETAS', cocinaNombre: 'Cocina Sur' }),
    modulo({ lineaId: 'l3', codigoModulo: 'PN4470', nombreDescriptivo: 'PN - Panel paneles horizontales', pref: 'PN', cocinaNombre: '—' }),
  ];
  const buscar = (texto: string) => calcularConsumos(mods, 0, texto).filas.map((f) => f.codigo);

  assert.deepEqual(buscar(''), ['DB12', 'PN4470', 'SBFD30'], 'sin texto se listan todos en orden alfabético');
  assert.deepEqual(buscar('db12'), ['DB12'], 'código');
  assert.deepEqual(buscar('gavetas'), ['DB12'], 'descripción');
  assert.deepEqual(buscar('norte'), ['SBFD30'], 'área');
  assert.deepEqual(buscar('panel horizontal'), ['PN4470'], 'varias palabras en cualquier orden');
  assert.deepEqual(buscar('COCINA sur'), ['DB12'], 'mayúsculas');
  assert.deepEqual(buscar('panel xyz'), [], 'sin coincidencias');
});

test('los módulos sin despiece se excluyen del consumo y quedan reportados', () => {
  const roto = modulo({ lineaId: 'l9', codigoModulo: 'BROKEN', nombreDescriptivo: undefined, ok: false, error: 'Falta tablero' }) as ModuloHDR;
  const { filas, conError } = calcularConsumos([modulo(), roto], 15);

  assert.equal(filas.length, 1, 'el módulo roto no aporta consumo');
  assert.equal(filas[0].codigo, 'SBFD30');
  assert.equal(conError, 1);

  // Buscar por su código lo trae a la vista con el aviso.
  const filtrado = calcularConsumos([modulo(), roto], 15, 'broken');
  assert.equal(filtrado.filas.length, 0);
  assert.equal(filtrado.conError, 1);

  // Y el módulo roto no rompe el buscador por descripción.
  assert.equal(calcularConsumos([roto], 15, 'broken').conError, 1);
});

test('el porcentaje se acota a un rango usable', () => {
  assert.equal(normalizarDesperdicio(-5), 0);
  assert.equal(normalizarDesperdicio(0), 0);
  assert.equal(normalizarDesperdicio(15.5), 15.5);
  assert.equal(normalizarDesperdicio(900), 100);
  assert.equal(normalizarDesperdicio(Number.NaN), 0);

  const m = modulo();
  const tope = calcularConsumos([m], 900).filas[0].materiales;
  const alCien = calcularConsumos([m], 100).filas[0].materiales;
  assert.deepEqual(tope.map((x) => x.m2Tableros), alCien.map((x) => x.m2Tableros));
});

test('el consumo de varios muebles se mantiene separado y sin valores fantasma', () => {
  const mods = [
    modulo(),
    modulo({
      lineaId: 'l2', codigoModulo: 'VACIO', nombreDescriptivo: 'SIN PIEZAS',
      result: { ...resultado(), piezas: [], maderaPorRol: [], cantoPorCalibre: [], consumibles: {}, cantidadesConsumibles: {} },
    }),
  ];
  const { filas } = calcularConsumos(mods, 20);

  assert.equal(filas.length, 2);
  assert.ok(filas[0].materiales.length > 0 && filas[0].cantos.length > 0 && filas[0].piezas > 0);
  assert.ok(filas[0].materiales.every((x) => x.m2Tableros > 0));
  assert.ok(filas[0].cantos.every((x) => x.metros > 0));

  const vacio = filas[1];
  assert.deepEqual(vacio.materiales, []);
  assert.deepEqual(vacio.cantos, []);
  assert.deepEqual(vacio.consumibles, []);
  assert.equal(vacio.piezas, 0);
});

test('Consumos ordena alfabéticamente por mueble, descripción y área sin cambiar cantidades', () => {
  const mods = [modulo({ lineaId: 'z', codigoModulo: 'W30' }), modulo({ lineaId: 'b', codigoModulo: 'B10', cocinaNombre: 'Zona B' }), modulo({ lineaId: 'a', codigoModulo: 'B10', cocinaNombre: 'Área A' }), modulo({ lineaId: 'c', codigoModulo: 'B2' })];
  const antes = structuredClone(mods);
  const { filas } = calcularConsumos(mods, 15, '', { a: 3, b: 2 });
  assert.deepEqual(filas.map(f => f.clave), ['c', 'a', 'b', 'z']);
  assert.deepEqual(filas.map(f => f.cantidad), [1, 3, 2, 1]);
  assert.deepEqual(mods, antes);
});

test('Excel de consumos conserva todos los desgloses como números, filtros y cantidades editadas', async () => {
  const { filas } = calcularConsumos([modulo({ lineaId: 'z', codigoModulo: 'W30' }), modulo({ lineaId: 'a', codigoModulo: 'B24' })], 15, '', { a: 2.5, z: 0 });
  const antes = structuredClone(filas);
  const wb = crearWorkbookConsumos([...filas].reverse(), { proyecto: 'Prueba Bogotá', desperdicioPct: 15, fecha: new Date('2026-11-10T02:00:00Z'), filtro: 'muebles' });
  const recargado = new ExcelJS.Workbook();
  await recargado.xlsx.load(await wb.xlsx.writeBuffer());
  const ws = recargado.getWorksheet('Consumos')!;
  assert.equal(ws.getCell('B2').value, '2026-11-09');
  assert.equal(ws.getCell('D2').value, 15);
  assert.equal(ws.getCell('B3').value, 'muebles');
  assert.equal(ws.getCell('A6').value, 'B24');
  assert.equal(ws.getCell('A7').value, 'W30');
  assert.equal(ws.getCell('D6').value, 2.5);
  assert.equal(ws.getCell('D7').value, 0);
  assert.ok(ws.getTable('ConsumosMuebles'));
  assert.equal(ws.views[0].state, 'frozen');
  const headers = ws.getRow(5).values as string[];
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i], row = ws.getRow(6 + i);
    assert.equal(row.getCell(2).value, f.descripcion);
    assert.equal(row.getCell(3).value, f.area);
    assert.equal(row.getCell(5).value, f.cantidadCotizacion);
    assert.equal(row.getCell(6).value, f.piezas);
    for (const m of f.materiales) {
      assert.equal(row.getCell(headers.indexOf(`${m.rol} · ${m.codigo} · neto (m²)`)).value, m.m2Neto);
      assert.equal(row.getCell(headers.indexOf(`${m.rol} · ${m.codigo} · con desperdicio (m²)`)).value, m.m2Tableros);
    }
    for (const c of f.cantos) assert.equal(row.getCell(headers.indexOf(`Canto ${c.calibre} (m)`)).value, c.metros);
    for (const c of f.consumibles) assert.equal(row.getCell(headers.indexOf(`${c.nombre} (unidades)`)).value, c.valor);
  }
  assert.deepEqual(filas, antes);
});

test('el nombre del Excel incluye fecha de Bogotá y limpia caracteres de rutas', () => {
  const fecha = new Date('2026-11-10T02:00:00Z');
  assert.equal(fechaConsumos(fecha), '2026-11-09');
  assert.equal(nombreExcelConsumos('Proyecto / Bogotá', fecha), 'Consumos_Proyecto _ Bogotá_2026-11-09.xlsx');
  assert.equal(nombreExcelConsumos('', fecha), 'Consumos_muebles_2026-11-09.xlsx');
});
