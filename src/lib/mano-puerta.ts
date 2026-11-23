import { derivarVars, toInches, type Regla, type UnidadDim } from './engine';
import { normalizarReglasPuertas } from './reglas-fabricacion';

export type ManoPuerta = 'L' | 'R';
export const manoValida = (mano: unknown): mano is ManoPuerta => mano === 'L' || mano === 'R';
export const requiereManoPuerta = (pref: string | null | undefined, puertas: number | null | undefined): boolean =>
  ['W-SM', 'WLD', 'WSM'].includes(String(pref ?? '').toUpperCase()) && puertas === 1;

/** Mismas reglas activas y normalización del motor; el override explícito prevalece. */
export function puertasSegunReglas(reglas: readonly Regla[] | undefined, medidas: { largo: number; alto: number; prof: number; unidad: UnidadDim }, override?: number): number | undefined {
  if (override != null) return override;
  if (!reglas?.length || ![medidas.largo, medidas.alto, medidas.prof].every(Number.isFinite)) return undefined;
  try {
    return derivarVars(normalizarReglasPuertas(reglas), { L: toInches(medidas.largo, medidas.unidad), A: toInches(medidas.alto, medidas.unidad), P: toInches(medidas.prof, medidas.unidad) }).n_puertas;
  } catch { return undefined; }
}

export function validarManoPuerta(pref: string | undefined, puertas: number | undefined, mano: unknown): void {
  if (requiereManoPuerta(pref, puertas) && !manoValida(mano)) throw new Error('Selecciona L o R para la apertura del mueble de una puerta.');
}

export function codigoConMano(codigo: string, pref: string | null | undefined, puertas: number | undefined, mano: unknown): string {
  return requiereManoPuerta(pref, puertas) && manoValida(mano) ? `${codigo.replace(/-[LR]$/, '')}-${mano}` : codigo;
}
