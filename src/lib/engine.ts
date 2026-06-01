// ============================================================================
// Motor de cálculo del Cotizador PLUS (portado y validado contra el Excel CEMA).
// Reproduce al centavo: tablero (área+desperdicio) + canto (por aristas) +
// consumibles + herrajes + cadena de precio (margen/recargo/TRM).
// Es agnóstico de framework: recibe los datos (plantillas, catálogos, parámetros)
// y devuelve el desglose completo.
// ============================================================================

export const IN2CM = 2.54;
const norm = (s: unknown) => String(s ?? '').toUpperCase().replace(/\s+/g, '');

// --- Evaluador de fórmulas (autoría admin; vars confiables) ---
const ALLOWED = /^[0-9+\-*/().\s A-Za-z_<>=!&|?:]*$/;
export function evalExpr(expr: string | number | null | undefined, vars: Record<string, number | boolean>): number | boolean {
  if (expr === null || expr === undefined || expr === '') return 0;
  const s = String(expr);
  if (!ALLOWED.test(s)) throw new Error(`Expresión no permitida: ${s}`);
  const keys = Object.keys(vars);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...keys, `"use strict"; return (${s});`);
  const v = fn(...keys.map((k) => vars[k]));
  return typeof v === 'boolean' ? v : Number(v);
}

// --- Tipos ---
export type Dims = { L: number; A: number; P: number };
export type UnidadDim = 'in' | 'cm' | 'mm';

export type Regla = { variable: string; condicion: string; valor: string; prioridad: number; tipo_mueble_id: string | null };
export type Pieza = {
  nombre: string; rol_tablero: string;
  formula_cantidad: string; formula_largo: string | null; formula_ancho: string | null;
  resta_largo?: number; resta_ancho?: number;
  cantos?: { calibre?: string; largos?: number; anchos?: number; despEdges?: number } | null;
  tarugos?: number; soportes?: number;
};
export type HerrajePlantilla = { rol: string; herraje_codigo: string | null; selector_key: string | null; formula_cantidad: string };
export type Tablero = { codigo: string; precio_m2: number };
export type Canto = { calibre: string; precio: number };
export type Herraje = { codigo: string; precio: number };
export type Parametros = {
  desperdicio_madera: number;
  margenes: Record<string, number>;
  recargo_extra: number;
  trm: { valor: number; modo?: string };
};

export type Preset = Record<string, string>; // rol_tablero -> codigo de tablero

export type CalcInput = {
  dims: Dims;
  unidad?: UnidadDim;
  piezas: Pieza[];
  herrajesPlantilla?: HerrajePlantilla[];
  reglas: Regla[];
  preset: Preset;
  tablerosByCode: Record<string, Tablero>;
  cantosByCalibre: Record<string, Canto>;   // clave normalizada (norm())
  herrajesByCode: Record<string, Herraje>;
  consumiblesBySelector: Record<string, number>; // selector_key -> precio
  etiquetasUnd: number;
  usaCarton?: boolean;
  margen: number;
  recargo: number;     // recargo cliente (ej. 0.10)
  trm: number;
  desperdicio: number;
  overrides?: Record<string, number>; // forzar n_puertas, etc.
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes'; // O* = sin_frentes ; KF-* = solo_frentes
};

// Convierte dimensiones de la unidad de entrada a pulgadas (el motor trabaja en pulgadas).
export function toInches(value: number, unidad: UnidadDim): number {
  if (unidad === 'in') return value;
  if (unidad === 'cm') return value / 2.54;
  return value / 25.4; // mm
}

// Deriva variables (n_puertas, n_entrepanos, n_patas, n_cajones...) desde reglas.
export function derivarVars(reglas: Regla[], dims: Dims, overrides: Record<string, number> = {}): Record<string, number> {
  const out: Record<string, number> = {};
  const byVar: Record<string, Regla[]> = {};
  for (const r of reglas) (byVar[r.variable] ||= []).push(r);
  for (const [variable, rs] of Object.entries(byVar)) {
    rs.sort((a, b) => a.prioridad - b.prioridad);
    for (const r of rs) {
      if (evalExpr(r.condicion, { ...dims, ...out }) === true) {
        out[variable] = Number(evalExpr(r.valor, { ...dims, ...out }));
        break;
      }
    }
  }
  return { ...out, ...overrides };
}

export type Breakdown = {
  vars: Record<string, number>;
  piezas: { pieza: string; rol: string; cant: number; largoIn: number; anchoIn: number; areaCm2: number }[];
  maderaPorRol: { rol: string; codigo: string; cm2: number; costo: number }[];
  cantoPorCalibre: { calibre: string; longCm: number; precio: number; costo: number }[];
  consumibles: Record<string, number>;
  herrajes: { rol: string; codigo: string | null; cant: number; precio: number; costo: number }[];
  costoMadera: number;
  costoCanto: number;
  costoConsumibles: number;
  costoSinHerrajes: number;
  costoHerrajes: number;
  costoConHerrajes: number;
  precioCop: number;
  precioCopConRecargo: number;
  precioUsd: number;
};

export function calcularMueble(inp: CalcInput): Breakdown {
  const dims = inp.dims;
  const vars = derivarVars(inp.reglas, dims, inp.overrides || {});
  const V: Record<string, number> = { ...dims, ...vars };
  const num = (e: string | number | null | undefined) => Number(evalExpr(e, V));

  const areaPorRol: Record<string, number> = {};
  const cantoPorCal: Record<string, { lenIn: number; edges: number }> = {};
  let tarugos = 0, soportes = 0;
  const piezasDet: Breakdown['piezas'] = [];

  const modo = inp.modoFrentes ?? 'normal';
  for (const pz of inp.piezas) {
    const esFrente = pz.rol_tablero === 'frente' || /frente/i.test(pz.nombre);
    if (modo === 'sin_frentes' && esFrente) continue;       // open: caja sin puertas/frentes
    if (modo === 'solo_frentes' && !esFrente) continue;     // kit de frentes: solo puertas/frentes
    const cant = num(pz.formula_cantidad);
    const lIn = num(pz.formula_largo) - (pz.resta_largo || 0);
    const aIn = num(pz.formula_ancho) - (pz.resta_ancho || 0);
    const area = cant * lIn * aIn * IN2CM * IN2CM;
    // Solo suma área si la pieza tiene rol de tablero; piezas "canto-only" (sin rol) aportan únicamente canto.
    if (pz.rol_tablero) areaPorRol[pz.rol_tablero] = (areaPorRol[pz.rol_tablero] || 0) + area;
    const c = pz.cantos || {};
    if (c.calibre) {
      const largos = c.largos || 0, anchos = c.anchos || 0;
      const e = (cantoPorCal[c.calibre] ||= { lenIn: 0, edges: 0 });
      e.lenIn += cant * (largos * lIn + anchos * aIn);
      // aristas para el desperdicio (5cm c/u). Si despEdges está definido, se usa; si no, largos+anchos.
      const de = (c.despEdges !== undefined && c.despEdges !== null) ? c.despEdges : (largos + anchos);
      e.edges += cant * de;
    }
    tarugos += cant * Number(pz.tarugos || 0);
    soportes += cant * Number(pz.soportes || 0);
    piezasDet.push({ pieza: pz.nombre, rol: pz.rol_tablero, cant, largoIn: +lIn.toFixed(3), anchoIn: +aIn.toFixed(3), areaCm2: +area.toFixed(2) });
  }

  // Madera
  let costoMadera = 0; const maderaPorRol: Breakdown['maderaPorRol'] = [];
  for (const [rol, cm2] of Object.entries(areaPorRol)) {
    const tab = inp.tablerosByCode[inp.preset[rol]];
    if (!tab) throw new Error(`Falta tablero para rol "${rol}": ${inp.preset[rol]}`);
    const costo = (cm2 * (1 + inp.desperdicio) / 10000) * Number(tab.precio_m2);
    costoMadera += costo;
    maderaPorRol.push({ rol, codigo: inp.preset[rol], cm2: +cm2.toFixed(2), costo: +costo.toFixed(2) });
  }

  // Canto
  let costoCanto = 0; const cantoPorCalibre: Breakdown['cantoPorCalibre'] = [];
  for (const [cal, e] of Object.entries(cantoPorCal)) {
    const cz = inp.cantosByCalibre[norm(cal)];
    if (!cz) throw new Error(`Falta canto calibre "${cal}"`);
    const longCm = e.lenIn * IN2CM + e.edges * 5;
    const costo = (longCm / 100) * Number(cz.precio);
    costoCanto += costo;
    cantoPorCalibre.push({ calibre: cal, longCm: +longCm.toFixed(2), precio: Number(cz.precio), costo: +costo.toFixed(2) });
  }

  // Consumibles
  const pc = (sel: string) => Number(inp.consumiblesBySelector[sel] || 0);
  const dimsArr = [dims.L, dims.A, dims.P].sort((a, b) => b - a);
  const cartonUnd = (inp.usaCarton === false) ? 0 : Math.round((((dimsArr[0] * 2 * IN2CM) / 200) * ((dimsArr[1] * 2 * IN2CM) / 130)) * 10) / 10;
  const consumibles = {
    tarugos: tarugos * pc('tarugo'),
    soportes: soportes * pc('soporte'),
    carton: cartonUnd * pc('carton'),
    etiquetas: inp.etiquetasUnd * pc('etiqueta'),
  };
  const costoConsumibles = Object.values(consumibles).reduce((a, b) => a + b, 0);

  const costoSinHerrajes = costoMadera + costoCanto + costoConsumibles;

  // Herrajes
  let costoHerrajes = 0; const herrajesDet: Breakdown['herrajes'] = [];
  const ESTRUCTURAL = new Set(['pata', 'tornillo', 'riel', 'barra']);
  for (const hp of (inp.herrajesPlantilla || [])) {
    // "Sin frentes": la carcasa conserva sus herrajes (queda lista para frentes). Kit de frentes: solo herraje de puerta.
    if (modo === 'solo_frentes' && ESTRUCTURAL.has(hp.rol)) continue;
    const cant = num(hp.formula_cantidad);
    const precio = Number((inp.herrajesByCode[hp.herraje_codigo || ''] || {}).precio || 0);
    const costo = cant * precio;
    costoHerrajes += costo;
    herrajesDet.push({ rol: hp.rol, codigo: hp.herraje_codigo, cant, precio, costo: +costo.toFixed(2) });
  }

  const costoConHerrajes = costoSinHerrajes + costoHerrajes;
  const precioCop = costoSinHerrajes / (1 - inp.margen);
  const precioCopConRecargo = precioCop / (1 - inp.recargo);
  const precioUsd = precioCopConRecargo / inp.trm;

  return {
    vars, piezas: piezasDet, maderaPorRol, cantoPorCalibre, consumibles, herrajes: herrajesDet,
    costoMadera, costoCanto, costoConsumibles, costoSinHerrajes, costoHerrajes, costoConHerrajes,
    precioCop, precioCopConRecargo, precioUsd,
  };
}

export const normCalibre = norm;
