import type { Pieza, Regla } from './engine';
import { toInches, type UnidadDim } from './engine';

const FRENTES_HEREDADOS = new Set(['BLS', 'BLS-RS-SM', 'BOV', 'BOV-SF', 'CC', 'POD', 'UV', 'UDB', 'UVFD', 'USVFD', 'WLD', 'WER', 'WPC', 'BOMH-1', 'BOMH-1-FE', 'KF', 'SLOC', 'SB-SM', 'SBAS']);

/** Geometría de fabricación BOV, separada de la normalización histórica de ejes. */
export function ajustarGeometriaBov<T extends Pieza>(piezas: readonly T[], pref: string): T[] {
  if (!/^BOV(?:-SMG)?(?:-SF)?$/.test(pref)) return [...piezas];
  // STEP HRJ BOV8078.561-SMG: seis paneles; el frente baja a z=0 y la
  // base comienza detrás de su espesor, sin descontar el refuerzo posterior.
  if (pref === 'BOV-SMG' || pref === 'BOV-SMG-SF') return piezas
    .filter(p => p.nombre !== 'refuerzo_delantero')
    .map(p => {
      if (p.nombre === 'base') return { ...p, formula_ancho: 'P-TF', visualizacion: { ...p.visualizacion, version: 1, funcion: 'base', plano: 'XY', intercambiar: false, x: 'TC', y: 'TF', z: '0', confirmado: true } };
      if (p.nombre === 'frente') return { ...p, formula_largo: 'L-2*TC', formula_ancho: 'A-73/25.4', ...(pref === 'BOV-SMG' ? { tarugos: 8 } : {}), visualizacion: { ...p.visualizacion, version: 1, funcion: 'frente', plano: 'XZ', intercambiar: false, x: 'TC', y: '0', z: '0', confirmado: true } };
      if (pref === 'BOV-SMG' && p.nombre === 'refuerzo_trasero') return { ...p, visualizacion: { ...p.visualizacion, version: 1, funcion: 'travesano_posterior', plano: 'XZ', intercambiar: false, y: 'P-EP-(I===0 ? 0.2 : 0)', z: 'I===0 ? TC : A-H', confirmado: true } };
      return p;
    });
  return piezas.map(original => {
    let p = original;
    if (p.nombre === 'base') p = { ...p, formula_ancho: 'P-TR' };
    if (p.nombre === 'frente') p = { ...p, formula_largo: 'L-2*TC', formula_ancho: pref.includes('-SMG') ? 'A-TC-73/25.4' : 'A-TC', visualizacion: { ...p.visualizacion, version: 1, funcion: 'frente', plano: 'XZ', intercambiar: false, x: 'TC', y: '0', z: 'TC', confirmado: true } };
    if (p.nombre === 'refuerzo_delantero') p = { ...p, visualizacion: { ...p.visualizacion, version: 1, funcion: 'travesano_frontal', plano: 'XZ', intercambiar: false, y: 'TF', confirmado: true } };
    return p;
  });
}

/** Normaliza ejes geométricos; orientarPieza muestra después el alto del frente primero. */
export function normalizarPlantillasFabricacion<T extends Pieza>(piezas: readonly T[], pref: string): T[] {
  const corregida = /^(?:PC(?:-MO)?-SMG?|(?:BMW|BOMH)-1(?:-FE)?-SMG?)(?:-SF)?$/.test(pref);
  const bomh = /^BOMH-1(?:-FE)?-SMG?(?:-SF)?$/.test(pref);
  const base = piezas.find(p => p.nombre === 'base' || p.nombre === 'base_tapa');
  return piezas.map(original => {
    let p = original;
    if (pref === 'SVFDH-SMG' && p.nombre === 'frente') p = { ...p, formula_ancho: 'A-30/25.4' };
    if (/^SVFDH-SMG(?:-SF)?$/.test(pref) && p.nombre === 'refuerzo_delantero') p = { ...p, formula_ancho: '80/25.4' };
    if (/^S?BFD-SMG(?:-SF)?$/.test(pref) && p.nombre === 'frente') p = { ...p, formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas' };
    if (/^DB(?:-|$)/.test(pref) && !/-FE(?:-|$)/.test(pref) && p.nombre === 'base_gaveta') p = { ...p, cantos: { ...p.cantos, largos: 2, anchos: 0 } };
    const largo = String(p.formula_largo ?? ''), ancho = String(p.formula_ancho ?? '');
    const invertida = (/\bA\b/.test(largo) && !/\bA\b/.test(ancho)) || (!/\bL\b/.test(largo) && /\bL\b/.test(ancho));
    if ((FRENTES_HEREDADOS.has(pref) || /^BOMH-1(?:-FE)?-SMG?(?:-SF)?$/.test(pref)) && p.rol_tablero === 'frente' && /^(frente|puerta)(_|$)/.test(p.nombre) && invertida) {
      p = { ...p, formula_largo: p.formula_ancho, formula_ancho: p.formula_largo, ...(p.visualizacion ? { visualizacion: { ...p.visualizacion, intercambiar: false } } : {}) };
    }
    if (corregida && base && /^refuerzo_delantero(?:_|$)/.test(p.nombre)) p = {
      ...p, formula_largo: base.formula_largo, resta_largo: base.resta_largo,
      formula_ancho: '80/25.4', resta_ancho: 0,
    };
    if (bomh && /^(frente_izq|frente_der)$/.test(p.nombre)) p = {
      ...p, formula_ancho: 'A-80/25.4-fijo_inferior_z-TR', resta_ancho: 0,
      visualizacion: { ...p.visualizacion, z: 'FI+TR', intercambiar: false },
    };
    if (/^BOMH-1-SMG?(?:-SF)?$/.test(pref) && p.nombre === 'trasero_gaveta') p = { ...p, formula_ancho: '68/25.4', resta_ancho: 0 };
    const carcasa = (/^base(?:_|$)/.test(p.nombre) && !/^base_gaveta(?:_|$)/.test(p.nombre)) || /^tapa(?:_|$)/.test(p.nombre) || /refuerzo|gola/.test(p.nombre);
    if (carcasa && p.cantos) p = { ...p, cantos: { ...p.cantos, largos: Number(p.cantos.largos ?? 0) || Number(p.cantos.anchos ?? 0), anchos: 0 } };
    return p;
  });
}

/** El intervalo 21–24 pulgadas usa una puerta; las elecciones explícitas siguen siendo overrides. */
export function normalizarReglasPuertas<T extends Regla>(reglas: readonly T[]): T[] {
  return reglas.map(r => r.variable === 'n_puertas' && /^\s*L\s*<=\s*21\s*$/.test(r.condicion) ? { ...r, condicion: 'L < 24' } : r);
}

/** El segundo eje de los entrepaños es su profundidad de fabricación. */
export function ajustarEntrepanos<T extends Pieza>(piezas: readonly T[], pref: string): T[] {
  const tipo = pref.trim().toUpperCase();
  const fijoComoBase = /^(?:PC-MO(?:-SMG?)?|(?:BMW|BOMH)-1(?:-FE)?-SMG?)(?:-SF)?$/.test(tipo);
  const base = piezas.find(p => p.nombre === 'base' || p.nombre === 'base_tapa');
  const formula = tipo === 'B-SF' ? '350/25.4'
    : /^(B|B-FE)(?:-SF)?$/.test(tipo) ? '300/25.4'
    : 'P <= 23.000000001 ? P-1.5 : P-2';
  return piezas.map(p => fijoComoBase && base && p.nombre === 'entrepano_fijo'
    ? { ...p, formula_largo: base.formula_largo, formula_ancho: base.formula_ancho,
      resta_largo: base.resta_largo, resta_ancho: base.resta_ancho,
      visualizacion: { ...p.visualizacion, y: base.visualizacion?.y ?? '0' } }
    : /^entrepano(?:_|$)/i.test(p.nombre)
    ? { ...p, formula_ancho: formula, resta_ancho: 0 }
    : p);
}

type ModuloEditable = { preset: Record<string, string>; cantoCaja?: string; largo: number; alto: number; prof: number; unidad: UnidadDim; cantidad?: number };

/** Solo los cambios geométricos o de cantidad requieren separar una línea del grupo. */
export function requiereSepararModulo(antes: ModuloEditable, despues: ModuloEditable): boolean {
  return (['largo', 'alto', 'prof'] as const).some(eje => Math.abs(toInches(antes[eje], antes.unidad) - toInches(despues[eje], despues.unidad)) > 0.000001)
    || Number(despues.cantidad ?? 1) !== 1;
}
