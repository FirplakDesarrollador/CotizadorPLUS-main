import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '../src/lib/engine';

const pieza = (ancho: string, cantidad: string): Pieza => ({
  nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: cantidad,
  formula_largo: 'L-4.607', formula_ancho: ancho, cantos: {},
});

function calcular(traseros: Pieza[]) {
  const input: CalcInput = {
    dims: { L: 30, A: 30, P: 24 }, piezas: traseros, reglas: [], overrides: {},
    herrajesPlantilla: [{ rol: 'barra', herraje_codigo: 'BARRAEST', selector_key: 'barra', formula_cantidad: '0' }],
    preset: { refuerzo: 'REF' }, tablerosByCode: { REF: { codigo: 'REF', precio_m2: 1, espesor_mm: 15 } },
    cantosByCalibre: {}, herrajesByCode: { BARRAEST: { codigo: 'BARRAEST', precio: 321 } },
    consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
  return calcularMueble(input);
}

test('cada trasero de gaveta de 183mm agrega un par de barras', () => {
  const result = calcular([pieza('183/25.4', '3')]);
  const barra = result.herrajes.find((h) => h.rol === 'barra')!;
  assert.equal(barra.cant, 3);
  assert.equal(barra.costo, 963);
});

test('traseros de 68mm no agregan barras estabilizadoras', () => {
  const result = calcular([pieza('68/25.4', '2')]);
  assert.equal(result.herrajes.find((h) => h.rol === 'barra')?.cant, 0);
});
