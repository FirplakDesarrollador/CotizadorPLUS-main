import assert from 'node:assert/strict';
import test from 'node:test';
import {
  anchoCodigo,
  codigoGrupo,
  codigoModulo,
  convertirExacto,
  distribuirResiduoMoneda,
  indiceALetras,
  letrasAIndice,
  normalizarEtiquetaGrupo,
  redondearMoneda,
} from '@/lib/module-groups';

test('convierte índices de grupo en letras de Excel y permite el camino inverso', () => {
  const cases = new Map([
    [0, 'A'], [25, 'Z'], [26, 'AA'], [51, 'AZ'], [52, 'BA'], [701, 'ZZ'], [702, 'AAA'],
  ]);
  for (const [index, letters] of cases) {
    assert.equal(indiceALetras(index), letters);
    assert.equal(letrasAIndice(letters), index);
  }
});

test('cierra el residuo monetario en la última línea del grupo', () => {
  const distributed = distribuirResiduoMoneda([10.005, 10.005, 10.005]);
  assert.deepEqual(distributed, [10.01, 10.01, 10]);
  assert.equal(redondearMoneda(distributed.reduce((sum, value) => sum + value, 0)), 30.02);
  assert.deepEqual(distribuirResiduoMoneda([123.456]), [123.46]);
});

test('normaliza etiquetas editables y rechaza posiciones inválidas', () => {
  assert.deepEqual(normalizarEtiquetaGrupo(' a2 '), { letra: 'A', posicion: 2 });
  assert.deepEqual(normalizarEtiquetaGrupo('aa'), { letra: 'AA', posicion: null });
  assert.throws(() => normalizarEtiquetaGrupo('A0'), /Usa una letra/);
  assert.throws(() => normalizarEtiquetaGrupo('2A'), /Usa una letra/);
  assert.throws(() => normalizarEtiquetaGrupo('A-2'), /Usa una letra/);
});

test('convierte dimensiones y construye códigos sin redondear a anchos de catálogo', () => {
  assert.equal(convertirExacto(12, 'in', 'cm'), 30.48);
  assert.equal(convertirExacto(30.48, 'cm', 'in'), 12);
  assert.equal(anchoCodigo(12, 'in', 'imperial'), '12');
  assert.equal(anchoCodigo(30.48, 'cm', 'metrico'), '30.48');
  assert.equal(codigoModulo('B', 12, 'in', 'imperial'), 'B12');
  assert.equal(codigoModulo('IP', 50, 'cm', 'metrico'), 'IP50');
  assert.equal(codigoGrupo(['B12', 'DB10', 'BFD20']), 'B12.DB10.BFD20');
});
