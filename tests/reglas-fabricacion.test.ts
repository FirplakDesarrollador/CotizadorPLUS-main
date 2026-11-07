import assert from 'node:assert/strict';
import test from 'node:test';
import { ajustarEntrepanos, requiereSepararModulo } from '../src/lib/reglas-fabricacion';
import { evalExpr, calcularMueble, type CalcInput } from '../src/lib/engine';

test('profundidad de entrepaños: límites exactos, medidas intermedias y excepciones', () => {
  const piezas = [{ nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: 'P', resta_ancho: 0.25 }];
  for (const pref of ['BFD', 'BFD-SM', 'OW', 'W', 'PCFD-MO']) {
    const [pieza] = ajustarEntrepanos(piezas, pref);
    for (const [profMm, esperado] of [[304.8, 266.7], [584.2, 546.1], [590, 539.2], [609.6, 558.8], [635, 584.2]]) {
      assert.ok(Math.abs(Number(evalExpr(pieza.formula_ancho, { P: profMm / 25.4 })) * 25.4 - esperado) < 0.001);
      assert.equal(pieza.resta_ancho, 0);
    }
  }
  for (const [pref, mm] of [['B', 300], ['B-FE', 300], ['B-SF', 350]] as const) {
    for (const P of [12, 23, 24, 30]) assert.ok(Math.abs(Number(evalExpr(ajustarEntrepanos(piezas, pref)[0].formula_ancho, { P })) * 25.4 - mm) < 0.001);
  }
  assert.equal(piezas[0].formula_ancho, 'P');
  assert.equal(piezas[0].resta_ancho, 0.25);
});

test('cantos de abiertos: frente prevalece incluso sobre forceCalibre sin añadir aristas', () => {
  const input: CalcInput = {
    dims: { L: 24, A: 30, P: 24 }, piezas: [
      { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: { calibre: '22x1', forceCalibre: true, largos: 2, anchos: 1 } },
      { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2 } },
      { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} },
    ], reglas: [], preset: { caja: 'F18', refuerzo: 'F18', frente: 'F18', fondo: 'F6' },
    tablerosByCode: { F18: { codigo: 'F18', espesor_mm: 18, precio_m2: 10 }, F6: { codigo: 'F6', espesor_mm: 6, precio_m2: 5 } },
    herrajesPlantilla: [], cantosByCalibre: { '22X2': { calibre: '22x2', precio: 1 } }, herrajesByCode: {}, consumiblesBySelector: {},
    etiquetasUnd: 0, usaCarton: false, margen: 0, trm: 4000, desperdicio: 0, cantoCaja: '19x0,45', cantoFrentes: '22x2', cantoFrentesEnTodasLasPiezas: true,
  };
  const result = calcularMueble(input);
  assert.equal(result.piezas[0].cantoCalibre, '22x2');
  assert.equal(result.piezas[1].cantoCalibre, '22x2');
  assert.equal(result.piezas[0].cantoAnchos, 1);
  assert.equal(result.piezas[1].cantoAnchos, 0);
  assert.equal(result.piezas[2].cantoCalibre, null);
  assert.equal(result.piezas[2].cantoLargos, 0);
});

test('editar una estructura compartida separa el módulo; frentes y herrajes compatibles siguen individuales', () => {
  const original = { preset: { caja: 'C15', refuerzo: 'C15', frente: 'F18', fondo: 'F6' }, cantoCaja: '19x0,45', largo: 24, alto: 30, prof: 24, unidad: 'in' as const, cantidad: 1 };
  assert.equal(requiereSepararModulo(original, { ...original, preset: { ...original.preset, caja: 'OTRO15' } }), true);
  assert.equal(requiereSepararModulo(original, { ...original, cantoCaja: '19x1' }), true);
  assert.equal(requiereSepararModulo(original, { ...original, prof: 25 }), true);
  assert.equal(requiereSepararModulo(original, { ...original, cantidad: 2 }), true);
  assert.equal(requiereSepararModulo(original, { ...original, preset: { ...original.preset, frente: 'OTRO_FRENTE18' } }), false);
  assert.equal(requiereSepararModulo(original, { ...original }), false);
});
