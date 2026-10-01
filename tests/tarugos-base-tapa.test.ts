import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '../src/lib/engine';

const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: {}, tarugos: 8 },
  { nombre: 'tapa', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: {}, tarugos: 8 },
  { nombre: 'base_gaveta', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'L', formula_ancho: 'P', cantos: {}, tarugos: 0 },
];

const input: CalcInput = {
  dims: { L: 30, A: 30, P: 24 }, piezas, reglas: [], herrajesPlantilla: [], overrides: {},
  preset: { caja: 'CAJA' },
  tablerosByCode: { CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 } },
  cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: { tarugo: 50 },
  etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
};

test('base y tapa consumen ocho tarugos por pieza; base_gaveta no consume', () => {
  const result = calcularMueble(input);
  assert.equal(result.cantidadesConsumibles.tarugos, 16, '8 por la base + 8 por la tapa');
  assert.equal(result.consumibles.tarugos, 800, '16 tarugos × $50');
});
