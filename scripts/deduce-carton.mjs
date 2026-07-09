#!/usr/bin/env node
// Deducción de la regla de CARTÓN y ETIQUETAS del Excel (fórmulas quemadas).
// Aísla: cartón+etiquetas = COSTO_MP/u − madera(15%) − canto − wooden_pins − shelf_pins.
import fs from 'node:fs'; import path from 'node:path'; import ExcelJS from 'exceljs';
const IN2CM = 2.54;
const P = { caja: 35608.70733673743, ref: 35608.70733673743, fr: 48529.96506315506, fon: 29726.999910418344 };
const CANTO = { c22: 980, c19: 400 };
const PR = { tarugo: 142.56, soporte: 47, carton: 6886, etiqueta: 594 };

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('Cotizaciones de muestra/25083 - Related Urban Construction - Flagler Villas - Cambios de marzo 3 Cotización - COPIA.xlsx');
const sh = wb.getWorksheet('Cabinets'); const v = (r, c) => { const x = sh.getCell(r, c).value; return Number((x && typeof x === 'object' && 'result' in x) ? x.result : x) || 0; };

// dims conocidas por SKU (W×H×D, pulgadas)
const DIMS = {
  BFD30: [30, 30, 24], BFD15: [15, 30, 24], BFD9: [9, 30, 24], BFD27: [27, 30, 24], SBFD33: [33, 30, 24],
  'DB15-1s': [15, 30, 24], W3022: [30, 22, 12], W3036: [30, 36, 12], W1236: [12, 36, 12], W2736: [27, 36, 12],
  W3019: [30, 19, 12], W1536: [15, 36, 12], W3336: [33, 36, 12], W2136: [21, 36, 12],
};
const seen = new Set();
console.log('SKU'.padEnd(9) + 'WxHxD'.padStart(11) + 'MP/u'.padStart(9) + 'madera'.padStart(8) + 'canto'.padStart(7) + 'pins'.padStart(6) + 'CART+ETIQ'.padStart(10) + '  nuestroCart(und)');
for (let r = 47; r <= sh.rowCount; r++) {
  const sku = sh.getCell(r, 7).value; const s = (sku && typeof sku === 'object' && 'result' in sku) ? sku.result : sku;
  if (!s || seen.has(s) || !DIMS[s]) continue; seen.add(s);
  const q = v(r, 23) || 5;
  const mp = v(r, 61) / q;
  const madera = (v(r, 56) / q) * P.caja + (v(r, 57) / q) * P.ref + (v(r, 55) / q) * P.fr + (v(r, 59) / q) * P.fon;
  const canto = (v(r, 52) / q) * CANTO.c22 + (v(r, 53) / q) * CANTO.c19 + (v(r, 54) / q) * CANTO.c19;
  const pins = (v(r, 46) / q) * PR.tarugo + (v(r, 40) / q) * PR.soporte;   // wooden pins + shelf pins
  const cartEtiq = mp - madera - canto - pins;
  // nuestro cartón (unidades) con la fórmula actual
  const d = [...DIMS[s]].sort((a, b) => b - a);
  const cartU = Math.round((((d[0] * 2 * IN2CM) / 200) * ((d[1] * 2 * IN2CM) / 130)) * 10) / 10;
  console.log(s.padEnd(9) + DIMS[s].join('x').padStart(11) + mp.toFixed(0).padStart(9) + madera.toFixed(0).padStart(8) + canto.toFixed(0).padStart(7) + pins.toFixed(0).padStart(6) + cartEtiq.toFixed(0).padStart(10) + '   ' + cartU);
}
console.log('\nCART+ETIQ = lo que el Excel mete en MP por encima de madera/canto/pins.');
console.log('Si ETIQ es fijo (n×594) y CART = und×6886, deduzco ambos comparando tamaños.');
