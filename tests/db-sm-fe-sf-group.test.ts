import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { esTipologiaDbSmFeSf, obtenerTipologiasDbSmFeSf } from '../src/lib/muebles';

const simulator = readFileSync('src/app/cotizador/CotizadorForm.tsx', 'utf8');
const quotes = readFileSync('src/app/cotizaciones/[id]/AddLineForm.tsx', 'utf8');
const hdr = readFileSync('src/app/hdr/HdrBuscador.tsx', 'utf8');

const variantes = [
  'DB-2S-SM-FE-SF',
  'DB-2-SM-FE-SF',
  'DB-2-1INT-SM-FE-SF',
];

test('DB-SM-FE-SF reconoce y ordena las variantes activas como una familia', () => {
  for (const pref of variantes) assert.equal(esTipologiaDbSmFeSf(pref), true, pref);
  const tipos = variantes.map((pref) => ({ pref, id: `id-${pref}` }));
  assert.deepEqual(obtenerTipologiasDbSmFeSf(tipos).map((tipo) => tipo.pref), [
    'DB-2-1INT-SM-FE-SF',
    'DB-2-SM-FE-SF',
    'DB-2S-SM-FE-SF',
  ]);
});

test('Simulador, Cotizaciones y HDR muestran una sola familia con selector interno', () => {
  for (const source of [simulator, quotes, hdr]) {
    assert.match(source, /DB_SM_FE_SF_GROUP_VALUE = '__DB_SM_FE_SF__'/);
    assert.equal((source.match(/DB-SM-FE-SF — Cajoneras con Gola, riel Full Extension y sin fondo/g) ?? []).length, 1);
    assert.match(source, /tipologiasDbSmFeSf\.map/);
    assert.match(source, /label="Tipología DB-SM-FE-SF"/);
  }
});

test('los formularios activan Gola, sin fondo y RIELFE500 para DB-SM-FE-SF', () => {
  for (const source of [simulator, quotes]) {
    assert.match(source, /esTipologiaDbSmFeSf/);
    assert.match(source, /RIELFE500/);
  }
  assert.match(quotes, /esTipologiaDbSmFeSf\(nuevoTipo\?\.pref\).*setConFondo\(false\)/);
});
