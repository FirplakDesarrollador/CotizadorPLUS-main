import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarConfig } from '../src/lib/corte/config';
import { construirListaCorte } from '../src/lib/corte/lista';

const cfg = normalizarConfig({ refiladoMm: 5 });
const tablero = { codigo: 'T', formato: '183X244', espesor_mm: 18 };
const modulo = (largoMm: number) => ({
  codigo: 'PN', cantidad: 1, tableroPorRol: { frente: 'T' },
  piezas: [{ pieza: 'panel', rol: 'frente', cant: 1, largoIn: largoMm / 25.4, anchoIn: 1830 / 25.4, cantoLargos: 0, cantoAnchos: 0, cantoCalibre: null }],
});

test('conserva el nominal del despiece y contabiliza el área útil de una lámina completa', () => {
  const lista = construirListaCorte([modulo(2440)], [tablero], cfg);
  assert.equal(lista.filas[0].largoMm, 2440);
  assert.equal(lista.totalPiezas, 1);
  const [material] = lista.materiales;
  assert.equal(material.areaNetaM2, 4.42);
  assert.equal(material.laminasMinimas, 1);
  assert.ok(material.alertas.includes('Hay medidas nominales que incluyen refilado'));
  assert.ok(!material.alertas.includes('Hay piezas más grandes que la lámina útil'));
});

test('la lista avisa si la medida rebasa el formato bruto', () => {
  const [material] = construirListaCorte([modulo(2441)], [tablero], cfg).materiales;
  assert.ok(material.alertas.includes('Hay piezas más grandes que la lámina útil'));
  assert.ok(!material.alertas.includes('Hay medidas nominales que incluyen refilado'));
});
