import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type HerrajePlantilla, type Pieza, type Regla } from '../src/lib/engine';

const piezas: Pieza[] = [
  { nombre: 'base_tapa', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 }, tarugos: 8 },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'gola ? A-1 : A', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 }, tarugos: 4 },
  { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: 'n_entrepanos', formula_largo: 'L-2*TC-0.03937', formula_ancho: 'P-1.5', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 }, soportes: 4 },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'gola ? A+0.62402 : A-RV', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-0.62992', formula_ancho: 'gola ? A-1.62992 : A-0.62992', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'gola', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'A <= 16', valor: '0', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'A <= 24', valor: '1', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'A <= 36', valor: '2', prioridad: 30 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'true', valor: '3', prioridad: 99 },
];

const herrajes: HerrajePlantilla[] = [
  { rol: 'bisagra', herraje_codigo: 'BISAGRA', selector_key: 'bisagra', formula_cantidad: 'n_puertas' },
  { rol: 'manija', herraje_codigo: 'MANIJA', selector_key: 'manija', formula_cantidad: 'n_puertas' },
];

function input(overrides: Record<string, number> = {}): CalcInput {
  return {
    dims: { L: 29, A: 36, P: 12 },
    piezas,
    reglas,
    herrajesPlantilla: herrajes,
    overrides,
    preset: { caja: 'CAJA', refuerzo: 'REF', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 },
      REF: { codigo: 'REF', precio_m2: 1, espesor_mm: 15 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
    },
    cantosByCalibre: { '19X0,45': { calibre: '19x0,45', precio: 1 }, '22X1': { calibre: '22x1', precio: 1 } },
    herrajesByCode: { BISAGRA: { codigo: 'BISAGRA', precio: 5800 }, MANIJA: { codigo: 'MANIJA', precio: 7450 } },
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    margen: 0,
    margenHerraje: 0,
    trm: 1,
    desperdicio: 0,
  };
}

const mm = (inches: number) => inches * 25.4;
const piece = (result: ReturnType<typeof calcularMueble>, name: string) =>
  result.piezas.find((item) => item.pieza === name)!;
const hardware = (result: ReturnType<typeof calcularMueble>, role: string) =>
  result.herrajes.find((item) => item.rol === role);
function assertMm(actualIn: number, esperadoMm: number, etiqueta: string) {
  assert.ok(Math.abs(mm(actualIn) - esperadoMm) < 0.2, `${etiqueta}: ${mm(actualIn).toFixed(2)}mm ~= ${esperadoMm}mm`);
}

test('W2936-SM reproduce la hoja real adjunta', () => {
  const result = calcularMueble(input({ gola: 1 }));

  assert.equal(result.vars.n_puertas, 2);
  assert.equal(result.vars.n_entrepanos, 2);

  assertMm(piece(result, 'base_tapa').largoIn, 706.6, 'largo base/tapa');
  assertMm(piece(result, 'base_tapa').anchoIn, 304.8, 'ancho base/tapa');
  // El lateral de un W con SM se corta 1" menos que el alto nominal: la gola ocupa
  // esa pulgada. Ver migración 0048.
  assertMm(piece(result, 'lateral').largoIn, 889, 'largo lateral SM (A-1")');
  assertMm(piece(result, 'lateral').anchoIn, 304.8, 'ancho lateral');
  assertMm(piece(result, 'refuerzo_trasero').largoIn, 706.6, 'largo rail trasero');
  assertMm(piece(result, 'refuerzo_trasero').anchoIn, 80, 'ancho rail trasero');
  assertMm(piece(result, 'entrepano').largoIn, 705.6, 'largo entrepano');
  assertMm(piece(result, 'entrepano').anchoIn, 266.7, 'ancho entrepano');
  assertMm(piece(result, 'frente').anchoIn, 930.25, 'alto puerta SM');
  assertMm(piece(result, 'frente').largoIn, 365.1, 'ancho puerta SM');
  // La hoja lista el backing como `898.4 x 720.6` porque ordena por tamaño, no por
  // eje. El motor usa largo/ancho como ejes geométricos y el fondo de W tiene
  // `intercambiar=false`: largo es el horizontal (base L) y ancho el vertical
  // (base A). Mismo panel, misma área; ver migración 0047.
  assertMm(piece(result, 'fondo').largoIn, 720.6, 'largo backing SM (horizontal, base L)');
  assertMm(piece(result, 'fondo').anchoIn, 873, 'ancho backing SM (vertical, sigue al lateral A-1")');
});

test('W-SM conserva bisagras y elimina manijas', () => {
  const result = calcularMueble(input({ gola: 1 }));

  assert.equal(hardware(result, 'bisagra')?.cant, 2);
  assert.equal(hardware(result, 'bisagra')?.costo, 11600);
  assert.equal(hardware(result, 'manija'), undefined);
  assert.equal(result.costoHerrajes, 11600);
});

test('W con manija conserva el alto de puerta previo', () => {
  const result = calcularMueble(input());

  assertMm(piece(result, 'frente').anchoIn, 911.2, 'alto puerta W manija');
  assert.equal(hardware(result, 'manija')?.cant, 2);
  // El lateral solo se acorta con SM; con manija sigue en el alto nominal.
  assertMm(piece(result, 'lateral').largoIn, 914.4, 'largo lateral W manija');
});

// La holgura de 1mm sobre la estructura no depende del sistema de frente: aplica
// igual con manija que con SM. Ver migración 0049.
test('W con manija lleva la holgura de 1mm en entrepaño y fondo', () => {
  const result = calcularMueble(input());

  assertMm(piece(result, 'entrepano').largoIn, 705.6, 'largo entrepaño W manija');
  assertMm(piece(result, 'fondo').largoIn, 720.6, 'largo fondo W manija');
  assertMm(piece(result, 'fondo').anchoIn, 898.4, 'ancho fondo W manija');
});
