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
