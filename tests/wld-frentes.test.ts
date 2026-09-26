import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

const piezas: Pieza[] = [
  {
    nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas',
    formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-RV', cantos: {},
  },
];
const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
];

function calcular(largo: number) {
  const input: CalcInput = {
    dims: { L: largo, A: 36, P: 12 }, piezas, reglas, herrajesPlantilla: [], overrides: {},
    preset: { frente: 'FRENTE' },
    tablerosByCode: { FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 } },
    cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {},
    etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
  return calcularMueble(input).piezas.find((pieza) => pieza.pieza === 'frente')!;
}

test('WLD aplica una puerta hasta 21 pulgadas y conserva alto A menos 3,2 mm', () => {
  const frente = calcular(21);
  assert.equal(frente.cant, 1);
  assert.ok(Math.abs(frente.largoIn * 25.4 - 530.2) < 0.01);
  assert.ok(Math.abs(frente.anchoIn * 25.4 - 911.2) < 0.01);
});

test('WLD aplica dos puertas desde 24 pulgadas sin cambiar la regla de altura', () => {
  const frente = calcular(24);
  assert.equal(frente.cant, 2);
  assert.ok(Math.abs(frente.largoIn * 25.4 - 301.6) < 0.01);
  assert.ok(Math.abs(frente.anchoIn * 25.4 - 911.2) < 0.01);
});
