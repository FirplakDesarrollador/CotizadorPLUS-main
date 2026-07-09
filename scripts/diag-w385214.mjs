#!/usr/bin/env node
// Diagnóstico W385214 (proyecto Thomas Penthouse) — PLUS vs Excel real, con la config del archivo.
import fs from 'node:fs'; import path from 'node:path'; import ExcelJS from 'exceljs';
for (const line of fs.readFileSync(path.resolve('.env.local'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: `Bearer ${SR}` };
const rest = async (q) => (await fetch(`${URL}/rest/v1/${q}`, { headers: H })).json();
const IN2CM = 2.54, norm = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, '');
const ev = (e, v) => { if (e == null || e === '') return 0; const k = Object.keys(v); const f = new Function(...k, `"use strict";return (${e});`); const r = f(...k.map((x) => v[x])); return typeof r === 'boolean' ? r : Number(r); };
const derive = (R, d) => { const o = {}, b = {}; for (const r of R) (b[r.variable] ||= []).push(r); for (const [vr, rs] of Object.entries(b)) { rs.sort((a, c) => a.prioridad - c.prioridad); for (const r of rs) if (ev(r.condicion, { ...d, ...o }) === true) { o[vr] = Number(ev(r.valor, { ...d, ...o })); break; } } return o; };

// Config Thomas Penthouse
const PRESET = { caja: 'PRICARB18CANDELARIA (POLAR)', refuerzo: 'PRICARB18CANDELARIA (POLAR)', frente: 'PRICARB18COLOR', fondo: 'PRICARB6COLOR' };
const DESP = 0.15, MARGEN = 0.57, ADIC = 0.23, TRM = 3550;
const DIMS = { L: 38, A: 52, P: 14 };
const N_ENTREPANOS = 2;   // override (mueble tiene 2 shelves)

(async () => {
  const tipos = await rest('cot_tipos_mueble?select=id,pref,etiquetas_und,usa_carton');
  const t = tipos.find((x) => x.pref === 'W');
  const piezas = (await rest('cot_piezas_plantilla?select=*&order=orden')).filter((p) => p.tipo_mueble_id === t.id);
  const reglas = (await rest('cot_reglas_config?activo=eq.true&select=*')).filter((r) => r.tipo_mueble_id === null || r.tipo_mueble_id === t.id);
  const hp = (await rest('cot_herrajes_plantilla?select=*')).filter((h) => h.tipo_mueble_id === t.id);
  const tb = Object.fromEntries((await rest('cot_tableros?select=codigo,precio_m2,espesor_mm')).map((x) => [x.codigo, x]));
  const cz = Object.fromEntries((await rest('cot_cantos?select=calibre,precio')).map((c) => [norm(c.calibre), c]));
  const cons = Object.fromEntries((await rest('cot_herrajes?categoria=eq.consumible&select=selector_key,precio')).map((h) => [h.selector_key, Number(h.precio)]));
  const hc = Object.fromEntries((await rest('cot_herrajes?select=codigo,precio')).map((h) => [h.codigo, Number(h.precio)]));

  const V = { ...DIMS, ...derive(reglas, DIMS), n_entrepanos: N_ENTREPANOS };
  const num = (e) => Number(ev(e, V));
  const aR = {}, cC = {}; let tar = 0, sop = 0;
  for (const p of piezas) {
    const c = num(p.formula_cantidad), l = num(p.formula_largo) - (p.resta_largo || 0), a = num(p.formula_ancho) - (p.resta_ancho || 0);
    if (p.rol_tablero) aR[p.rol_tablero] = (aR[p.rol_tablero] || 0) + c * l * a * IN2CM * IN2CM;
    const ct = p.cantos || {};
    if (ct.calibre) {
      // canto role-aware (motor corregido): frente 18mm->22x1, caja/interior 18mm->22x0,45
      const esp = Number(tb[PRESET[p.rol_tablero]]?.espesor_mm);
      let cal = ct.calibre;
      if (esp === 18) cal = (p.rol_tablero === 'frente') ? '22x1' : '22x0,45';
      else if (esp === 15) cal = (p.rol_tablero === 'frente') ? '19x1' : '19x0,45';
      const lg = ct.largos || 0, an = ct.anchos || 0;
      const e = (cC[cal] ||= { lenIn: 0, edges: 0 });
      e.lenIn += c * (lg * l + an * a);
      if (/refuerzo/i.test(p.nombre)) e.lenIn += c * (8 / IN2CM);   // canto +8cm refuerzo (motor actual)
      e.edges += c * ((ct.despEdges ?? (lg + an)));
    }
    tar += c * (p.tarugos || 0); sop += c * (p.soportes || 0);
  }
  let mad = 0; const madDet = {};
  for (const [rol, cm2] of Object.entries(aR)) { const m = (cm2 * (1 + DESP) / 10000) * Number(tb[PRESET[rol]].precio_m2); mad += m; madDet[rol] = { m2: +(cm2 / 10000).toFixed(4), costo: Math.round(m) }; }
  let can = 0; const canDet = {};
  for (const [cal, e] of Object.entries(cC)) { const c = ((e.lenIn * IN2CM + e.edges * 5) / 100) * Number(cz[norm(cal)].precio); can += c; canDet[cal] = Math.round(c); }
  const da = [DIMS.L, DIMS.A, DIMS.P].sort((a, b) => b - a);
  const cartU = t.usa_carton !== false ? Math.round((((da[0] * 2 * IN2CM) / 200) * ((da[1] * 2 * IN2CM) / 130)) * 10) / 10 : 0;
  const etiq = Number(process.env.ETIQ ?? 3);
  const consDet = { tarugos: Math.round(tar * (cons.tarugo || 0)), soportes: Math.round(sop * (cons.soporte || 0)), carton: Math.round(cartU * (cons.carton || 0)), etiquetas: Math.round(etiq * (cons.etiqueta || 0)) };
  const costoSin = mad + can + Object.values(consDet).reduce((a, b) => a + b, 0);
  let herr = 0; const herrDet = {};
  for (const h of hp) { const q = num(h.formula_cantidad); const cst = q * (hc[h.herraje_codigo] || 0); herr += cst; if (cst) herrDet[h.rol] = `${q}×=${Math.round(cst)}`; }

  console.log('W385214  vars:', JSON.stringify(V));
  console.log('AREA m2 PLUS:', JSON.stringify(madDet));
  console.log('CANTO PLUS:', JSON.stringify(canDet), ' (refuerzo +8cm incluido)');
  console.log('CONSUMIBLES PLUS (etiq=' + etiq + '):', JSON.stringify(consDet), ' cartonU=' + cartU);
  console.log('HERRAJES PLUS:', JSON.stringify(herrDet), ' total=', Math.round(herr));
  console.log('costoSin =', Math.round(costoSin), '  costoHerr =', Math.round(herr));
  console.log('--- EXCEL: MP=262999  HERR=26500  Wo=223.75  con=235.24 ---');
  for (const mh of [0.35, 0.30]) {
    const wo = (costoSin / (1 - MARGEN)) / (1 - ADIC) / TRM;
    const hw = (herr / (1 - mh)) / TRM;
    console.log(`PLUS @hardware ${mh}: Wo=${wo.toFixed(2)}  hw=${hw.toFixed(2)}  CON=${(wo + hw).toFixed(2)} USD`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
