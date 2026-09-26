import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

// Espejo de 0084: SBFD-SM es BFD-SM sin la fila de entrepaño.
const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {}, tarugos: 8 },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'refuerzo_delantero', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {}, tarugos: 4 },
  { nombre: 'gola_madera', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {}, tarugos: 4 },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {}, tarugos: 4 },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-30/25.4', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'true', valor: '0', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_cajones', condicion: 'true', valor: '0', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_patas', condicion: 'true', valor: '4', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'gola', condicion: 'true', valor: '0', prioridad: 10 },
];

function input(): CalcInput {
  return {
    dims: { L: 30, A: 30, P: 24 }, piezas, reglas,
    preset: { caja: 'CAJA', refuerzo: 'REFUERZO', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 },
      REFUERZO: { codigo: 'REFUERZO', precio_m2: 1, espesor_mm: 15 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
    },
    cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0,
    margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
}

const mm = (inches: number) => inches * 25.4;
const pieza = (r: ReturnType<typeof calcularMueble>, nombre: string) => r.piezas.find((p) => p.pieza === nombre)!;
const approx = (actual: number, esperado: number, etiqueta: string) =>
  assert.ok(Math.abs(actual - esperado) < 0.1, `${etiqueta}: ${actual.toFixed(2)} mm ≈ ${esperado} mm`);

test('SBFD-SM conserva BFD-SM sin entrepaño y con medidas paramétricas correctas', () => {
  const r = calcularMueble(input());
  assert.equal(r.vars.n_entrepanos, 0);
  assert.equal(r.vars.n_puertas, 2);
  assert.equal(r.piezas.some((p) => p.pieza === 'entrepano'), false);
  assert.equal(piezas.reduce((total, p) => total + Number(p.soportes ?? 0), 0), 0);
  assert.equal(piezas.reduce((total, p) => total + Number(p.tarugos ?? 0) * Number(p.formula_cantidad === '2' ? 2 : 1), 0), 24);

  approx(mm(pieza(r, 'base').largoIn), 732, 'largo de base');
  approx(mm(pieza(r, 'base').anchoIn), 585.6, 'profundidad de base');
  approx(mm(pieza(r, 'frente').largoIn), 377.8, 'ancho de cada puerta');
  approx(mm(pieza(r, 'frente').anchoIn), 732, 'alto de puerta SM inferior');
  approx(mm(pieza(r, 'fondo').largoIn), 760, 'alto del fondo');
  approx(mm(pieza(r, 'fondo').anchoIn), 746, 'largo del fondo');
});
