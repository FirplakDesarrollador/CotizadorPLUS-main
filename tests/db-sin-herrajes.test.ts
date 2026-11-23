import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput } from '../src/lib/engine';

const base: Omit<CalcInput, 'herrajesPlantilla'> = {
  dims:{ L:15, A:30, P:24 },
  // La cantidad de barras estabilizadoras se deriva del despiece —un par por cada
  // trasero de gaveta de 183mm— y no del `formula_cantidad` de la plantilla, así
  // que el fixture necesita esos traseros para que la fila de barra cuente.
  // La pieza va sin rol de tablero: solo importa para el conteo de barras.
  piezas:[{ nombre:'trasero_gaveta', rol_tablero:'', formula_cantidad:'2', formula_largo:'10', formula_ancho:'183/25.4', cantos:{} }],
  reglas:[], overrides:{},
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

test('DB65: desmarcar riel y barra elimina sus costos y volver a marcar los recupera', () => {
  const plantilla = [
    { rol: 'pata', herraje_codigo: 'PATA', selector_key: 'pata', formula_cantidad: '4' },
    { rol: 'tornillo', herraje_codigo: 'TORNILLO', selector_key: 'tornillo', formula_cantidad: '16' },
    { rol: 'riel', herraje_codigo: 'RIEL', selector_key: 'riel', formula_cantidad: '3' },
    { rol: 'barra', herraje_codigo: 'BARRA', selector_key: 'barra', formula_cantidad: '2' },
  ];
  const input = { ...base, herrajesPlantilla: plantilla, herrajesByCode: { ...base.herrajesByCode, PATA: { codigo: 'PATA', precio: 10 }, TORNILLO: { codigo: 'TORNILLO', precio: 1 } } };
  const con = calcularMueble(input);
  const sin = calcularMueble({ ...input, herrajesExcluidos: ['riel', 'barra'] });
  assert.deepEqual(sin.herrajes.map(h => [h.rol, h.cant]), [['pata', 4], ['tornillo', 16]]);
  assert.equal(sin.costoHerrajes, 56);
  assert.equal(con.costoHerrajes - sin.costoHerrajes, 340);
  assert.deepEqual(calcularMueble({ ...input, herrajesExcluidos: [] }), con);
  const heredada = calcularMueble({ ...input, herrajesPlantilla: plantilla.filter(h => h.rol !== 'barra'), herrajesExcluidos: ['riel', 'barra'] });
  assert.equal(heredada.costoHerrajes, 56, 'la barra automática tampoco debe reaparecer');
});
