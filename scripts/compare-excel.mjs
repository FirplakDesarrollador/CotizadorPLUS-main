#!/usr/bin/env node
// Compara el COSTO SIN HERRAJES del motor del Cotizador PLUS contra el Excel
// de referencia, para una lista de muebles. Lee plantillas/catálogos/parámetros
// desde Supabase (service_role) y usa el preset_default.
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env.local');
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: `Bearer ${SR}` };
const rest = async (q) => { const r = await fetch(`${URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`${q}: ${r.status} ${await r.text()}`); return r.json(); };

const IN2CM = 2.54;
const norm = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, '');
const ALLOWED = /^[0-9+\-*/().\s A-Za-z_<>=!&|?:]*$/;
function ev(expr, vars) {
  if (expr == null || expr === '') return 0;
  const s = String(expr); if (!ALLOWED.test(s)) throw new Error(`expr: ${s}`);
  const k = Object.keys(vars); const f = new Function(...k, `"use strict";return (${s});`);
  const v = f(...k.map((x) => vars[x])); return typeof v === 'boolean' ? v : Number(v);
}
function derive(reglas, dims) {
  const out = {}, byVar = {};
  for (const r of reglas) (byVar[r.variable] ||= []).push(r);
  for (const [vr, rs] of Object.entries(byVar)) {
    rs.sort((a, b) => a.prioridad - b.prioridad);
    for (const r of rs) if (ev(r.condicion, { ...dims, ...out }) === true) { out[vr] = Number(ev(r.valor, { ...dims, ...out })); break; }
  }
  return out;
}

function costoSinHerrajes({ piezas, reglas, dims, preset, tablerosByCode, cantosByCal, consBySel, etiquetas, desperdicio }) {
  const V = { ...dims, ...derive(reglas, dims) };
  const num = (e) => Number(ev(e, V));
  const areaPorRol = {}, cantoPorCal = {};
  let tarugos = 0, soportes = 0;
  for (const pz of piezas) {
    const cant = num(pz.formula_cantidad);
    const lIn = num(pz.formula_largo) - (pz.resta_largo || 0);
    const aIn = num(pz.formula_ancho) - (pz.resta_ancho || 0);
    if (pz.rol_tablero) areaPorRol[pz.rol_tablero] = (areaPorRol[pz.rol_tablero] || 0) + cant * lIn * aIn * IN2CM * IN2CM;
    const c = pz.cantos || {};
    if (c.calibre) {
      const lg = c.largos || 0, an = c.anchos || 0;
      const e = (cantoPorCal[c.calibre] ||= { lenIn: 0, edges: 0 });
      e.lenIn += cant * (lg * lIn + an * aIn);
      e.edges += cant * ((c.despEdges !== undefined && c.despEdges !== null) ? c.despEdges : (lg + an));
    }
    tarugos += cant * Number(pz.tarugos || 0);
    soportes += cant * Number(pz.soportes || 0);
  }
  let madera = 0;
  for (const [rol, cm2] of Object.entries(areaPorRol)) {
    const tab = tablerosByCode[preset[rol]];
    if (!tab) throw new Error(`falta tablero rol ${rol}=${preset[rol]}`);
    madera += (cm2 * (1 + desperdicio) / 10000) * Number(tab.precio_m2);
  }
  let canto = 0;
  for (const [cal, e] of Object.entries(cantoPorCal)) {
    const cz = cantosByCal[norm(cal)]; if (!cz) throw new Error(`falta canto ${cal}`);
    canto += ((e.lenIn * IN2CM + e.edges * 5) / 100) * Number(cz.precio);
  }
  const dimsArr = [dims.L, dims.A, dims.P].sort((a, b) => b - a);
  const cartonU = Math.round((((dimsArr[0] * 2 * IN2CM) / 200) * ((dimsArr[1] * 2 * IN2CM) / 130)) * 10) / 10;
  const cons = tarugos * (consBySel.tarugo || 0) + soportes * (consBySel.soporte || 0)
    + cartonU * (consBySel.carton || 0) + etiquetas * (consBySel.etiqueta || 0);
  return madera + canto + cons;
}

const GROUND = [
  { sku: 'B12', pref: 'B', L: 12, A: 30, P: 24, I: 93731.71 }, { sku: 'B15', pref: 'B', L: 15, A: 30, P: 24, I: 104503.87 },
  { sku: 'B18', pref: 'B', L: 18, A: 30, P: 24, I: 115249.2 }, { sku: 'B21', pref: 'B', L: 21, A: 30, P: 24, I: 126401.14 },
  { sku: 'B24', pref: 'B', L: 24, A: 30, P: 24, I: 138980.47 }, { sku: 'B27', pref: 'B', L: 27, A: 30, P: 24, I: 150558.88 },
  { sku: 'B30', pref: 'B', L: 30, A: 30, P: 24, I: 162137.29 }, { sku: 'B33', pref: 'B', L: 33, A: 30, P: 24, I: 173715.7 },
  { sku: 'B36', pref: 'B', L: 36, A: 30, P: 24, I: 185294.11 }, { sku: 'B42', pref: 'B', L: 42, A: 30, P: 24, I: 208450.93 },
  { sku: 'SBFD30', pref: 'SBFD', L: 30, A: 30, P: 24, I: 136010.04 }, { sku: 'SBFD33', pref: 'SBFD', L: 33, A: 30, P: 24, I: 144915.41 },
  { sku: 'SBFD36', pref: 'SBFD', L: 36, A: 30, P: 24, I: 153820.77 }, { sku: 'SBFD39', pref: 'SBFD', L: 39, A: 30, P: 24, I: 162726.13 },
  { sku: 'SBFD24', pref: 'SBFD', L: 24, A: 30, P: 24, I: 118199.32 },
];

(async () => {
  const params = Object.fromEntries((await rest('cot_parametros?select=key,value')).map((r) => [r.key, r.value]));
  const preset = params.preset_default;
  const desperdicio = Number(params.desperdicio_madera);
  const tipos = await rest('cot_tipos_mueble?select=id,pref,etiquetas_und');
  const piezas = await rest('cot_piezas_plantilla?select=*&order=orden');
  const reglas = await rest('cot_reglas_config?activo=eq.true&select=*');
  const tableros = await rest('cot_tableros?select=codigo,precio_m2');
  const cantos = await rest('cot_cantos?select=calibre,precio');
  const herr = await rest('cot_herrajes?categoria=eq.consumible&select=selector_key,precio');
  const tablerosByCode = Object.fromEntries(tableros.map((t) => [t.codigo, t]));
  const cantosByCal = Object.fromEntries(cantos.map((c) => [norm(c.calibre), c]));
  const consBySel = Object.fromEntries(herr.map((h) => [h.selector_key, Number(h.precio)]));

  let pass = 0;
  console.log(`${'sku'.padEnd(9)}${'calc'.padStart(12)}${'excel'.padStart(12)}${'diff'.padStart(10)}${'%'.padStart(9)}  ok`);
  for (const m of GROUND) {
    const tipo = tipos.find((t) => t.pref === m.pref);
    if (!tipo) { console.log(`${m.sku.padEnd(9)}  tipo ${m.pref} no existe`); continue; }
    const pz = piezas.filter((p) => p.tipo_mueble_id === tipo.id);
    const rg = reglas.filter((r) => r.tipo_mueble_id === null || r.tipo_mueble_id === tipo.id);
    let calc;
    try {
      calc = costoSinHerrajes({ piezas: pz, reglas: rg, dims: { L: m.L, A: m.A, P: m.P }, preset, tablerosByCode, cantosByCal, consBySel, etiquetas: tipo.etiquetas_und ?? 4, desperdicio });
    } catch (e) { console.log(`${m.sku.padEnd(9)}  ERROR ${e.message}`); continue; }
    const diff = calc - m.I, pct = (diff / m.I) * 100, ok = Math.abs(diff) < 50;
    if (ok) pass++;
    console.log(`${m.sku.padEnd(9)}${calc.toFixed(0).padStart(12)}${m.I.toFixed(0).padStart(12)}${diff.toFixed(0).padStart(10)}${pct.toFixed(3).padStart(8)}%  ${ok ? '✅' : '❌'}`);
  }
  console.log(`\n${pass}/${GROUND.length} dentro de ±50 COP`);
})().catch((e) => { console.error(e); process.exit(1); });
