import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';
import { orientarPieza } from '../src/lib/muebles';

// Hoja real "B12 · MUEBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO CARB2"
// (L=12", A=30", P=24"). Fórmulas tal como quedaron tras la migración 0052.

const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 } },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'refuerzo_horizontal', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-2*TC-0.03937', formula_ancho: '11.81102', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 } },
  { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-4.13386', formula_ancho: 'P-4.63', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-4.607', formula_ancho: '2.6875', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-n_cajones*alto_frente_gaveta-(n_cajones+1)*RV', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_cajon', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'alto_frente_gaveta', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '2', prioridad: 99 },
  { tipo_mueble_id: null, variable: 'n_cajones', condicion: 'true', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'alto_frente_gaveta', condicion: 'true', valor: '6', prioridad: 10 },
];

function input(L = 12, A = 30, P = 24): CalcInput {
  return {
    dims: { L, A, P }, piezas, reglas, herrajesPlantilla: [], overrides: {},
    preset: { caja: 'C', refuerzo: 'R', frente: 'F', fondo: 'B' },
    tablerosByCode: {
      C: { codigo: 'C', precio_m2: 1, espesor_mm: 15 }, R: { codigo: 'R', precio_m2: 1, espesor_mm: 15 },
      F: { codigo: 'F', precio_m2: 1, espesor_mm: 18 }, B: { codigo: 'B', precio_m2: 1, espesor_mm: 6 },
    },
    cantosByCalibre: { '19X0,45': { calibre: '19x0,45', precio: 1 }, '22X1': { calibre: '22x1', precio: 1 } },
    herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
}

// La hoja lista cada panel con su medida mayor primero, así que se compara el par
// de medidas sin importar el orden: el eje lo fija `orientarPieza`.
const par = (a: number, b: number) => [a, b].sort((x, y) => x - y);
function assertPieza(result: ReturnType<typeof calcularMueble>, nombre: string, cant: number, l: number, a: number) {
  const p = result.piezas.find((x) => x.pieza === nombre);
  assert.ok(p, `falta la pieza ${nombre}`);
  assert.equal(Math.round(p.cant), cant, `cantidad de ${nombre}`);
  const o = orientarPieza(p);
  const [menor, mayor] = par(o.largoIn * 25.4, o.anchoIn * 25.4);
  const [emenor, emayor] = par(l, a);
  assert.ok(Math.abs(menor - emenor) < 0.35 && Math.abs(mayor - emayor) < 0.35,
    `${nombre}: ${menor.toFixed(1)} x ${mayor.toFixed(1)} vs hoja ${emenor} x ${emayor}`);
}

test('B12 reproduce la hoja real de producción', () => {
  const r = calcularMueble(input());

  assert.equal(r.vars.n_puertas, 1);
  assert.equal(r.vars.n_cajones, 1);

  assertPieza(r, 'base', 1, 274.8, 585.6);
  assertPieza(r, 'lateral', 2, 762, 609.6);
  assertPieza(r, 'refuerzo_horizontal', 2, 274.8, 80);   // RAIL DELANTERO
  assertPieza(r, 'refuerzo_trasero', 2, 274.8, 80);      // RAIL TRASERO
  assertPieza(r, 'entrepano', 1, 273.8, 300);            // SHELF
  assertPieza(r, 'base_gaveta', 1, 199.8, 492);          // PIEZA CAJON
  assertPieza(r, 'trasero_gaveta', 1, 187.8, 68);        // TRASERO CAJON
  assertPieza(r, 'frente', 1, 603.2, 301.6);             // DOOR
  assertPieza(r, 'frente_cajon', 1, 152.4, 301.6);       // FRENTE GAVETA
  assertPieza(r, 'fondo', 1, 760, 288.8);                // BACKING
});

test('las tres medidas que 0052 corrigió no vuelven a su valor anterior', () => {
  const r = calcularMueble(input());
  const mm = (nombre: string, eje: 'largoIn' | 'anchoIn') => r.piezas.find((p) => p.pieza === nombre)![eje] * 25.4;

  // Antes: P*0.5 = 304.8
  assert.ok(Math.abs(mm('entrepano', 'anchoIn') - 300) < 0.1, 'entrepaño debe ser 300mm, no media profundidad');
  // Antes: L-2.95 = 229.9
  assert.ok(Math.abs(mm('base_gaveta', 'largoIn') - 199.8) < 0.1, 'base de gaveta debe restar 105mm al largo');
  // Antes: L-TC / A = 289.8 x 762
  assert.ok(Math.abs(mm('fondo', 'largoIn') - 760) < 0.1, 'fondo: el largo va sobre A-2mm');
  assert.ok(Math.abs(mm('fondo', 'anchoIn') - 288.8) < 0.1, 'fondo: el ancho va sobre L-16mm');
});

test('la geometría escala con la medida del mueble', () => {
  // El entrepaño es el único constante; el resto sigue a L/A/P.
  const r = calcularMueble(input(24, 30, 24));
  const mm = (nombre: string, eje: 'largoIn' | 'anchoIn') => r.piezas.find((p) => p.pieza === nombre)![eje] * 25.4;

  assert.equal(r.vars.n_puertas, 2, 'un B de 24" lleva dos puertas');
  assert.ok(Math.abs(mm('base', 'largoIn') - (609.6 - 30)) < 0.1);
  assert.ok(Math.abs(mm('base_gaveta', 'largoIn') - (609.6 - 105)) < 0.1);
  assert.ok(Math.abs(mm('fondo', 'anchoIn') - (609.6 - 16)) < 0.1);
  assert.ok(Math.abs(mm('entrepano', 'anchoIn') - 300) < 0.1, 'el entrepaño no depende de la profundidad');
});
