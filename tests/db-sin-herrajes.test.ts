import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput } from '../src/lib/engine';

const base: Omit<CalcInput, 'herrajesPlantilla'> = {
  dims:{ L:15, A:30, P:24 }, piezas:[], reglas:[], overrides:{},
  preset:{}, tablerosByCode:{}, cantosByCalibre:{}, herrajesByCode:{ RIEL:{ codigo:'RIEL',precio:100 }, BARRA:{ codigo:'BARRA',precio:20 } },
  consumiblesBySelector:{}, etiquetasUnd:0, margen:0, margenHerraje:0, trm:1, desperdicio:0,
};

test('una tipología DB puede excluir todos sus herrajes', () => {
  const conHerrajes=calcularMueble({ ...base, herrajesPlantilla:[
    { rol:'riel',herraje_codigo:'RIEL',selector_key:'riel',formula_cantidad:'3' },
    { rol:'barra',herraje_codigo:'BARRA',selector_key:'barra',formula_cantidad:'2' },
  ] });
  const sinHerrajes=calcularMueble({ ...base, herrajesPlantilla:[] });
  assert.equal(conHerrajes.costoHerrajes,340);
  assert.equal(sinHerrajes.costoHerrajes,0);
  assert.deepEqual(sinHerrajes.herrajes,[]);
});
