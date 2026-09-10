/** Mounting metadata is independent of costing and cutting formulas. Coordinates: mm. */
export const FUNCIONES_MONTAJE = [
  'automatico', 'lateral', 'base', 'tapa', 'base_tapa', 'estante', 'division',
  'respaldo', 'travesano_frontal', 'travesano_posterior', 'travesano_lateral',
  'frente', 'frente_gaveta', 'frente_falso', 'base_gaveta', 'trasero_gaveta',
  'lateral_gaveta', 'frente_interior', 'gola', 'zocalo', 'panel', 'suelto', 'omitir',
] as const;
export type FuncionMontaje = typeof FUNCIONES_MONTAJE[number];
export type PlanoMontaje = 'XY' | 'XZ' | 'YZ';
export type MontajeConfig = {
  version?: 1;
  funcion?: FuncionMontaje;
  plano?: PlanoMontaje;
  intercambiar?: boolean;
  x?: string; y?: string; z?: string;
  giro?: 0 | 90 | 180 | 270 | string;
  confirmado?: boolean;
  nota?: string;
};

// No JS evaluation in the browser. The server's trusted formula evaluator receives
// only these coordinate variables; validate names and syntax before persistence.
export const VARIABLES_MONTAJE = ['L','A','P','TC','TF','TB','LP','AP','EP','I','N','W','D','H','X','Y','Z'];
export function validarMontaje(value: unknown): MontajeConfig | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Montaje debe ser un objeto.');
  const v = value as Record<string, unknown>;
  const allowed = ['version','funcion','plano','intercambiar','x','y','z','giro','confirmado','nota'];
  if (Object.keys(v).some(k => !allowed.includes(k))) throw new Error('Campo de montaje desconocido.');
  if (v.version != null && v.version !== 1) throw new Error('Versión de montaje no soportada.');
  if (v.funcion != null && !FUNCIONES_MONTAJE.includes(v.funcion as FuncionMontaje)) throw new Error('Función de montaje inválida.');
  if (v.plano != null && !['XY','XZ','YZ'].includes(String(v.plano))) throw new Error('Plano inválido.');
  if (v.giro != null && typeof v.giro !== 'string' && ![0,90,180,270].includes(Number(v.giro))) throw new Error('Giro inválido.');
  for (const key of ['confirmado','intercambiar']) if (v[key] != null && typeof v[key] !== 'boolean') throw new Error(`${key} debe ser booleano.`);
  for (const key of ['x','y','z','giro']) {
    if (v[key] == null || v[key] === '') continue;
    if (key==='giro' && typeof v[key]==='number') continue;
    const e = v[key];
    if (typeof e !== 'string' || e.length > 240 || !/^[\d\sA-Z+*/().<>=!&|?:-]+$/.test(e)) throw new Error(`Fórmula ${key.toUpperCase()} inválida.`);
    const names = e.match(/[A-Z]+/g) ?? [];
    if (names.some(n => !VARIABLES_MONTAJE.includes(n))) throw new Error(`Variable no permitida en ${key.toUpperCase()}.`);
    // Reject assignments, mutations, statements and arbitrary function calls.
    if (/(^|[^<>=!])=([^=]|$)|\+\+|--|[A-Z]\s*\(/.test(e)) throw new Error('Solo se permiten expresiones aritméticas de montaje.');
  }
  if (v.nota != null && (typeof v.nota !== 'string' || v.nota.length > 600)) throw new Error('Nota demasiado larga.');
  return { ...v, version: 1 } as MontajeConfig;
}

export function inferirMontaje(p: { nombre: string; rol_tablero: string; formula_largo: string | null; formula_ancho: string | null }): MontajeConfig {
  const n = p.nombre.toLowerCase();
  let funcion: FuncionMontaje = 'suelto';
  if (!p.rol_tablero || /canto|informativo|area_op/.test(n)) funcion = 'omitir';
  else if (/^lateral_gav/.test(n)) funcion = 'lateral_gaveta';
  else if (n === 'lateral') funcion = /\bA\b/.test(p.formula_largo ?? '') ? 'lateral' : 'lateral_gaveta';
  else if (/base_gav|pieza_cajon/.test(n)) funcion = 'base_gaveta';
  else if (/^tras.*gav|^tras.*caj|^trasero_pod/.test(n)) funcion = 'trasero_gaveta';
  else if (/contraparche/.test(n)) funcion = 'frente_interior';
  else if (/frente.*gav|frente_cajon|parche_gaveta/.test(n)) funcion = 'frente_gaveta';
  else if (n === 'frente_falso') funcion = 'frente_falso';
  else if (/^frente|^puerta/.test(n)) funcion = 'frente';
  else if (/base_tapa/.test(n)) funcion = 'base_tapa';
  else if (n === 'base') funcion = 'base';
  else if (n === 'tapa') funcion = 'tapa';
  else if (/entrepano|shlef/.test(n)) funcion = 'estante';
  else if (n === 'division') funcion = 'division';
  else if (n === 'fondo') funcion = 'respaldo';
  else if (/trasero|ref_tra|ref_inf_tra/.test(n)) funcion = 'travesano_posterior';
  else if (/profundidad/.test(n)) funcion = 'travesano_lateral';
  else if (/refuerzo|^ref_/.test(n)) funcion = 'travesano_frontal';
  else if (/gola/.test(n)) funcion = 'gola';
  else if (n === 'zocalo') funcion = 'zocalo';
  else if (/panel|filler/.test(n)) funcion = 'panel';
  const plano: PlanoMontaje = ['base','tapa','base_tapa','estante','base_gaveta','travesano_frontal'].includes(funcion) ? 'XY'
    : ['lateral','division','lateral_gaveta','travesano_lateral'].includes(funcion) ? 'YZ' : 'XZ';
  const l=p.formula_largo ?? '', a=p.formula_ancho ?? '';
  const intercambiar = plano === 'XY' ? /\bP\b/.test(l) && /\bL\b/.test(a)
    : plano === 'YZ' ? /\bP\b/.test(l)
    : /\bL\b/.test(a) && !/\bL\b/.test(l);
  return { version:1, funcion, plano, intercambiar, confirmado:false };
}
