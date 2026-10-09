// Parámetros de planta del optimizador de corte. Viven en `cot_parametros` bajo la
// llave `optimizador` (migración 0180) y se editan desde la pestaña Optimizador.
// Módulo puro: sin Next ni Supabase, para poder probarlo igual que el motor.
// Valores confirmados por producción el 2026-10-07; ver docs/plan_optimizador_corte.md §4.1.

export type FormatoLamina = { codigo: string; largoMm: number; anchoMm: number; activo: boolean };
export type PilaEspesor = { espesorMm: number; laminas: number };
export type TexturaVeta = { nombre: string; rotaVeta: boolean };
export type CriterioOptimizacion = 'desperdicio' | 'laminas' | 'sobrante_ultima' | 'cortes';

export type ConfigOptimizador = {
  maquina: string;
  discoMm: number;
  nivelesCorte: number;
  giraLamina: boolean;
  refiladoMm: number;
  refiladoMaxMm: number;
  refilarSoloZonaUsada: boolean;
  sobranteMinLargoMm: number;
  sobranteMinAnchoMm: number;
  sobranteEnUltimaLamina: boolean;
  desperdicioMaxPct: number;
  // 0 = sin definir: la planificación por días queda pendiente.
  piezasPorDia: number;
  pilas: PilaEspesor[];
  formatos: FormatoLamina[];
  texturas: TexturaVeta[];
  criterio: CriterioOptimizacion[];
};

export const CRITERIOS: { key: CriterioOptimizacion; label: string }[] = [
  { key: 'desperdicio', label: 'No superar el desperdicio máximo por material' },
  { key: 'laminas', label: 'Usar menos láminas' },
  { key: 'sobrante_ultima', label: 'Dejar el sobrante en la última lámina, en una sola pieza' },
  { key: 'cortes', label: 'Hacer menos cortes' },
];

export const CONFIG_OPTIMIZADOR_DEFAULT: ConfigOptimizador = {
  maquina: 'Seccionadora Holz-Her',
  discoMm: 4.4,
  // Provisional: producción aún no confirma los niveles de guillotina.
  nivelesCorte: 3,
  giraLamina: true,
  refiladoMm: 5,
  refiladoMaxMm: 9,
  refilarSoloZonaUsada: true,
  sobranteMinLargoMm: 1000,
  sobranteMinAnchoMm: 500,
  sobranteEnUltimaLamina: true,
  desperdicioMaxPct: 15,
  piezasPorDia: 0,
  pilas: [
    { espesorMm: 15, laminas: 4 },
    { espesorMm: 18, laminas: 3 },
  ],
  formatos: [
    { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true },
    { codigo: '124X246', largoMm: 2460, anchoMm: 1240, activo: true },
    // Existen en el catálogo pero producción no los confirmó.
    { codigo: '122X244', largoMm: 2440, anchoMm: 1220, activo: false },
    { codigo: '280X207', largoMm: 2800, anchoMm: 2070, activo: false },
  ],
  texturas: [
    { nombre: 'Soft', rotaVeta: true },
    { nombre: 'Rustick', rotaVeta: false },
    { nombre: 'Amazonas', rotaVeta: false },
  ],
  criterio: ['desperdicio', 'laminas', 'sobrante_ultima', 'cortes'],
};

const num = (v: unknown, def: number, min = 0, max = Number.POSITIVE_INFINITY) => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
};
const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
const texto = (v: unknown, def: string) => (typeof v === 'string' && v.trim() ? v.trim() : def);

// `cot_tableros.formato` mezcla "183X244" y "183x244". La clave canónica es en mayúsculas.
export function normalizarFormato(formato: string | null | undefined): string {
  return String(formato ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

// "183X244" está en cm: lado mayor = largo, lado menor = ancho, en mm.
export function dimsDesdeCodigoFormato(codigo: string): { largoMm: number; anchoMm: number } | null {
  const m = normalizarFormato(codigo).match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const a = Number(m[1]) * 10;
  const b = Number(m[2]) * 10;
  return { largoMm: Math.max(a, b), anchoMm: Math.min(a, b) };
}

// Acepta lo que venga de la base o del formulario y devuelve una configuración completa y válida.
export function normalizarConfig(raw: unknown): ConfigOptimizador {
  const d = CONFIG_OPTIMIZADOR_DEFAULT;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const refiladoMaxMm = num(r.refiladoMaxMm, d.refiladoMaxMm, 0, 50);

  const pilas = Array.isArray(r.pilas)
    ? (r.pilas as Record<string, unknown>[])
        .map((p) => ({ espesorMm: num(p?.espesorMm, NaN, 0, 100), laminas: Math.round(num(p?.laminas, NaN, 1, 50)) }))
        .filter((p) => Number.isFinite(p.espesorMm) && p.espesorMm > 0 && Number.isFinite(p.laminas))
    : d.pilas;
  const vistos = new Set<string>();
  const formatos = Array.isArray(r.formatos)
    ? (r.formatos as Record<string, unknown>[])
        .map((f) => {
          const codigo = normalizarFormato(String(f?.codigo ?? ''));
          const dims = dimsDesdeCodigoFormato(codigo);
          const largo = num(f?.largoMm, dims?.largoMm ?? NaN, 1, 10000);
          const ancho = num(f?.anchoMm, dims?.anchoMm ?? NaN, 1, 10000);
          return { codigo, largoMm: Math.max(largo, ancho), anchoMm: Math.min(largo, ancho), activo: bool(f?.activo, true) };
        })
        .filter((f) => f.codigo && Number.isFinite(f.largoMm) && Number.isFinite(f.anchoMm) && !vistos.has(f.codigo) && vistos.add(f.codigo))
    : d.formatos;
  const texturas = Array.isArray(r.texturas)
    ? (r.texturas as Record<string, unknown>[])
        .map((t) => ({ nombre: texto(t?.nombre, ''), rotaVeta: bool(t?.rotaVeta, true) }))
        .filter((t) => t.nombre)
    : d.texturas;
  const validos = new Set(CRITERIOS.map((c) => c.key));
  const criterio = Array.isArray(r.criterio)
    ? [...new Set((r.criterio as unknown[]).filter((c): c is CriterioOptimizacion => validos.has(c as CriterioOptimizacion)))]
    : d.criterio;
  for (const c of d.criterio) if (!criterio.includes(c)) criterio.push(c);

  return {
    maquina: texto(r.maquina, d.maquina),
    discoMm: num(r.discoMm, d.discoMm, 0, 20),
    nivelesCorte: Math.round(num(r.nivelesCorte, d.nivelesCorte, 1, 6)),
    giraLamina: bool(r.giraLamina, d.giraLamina),
    refiladoMm: num(r.refiladoMm, d.refiladoMm, 0, refiladoMaxMm),
    refiladoMaxMm,
    refilarSoloZonaUsada: bool(r.refilarSoloZonaUsada, d.refilarSoloZonaUsada),
    sobranteMinLargoMm: num(r.sobranteMinLargoMm, d.sobranteMinLargoMm, 0, 10000),
    sobranteMinAnchoMm: num(r.sobranteMinAnchoMm, d.sobranteMinAnchoMm, 0, 10000),
    sobranteEnUltimaLamina: bool(r.sobranteEnUltimaLamina, d.sobranteEnUltimaLamina),
    desperdicioMaxPct: num(r.desperdicioMaxPct, d.desperdicioMaxPct, 0, 100),
    piezasPorDia: Math.round(num(r.piezasPorDia, d.piezasPorDia, 0, 1_000_000)),
    pilas: pilas.sort((a, b) => a.espesorMm - b.espesorMm),
    formatos,
    texturas,
    criterio,
  };
}

export function formatoConfigurado(cfg: ConfigOptimizador, formato: string | null | undefined): FormatoLamina | null {
  const codigo = normalizarFormato(formato);
  return cfg.formatos.find((f) => f.codigo === codigo) ?? null;
}

// Láminas que la seccionadora corta a la vez para un espesor. null = espesor sin dato.
export function laminasPorPila(cfg: ConfigOptimizador, espesorMm: number | null | undefined): number | null {
  if (espesorMm == null) return null;
  return cfg.pilas.find((p) => Math.abs(p.espesorMm - Number(espesorMm)) < 0.01)?.laminas ?? null;
}

// Reparto de las piezas del proyecto en días de producción: días llenos con
// `piezasPorDia` y el último con el resto. Vacío si no hay ritmo definido.
export function repartoDiario(totalPiezas: number, piezasPorDia: number): number[] {
  const total = Math.max(0, Math.round(totalPiezas));
  const ritmo = Math.round(piezasPorDia);
  if (!(ritmo > 0) || total === 0) return [];
  const dias = Math.ceil(total / ritmo);
  return Array.from({ length: dias }, (_, i) => (i < dias - 1 ? ritmo : total - ritmo * (dias - 1)));
}
