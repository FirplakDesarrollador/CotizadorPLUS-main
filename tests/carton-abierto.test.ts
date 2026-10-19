import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput } from '../src/lib/engine';

// Excel CEMA, columna Z ("Costo Carton") en 'Costos Muebles': las 36 filas O*
// revisadas (OB, OBFD, OSBFD, OSVFD, OV, OW, ODB, OBBLFD, OPC — modo "abierto",
// sin puertas) dan Z=0, mientras que la misma tipología sin el modificador O*
// sí trae cartón. La fórmula de `cartonUnd` en engine.ts no distinguía `modo`,
// así que un BFD9 "abierto" (sin_frentes) seguía cobrando el mismo cartón que
// un BFD9 normal ($4.820,20 con precio unitario $6.886, según cot_herrajes).
const UNIT_PRICE = 6886;

function input(modoFrentes: CalcInput['modoFrentes']): CalcInput {
  return {
    dims: { L: 9, A: 30, P: 24 },
    piezas: [],
    reglas: [],
    preset: {},
    tablerosByCode: {},
    cantosByCalibre: {},
    herrajesByCode: {},
    consumiblesBySelector: { carton: UNIT_PRICE },
    etiquetasUnd: 0,
    usaCarton: true,
    margen: 0,
    margenHerraje: 0,
    trm: 1,
    desperdicio: 0,
    modoFrentes,
  };
}

function inputConHerrajes(modoFrentes: CalcInput['modoFrentes'], conFrente: boolean): CalcInput {
  return {
    ...input(modoFrentes),
    piezas: conFrente ? [{
      nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1',
      formula_largo: 'L', formula_ancho: 'A', cantos: {},
    }] : [],
    preset: conFrente ? { frente: 'FRENTE' } : {},
    tablerosByCode: conFrente ? { FRENTE: { codigo: 'FRENTE', precio_m2: 0 } } : {},
    herrajesPlantilla: [
      { rol: 'pata', herraje_codigo: 'PATA', selector_key: 'pata', formula_cantidad: '4' },
      { rol: 'bisagra', herraje_codigo: 'BISAGRA', selector_key: 'bisagra', formula_cantidad: '2' },
      { rol: 'manija', herraje_codigo: 'MANIJA', selector_key: 'manija', formula_cantidad: '1' },
    ],
    herrajesByCode: {
      PATA: { codigo: 'PATA', precio: 10 },
      BISAGRA: { codigo: 'BISAGRA', precio: 20 },
      MANIJA: { codigo: 'MANIJA', precio: 30 },
    },
  };
}

test('BFD9 normal (con frentes) sí paga cartón, igual al Excel ($4.820,20)', () => {
  const r = calcularMueble(input('normal'));
  assert.ok(Math.abs(r.consumibles.carton - 4820.2) < 0.1, `carton=${r.consumibles.carton} debería ser ≈4820.20`);
});

test('OBFD9 (modo sin_frentes, "abierto") no paga cartón, igual al Excel (Z=0)', () => {
  const r = calcularMueble(input('sin_frentes'));
  assert.equal(r.consumibles.carton, 0, 'una carcasa abierta sin puertas no se empaca en cartón');
});

test('usaCarton=false del tipo sigue anulando el cartón sin importar el modo', () => {
  const inp = { ...input('normal'), usaCarton: false };
  const r = calcularMueble(inp);
  assert.equal(r.consumibles.carton, 0);
});

test('un módulo sin puertas excluye manijas y bisagras, pero conserva herrajes estructurales', () => {
  const r = calcularMueble(inputConHerrajes('normal', false));
  assert.deepEqual(r.herrajes.map((herraje) => herraje.rol), ['pata']);
  assert.equal(r.costoHerrajes, 40);
});

test('modo sin_frentes aplica la misma regla aunque la plantilla original tenga puertas', () => {
  const r = calcularMueble(inputConHerrajes('sin_frentes', true));
  assert.deepEqual(r.herrajes.map((herraje) => herraje.rol), ['pata']);
});

test('un módulo con frente conserva bisagras y manijas', () => {
  const r = calcularMueble(inputConHerrajes('normal', true));
  assert.deepEqual(r.herrajes.map((herraje) => herraje.rol), ['pata', 'bisagra', 'manija']);
});
