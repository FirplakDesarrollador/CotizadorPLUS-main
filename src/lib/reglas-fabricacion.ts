import type { Pieza, Regla } from './engine';
import { toInches, type UnidadDim } from './engine';

const FRENTES_HEREDADOS = new Set(['BLS', 'BLS-RS-SM', 'BOV', 'BOV-SF', 'CC', 'POD', 'UV', 'UDB', 'UVFD', 'USVFD', 'WLD', 'WER', 'WPC', 'BOMH-1', 'BOMH-1-FE', 'KF', 'SLOC', 'SB-SM', 'SBAS']);

/** Geometría de fabricación BOV, separada de la normalización histórica de ejes. */
export function ajustarGeometriaBov<T extends Pieza>(piezas: readonly T[], pref: string): T[] {
  if (!/^BOV(?:-SMG)?(?:-SF)?$/.test(pref)) return [...piezas];
  // STEP HRJ BOV8078.561-SMG: seis paneles; el frente baja a z=0 y la
  // base comienza detrás de su espesor, sin descontar el refuerzo posterior.
  if (pref === 'BOV-SMG' || pref === 'BOV-SMG-SF') return piezas
    .map(p => {
      if (p.nombre === 'base') return { ...p, formula_ancho: 'P-TF', visualizacion: { ...p.visualizacion, version: 1, funcion: 'base', plano: 'XY', intercambiar: false, x: 'TC', y: 'TF', z: '0', confirmado: true } };
      if (p.nombre === 'frente') return { ...p, formula_largo: 'L-2*TC', formula_ancho: 'A-73/25.4', ...(pref === 'BOV-SMG' ? { tarugos: 8 } : {}), visualizacion: { ...p.visualizacion, version: 1, funcion: 'frente', plano: 'XZ', intercambiar: false, x: 'TC', y: '0', z: '0', confirmado: true } };
      if (p.nombre === 'refuerzo_delantero') return { ...p, formula_largo: 'L-2*TC', formula_ancho: '80/25.4', tarugos: 4, cantos: { ...p.cantos, calibre: p.cantos?.calibre ?? '19x0,45', largos: 2, anchos: 0 }, visualizacion: { ...p.visualizacion, version: 1, funcion: 'travesano_frontal', plano: 'XZ', intercambiar: true, x: '(L-80/25.4)/2', y: '27', z: 'TC', confirmado: true, nota: 'Refuerzo vertical a 27 mm del borde delantero del lateral.' } };
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
  return piezas.map(original => {
    let p = original;
    if (pref === 'SVFDH-SMG' && p.nombre === 'frente') p = { ...p, formula_ancho: 'A-30/25.4' };
    if (/^SVFDH-SMG(?:-SF)?$/.test(pref) && p.nombre === 'refuerzo_delantero') p = { ...p, formula_ancho: '80/25.4' };
    if (/^S?BFD-SMG(?:-SF)?$/.test(pref) && p.nombre === 'frente') p = { ...p, formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas' };
    if (/^DB(?:-|$)/.test(pref) && !/-FE(?:-|$)/.test(pref) && p.nombre === 'base_gaveta') p = { ...p, cantos: { ...p.cantos, largos: 2, anchos: 0 } };
    const largo = String(p.formula_largo ?? ''), ancho = String(p.formula_ancho ?? '');
    const invertida = (/\bA\b/.test(largo) && !/\bA\b/.test(ancho)) || (!/\bL\b/.test(largo) && /\bL\b/.test(ancho));
    if (FRENTES_HEREDADOS.has(pref) && p.rol_tablero === 'frente' && /^(frente|puerta)(_|$)/.test(p.nombre) && invertida) {
      p = { ...p, formula_largo: p.formula_ancho, formula_ancho: p.formula_largo, ...(p.visualizacion ? { visualizacion: { ...p.visualizacion, intercambiar: false } } : {}) };
    }
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
