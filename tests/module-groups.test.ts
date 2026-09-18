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
  parseMedida,
  redondearMoneda,
  sufijoSistemaFrente,
  codigoComercial,
  incluyeAltoEnCodigo,
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

test('en prefijos con sufijo (FE) la medida va después de la letra base, no al final', () => {
  assert.equal(codigoModulo('B-FE', 12, 'in', 'imperial'), 'B12-FE');
  assert.equal(codigoModulo('UB-FE', 12, 'in', 'imperial'), 'UB12-FE');
  assert.equal(codigoModulo('V-FE', 30, 'in', 'imperial'), 'V30-FE');
  assert.equal(codigoModulo('B-FE', 30.48, 'cm', 'metrico'), 'B30.48-FE');
  // Los prefijos sin guion conservan la medida al final: cotizaciones.ts les
  // concatena después el alto (W/PN) o la tipología (DB).
  assert.equal(codigoModulo('SBFD', 30, 'in', 'imperial'), 'SBFD30');
  assert.equal(codigoModulo('W', 36, 'in', 'imperial') + anchoCodigo(14, 'in', 'imperial'), 'W3614');
  assert.equal(codigoModulo('DB', 18, 'in', 'imperial') + '-1S', 'DB18-1S');
});

test('sistema de frente gola agrega sufijo comercial SM', () => {
  assert.equal(sufijoSistemaFrente('manija'), '');
  assert.equal(sufijoSistemaFrente('gola'), '-SM');
  assert.equal(codigoModulo('W', 29, 'in', 'imperial') + anchoCodigo(36, 'in', 'imperial') + sufijoSistemaFrente('gola'), 'W2936-SM');
});

test('los superiores de la familia W y los paneles PN llevan el alto en el código', () => {
  for (const pref of ['W', 'WBL', 'WER', 'WLD', 'WPC', 'PN']) {
    assert.equal(incluyeAltoEnCodigo(pref), true, pref);
  }
  // WCC es un módulo de clóset, no un superior de pared; B/DB/SBFD tienen alto implícito.
  for (const pref of ['WCC', 'B', 'DB', 'SBFD', 'S', 'UW']) {
    assert.equal(incluyeAltoEnCodigo(pref), false, pref);
  }
});

test('codigoComercial arma el código final completo', () => {
  const base = { unidad: 'in', sistema: 'imperial' } as const;
  // El caso del reporte: superior de pared con gola.
  assert.equal(codigoComercial({ ...base, pref: 'W', largo: 29, alto: 36, sistemaFrente: 'gola' }), 'W2936-SM');
  assert.equal(codigoComercial({ ...base, pref: 'W', largo: 29, alto: 36, sistemaFrente: 'manija' }), 'W2936');
  assert.equal(codigoComercial({ ...base, pref: 'WER', largo: 24, alto: 36, sistemaFrente: 'gola' }), 'WER2436-SM');
  // Sin alto en el código: el alto no entra aunque venga en el input.
  assert.equal(codigoComercial({ ...base, pref: 'B', largo: 12, alto: 34.5, sistemaFrente: 'gola' }), 'B12-SM');
  // Tipología DB y prefijo con guion (FE) conviven con el sufijo SM.
  assert.equal(codigoComercial({ ...base, pref: 'DB', largo: 18, alto: 34.5, dbTipo: 'DB-1S', sistemaFrente: 'gola' }), 'DB18-1S-SM');
  assert.equal(codigoComercial({ ...base, pref: 'B-FE', largo: 12, alto: 34.5, sistemaFrente: 'gola' }), 'B12-FE-SM');
  // PCFD con gavetas ocultas.
  assert.equal(codigoComercial({ ...base, pref: 'PCFD', largo: 12, alto: 96, pcfdCajones: 2 }), 'PCFD12-2OP-PUSH');
  // Sistema métrico.
  assert.equal(codigoComercial({ pref: 'W', largo: 73.66, alto: 91.44, unidad: 'cm', sistema: 'metrico', sistemaFrente: 'gola' }), 'W73.6691.44-SM');
});

test('interpreta medidas en fracción imperial sin corromperse a NaN/0', () => {
  assert.equal(parseMedida('24 7/8'), 24.875);
  assert.equal(parseMedida('24-7/8'), 24.875);
  assert.equal(parseMedida('7/8'), 0.875);
  assert.equal(parseMedida('24.875'), 24.875);
  assert.equal(parseMedida('24'), 24);
  assert.equal(parseMedida('  30  '), 30);
  assert.equal(parseMedida('24 7/8"'), 24.875);
  assert.ok(Number.isNaN(parseMedida('')));
  assert.ok(Number.isNaN(parseMedida('abc')));
});
