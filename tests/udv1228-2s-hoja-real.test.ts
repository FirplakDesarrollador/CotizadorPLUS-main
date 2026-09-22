import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '../src/lib/engine';

// Hoja: UDV1228 3/4-2S MBLE INF BAÑO 3 GAVETAS PEQUEÑA CARB2.
const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {} },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'refuerzo_horizontal', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {} },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {} },
  { nombre: 'base_gaveta', rol_tablero: 'caja', formula_cantidad: 'n_cajones', formula_largo: 'L-4.13386', formula_ancho: 'P-3.6378', cantos: {} },
  { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos>0?0:n_cajones', formula_largo: 'L-4.607', formula_ancho: '2.6875', cantos: {} },
  { nombre: 'trasero_gaveta_pequena', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-4.607', formula_ancho: '68/25.4', cantos: {} },
  { nombre: 'trasero_gaveta_grande', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', formula_largo: 'L-4.607', formula_ancho: '183/25.4', cantos: {} },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos>0?0:n_cajones', formula_largo: 'L', formula_ancho: 'A/n_cajones', cantos: {} },
  { nombre: 'frente_gaveta_pequena', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-RV', formula_ancho: '5.5', cantos: {} },
  { nombre: 'frente_gaveta_grande', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', formula_largo: 'L-RV', formula_ancho: '(n_cajones-n_cajones_pequenos)>0?(A-n_cajones*RV-n_cajones_pequenos*5.5)/(n_cajones-n_cajones_pequenos):0', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

const input: CalcInput = {
  dims: { L: 12, A: 28.75, P: 21 }, piezas, reglas: [], herrajesPlantilla: [],
  overrides: { n_cajones: 3, n_cajones_pequenos: 2 },
  preset: { caja: 'CAJA', refuerzo: 'REFUERZO', frente: 'FRENTE', fondo: 'FONDO' },
  tablerosByCode: {
    CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 },
    REFUERZO: { codigo: 'REFUERZO', precio_m2: 1, espesor_mm: 15 },
    FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
    FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
  },
  cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {},
  etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
};

function assertPieza(result: ReturnType<typeof calcularMueble>, nombre: string, cant: number, a: number, b: number) {
  const pieza = result.piezas.find((p) => p.pieza === nombre);
  assert.ok(pieza, `falta ${nombre}`);
  assert.equal(pieza.cant, cant, `cantidad de ${nombre}`);
  const medidas = [pieza.largoIn * 25.4, pieza.anchoIn * 25.4].sort((x, y) => x - y);
  const esperadas = [a, b].sort((x, y) => x - y);
  assert.ok(medidas.every((medida, i) => Math.abs(medida - esperadas[i]) < 0.05), `${nombre}: ${medidas} vs ${esperadas}`);
}

test('UDV1228¾-2S coincide con sus 18 piezas físicas', () => {
  const result = calcularMueble(input);
  assertPieza(result, 'base', 1, 274.8, 509.4);
  assertPieza(result, 'lateral', 2, 730.25, 533.4);
  assertPieza(result, 'refuerzo_horizontal', 3, 274.8, 80);
  assertPieza(result, 'refuerzo_trasero', 2, 274.8, 80);
  assertPieza(result, 'base_gaveta', 3, 199.8, 441);
  assertPieza(result, 'trasero_gaveta', 0, 187.8, 68);
  assertPieza(result, 'trasero_gaveta_pequena', 2, 187.8, 68);
  assertPieza(result, 'trasero_gaveta_grande', 1, 187.8, 183);
  assertPieza(result, 'frente', 0, 243.4, 304.8);
  assertPieza(result, 'frente_gaveta_pequena', 2, 139.7, 301.6);
  assertPieza(result, 'frente_gaveta_grande', 1, 441.25, 301.6);
  assertPieza(result, 'fondo', 1, 728.25, 288.8);
  assert.equal(result.piezas.reduce((total, pieza) => total + pieza.cant, 0), 18);
});
