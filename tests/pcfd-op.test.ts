import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularMueble,
  type CalcInput,
  type HerrajePlantilla,
  type Pieza,
  type Regla,
} from '../src/lib/engine';

const reglas: Regla[] = [
  { tipo_mueble_id: 'pcfd', variable: 'n_puertas', condicion: 'L < 24', valor: '1', prioridad: 5 },
  { tipo_mueble_id: 'pcfd', variable: 'n_puertas', condicion: 'true', valor: '2', prioridad: 10 },
  { tipo_mueble_id: 'pcfd', variable: 'n_cajones', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: 'pcfd', variable: 'n_entrepanos', condicion: 'true', valor: '5', prioridad: 5 },
  { tipo_mueble_id: null, variable: 'n_patas', condicion: 'true', valor: '4', prioridad: 100 },
  { tipo_mueble_id: null, variable: 'zocalo', condicion: 'true', valor: '5.25', prioridad: 100 },
];

const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A-zocalo', formula_ancho: 'P', cantos: {} },
  { nombre: 'base_tapa_division', rol_tablero: 'caja', formula_cantidad: 'n_cajones>0 ? 3 : 2', formula_largo: 'L-1.18', formula_ancho: 'P-0.9', cantos: {}, tarugos: 8 },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '3', formula_largo: 'L-1.18', formula_ancho: '3.25', cantos: {}, tarugos: 4 },
  { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: 'n_entrepanos', formula_largo: 'L-1.18', formula_ancho: 'P-1.54', cantos: {}, soportes: 4 },
  { nombre: 'puerta_estandar', rol_tablero: 'frente', formula_cantidad: 'n_cajones<=0 ? n_puertas : 0', formula_largo: 'L/n_puertas', formula_ancho: 'A-zocalo', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_area_op', rol_tablero: 'frente', formula_cantidad: 'n_cajones>0 ? 1 : 0', formula_largo: 'L', formula_ancho: '(A-5.25)*1.25', cantos: {} },
  { nombre: 'frente_canto_puertas_op', rol_tablero: '', formula_cantidad: 'n_cajones>0 ? n_puertas : 0', formula_largo: 'L', formula_ancho: '(A-5.25)/n_puertas', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_canto_gavetas_op', rol_tablero: '', formula_cantidad: 'n_cajones', formula_largo: 'L', formula_ancho: 'n_cajones>0 ? (A-5.25)/n_cajones : 0', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-2.95', formula_ancho: 'P-4.63', cantos: {} },
  { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-3.427', formula_ancho: '2.6875', cantos: {} },
  { nombre: 'frente_delgado_informativo_op', rol_tablero: '', formula_cantidad: 'n_cajones>0 ? 1 : 0', formula_largo: 'L', formula_ancho: '5.25', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-0.59', formula_ancho: 'n_cajones>0 ? A-5.25 : A-zocalo', cantos: {} },
];

const herrajes: HerrajePlantilla[] = [
  { rol: 'pata', herraje_codigo: 'PATA', selector_key: 'pata', formula_cantidad: 'n_patas' },
  { rol: 'tornillo', herraje_codigo: 'TORNILLO', selector_key: 'tornillo', formula_cantidad: 'n_patas*4' },
  { rol: 'bisagra', herraje_codigo: 'BISAGRA', selector_key: 'bisagra', formula_cantidad: 'n_cajones>0 ? n_puertas*2 : n_puertas' },
  { rol: 'manija', herraje_codigo: 'MANIJA', selector_key: 'manija', formula_cantidad: 'n_cajones>0 ? 0 : n_puertas' },
  { rol: 'riel', herraje_codigo: 'RIEL', selector_key: 'riel', formula_cantidad: 'n_cajones' },
  { rol: 'push', herraje_codigo: 'PUSH', selector_key: 'push', formula_cantidad: 'n_cajones>0 ? 2 : 0' },
];

function input(L = 22.75, overrides?: Record<string, number>): CalcInput {
  return {
    dims: { L, A: 84, P: 22 },
    piezas,
    reglas,
    overrides,
    preset: { caja: 'CAJA', refuerzo: 'REF', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1 },
      REF: { codigo: 'REF', precio_m2: 1 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1 },
      FONDO: { codigo: 'FONDO', precio_m2: 1 },
    },
    cantosByCalibre: { '22X1': { calibre: '22x1', precio: 1 } },
    herrajesByCode: Object.fromEntries(['PATA', 'TORNILLO', 'BISAGRA', 'MANIJA', 'RIEL', 'PUSH'].map((codigo) => [codigo, { codigo, precio: 1 }])),
    herrajesPlantilla: herrajes,
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    margen: 0,
    margenHerraje: 0,
    trm: 1,
    desperdicio: 0,
  };
}

const piece = (result: ReturnType<typeof calcularMueble>, name: string) =>
  result.piezas.find((item) => item.pieza === name)!;
const hardware = (result: ReturnType<typeof calcularMueble>, role: string) =>
  result.herrajes.find((item) => item.rol === role)!;

test('PCFD estándar conserva cero gavetas y cinco entrepaños', () => {
  const result = calcularMueble(input());
  assert.equal(result.vars.n_cajones, 0);
  assert.equal(piece(result, 'base_tapa_division').cant, 2);
  assert.equal(piece(result, 'entrepano').cant, 5);
  assert.equal(piece(result, 'puerta_estandar').cant, 1);
  assert.equal(piece(result, 'base_gaveta').cant, 0);
  assert.equal(hardware(result, 'riel').cant, 0);
  assert.equal(hardware(result, 'push').cant, 0);
  assert.equal(hardware(result, 'manija').cant, 1);
});

test('PCFD 2OP reproduce la geometría CEMA de la fila 5449', () => {
  const result = calcularMueble(input(22.75, {
    n_cajones: 2,
    n_entrepanos: 3,
    zocalo: 4.5,
  }));

  assert.equal(result.vars.n_puertas, 1);
  assert.equal(piece(result, 'base_tapa_division').cant, 3);
  assert.equal(piece(result, 'entrepano').cant, 3);
  assert.equal(piece(result, 'base_gaveta').cant, 2);
  assert.equal(piece(result, 'trasero_gaveta').cant, 2);
  assert.ok(Math.abs(piece(result, 'lateral').areaCm2 - 22567.70) < 0.01);
  assert.ok(Math.abs(piece(result, 'base_tapa_division').areaCm2 - 8808.89) < 0.01);
  assert.ok(Math.abs(piece(result, 'refuerzo_trasero').areaCm2 - 1356.82) < 0.01);
  assert.ok(Math.abs(piece(result, 'entrepano').areaCm2 - 8541.70) < 0.01);
  assert.ok(Math.abs(piece(result, 'frente_area_op').areaCm2 - 14448.06) < 0.01);
  assert.ok(Math.abs(piece(result, 'base_gaveta').areaCm2 - 4437.75) < 0.01);
  assert.ok(Math.abs(piece(result, 'trasero_gaveta').areaCm2 - 670.07) < 0.01);
  assert.ok(Math.abs(result.cantoPorCalibre[0].longCm - 1206.81) < 0.01);
  assert.equal(hardware(result, 'bisagra').cant, 2);
  assert.equal(hardware(result, 'manija').cant, 0);
  assert.equal(hardware(result, 'riel').cant, 2);
  assert.equal(hardware(result, 'push').cant, 2);
});

test('PCFD permite editar a cuatro gavetas y deriva dos puertas en anchos grandes', () => {
  const result = calcularMueble(input(36.75, {
    n_cajones: 4,
    n_entrepanos: 2,
    zocalo: 5.25,
  }));
  assert.equal(result.vars.n_puertas, 2);
  assert.equal(piece(result, 'entrepano').cant, 2);
  assert.equal(piece(result, 'base_gaveta').cant, 4);
  assert.equal(piece(result, 'trasero_gaveta').cant, 4);
  assert.equal(hardware(result, 'bisagra').cant, 4);
  assert.equal(hardware(result, 'riel').cant, 4);
  assert.equal(hardware(result, 'push').cant, 2);
});
