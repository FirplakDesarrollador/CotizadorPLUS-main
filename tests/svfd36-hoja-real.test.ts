import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

// Hoja de ruta real: "SVFD36 MBLE INF LVM 2 PUERTAS CARB2".
// L=36in, A=30in, P=21in; las dimensiones se contrastan en mm.
const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {} },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'refuerzo_delantero', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: '3.77953', cantos: {} },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {} },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-RV', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
];

const input: CalcInput = {
  dims: { L: 36, A: 30, P: 21 }, piezas, reglas, herrajesPlantilla: [], overrides: {},
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

function mm(value: number): number { return value * 25.4; }

function assertPieza(result: ReturnType<typeof calcularMueble>, nombre: string, cant: number, medida1: number, medida2: number) {
  const pieza = result.piezas.find((p) => p.pieza === nombre);
  assert.ok(pieza, `falta ${nombre}`);
  assert.equal(pieza.cant, cant, `cantidad de ${nombre}`);
  const medidas = [mm(pieza.largoIn), mm(pieza.anchoIn)].sort((a, b) => a - b);
  const esperadas = [medida1, medida2].sort((a, b) => a - b);
  assert.ok(medidas.every((medida, i) => Math.abs(medida - esperadas[i]) < 0.05), `${nombre}: ${medidas} vs ${esperadas}`);
}

test('SVFD36 coincide con la hoja de ruta real', () => {
  const result = calcularMueble(input);
  assertPieza(result, 'base', 1, 884.4, 509.4);
  assertPieza(result, 'lateral', 2, 762, 533.4);
  assertPieza(result, 'refuerzo_delantero', 1, 884.4, 96);
  assertPieza(result, 'refuerzo_trasero', 2, 884.4, 80);
  assertPieza(result, 'frente', 2, 758.8, 454);
  assertPieza(result, 'fondo', 1, 760, 898.4);
});
