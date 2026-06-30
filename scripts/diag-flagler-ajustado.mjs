#!/usr/bin/env node
// Análisis comparativo con REGLAS AJUSTADAS (header del proyecto): madera 10%, margen 55.8%,
// hardware 30%, adicional 10%, TRM 3750.
//   - "Excel ajustado": re-calcula desde la propia base de costo del Excel (sus columnas de
//      tablero/canto/MP), re-basando la madera de 15% -> 10%, y pasando por la cadena del header.
//   - "PLUS": nuestro motor con desperdicio 10% y la misma cadena.
// Verdad de costo: hoja "Cabinets" del archivo real.
import fs from 'node:fs'; import path from 'node:path'; import ExcelJS from 'exceljs';
for (const line of fs.readFileSync(path.resolve('.env.local'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: `Bearer ${SR}` };
const rest = async (q) => (await fetch(`${URL}/rest/v1/${q}`, { headers: H })).json();
const IN2CM = 2.54, norm = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, '');
const ev = (e, v) => { if (e == null || e === '') return 0; const k = Object.keys(v); const f = new Function(...k, `"use strict";return (${e});`); const r = f(...k.map((x) => v[x])); return typeof r === 'boolean' ? r : Number(r); };
const derive = (R, d) => { const o = {}, b = {}; for (const r of R) (b[r.variable] ||= []).push(r); for (const [vr, rs] of Object.entries(b)) { rs.sort((a, c) => a.prioridad - c.prioridad); for (const r of rs) if (ev(r.condicion, { ...d, ...o }) === true) { o[vr] = Number(ev(r.valor, { ...d, ...o })); break; } } return o; };

// --- Reglas AJUSTADAS (header del proyecto Flagler/CEMA) ---
const DESP = 0.10, MARGEN = 0.557631817925398, HW = 0.30, ADIC = 0.10, TRM = 3750;
const PRESET = { caja: 'ECOCARB15COLOR', refuerzo: 'ECOCARB15COLOR', frente: 'ECOCARB18COLOR', fondo: 'DURCARB6POLAR' };

const TARGET = [
  { sku: 'BFD30', pref: 'BFD', L: 30, A: 30, P: 24 }, { sku: 'BFD15', pref: 'BFD', L: 15, A: 30, P: 24 },
  { sku: 'BFD9', pref: 'BFD', L: 9, A: 30, P: 24 }, { sku: 'BFD27', pref: 'BFD', L: 27, A: 30, P: 24 },
  { sku: 'SBFD33', pref: 'SBFD', L: 33, A: 30, P: 24 }, { sku: 'DB15-1s', pref: 'DB', L: 15, A: 30, P: 24, ov: { n_cajones: 3, n_barras: 2 } },
  { sku: 'W3022', pref: 'W', L: 30, A: 22, P: 12 }, { sku: 'W3036', pref: 'W', L: 30, A: 36, P: 12 },
  { sku: 'W1236', pref: 'W', L: 12, A: 36, P: 12 }, { sku: 'W2736', pref: 'W', L: 27, A: 36, P: 12 },
  { sku: 'W3019', pref: 'W', L: 30, A: 19, P: 12 }, { sku: 'W1536', pref: 'W', L: 15, A: 36, P: 12 },
  { sku: 'W3336', pref: 'W', L: 33, A: 36, P: 12 }, { sku: 'W2136', pref: 'W', L: 21, A: 36, P: 12 },
];

function engine(piezas, reglas, hp, tb, cz, cons, hc, etiquetas, usaCarton, dims, ov) {
  const V = { ...dims, ...derive(reglas, dims), ...(ov || {}) }; const num = (e) => Number(ev(e, V));
  const aR = {}, cC = {}; let tar = 0, sop = 0;
  for (const p of piezas) { const c = num(p.formula_cantidad), l = num(p.formula_largo) - (p.resta_largo || 0), a = num(p.formula_ancho) - (p.resta_ancho || 0); if (p.rol_tablero) aR[p.rol_tablero] = (aR[p.rol_tablero] || 0) + c * l * a * IN2CM * IN2CM; const ct = p.cantos || {}; if (ct.calibre) { const lg = ct.largos || 0, an = ct.anchos || 0; const e = (cC[ct.calibre] ||= { lenIn: 0, edges: 0 }); e.lenIn += c * (lg * l + an * a); e.edges += c * ((ct.despEdges ?? (lg + an))); } tar += c * (p.tarugos || 0); sop += c * (p.soportes || 0); }
  let mad = 0; for (const [r, cm2] of Object.entries(aR)) mad += (cm2 * (1 + DESP) / 10000) * Number(tb[PRESET[r]].precio_m2);
  let can = 0; for (const [cal, e] of Object.entries(cC)) can += ((e.lenIn * IN2CM + e.edges * 5) / 100) * Number(cz[norm(cal)].precio);
  const da = [dims.L, dims.A, dims.P].sort((a, b) => b - a); const cart = usaCarton === false ? 0 : Math.round((((da[0] * 2 * IN2CM) / 200) * ((da[1] * 2 * IN2CM) / 130)) * 10) / 10;
  const consumibles = tar * (cons.tarugo || 0) + sop * (cons.soporte || 0) + cart * (cons.carton || 0) + etiquetas * (cons.etiqueta || 0);
  let herr = 0; for (const h of hp) herr += num(h.formula_cantidad) * (hc[h.herraje_codigo] || 0);
  return { sin: mad + can + consumibles, herr };
}
const chain = (sinCOP, herrCOP) => { const sim = (sinCOP / TRM) / (1 - MARGEN); const wo = sim / (1 - ADIC); const hw = (herrCOP / TRM) / (1 - HW); return { wo, w: wo + hw }; };

(async () => {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile('Cotizaciones de muestra/25083 - Related Urban Construction - Flagler Villas - Cambios de marzo 3 Cotización - COPIA.xlsx');
  const sh = wb.getWorksheet('Cabinets'); const val = (c) => { const v = c.value; return (v && typeof v === 'object' && 'result' in v) ? v.result : v; };
  const ex = {};
  for (let r = 47; r <= sh.rowCount; r++) { const row = sh.getRow(r); const sku = val(row.getCell(7)); if (!sku || ex[sku]) continue; const q = Number(val(row.getCell(23))) || 5;
    ex[sku] = { woOrig: +val(row.getCell(21)), wOrig: +val(row.getCell(20)), mp: +val(row.getCell(61)) / q, herr: +val(row.getCell(62)) / q,
      tFr: +val(row.getCell(55)) / q, tCaja: +val(row.getCell(56)) / q, tRef: +val(row.getCell(57)) / q, tFon: +val(row.getCell(59)) / q }; }

  const tipos = await rest('cot_tipos_mueble?select=id,pref,etiquetas_und,usa_carton');
  const piezas = await rest('cot_piezas_plantilla?select=*&order=orden');
  const reglas = await rest('cot_reglas_config?activo=eq.true&select=*');
  const herrP = await rest('cot_herrajes_plantilla?select=*');
  const tb = Object.fromEntries((await rest('cot_tableros?select=codigo,precio_m2')).map((x) => [x.codigo, x]));
  const cz = Object.fromEntries((await rest('cot_cantos?select=calibre,precio')).map((c) => [norm(c.calibre), c]));
  const cons = Object.fromEntries((await rest('cot_herrajes?categoria=eq.consumible&select=selector_key,precio')).map((h) => [h.selector_key, Number(h.precio)]));
  const hc = Object.fromEntries((await rest('cot_herrajes?select=codigo,precio')).map((h) => [h.codigo, Number(h.precio)]));
  const P = { caja: +tb['ECOCARB15COLOR'].precio_m2, ref: +tb['ECOCARB15COLOR'].precio_m2, fr: +tb['ECOCARB18COLOR'].precio_m2, fon: +tb['DURCARB6POLAR'].precio_m2 };

  console.log('REGLAS AJUSTADAS: madera ' + (DESP * 100) + '%  margen ' + (MARGEN * 100).toFixed(1) + '%  hardware ' + (HW * 100) + '%  adicional ' + (ADIC * 100) + '%  TRM ' + TRM + '\n');
  console.log('SKU'.padEnd(10) + 'ExcelOrig'.padStart(10) + 'ExcelAjust'.padStart(11) + 'PLUS'.padStart(9) + 'Δ(P-Aj)%'.padStart(9) + '   (W/Hardware USD)');
  let sumA = 0, sumP = 0;
  for (const t of TARGET) {
    const e = ex[t.sku]; if (!e) { console.log(t.sku + ' (no en Excel)'); continue; }
    // Excel ajustado: re-basar madera 15%->10% desde sus columnas de tablero, re-armar MP, cadena header
    const mad15 = (e.tCaja / 1.15) * 1.15 * P.caja + (e.tRef / 1.15) * 1.15 * P.ref + (e.tFr / 1.15) * 1.15 * P.fr + (e.tFon / 1.15) * 1.15 * P.fon;
    const mad10 = (e.tCaja / 1.15) * 1.10 * P.caja + (e.tRef / 1.15) * 1.10 * P.ref + (e.tFr / 1.15) * 1.10 * P.fr + (e.tFon / 1.15) * 1.10 * P.fon;
    const mpAj = e.mp - mad15 + mad10;           // MP del Excel re-basado a 10%
    const exAdj = chain(mpAj, e.herr);
    // PLUS
    const tipo = tipos.find((x) => x.pref === t.pref);
    const R = engine(piezas.filter((p) => p.tipo_mueble_id === tipo.id), reglas.filter((r) => r.tipo_mueble_id === null || r.tipo_mueble_id === tipo.id), herrP.filter((h) => h.tipo_mueble_id === tipo.id), tb, cz, cons, hc, Number(process.env.ETIQ ?? (tipo.etiquetas_und ?? 4)), tipo.usa_carton !== false, { L: t.L, A: t.A, P: t.P }, t.ov);
    const plus = chain(R.sin, R.herr);
    const d = (plus.w - exAdj.w) / exAdj.w * 100; sumA += exAdj.w; sumP += plus.w;
    console.log(t.sku.padEnd(10) + e.wOrig.toFixed(2).padStart(10) + exAdj.w.toFixed(2).padStart(11) + plus.w.toFixed(2).padStart(9) + d.toFixed(2).padStart(8) + '%');
  }
  console.log('\nTOTAL (suma W/Hardware):  Excel ajustado ' + sumA.toFixed(2) + '   PLUS ' + sumP.toFixed(2) + '   Δ ' + ((sumP - sumA) / sumA * 100).toFixed(2) + '%');
  console.log('ExcelOrig = valor quemado del archivo (tasas 57/35/15). ExcelAjust = recalculado a 10/55.8/30. PLUS = nuestro motor a 10/55.8/30.');
})().catch((e) => { console.error(e); process.exit(1); });
