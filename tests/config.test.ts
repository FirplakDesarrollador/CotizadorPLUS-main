import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarConfig } from '../src/lib/corte/config';

// Parametros de planta del optimizador: lo que llega de `cot_parametros` puede venir
// incompleto, con comas decimales o con llaves que ya no existen, asi que
// `normalizarConfig` tiene que devolver siempre una configuracion usable.

test('el presupuesto de busqueda tiene valores por defecto y se puede ajustar', () => {
  const d = normalizarConfig(undefined);
  assert.equal(d.iteraciones, 2000, 'combinaciones de acomodo por material');
  assert.equal(d.tiempoMaxMs, 150, 'tope por material, en ms');
  assert.equal(d.repartoTiempoMs, 5000, 'tope de la busqueda de reparto entre dias');

  const c = normalizarConfig({ iteraciones: 500, tiempoMaxMs: 300, repartoTiempoMs: 60_000 });
  assert.equal(c.iteraciones, 500);
  assert.equal(c.tiempoMaxMs, 300);
  assert.equal(c.repartoTiempoMs, 60_000);
});

test('las decisiones de planta D4 y D5 llegan con el valor por defecto', () => {
  const d = normalizarConfig(undefined);
  assert.equal(d.toleranciaRitmoPct, 0, 'D4: el ritmo diario es exacto');
  assert.equal(d.diasExtraPermitidos, 0, 'D5: no se agregan dias');
  const c = normalizarConfig({ toleranciaRitmoPct: 10, diasExtraPermitidos: 2 });
  assert.equal(c.toleranciaRitmoPct, 10);
  assert.equal(c.diasExtraPermitidos, 2);
});

test('un presupuesto absurdo se recorta en vez de colgar la pantalla', () => {
  const c = normalizarConfig({
    iteraciones: -5, tiempoMaxMs: 999_999, repartoTiempoMs: 99_999_999,
    toleranciaRitmoPct: 500, diasExtraPermitidos: -3,
  });
  assert.equal(c.iteraciones, 0, 'negativo se trata como sin busqueda');
  assert.equal(c.tiempoMaxMs, 10_000, 'tope duro por material');
  assert.equal(c.repartoTiempoMs, 900_000, 'tope de seguridad de 15 minutos');
  assert.equal(c.toleranciaRitmoPct, 100);
  assert.equal(c.diasExtraPermitidos, 0);
});

test('un valor no numerico cae al defecto en vez de propagar NaN', () => {
  const c = normalizarConfig({ iteraciones: 'muchas', repartoTiempoMs: null, toleranciaRitmoPct: {} });
  assert.equal(c.iteraciones, 2000);
  assert.equal(c.repartoTiempoMs, 5000);
  assert.equal(c.toleranciaRitmoPct, 0);
});

test('normalizarConfig corrige valores inválidos sin perder los válidos', () => {
  const c = normalizarConfig({
    discoMm: '4,6', refiladoMm: 20, refiladoMaxMm: 9, piezasPorDia: -3, nivelesCorte: 2.6,
    pilas: [{ espesorMm: 18, laminas: 3 }, { espesorMm: 'x', laminas: 2 }],
    formatos: [{ codigo: ' 183x244 ', largoMm: 1830, anchoMm: 2440 }, { codigo: '183X244', largoMm: 1, anchoMm: 1 }],
    criterio: ['cortes', 'inventado', 'cortes'],
  });
  assert.equal(c.discoMm, 4.6);
  assert.equal(c.refiladoMm, 9, 'el refilado no puede pasar del máximo');
  assert.equal(c.piezasPorDia, 0);
  assert.equal(c.nivelesCorte, 3);
  assert.deepEqual(c.pilas, [{ espesorMm: 18, laminas: 3 }]);
  assert.deepEqual(c.formatos, [{ codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true }], 'largo = lado mayor y sin duplicados');
  assert.deepEqual(c.criterio, ['cortes', 'desperdicio', 'laminas', 'sobrante_ultima']);
});
