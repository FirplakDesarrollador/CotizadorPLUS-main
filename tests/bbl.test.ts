import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

const reglas: Regla[] = [
  { tipo_mueble_id: 'bblfd', variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 5 },
];

const piezas: Pieza[] = [
  {
    nombre: 'puerta', rol_tablero: 'frente', formula_cantidad: 'n_puertas',
    formula_largo: '(L-P)/n_puertas', formula_ancho: 'A', cantos: {},
  },
  {
    nombre: 'frente_falso', rol_tablero: 'frente', formula_cantidad: '1',
    formula_largo: 'P', formula_ancho: 'A', cantos: {},
  },
];

function input(overrides?: Record<string, number>, L = 42): CalcInput {
  return {
    dims: { L, A: 30, P: 24 }, piezas, reglas, overrides,
    preset: { frente: 'FRONT' },
    tablerosByCode: { FRONT: { codigo: 'FRONT', precio_m2: 1 } },
    cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {},
    etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
}

test('BBLFD automático deja un frente falso de 24 pulgadas', () => {
  const result = calcularMueble(input());
  const puerta = result.piezas.find((p) => p.pieza === 'puerta');
  const falso = result.piezas.find((p) => p.pieza === 'frente_falso');
  assert.equal(puerta?.largoIn, 18);
  assert.equal(falso?.largoIn, 24);
  assert.equal((puerta?.largoIn ?? 0) + (falso?.largoIn ?? 0), 42);
});

test('BBLFD divide el vano entre dos puertas sin perder el cierre frontal', () => {
  const result = calcularMueble(input({ n_puertas: 2 }, 45));
  const puerta = result.piezas.find((p) => p.pieza === 'puerta');
  const falso = result.piezas.find((p) => p.pieza === 'frente_falso');
  assert.equal(puerta?.cant, 2);
  assert.equal(puerta?.largoIn, 10.5);
  assert.equal(falso?.largoIn, 24);
  assert.equal((puerta?.cant ?? 0) * (puerta?.largoIn ?? 0) + (falso?.largoIn ?? 0), 45);
});
