import type { Pieza } from './engine';
import { toInches, type UnidadDim } from './engine';

/** El segundo eje de los entrepaños es su profundidad de fabricación. */
export function ajustarEntrepanos<T extends Pieza>(piezas: readonly T[], pref: string): T[] {
  const tipo = pref.trim().toUpperCase();
  const formula = tipo === 'B-SF' ? '350/25.4'
    : /^(B|B-FE)(?:-SF)?$/.test(tipo) ? '300/25.4'
    : 'P <= 23.000000001 ? P-1.5 : P-2';
  return piezas.map(p => /^entrepano(?:_|$)/i.test(p.nombre)
    ? { ...p, formula_ancho: formula, resta_ancho: 0 }
    : p);
}

type ModuloEditable = { preset: Record<string, string>; cantoCaja?: string; largo: number; alto: number; prof: number; unidad: UnidadDim; cantidad?: number };

/** Una edición incompatible se conserva separando únicamente el módulo editado. */
export function requiereSepararModulo(antes: ModuloEditable, despues: ModuloEditable): boolean {
  const tablero = (m: ModuloEditable, rol: string) => m.preset[rol] ?? (rol === 'refuerzo' ? m.preset.caja : '');
  const canto = (m: ModuloEditable) => (m.cantoCaja ?? '').toUpperCase().replace(/\s/g, '').replace(',', '.');
  return ['caja', 'refuerzo', 'fondo'].some(rol => tablero(antes, rol) !== tablero(despues, rol))
    || canto(antes) !== canto(despues)
    || (['largo', 'alto', 'prof'] as const).some(eje => Math.abs(toInches(antes[eje], antes.unidad) - toInches(despues[eje], despues.unidad)) > 0.000001)
    || Number(despues.cantidad ?? 1) !== 1;
}
