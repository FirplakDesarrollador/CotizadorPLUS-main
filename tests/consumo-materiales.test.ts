import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

// Los consumos que muestra el Simulador tienen que poder reconstruirse desde el
// listado de piezas de la HDR: misma fuente, distinta presentación. Tablero en m²
// y canto en metros lineales, ambos ya con su merma, de modo que
// `cantidad x precio = costo` y la cifra explique el costo que aparece al lado.

const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 } },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: { calibre: '19x0,45', largos: 1, anchos: 0 } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-RV', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-TC', formula_ancho: 'A', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
];

const PRECIOS: Record<string, number> = { CAJA: 42000, REF: 42000, FRENTE: 51000, FONDO: 31000 };

function input(desperdicio: number): CalcInput {
  return {
    dims: { L: 30, A: 30, P: 24 },
    piezas, reglas, herrajesPlantilla: [], overrides: {},
    preset: { caja: 'CAJA', refuerzo: 'REF', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: PRECIOS.CAJA, espesor_mm: 15 },
      REF: { codigo: 'REF', precio_m2: PRECIOS.REF, espesor_mm: 15 },
      FRENTE: { codigo: 'FRENTE', precio_m2: PRECIOS.FRENTE, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: PRECIOS.FONDO, espesor_mm: 6 },
    },
    cantosByCalibre: { '19X0,45': { calibre: '19x0,45', precio: 400 }, '22X1': { calibre: '22x1', precio: 980 } },
    herrajesByCode: {}, consumiblesBySelector: {},
    etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio,
  };
}

test('el m² de tablero se reconstruye desde el listado de piezas', () => {
  for (const desperdicio of [0, 0.1, 0.15]) {
    const r = calcularMueble(input(desperdicio));
    for (const m of r.maderaPorRol) {
      // 1. El área neta es exactamente la suma de las piezas de ese rol en la HDR.
      const areaPiezas = r.piezas.filter((p) => p.rol === m.rol).reduce((s, p) => s + p.areaCm2, 0);
      assert.ok(Math.abs(areaPiezas - m.cm2) < 0.05, `${m.rol}: piezas ${areaPiezas} vs cm2 ${m.cm2}`);
      // 2. El consumo facturable aplica la merma sobre esa área.
      assert.ok(Math.abs(m.m2 - (m.cm2 * (1 + desperdicio)) / 10000) < 1e-4, `${m.rol} con ${desperdicio}`);
    }
  }
});

test('la cantidad mostrada explica el costo, en tablero y en canto', () => {
  const r = calcularMueble(input(0.1));
  for (const m of r.maderaPorRol) {
    assert.ok(Math.abs(m.m2 * PRECIOS[m.codigo] - m.costo) < 0.05, `${m.rol}: ${m.m2} m² x precio != ${m.costo}`);
  }
  for (const c of r.cantoPorCalibre) {
    assert.ok(Math.abs(c.metros * c.precio - c.costo) < 0.05, `${c.calibre}: ${c.metros} m x precio != ${c.costo}`);
  }
  // Los totales del desglose siguen cuadrando con la suma de las filas.
  const sumaMadera = r.maderaPorRol.reduce((s, m) => s + m.costo, 0);
  const sumaCanto = r.cantoPorCalibre.reduce((s, c) => s + c.costo, 0);
  assert.ok(Math.abs(sumaMadera - r.costoMadera) < 0.05);
  assert.ok(Math.abs(sumaCanto - r.costoCanto) < 0.05);
});

test('los metros de canto incluyen los 5 cm de merma por arista', () => {
  const r = calcularMueble(input(0));
  const IN2CM = 2.54;
  // El canto no usa la merma de madera: su merma son las aristas.
  const esperado: Record<string, number> = {};
  for (const p of r.piezas) {
    if (!p.cantoCalibre) continue;
    const largoCm = p.cant * (p.cantoLargos * p.largoIn * IN2CM);
    const anchoCm = p.cant * (p.cantoAnchos * p.anchoIn * IN2CM);
    const aristas = p.cant * (p.cantoLargos + p.cantoAnchos) * 5;
    // Las piezas de refuerzo suman 8 cm por unidad: el canto del refuerzo posterior
    // envuelve también su espesor (regla del motor, no del despiece).
    const espesorRefuerzo = /refuerzo/i.test(p.pieza) ? p.cant * 8 : 0;
    esperado[p.cantoCalibre] = (esperado[p.cantoCalibre] ?? 0) + largoCm + anchoCm + aristas + espesorRefuerzo;
  }
  for (const c of r.cantoPorCalibre) {
    assert.ok(Math.abs(c.metros * 100 - esperado[c.calibre]) < 0.5, `${c.calibre}: ${c.metros * 100} vs ${esperado[c.calibre]}`);
  }
});

test('la merma de madera no altera el despiece, solo el consumo facturable', () => {
  const sin = calcularMueble(input(0));
  const con = calcularMueble(input(0.15));
  assert.deepEqual(
    con.piezas.map((p) => [p.pieza, p.largoIn, p.anchoIn, p.cant]),
    sin.piezas.map((p) => [p.pieza, p.largoIn, p.anchoIn, p.cant]),
  );
  for (let i = 0; i < con.maderaPorRol.length; i += 1) {
    assert.equal(con.maderaPorRol[i].cm2, sin.maderaPorRol[i].cm2, 'el área neta no cambia');
    assert.ok(con.maderaPorRol[i].m2 > sin.maderaPorRol[i].m2, 'el consumo facturable sí');
  }
  // El canto es ajeno a la merma de madera.
  assert.deepEqual(con.cantoPorCalibre.map((c) => c.metros), sin.cantoPorCalibre.map((c) => c.metros));
});

test('un mismo canto no se parte en dos filas por la capitalización', () => {
  // El override del formulario llega con la grafía de `cot_cantos`, que no siempre
  // coincide con la de la plantilla de la pieza. Antes eso producía dos filas del
  // mismo calibre en el listado de materiales. Ver migración 0050.
  const base = input(0);
  const r = calcularMueble({ ...base, cantoCaja: '19X0,45' });

  const calibres = r.cantoPorCalibre.map((c) => c.calibre);
  assert.equal(new Set(calibres.map((c) => c.toUpperCase())).size, calibres.length, `calibres repetidos: ${calibres}`);
  // Se reporta con la grafía del catálogo, no con la del override.
  assert.ok(calibres.includes('19x0,45'), `esperaba la grafía del catálogo en ${calibres}`);

  // El override no cambia el consumo: solo de dónde viene el texto del calibre.
  const sinOverride = calcularMueble({ ...base, cantoCaja: '19x0,45' });
  assert.deepEqual(
    r.cantoPorCalibre.map((c) => [c.calibre, c.metros]),
    sinOverride.cantoPorCalibre.map((c) => [c.calibre, c.metros]),
  );
});
