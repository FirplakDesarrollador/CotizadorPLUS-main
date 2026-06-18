#!/usr/bin/env node
// Diagnóstico: compara el Cotizador PLUS (motor) contra el Excel real (Flagler Villas)
// usando los MATERIALES y PARÁMETROS exactos que definió el diseñador en ese proyecto.
// Verdad de referencia: hoja "Cabinets" del archivo de cotización real.
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

function loadEnv() {
  for (const line of fs.readFileSync(path.resolve('.env.local'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: `Bearer ${SR}` };
const rest = async (q) => { const r = await fetch(`${URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`${q}: ${r.status}`); return r.json(); };

const IN2CM = 2.54;
const norm = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, '');
const ALLOWED = /^[0-9+\-*/().\s A-Za-z_<>=!&|?:]*$/;
const ev = (e, v) => { if (e == null || e === '') return 0; const s = String(e); if (!ALLOWED.test(s)) throw new Error('expr ' + s); const k = Object.keys(v); const f = new Function(...k, `"use strict";return (${s});`); const r = f(...k.map((x) => v[x])); return typeof r === 'boolean' ? r : Number(r); };
const derive = (R, d) => { const o = {}, b = {}; for (const r of R) (b[r.variable] ||= []).push(r); for (const [vr, rs] of Object.entries(b)) { rs.sort((a, c) => a.prioridad - c.prioridad); for (const r of rs) if (ev(r.condicion, { ...d, ...o }) === true) { o[vr] = Number(ev(r.valor, { ...d, ...o })); break; } } return o; };

// --- Config del proyecto (filas 1-49 de la cotización real) ---
const PRESET = { caja: 'ECOCARB15COLOR', refuerzo: 'ECOCARB15COLOR', frente: 'ECOCARB18COLOR', fondo: 'DURCARB6POLAR' };
const DESPERDICIO = Number(process.env.DESP ?? 0.15);  // probar 0.10 vs 0.15
const MARGEN = 0.57;        // efectivo por tipo
const ADICIONAL = 0.10;     // "Margen adicional 10%"
const TRM = 3750;

// --- Muebles del proyecto (SKU -> tipo + dims + overrides) ---
const TARGET = [
  { sku: 'BFD30', pref: 'BFD', L: 30, A: 30, P: 24 },
  { sku: 'BFD15', pref: 'BFD', L: 15, A: 30, P: 24 },
  { sku: 'BFD9', pref: 'BFD', L: 9, A: 30, P: 24 },
  { sku: 'BFD27', pref: 'BFD', L: 27, A: 30, P: 24 },
  { sku: 'SBFD33', pref: 'SBFD', L: 33, A: 30, P: 24 },
  { sku: 'DB15-1s', pref: 'DB', L: 15, A: 30, P: 24, ov: { n_cajones: 3, n_barras: 2 } },
  { sku: 'W3022', pref: 'W', L: 30, A: 22, P: 12 },
  { sku: 'W3036', pref: 'W', L: 30, A: 36, P: 12 },
  { sku: 'W1236', pref: 'W', L: 12, A: 36, P: 12 },
  { sku: 'W2736', pref: 'W', L: 27, A: 36, P: 12 },
  { sku: 'W3019', pref: 'W', L: 30, A: 19, P: 12 },
  { sku: 'W1536', pref: 'W', L: 15, A: 36, P: 12 },
  { sku: 'W3336', pref: 'W', L: 33, A: 36, P: 12 },
  { sku: 'W2136', pref: 'W', L: 21, A: 36, P: 12 },
];

function engine({ piezas, reglas, dims, preset, tablerosByCode, cantosByCal, consBySel, etiquetas, desperdicio, overrides, usaCarton, herrajesPlant, herrajesByCode }) {
  const V = { ...dims, ...derive(reglas, dims), ...(overrides || {}) };
  const num = (e) => Number(ev(e, V));
  const areaPorRol = {}, cantoPorCal = {}; let tarugos = 0, soportes = 0;
  for (const pz of piezas) {
    const cant = num(pz.formula_cantidad);
    const lIn = num(pz.formula_largo) - (pz.resta_largo || 0);
    const aIn = num(pz.formula_ancho) - (pz.resta_ancho || 0);
    if (pz.rol_tablero) areaPorRol[pz.rol_tablero] = (areaPorRol[pz.rol_tablero] || 0) + cant * lIn * aIn * IN2CM * IN2CM;
    const c = pz.cantos || {};
    if (c.calibre) { const lg = c.largos || 0, an = c.anchos || 0; const e = (cantoPorCal[c.calibre] ||= { lenIn: 0, edges: 0 }); e.lenIn += cant * (lg * lIn + an * aIn); e.edges += cant * ((c.despEdges !== undefined && c.despEdges !== null) ? c.despEdges : (lg + an)); }
    tarugos += cant * Number(pz.tarugos || 0); soportes += cant * Number(pz.soportes || 0);
  }
  let madera = 0; const maderaDet = {};
  for (const [rol, cm2] of Object.entries(areaPorRol)) { const tab = tablerosByCode[preset[rol]]; if (!tab) throw new Error('falta tablero ' + rol + '=' + preset[rol]); const c = (cm2 * (1 + desperdicio) / 10000) * Number(tab.precio_m2); madera += c; maderaDet[rol] = c; }
  let canto = 0; const cantoDet = {};
  for (const [cal, e] of Object.entries(cantoPorCal)) { const cz = cantosByCal[norm(cal)]; if (!cz) throw new Error('falta canto ' + cal); const c = ((e.lenIn * IN2CM + e.edges * 5) / 100) * Number(cz.precio); canto += c; cantoDet[cal] = c; }
  const da = [dims.L, dims.A, dims.P].sort((a, b) => b - a);
  const cartonU = (usaCarton === false) ? 0 : Math.round((((da[0] * 2 * IN2CM) / 200) * ((da[1] * 2 * IN2CM) / 130)) * 10) / 10;
  const cons = tarugos * (consBySel.tarugo || 0) + soportes * (consBySel.soporte || 0) + cartonU * (consBySel.carton || 0) + etiquetas * (consBySel.etiqueta || 0);
  const sin = madera + canto + cons;
  let herr = 0; const herrDet = {};
  for (const hp of (herrajesPlant || [])) { const precio = Number((herrajesByCode[hp.herraje_codigo] || {}).precio || 0); const q = num(hp.formula_cantidad); herr += q * precio; herrDet[hp.rol] = (herrDet[hp.rol] || 0) + q * precio; }
  return { vars: V, madera, maderaDet, canto, cantoDet, cons, sin, herr, herrDet };
}

(async () => {
  // 1) Verdad del Excel real
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Cotizaciones de muestra/25083 - Related Urban Construction - Flagler Villas - Cambios de marzo 3 Cotización - COPIA.xlsx');
  const sh = wb.getWorksheet('Cabinets');
  const val = (cell) => { const v = cell.value; return (v && typeof v === 'object' && 'result' in v) ? v.result : v; };
  const ex = {};
  for (let r = 47; r <= sh.rowCount; r++) {
    const row = sh.getRow(r); const sku = val(row.getCell(7));
    if (!sku || ex[sku]) continue;
    const qty = Number(val(row.getCell(23))) || 5;
    ex[sku] = {
      feat: val(row.getCell(12)),
      usdWo: Number(val(row.getCell(21))), usdW: Number(val(row.getCell(20))),
      mpUnit: Number(val(row.getCell(61))) / qty, herrUnit: Number(val(row.getCell(62))) / qty,
      cantoFr: Number(val(row.getCell(52))), cantoCajaG: Number(val(row.getCell(53))), cantoPolar: Number(val(row.getCell(54))),
    };
  }

  // 2) Datos del motor
  const tipos = await rest('cot_tipos_mueble?select=id,pref,etiquetas_und,usa_carton');
  const piezas = await rest('cot_piezas_plantilla?select=*&order=orden');
  const reglas = await rest('cot_reglas_config?activo=eq.true&select=*');
  const herrPlant = await rest('cot_herrajes_plantilla?select=*');
  const tableros = await rest('cot_tableros?select=codigo,precio_m2');
  const cantos = await rest('cot_cantos?select=calibre,precio');
  const consR = await rest('cot_herrajes?categoria=eq.consumible&select=selector_key,precio');
  const herrAll = await rest('cot_herrajes?select=codigo,precio');
  const tablerosByCode = Object.fromEntries(tableros.map((t) => [t.codigo, t]));
  const cantosByCal = Object.fromEntries(cantos.map((c) => [norm(c.calibre), c]));
  const consBySel = Object.fromEntries(consR.map((h) => [h.selector_key, Number(h.precio)]));
  const herrajesByCode = Object.fromEntries(herrAll.map((h) => [h.codigo, h]));

  console.log('desperdicio=' + DESPERDICIO + '  margen=' + MARGEN + '  adicional=' + ADICIONAL + '  TRM=' + TRM + '\n');
  console.log('SKU'.padEnd(11) + 'MP_PLUS'.padStart(9) + 'MP_Excel'.padStart(9) + 'dMP%'.padStart(7) + '  ' + 'UsdWo_PLUS'.padStart(11) + 'UsdWo_Exc'.padStart(10) + 'd%'.padStart(6) + '   HR_PLUS'.padStart(9) + 'HR_Excel'.padStart(9) + 'dHR%'.padStart(7));
  for (const t of TARGET) {
    const tipo = tipos.find((x) => x.pref === t.pref); if (!tipo) { console.log(t.sku, 'tipo no existe'); continue; }
    const pz = piezas.filter((p) => p.tipo_mueble_id === tipo.id);
    const rg = reglas.filter((r) => r.tipo_mueble_id === null || r.tipo_mueble_id === tipo.id);
    const hp = herrPlant.filter((h) => h.tipo_mueble_id === tipo.id);
    let R; try { R = engine({ piezas: pz, reglas: rg, dims: { L: t.L, A: t.A, P: t.P }, preset: PRESET, tablerosByCode, cantosByCal, consBySel, etiquetas: tipo.etiquetas_und ?? 4, desperdicio: DESPERDICIO, overrides: t.ov, usaCarton: tipo.usa_carton !== false, herrajesPlant: hp, herrajesByCode }); }
    catch (e) { console.log(t.sku.padEnd(11) + '  ERROR ' + e.message); continue; }
    const e = ex[t.sku] || {};
    const usdWo = (R.sin / (1 - MARGEN)) / (1 - ADICIONAL) / TRM;   // precio mueble sin herrajes
    const dMP = e.mpUnit ? ((R.sin - e.mpUnit) / e.mpUnit * 100) : NaN;
    const dWo = e.usdWo ? ((usdWo - e.usdWo) / e.usdWo * 100) : NaN;
    const dHR = e.herrUnit ? ((R.herr - e.herrUnit) / e.herrUnit * 100) : NaN;
    console.log(t.sku.padEnd(11) + Math.round(R.sin).toString().padStart(9) + (e.mpUnit ? Math.round(e.mpUnit) : '-').toString().padStart(9) + (isNaN(dMP) ? '-' : dMP.toFixed(1)).padStart(7) + '  ' + usdWo.toFixed(2).padStart(11) + (e.usdWo ? e.usdWo.toFixed(2) : '-').padStart(10) + (isNaN(dWo) ? '-' : dWo.toFixed(1)).padStart(6) + '   ' + Math.round(R.herr).toString().padStart(8) + (e.herrUnit ? Math.round(e.herrUnit) : '-').toString().padStart(9) + (isNaN(dHR) ? '-' : dHR.toFixed(1)).padStart(7));
  }
  // Detalle de herrajes de la cajonera DB (donde hay desviación)
  const db = TARGET.find((x) => x.sku === 'DB15-1s'); const tdb = tipos.find((x) => x.pref === 'DB');
  const Rdb = engine({ piezas: piezas.filter((p) => p.tipo_mueble_id === tdb.id), reglas: reglas.filter((r) => r.tipo_mueble_id === null || r.tipo_mueble_id === tdb.id), dims: { L: db.L, A: db.A, P: db.P }, preset: PRESET, tablerosByCode, cantosByCal, consBySel, etiquetas: tdb.etiquetas_und ?? 4, desperdicio: DESPERDICIO, overrides: db.ov, usaCarton: tdb.usa_carton !== false, herrajesPlant: herrPlant.filter((h) => h.tipo_mueble_id === tdb.id), herrajesByCode });
  console.log('\nDB15 vars:', JSON.stringify(Rdb.vars), '\nDB15 herrajes PLUS (rol:costo):', JSON.stringify(Object.fromEntries(Object.entries(Rdb.herrDet).map(([k, v]) => [k, Math.round(v)]))));
  console.log('MP = materia prima sin herrajes/unidad COP. UsdWo = precio unidad SIN herrajes (margen+adicional/TRM). HR = herrajes/unidad COP.');
})().catch((e) => { console.error(e); process.exit(1); });
