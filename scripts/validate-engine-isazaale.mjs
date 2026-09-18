#!/usr/bin/env node
// Validación end-to-end del motor completo (madera + canto + consumibles + precio)
// contra el Excel, para SBFD33. Lee todo desde Supabase (service_role).
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
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: `Bearer ${SR}` };
async function rest(q) {
  const r = await fetch(`${URL}/rest/v1/${q}`, { headers: H });
  if (!r.ok) throw new Error(`REST ${q} -> ${r.status} ${await r.text()}`);
  return r.json();
}

const ALLOWED = /^[0-9+\-*/().\s A-Za-z_<>=!&|?:]*$/;
function evalExpr(expr, vars) {
  if (expr == null || expr === '') return 0;
  const s = String(expr);
  if (!ALLOWED.test(s)) throw new Error(`Expresión no permitida: ${s}`);
  const keys = Object.keys(vars);
  const fn = new Function(...keys, `"use strict"; return (${s});`);
  const v = fn(...keys.map((k) => vars[k]));
  return typeof v === 'boolean' ? v : Number(v);
}
const IN2CM = 2.54;
const norm = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, '');

// Deriva variables (n_puertas, n_entrepanos, ...) desde reglas + dimensiones.
function derivarVars(reglas, dims) {
  const out = {};
  const byVar = {};
  for (const r of reglas) (byVar[r.variable] ||= []).push(r);
  for (const [variable, rs] of Object.entries(byVar)) {
    rs.sort((a, b) => a.prioridad - b.prioridad);
    for (const r of rs) {
      if (evalExpr(r.condicion, { ...dims, ...out }) === true) { out[variable] = evalExpr(r.valor, { ...dims, ...out }); break; }
    }
  }
  return out;
}

function calcular({ piezas, tablerosByCode, cantosByCalibre, preset, dims, vars, params, herrajes, herrajesPlantilla, herrajesCatalog, etiquetasUnd, margen, recargo, trm }) {
  const V = { ...dims, ...vars };
  const desp = Number(params.desperdicio_madera);
  const areaPorRol = {};            // cm2 sin desperdicio
  const cantoPorCal = {};           // calibre -> {len_in, edges}
  let tarugos = 0, soportes = 0;
  const detalle = [];
  for (const pz of piezas) {
    const cant = evalExpr(pz.formula_cantidad, V);
    const lIn = evalExpr(pz.formula_largo, V) - (pz.resta_largo || 0);
    const aIn = evalExpr(pz.formula_ancho, V) - (pz.resta_ancho || 0);
    const area = cant * lIn * aIn * IN2CM * IN2CM;
    areaPorRol[pz.rol_tablero] = (areaPorRol[pz.rol_tablero] || 0) + area;
    const c = pz.cantos || {};
    if (c.calibre) {
      const largos = c.largos || 0, anchos = c.anchos || 0;
      const e = cantoPorCal[c.calibre] ||= { len_in: 0, edges: 0 };
      e.len_in += cant * (largos * lIn + anchos * aIn);
      e.edges += cant * (largos + anchos);
    }
    tarugos += cant * Number(pz.tarugos || 0);
    soportes += cant * Number(pz.soportes || 0);
    detalle.push({ pieza: pz.nombre, rol: pz.rol_tablero, cant, lIn: +lIn.toFixed(3), aIn: +aIn.toFixed(3), areaCm2: +area.toFixed(2) });
  }

  // Madera
  let madera = 0; const maderaRol = [];
  for (const [rol, cm2] of Object.entries(areaPorRol)) {
    const tab = tablerosByCode[preset[rol]];
    if (!tab) throw new Error(`Falta tablero rol ${rol}: ${preset[rol]}`);
    const costo = (cm2 * (1 + desp) / 10000) * Number(tab.precio_m2);
    madera += costo; maderaRol.push({ rol, code: preset[rol], cm2: +cm2.toFixed(2), costo: +costo.toFixed(2) });
  }

  // Canto
  let canto = 0; const cantoDet = [];
  for (const [cal, e] of Object.entries(cantoPorCal)) {
    const cz = cantosByCalibre[norm(cal)];
    if (!cz) throw new Error(`Falta canto calibre ${cal}`);
    const len_cm = e.len_in * IN2CM + e.edges * 5;     // +5cm desperdicio por arista
    const costo = (len_cm / 100) * Number(cz.precio);
    canto += costo; cantoDet.push({ calibre: cal, len_cm: +len_cm.toFixed(2), precio: Number(cz.precio), costo: +costo.toFixed(2) });
  }

  // Consumibles
  const pH = (sel) => Number((herrajes.find((h) => h.selector_key === sel) || {}).precio || 0);
  const dimsArr = [dims.L, dims.A, dims.P].sort((a, b) => b - a);
  const cartonUnd = Math.round((((dimsArr[0] * 2 * IN2CM) / 200) * ((dimsArr[1] * 2 * IN2CM) / 130)) * 10) / 10;
  const cons = {
    tarugos: tarugos * pH('tarugo'),
    soportes: soportes * pH('soporte'),
    carton: cartonUnd * pH('carton'),
    etiquetas: etiquetasUnd * pH('etiqueta'),
  };
  const consTotal = Object.values(cons).reduce((a, b) => a + b, 0);

  const sinHerrajes = madera + canto + consTotal;

  // Herrajes
  let herrajesTotal = 0; const herrajesDet = [];
  for (const hp of (herrajesPlantilla || [])) {
    const cant = evalExpr(hp.formula_cantidad, V);
    const precio = Number((herrajesCatalog[hp.herraje_codigo] || {}).precio || 0);
    const costo = cant * precio;
    herrajesTotal += costo;
    herrajesDet.push({ rol: hp.rol, codigo: hp.herraje_codigo, cant, precio, costo: +costo.toFixed(2) });
  }

  // Cadena de precio (Precio!: precio = costo/(1-margen); usd = /trm; recargo: /(1-recargo))
  const precioCop = sinHerrajes / (1 - margen);
  const precioCopConRecargo = precioCop / (1 - recargo);
  const precioUsd = precioCopConRecargo / trm;

  return { detalle, maderaRol, cantoDet, cons, madera, canto, consTotal, sinHerrajes, herrajesDet, herrajesTotal, conHerrajes: sinHerrajes + herrajesTotal, precioCop, precioCopConRecargo, precioUsd };
}

(async () => {
  const paramsRows = await rest('cot_parametros?select=key,value');
  const params = Object.fromEntries(paramsRows.map((r) => [r.key, r.value]));
  const tipo = (await rest('cot_tipos_mueble?pref=eq.SBFD&select=id,etiquetas_und,margen_key'))[0];
  const piezas = await rest(`cot_piezas_plantilla?tipo_mueble_id=eq.${tipo.id}&select=*&order=orden`);
  const reglas = await rest(`cot_reglas_config?or=(tipo_mueble_id.is.null,tipo_mueble_id.eq.${tipo.id})&activo=eq.true&select=*`);
  const herrajes = await rest('cot_herrajes?categoria=eq.consumible&select=selector_key,precio');
  const herrajesPlantilla = await rest(`cot_herrajes_plantilla?tipo_mueble_id=eq.${tipo.id}&select=*&order=orden`);
  const herrajesAll = await rest('cot_herrajes?select=codigo,precio');
  const herrajesCatalog = Object.fromEntries(herrajesAll.map((h) => [h.codigo, h]));
  const cantos = await rest('cot_cantos?select=calibre,precio');
  const cantosByCalibre = Object.fromEntries(cantos.map((c) => [norm(c.calibre), c]));

  const preset = { caja: 'ECOCARB15ARLINGTON', frente: 'ECOCARB18COLOR', fondo: 'PRICARB6CANDELARIA (POLAR)' };
  const inList = [...new Set(Object.values(preset))].map((c) => `"${c.replace(/"/g, '\\"')}"`).join(',');
  const tableros = await rest(`cot_tableros?codigo=in.(${encodeURIComponent(inList)})&select=codigo,precio_m2`);
  const tablerosByCode = Object.fromEntries(tableros.map((t) => [t.codigo, t]));

  const dims = { L: 33, A: 30, P: 24 };
  const vars = derivarVars(reglas, dims);
  const margen = Number(params.margenes.muebles);
  const recargo = Number(params.recargo_extra);
  const trm = Number(params.trm.valor);

  const res = calcular({ piezas, tablerosByCode, cantosByCalibre, preset, dims, vars, params, herrajes, herrajesPlantilla, herrajesCatalog, etiquetasUnd: tipo.etiquetas_und, margen, recargo, trm });

  console.log('Variables derivadas:', vars, '\n');
  console.log('=== Piezas ==='); console.table(res.detalle);
  console.log('=== Madera por rol ==='); console.table(res.maderaRol);
  console.log('=== Canto por calibre ==='); console.table(res.cantoDet);
  console.log('=== Consumibles ===', res.cons, '\n');
  console.log('=== Herrajes ==='); console.table(res.herrajesDet);

  const fmt = (n) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
  console.log(`Madera:       ${fmt(res.madera)}`);
  console.log(`Canto:        ${fmt(res.canto)}`);
  console.log(`Consumibles:  ${fmt(res.consTotal)}`);
  console.log(`--------------------------------`);
  console.log(`SIN HERRAJES: ${fmt(res.sinHerrajes)} COP`);
  const ESP = 134587.64; const diff = res.sinHerrajes - ESP;
  console.log(`Excel I722:   ${fmt(ESP)} COP   (diff ${diff.toFixed(2)})  ${Math.abs(diff) < 5 ? '✅' : '❌'}`);
  console.log(`HERRAJES:     ${fmt(res.herrajesTotal)} COP`);
  const ESPJ = 34816; const diffJ = res.herrajesTotal - ESPJ;
  console.log(`Excel J722:   ${fmt(ESPJ)} COP   (diff ${diffJ.toFixed(2)})  ${Math.abs(diffJ) < 5 ? '✅' : '❌'}`);
  console.log(`CON HERRAJES: ${fmt(res.conHerrajes)} COP`);
  const ESPK = 169403.64; const diffK = res.conHerrajes - ESPK;
  console.log(`Excel K722:   ${fmt(ESPK)} COP   (diff ${diffK.toFixed(2)})  ${Math.abs(diffK) < 5 ? '✅' : '❌'}`);
  console.log(`\n--- Cadena de precio (margen ${margen}, recargo ${recargo}, TRM ${trm}) ---`);
  console.log(`Precio COP (s/recargo): ${fmt(res.precioCop)}`);
  console.log(`Precio COP (c/recargo): ${fmt(res.precioCopConRecargo)}`);
  console.log(`Precio USD:             ${fmt(res.precioUsd)}`);
})().catch((e) => { console.error(e); process.exit(1); });
