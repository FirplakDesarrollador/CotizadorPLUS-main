import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HdrTabla from '../src/app/hdr/HdrTabla';
import { calcularMueble } from '../src/lib/engine';

test('HDR identifica sin repetir todas las piezas: Z→AA, AZ→BA y ZZ→AAA', () => {
  const resultado = calcularMueble({
    dims: { L: 24, A: 30, P: 24 },
    piezas: [{ nombre: 'entrepano', rol_tablero: 'caja', formula_cantidad: '703', formula_largo: 'L', formula_ancho: 'P', cantos: {} }],
    reglas: [], preset: { caja: 'TAB15' }, tablerosByCode: { TAB15: { codigo: 'TAB15', precio_m2: 10, espesor_mm: 15 } },
    herrajesPlantilla: [], herrajesByCode: {}, cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0, usaCarton: false, margen: 0, trm: 4000, desperdicio: 0,
  });
  const html = renderToStaticMarkup(createElement(HdrTabla, { res: { ...resultado, trm: 4000, margen: 0 }, tableros: [{ codigo: 'TAB15', espesor_mm: 15 }], titulo: 'Regresión de identificadores', mostrarBotonExportar: false }));
  const cuerpo = html.match(/<tbody>([\s\S]*?)<\/tbody>/)![1];
  const letras = [...cuerpo.matchAll(/<tr[^>]*>\s*<td[^>]*>([A-Z]+)<\/td>/g)].map(m => m[1]);
  assert.equal(letras.length, 703);
  assert.equal(new Set(letras).size, 703);
  for (const [i, letra] of [[0, 'A'], [25, 'Z'], [26, 'AA'], [51, 'AZ'], [52, 'BA'], [701, 'ZZ'], [702, 'AAA']] as const) assert.equal(letras[i], letra);
  assert.equal((cuerpo.match(/<input/g) ?? []).length, 703, 'cada fila mantiene su propio campo de color');
});
