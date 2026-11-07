import test from 'node:test';
import assert from 'node:assert/strict';
import { derivarVars, toInches, evalExpr, type Pieza, type Regla } from '../src/lib/engine';
import { orientarPieza } from '../src/lib/muebles';
import { normalizarPlantillasFabricacion, normalizarReglasPuertas } from '../src/lib/reglas-fabricacion';

test('umbral de puertas equivalente antes, en y después de 609,6 mm, sin cambiar overrides', () => {
  const reglas: Regla[] = [
    { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
    { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
    { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
  ];
  const normalizadas = normalizarReglasPuertas(reglas);
  for (const unidad of ['mm', 'cm', 'in'] as const) {
    for (const [mm, cantidad] of [[609.5, 1], [609.6, 2], [609.7, 2], [580, 1]] as const) {
      const valor = unidad === 'mm' ? mm : unidad === 'cm' ? mm / 10 : mm / 25.4;
      assert.equal(derivarVars(normalizadas, { L: toInches(valor, unidad), A: 48, P: 24 }).n_puertas, cantidad, `${unidad}/${mm}`);
    }
  }
  assert.equal(derivarVars(normalizadas, { L: 30, A: 48, P: 24 }, { n_puertas: 4 }).n_puertas, 4);
  assert.equal(reglas[0].condicion, 'L <= 21');
});

test('puertas muestran el alto en largo incluso cuando el ancho es mayor; normalización idempotente', () => {
  const original: Pieza = { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'A-RV', formula_ancho: 'L-RV', visualizacion: { version: 1, funcion: 'frente', plano: 'XZ', intercambiar: true } };
  const corregida = normalizarPlantillasFabricacion([original], 'BOV')[0];
  for (const L of [600, 1500]) {
    const vars = { L: L / 25.4, A: 1200 / 25.4, RV: 3.2 / 25.4 };
    const visible = orientarPieza({ rol: 'frente', pieza: 'frente', largoIn: Number(evalExpr(corregida.formula_largo, vars)), anchoIn: Number(evalExpr(corregida.formula_ancho, vars)) });
    assert.ok(Math.abs(visible.largoIn * 25.4 - 1196.8) < 1e-6);
    assert.ok(Math.abs(visible.anchoIn * 25.4 - (L - 3.2)) < 1e-6);
  }
  assert.equal(corregida.visualizacion?.intercambiar, false);
  assert.deepEqual(normalizarPlantillasFabricacion([corregida], 'BOV'), [corregida]);
  assert.equal(original.formula_largo, 'A-RV');
  const gaveta = normalizarPlantillasFabricacion([{ ...original, nombre: 'frente_gaveta', formula_largo: '332.8/25.4' }], 'BOMH-1')[0];
  assert.equal(gaveta.formula_largo, 'L-RV');
  assert.equal(gaveta.formula_ancho, '332.8/25.4');
});

test('base/tapa/refuerzos/golas conservan calibre y enchapan solo largos, sin alterar laterales ni gavetas', () => {
  const pieza: Pieza = { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: { calibre: '22x1', largos: 0, anchos: 2, forceCalibre: true } };
  for (const nombre of ['base', 'base_tapa', 'tapa', 'refuerzo_delantero', 'gola_madera', 'base_inferior']) {
    const corregida = normalizarPlantillasFabricacion([{ ...pieza, nombre }], 'W')[0];
    assert.deepEqual(corregida.cantos, { calibre: '22x1', largos: 2, anchos: 0, forceCalibre: true });
    assert.deepEqual(normalizarPlantillasFabricacion([corregida], 'W'), [corregida]);
  }
  for (const nombre of ['lateral', 'base_gaveta', 'frente', 'trasero_gaveta_grande']) {
    const sinCambio = { ...pieza, nombre };
    assert.deepEqual(normalizarPlantillasFabricacion([sinCambio], 'W'), [sinCambio]);
  }
  assert.equal(pieza.cantos?.anchos, 2);
});
