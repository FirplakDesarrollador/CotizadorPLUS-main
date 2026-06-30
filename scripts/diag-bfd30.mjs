#!/usr/bin/env node
// Verificación BFD30: Cotizador PLUS vs Excel real, con los parámetros indicados por el usuario.
import fs from 'node:fs'; import path from 'node:path';
for (const line of fs.readFileSync(path.resolve('.env.local'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: `Bearer ${SR}` };
const rest = async (q) => (await fetch(`${URL}/rest/v1/${q}`, { headers: H })).json();
const IN2CM = 2.54, norm = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, '');
const ev = (e, v) => { if (e == null || e === '') return 0; const k = Object.keys(v); const f = new Function(...k, `"use strict";return (${e});`); const r = f(...k.map((x) => v[x])); return typeof r === 'boolean' ? r : Number(r); };
const derive = (R, d) => { const o = {}, b = {}; for (const r of R) (b[r.variable] ||= []).push(r); for (const [vr, rs] of Object.entries(b)) { rs.sort((a, c) => a.prioridad - c.prioridad); for (const r of rs) if (ev(r.condicion, { ...d, ...o }) === true) { o[vr] = Number(ev(r.valor, { ...d, ...o })); break; } } return o; };

const PRESET = { caja: 'ECOCARB15COLOR', refuerzo: 'ECOCARB15COLOR', frente: 'ECOCARB18COLOR', fondo: 'DURCARB6POLAR' };
const TRM = 3750;

function costo(piezas, reglas, hp, tb, cz, cons, hc, etiquetas, usaCarton, desperdicio) {
  const V = { L: 30, A: 30, P: 24, ...derive(reglas, { L: 30, A: 30, P: 24 }) };
  const num = (e) => Number(ev(e, V));
  const aR = {}, cC = {}; let tar = 0, sop = 0;
  for (const p of piezas) { const c = num(p.formula_cantidad), l = num(p.formula_largo) - (p.resta_largo || 0), a = num(p.formula_ancho) - (p.resta_ancho || 0); if (p.rol_tablero) aR[p.rol_tablero] = (aR[p.rol_tablero] || 0) + c * l * a * IN2CM * IN2CM; const ct = p.cantos || {}; if (ct.calibre) { const lg = ct.largos || 0, an = ct.anchos || 0; const e = (cC[ct.calibre] ||= { lenIn: 0, edges: 0 }); e.lenIn += c * (lg * l + an * a); e.edges += c * ((ct.despEdges ?? (lg + an))); } tar += c * (p.tarugos || 0); sop += c * (p.soportes || 0); }
  let mad = 0; for (const [r, cm2] of Object.entries(aR)) mad += (cm2 * (1 + desperdicio) / 10000) * Number(tb[PRESET[r]].precio_m2);
  let can = 0; for (const [cal, e] of Object.entries(cC)) can += ((e.lenIn * IN2CM + e.edges * 5) / 100) * Number(cz[norm(cal)].precio);
  const da = [30, 30, 24].sort((a, b) => b - a); const cart = usaCarton === false ? 0 : Math.round((((da[0] * 2 * IN2CM) / 200) * ((da[1] * 2 * IN2CM) / 130)) * 10) / 10;
  const consumibles = tar * (cons.tarugo || 0) + sop * (cons.soporte || 0) + cart * (cons.carton || 0) + etiquetas * (cons.etiqueta || 0);
  let herr = 0; for (const h of hp) herr += num(h.formula_cantidad) * (hc[h.herraje_codigo] || 0);
  const consDet = { tarugos: tar * (cons.tarugo || 0), soportes: sop * (cons.soporte || 0), carton: cart * (cons.carton || 0), cartonU: cart, etiquetas: etiquetas * (cons.etiqueta || 0) };
  return { sin: mad + can + consumibles, herr, mad, can, consumibles, consDet };
}

(async () => {
  const tipos = await rest('cot_tipos_mueble?select=id,pref,etiquetas_und,usa_carton');
  const t = tipos.find((x) => x.pref === 'BFD');
  const piezas = (await rest('cot_piezas_plantilla?select=*&order=orden')).filter((p) => p.tipo_mueble_id === t.id);
  const reglas = (await rest('cot_reglas_config?activo=eq.true&select=*')).filter((r) => r.tipo_mueble_id === null || r.tipo_mueble_id === t.id);
  const hp = (await rest('cot_herrajes_plantilla?select=*')).filter((h) => h.tipo_mueble_id === t.id);
  const tb = Object.fromEntries((await rest('cot_tableros?select=codigo,precio_m2')).map((x) => [x.codigo, x]));
  const cz = Object.fromEntries((await rest('cot_cantos?select=calibre,precio')).map((c) => [norm(c.calibre), c]));
  const cons = Object.fromEntries((await rest('cot_herrajes?categoria=eq.consumible&select=selector_key,precio')).map((h) => [h.selector_key, Number(h.precio)]));
  const hc = Object.fromEntries((await rest('cot_herrajes?select=codigo,precio')).map((h) => [h.codigo, Number(h.precio)]));

  const chain = (sinCOP, herrCOP, margen, adicional, tHw) => {
    const sim = (sinCOP / TRM) / (1 - margen);          // $ simulador (mueble, sin herraje, sin adicional)
    const wo = sim / (1 - adicional);                   // Value Wo/Hardware
    const hw = (herrCOP / TRM) / (1 - tHw);             // $ hardware
    return { sim, wo, hw, w: wo + hw };
  };

  console.log('BFD30 — caja/ref ECOCARB15COLOR, frente ECOCARB18COLOR, fondo DURCARB6POLAR, TRM 3750\n');

  // Escenario A: parámetros que indicó el usuario (header del Excel)
  const cA = costo(piezas, reglas, hp, tb, cz, cons, hc, t.etiquetas_und ?? 4, t.usa_carton !== false, 0.10);
  const A = chain(cA.sin, cA.herr, 0.558, 0.10, 0.30);
  console.log('A) PLUS con TUS parámetros (madera 10%, margen 55.8%, adicional 10%, hardware 30%):');
  console.log('   costoSin=' + Math.round(cA.sin) + ' COP  costoHerr=' + Math.round(cA.herr) + ' COP');
  console.log('   $sim=' + A.sim.toFixed(2) + '  Wo/Hw=' + A.wo.toFixed(2) + '  $hw=' + A.hw.toFixed(2) + '  W/Hw=' + A.w.toFixed(2) + ' USD\n');

  // Escenario B: parámetros EFECTIVOS que reproducen el Excel quemado (madera 15%, margen 57%, hardware 35%)
  const cB = costo(piezas, reglas, hp, tb, cz, cons, hc, t.etiquetas_und ?? 4, t.usa_carton !== false, 0.15);
  const B = chain(cB.sin, cB.herr, 0.57, 0.10, 0.35);
  console.log('B) PLUS con parámetros EFECTIVOS del Excel quemado (madera 15%, margen 57%, hardware 35%):');
  console.log('   costoSin=' + Math.round(cB.sin) + ' COP  costoHerr=' + Math.round(cB.herr) + ' COP');
  console.log('   $sim=' + B.sim.toFixed(2) + '  Wo/Hw=' + B.wo.toFixed(2) + '  $hw=' + B.hw.toFixed(2) + '  W/Hw=' + B.w.toFixed(2) + ' USD\n');

  console.log('C) EXCEL quemado (valores reales del archivo de cotización):');
  console.log('   costoSin(MP/5)=153653 COP  costoHerr(HR/5)=34816 COP');
  console.log('   $sim=95.29  Wo/Hw=105.88  $hw=14.28  W/Hw=120.16 USD\n');

  console.log('D) Desglose de consumibles PLUS (BFD30, escenario B @15%):');
  console.log('   madera=' + Math.round(cB.mad) + '  canto=' + Math.round(cB.can) + '  consumibles=' + Math.round(cB.consumibles));
  console.log('   consumibles detalle:', JSON.stringify(Object.fromEntries(Object.entries(cB.consDet).map(([k, v]) => [k, Math.round(v * 100) / 100]))));
  console.log('   Excel MP(15%)=153653  =>  consumibles implícitos Excel = 153653 - madera - canto = ' + Math.round(153653 - cB.mad - cB.can));
})().catch((e) => { console.error(e); process.exit(1); });
