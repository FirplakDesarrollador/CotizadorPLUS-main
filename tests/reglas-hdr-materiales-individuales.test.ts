import assert from 'node:assert/strict';
import test from 'node:test';
import { codigoComercial } from '../src/lib/module-groups';
import { aplicarMaterialesProyecto, personalizarMaterialesLinea } from '../src/lib/materiales-proyecto';

test('DB en todas sus variantes incluye cada dimensión no estándar, en cualquier unidad', () => {
  for (const pref of ['DB', 'DB-FE', 'DB-SM', 'DB-2-SM-SF', 'DB-3-SM-FE', 'DB-SMG']) {
    for (const [unidad, factor] of [['in', 1], ['cm', 2.54], ['mm', 25.4]] as const) {
      const base = { pref, unidad, sistema: 'imperial' as const, largo: 18 * factor };
      assert.ok(codigoComercial({ ...base, alto: 31 * factor, prof: 25 * factor }).startsWith('DB183125'));
      assert.ok(codigoComercial({ ...base, alto: 30 * factor, prof: 25 * factor }).startsWith('DB1825'));
      assert.ok(codigoComercial({ ...base, alto: 31 * factor, prof: 24 * factor }).startsWith('DB1831'));
      assert.equal(codigoComercial({ ...base, alto: 30 * factor, prof: 24 * factor }), codigoComercial({ ...base, unidad: 'in', largo: 18, alto: 30, prof: 24 }));
    }
  }
  for (const unidad of ['cm', 'mm'] as const) {
    const factor = unidad === 'cm' ? 1 : 10;
    assert.equal(codigoComercial({ pref: 'DB-2S-SMG', largo: 65 * factor, alto: 78.74 * factor, prof: 63.5 * factor, unidad, sistema: 'metrico' }), 'DB6578.7463.5-2S-SMG');
  }
});

test('las elecciones individuales sobreviven a aplicar y cambiar los globales sin modificarlos', () => {
  const global = { preset: { caja: 'CAJA', frente: 'FRENTE', refuerzo: 'CAJA', fondo: 'F6' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' };
  const input = { preset: { ...global.preset, frente: 'FRENTE_PERSONAL' }, cantoCaja: '19x1', cantoFrentes: '22x1', herrajesExcluidos: ['riel', 'barra'], conHerrajes: true };
  const antes = structuredClone(global);
  const individual = personalizarMaterialesLinea(input, global, 'DB');
  const siguienteGlobal = { ...global, preset: { ...global.preset, caja: 'CAJA_NUEVA', frente: 'FRENTE_NUEVO' }, cantoCaja: '19x0,6', cantoFrentes: '22x2' };
  const restaurado = aplicarMaterialesProyecto(individual, siguienteGlobal, 'DB');
  assert.equal(restaurado.preset.frente, 'FRENTE_PERSONAL');
  assert.equal(restaurado.preset.caja, 'CAJA_NUEVA');
  assert.equal(restaurado.cantoCaja, '19x1');
  assert.equal(restaurado.cantoFrentes, '22x2');
  assert.deepEqual(restaurado.herrajesExcluidos, ['riel', 'barra']);
  assert.deepEqual(global, antes);
  assert.deepEqual(aplicarMaterialesProyecto(restaurado, siguienteGlobal, 'DB'), restaurado);
});

test('volver a elegir los valores globales elimina la excepción individual', () => {
  const global = { preset: { caja: 'CAJA' }, cantoCaja: '19x1' };
  const resultado = personalizarMaterialesLinea({ ...global, personalizacionMateriales: { preset: { caja: 'OTRA' } } }, global, 'B');
  assert.deepEqual(resultado.personalizacionMateriales, { preset: {} });
  assert.equal(aplicarMaterialesProyecto(resultado, global, 'B').preset.caja, 'CAJA');
});
