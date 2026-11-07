import { codigoComercial, type SistemaMedida } from './module-groups';
import type { UnidadDim } from './engine';

export const esPanel = (pref: string | null | undefined) => /^PN(?:$|[-\d\s])/i.test(String(pref ?? '').trim());
export function nombrePanel(nota?: string | null): string {
  const detalle = (nota ?? '').trim().replace(/^PN\s*[-–—]\s*/i, '').replace(/^Panel(?:\s+|$)/i, '').replace(/\s+/g, ' ').trim();
  return `PN - Panel${detalle ? ` ${detalle}` : ''}`;
}
export function etiquetaTipoModulo(pref: string, nombre?: string | null): string {
  if (esPanel(pref)) return nombrePanel();
  return ['BBLFD', 'BBLFD-D-L/R-SM', 'WBL-D-L/R-SM', 'BLS', 'BLS-RS-SM', 'BOMH-1', 'BOMH-1-FE'].includes(pref)
    ? (nombre ?? pref) : `${pref} — ${nombre ?? ''}`;
}
export function descripcionConNotas(linea: { pref?: string | null; descripcion_es?: string | null; anotaciones?: string | null }): string {
  return esPanel(linea.pref) ? nombrePanel(linea.anotaciones) : [linea.descripcion_es, linea.anotaciones].filter(Boolean).join(' · ');
}

export type LineaParaNombre = { tipo_mueble_id: string | null; pref?: string | null; codigo_modulo?: string | null; descripcion_es?: string | null; anotaciones?: string | null; largo: number; alto: number; prof: number; unidad_dim: UnidadDim; config?: Record<string, unknown> | null };
export type TipoParaNombre = { id: string; pref: string; pref_imperial?: string | null; pref_metrico?: string | null };
export type TableroParaNombre = { codigo: string; espesor_mm?: number | null };

/** Proyección de lectura: no modifica precios, selecciones ni snapshots históricos. */
export function normalizarNombresLineas<T extends LineaParaNombre>(lineas: readonly T[], tipos: readonly TipoParaNombre[], tableros: readonly TableroParaNombre[], sistema: SistemaMedida): T[] {
  const porTipo = new Map(tipos.map(t => [t.id, t]));
  const espesores = new Map(tableros.map(t => [t.codigo, t.espesor_mm]));
  return lineas.map(linea => {
    const tipo = linea.tipo_mueble_id ? porTipo.get(linea.tipo_mueble_id) : undefined;
    if (!tipo) return linea;
    const cfg = linea.config ?? {};
    const preset = (cfg.preset ?? {}) as Record<string, string>;
    const overrides = (cfg.overrides ?? {}) as Record<string, number>;
    const pref = (sistema === 'metrico' ? tipo.pref_metrico : tipo.pref_imperial) || tipo.pref;
    const codigo_modulo = codigoComercial({
      pref, largo: Number(linea.largo), alto: Number(linea.alto), prof: Number(linea.prof), unidad: linea.unidad_dim, sistema,
      espesorCajaMm: espesores.get(preset.caja), espesorFrenteMm: espesores.get(preset.frente),
      sistemaFrente: cfg.sistemaFrente as string | undefined, dbTipo: cfg.dbTipo as string | undefined,
      door: cfg.door == null ? undefined : Number(cfg.door), doorHand: cfg.doorHand as 'L' | 'R' | undefined,
      conFondo: cfg.conFondo !== false, zocaloIn: overrides.zocalo,
      pcfdCajones: pref === 'PCFD' ? overrides.n_cajones : undefined,
    });
    return { ...linea, pref: linea.pref?.trim() ? linea.pref : tipo.pref, codigo_modulo, ...(esPanel(tipo.pref) ? { descripcion_es: nombrePanel(linea.anotaciones) } : {}) };
  });
}
