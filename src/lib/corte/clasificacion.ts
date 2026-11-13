// Clasificación de los módulos de una cotización para el optimizador de corte.
//
// El grupo sale del catálogo (cot_tipos_mueble.grupo_optimizador, migraciones 0260 y 0261).
// Si un tipo no lo trae, se deriva: categoria 'zocalo' → zocalo (TK); margen_key 'pn_tk' →
// panel (PN, D, R); 'fillers' → filler (F); el resto → mueble.
// Los artículos de "+ Agregar herrajes/otros" no son módulos y no llegan aquí.

export type GrupoOptimizador = 'mueble' | 'panel' | 'filler' | 'zocalo';

export const GRUPOS_OPTIMIZADOR: readonly GrupoOptimizador[] = ['mueble', 'panel', 'filler', 'zocalo'];

export const ETIQUETA_GRUPO: Record<GrupoOptimizador, string> = {
  mueble: 'Muebles',
  panel: 'Paneles',
  filler: 'Fillers',
  zocalo: 'Zócalos (TK)',
};

export type TipoClasificable = { grupo_optimizador?: string | null; margen_key?: string | null; categoria?: string | null };

export function grupoDeTipo(tipo: TipoClasificable | null | undefined): GrupoOptimizador {
  const g = tipo?.grupo_optimizador;
  if (g === 'mueble' || g === 'panel' || g === 'filler' || g === 'zocalo') return g;
  if (tipo?.categoria === 'zocalo') return 'zocalo';
  if (tipo?.margen_key === 'pn_tk') return 'panel';
  if (tipo?.margen_key === 'fillers') return 'filler';
  return 'mueble';
}

/** Unidades físicas de una línea: su cantidad por las repeticiones del área (cocina × N). */
export function unidadesFisicas(cantidad: number, repeticionesArea: number | null | undefined): number {
  const c = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
  const r = repeticionesArea != null && Number.isFinite(repeticionesArea) && repeticionesArea > 0 ? repeticionesArea : 1;
  return c * r;
}

export type ResumenGrupo = { grupo: GrupoOptimizador; lineas: number; unidades: number; piezas: number; errores: number };

/**
 * Totales por grupo (siempre los cuatro, en orden fijo). Módulos sin grupo cuentan como mueble.
 * `unidades` cuenta muebles: un módulo agrupado (laterales compartidos) aporta todos sus muebles.
 */
export function resumenPorGrupo(
  modulos: { grupo?: GrupoOptimizador; cantidad: number; piezasPorModulo: number; mueblesPorModulo?: number }[],
  errores: { grupo?: GrupoOptimizador }[] = [],
): ResumenGrupo[] {
  const out = new Map(GRUPOS_OPTIMIZADOR.map((g) => [g, { grupo: g, lineas: 0, unidades: 0, piezas: 0, errores: 0 }]));
  for (const m of modulos) {
    const r = out.get(m.grupo ?? 'mueble')!;
    r.lineas += 1;
    r.unidades += m.cantidad * Math.max(1, m.mueblesPorModulo ?? 1);
    r.piezas += m.cantidad * m.piezasPorModulo;
  }
  for (const e of errores) out.get(e.grupo ?? 'mueble')!.errores += 1;
  for (const r of out.values()) r.piezas = Math.round(r.piezas * 100) / 100;
  return [...out.values()];
}

/**
 * Firma del despiece de un módulo: dos líneas con el mismo código pero distintas
 * medidas o piezas no deben juntarse en el resumen.
 */
export function firmaDespiece(piezas: { pieza: string; cant: number; largoIn: number; anchoIn: number }[]): string {
  return piezas
    .map((p) => `${p.pieza}:${p.cant}:${Math.round(p.largoIn * 1000)}x${Math.round(p.anchoIn * 1000)}`)
    .sort()
    .join('|');
}
