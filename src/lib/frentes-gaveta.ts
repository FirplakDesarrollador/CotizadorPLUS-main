import type { Pieza, Regla } from './engine';

export const FORMULAS_FRENTES_DOS_PEQUENOS = {
  espacio_gola: '30/25.4',
  alto_frente_grande: '(A-2*espacio_gola)/2',
  alto_frente_pequeno: 'alto_frente_grande/2-RV',
} as const;

export function usaFrentesDosPequenosGola(pref: string | null | undefined): boolean {
  return /^DB-2S-SMG?(?:-FE)?(?:-SF)?$/.test(String(pref ?? '').trim().toUpperCase());
}

/** Dos frentes pequeños y uno inferior; las demás configuraciones conservan sus reglas. */
export function ajustarFrentesDosPequenosGola(piezas: readonly Pieza[], reglas: readonly Regla[], pref: string): { piezas: Pieza[]; reglas: Regla[] } {
  if (!usaFrentesDosPequenosGola(pref)) return { piezas: [...piezas], reglas: [...reglas] };
  const tipoId = reglas.find(r => r.tipo_mueble_id != null)?.tipo_mueble_id ?? null;
  return {
    piezas: piezas.map(p => p.nombre === 'frente_gaveta_grande' ? { ...p, formula_ancho: 'alto_frente_grande' }
      : p.nombre === 'frente_gaveta_pequena' ? { ...p, formula_ancho: 'alto_frente_pequeno' } : p),
    reglas: [
      ...reglas.filter(r => !(r.variable in FORMULAS_FRENTES_DOS_PEQUENOS)),
      ...Object.entries(FORMULAS_FRENTES_DOS_PEQUENOS).map(([variable, valor]) => ({ variable, valor, condicion: 'true', prioridad: 1, tipo_mueble_id: tipoId })),
    ],
  };
}
