import assert from 'node:assert/strict';
import test from 'node:test';
import { cantidadBisagras } from '../src/lib/bisagras';
import { calcularMueble } from '../src/lib/engine';

test('las bandas corresponden al alto de fabricación en mm, cm o pulgadas', () => {
  for (const [mm, esperado] of [[1200, 2], [1201, 3], [1800, 3], [1801, 5], [2400, 5], [2401, 4]]) {
    for (const anchoIn of [mm / 25.4, (mm / 10) / 2.54]) {
      assert.equal(cantidadBisagras([{ pieza: 'puerta', cant: 1, anchoIn }], 'BISAGRA', 4), esperado, String(mm));
    }
  }
});

test('suma alturas por hoja, mantiene el SKU por par y excluye frentes de gaveta', () => {
  const piezas = [
    { pieza: 'puerta_inferior', cant: 2, anchoIn: 2000 / 25.4 },
    { pieza: 'puerta_superior', cant: 1, anchoIn: 1300 / 25.4 },
    { pieza: 'frente_gaveta', cant: 4, anchoIn: 200 / 25.4 },
  ];
  assert.equal(cantidadBisagras(piezas, 'BISAGRAPAR', 4), 6.5);
  assert.equal(cantidadBisagras(piezas, 'BISAGRAPAR', 0), 0);
  assert.equal(cantidadBisagras([{ pieza: 'panel', cant: 1, anchoIn: 90 }], 'BISAGRAPAR', 1), 1);
});

test('el motor pesa el costo de bisagras por par y conserva exclusiones', () => {
  const calc: Parameters<typeof calcularMueble>[0] = {
    dims: { L: 20, A: 1800 / 25.4, P: 16 },
    piezas: [{ nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} }],
    reglas: [], preset: { frente: 'C18' }, tablerosByCode: { C18: { codigo: 'C18', precio_m2: 100, espesor_mm: 18 } },
    herrajesPlantilla: [{ rol: 'bisagra', selector_key: 'bisagra', herraje_codigo: 'BISAGRAPAR', formula_cantidad: '1' }],
    herrajesByCode: { BISAGRAPAR: { codigo: 'BISAGRAPAR', precio: 10_000 } },
    cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 4000, desperdicio: 0,
  };
  const resultado = calcularMueble(calc);
  assert.equal(resultado.herrajes[0].cant, 1.5);
  assert.equal(resultado.costoHerrajes, 15_000);
  assert.equal(calcularMueble({ ...calc, modoFrentes: 'sin_frentes' }).costoHerrajes, 0);
  assert.equal(calcularMueble({ ...calc, herrajesExcluidos: ['bisagra'] }).costoHerrajes, 0);
});
