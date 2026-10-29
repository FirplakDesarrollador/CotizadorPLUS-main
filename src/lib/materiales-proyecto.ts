import { CLAVE_CONFIG_FAMILIA, familiaMaterialPorPrefijo, type FamiliaMaterial } from './muebles';

export type MaterialesFamilia = { preset?: Record<string, string>; cantoCaja?: string; cantoFrentes?: string };
export type ConfigMaterialesProyecto = {
  preset?: Record<string, string>;
  cantoCaja?: string;
  cantoFrentes?: string;
  materialesInferiores?: MaterialesFamilia;
  materialesSuperiores?: MaterialesFamilia;
  materialesCloset?: MaterialesFamilia;
  materialesBanos?: MaterialesFamilia;
};

/** El nombre del área tiene prioridad sobre la tipología de cada módulo. */
export function familiaMaterialDelArea(pref: string | null | undefined, nombreArea = ''): FamiliaMaterial {
  const nombre = nombreArea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return nombre.includes('closet') ? 'closet' : familiaMaterialPorPrefijo(pref);
}

export function materialesDelProyecto(config: ConfigMaterialesProyecto, pref: string | null | undefined, nombreArea = ''): MaterialesFamilia {
  return config[CLAVE_CONFIG_FAMILIA[familiaMaterialDelArea(pref, nombreArea)] as keyof ConfigMaterialesProyecto] as MaterialesFamilia
    ?? config.materialesInferiores ?? { preset: config.preset, cantoCaja: config.cantoCaja, cantoFrentes: config.cantoFrentes };
}

/** Solo cambia selecciones existentes: no inventa materiales ni modifica herrajes. */
export function aplicarMaterialesProyecto<T extends { preset: Record<string, string>; cantoCaja?: string; cantoFrentes?: string }>(
  input: T, config: ConfigMaterialesProyecto, pref: string | null | undefined, nombreArea = '',
): T {
  const materiales = materialesDelProyecto(config, pref, nombreArea);
  return {
    ...input,
    preset: { ...input.preset, ...materiales.preset },
    ...(materiales.cantoCaja ? { cantoCaja: materiales.cantoCaja } : {}),
    ...(materiales.cantoFrentes ? { cantoFrentes: materiales.cantoFrentes } : {}),
  };
}

export type TableroProyecto = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };

/** Las referencias históricas COLOR CONSTRUCTOR fueron renombradas en catálogo. */
export function resolverCodigoTablero(codigo: string, catalogo: readonly { codigo: string }[]): string {
  if (catalogo.some(t => t.codigo === codigo)) return codigo;
  const normalizar = (valor: string) => valor.trim().replace(/COLOR\s+CONSTRUCTOR/gi, 'CONSTRUCTOR').replace(/\s*\(POLAR\)/gi, '').trim().toUpperCase();
  const clave = normalizar(codigo);
  const matches = catalogo.filter(t => normalizar(t.codigo) === clave);
  return matches.length === 1 ? matches[0].codigo : codigo;
}

export function descripcionTableroProyecto(codigo: string | undefined, catalogo: readonly TableroProyecto[]): string {
  if (!codigo) return 'No configurado';
  const actual = resolverCodigoTablero(codigo, catalogo);
  const tablero = catalogo.find(t => t.codigo === actual);
  if (!tablero) return `${codigo} · Referencia no encontrada en catálogo`;
  return [tablero.codigo.trim(), tablero.sustrato?.trim(), tablero.espesor_mm ? `${tablero.espesor_mm} mm` : '', tablero.color_nombre?.trim(), tablero.proveedor?.trim()].filter(Boolean).join(' · ');
}

/** Contrasta el material calculado con el elegido, no solo el preset guardado. */
export function materialesDelDespieceCoinciden(breakdown: Record<string, unknown> | null | undefined, preset: Record<string, string>): boolean {
  const madera = breakdown?.maderaPorRol;
  if (!Array.isArray(madera)) return true;
  return madera.every((fila: { rol: string; codigo: string }) => preset[fila.rol] === fila.codigo);
}

export type EspecificacionProyecto = { familia: FamiliaMaterial; titulo: string; filas: Array<[string, string]> };
export function especificacionesProyecto(config: ConfigMaterialesProyecto, catalogo: readonly TableroProyecto[]): EspecificacionProyecto[] {
  const familias: Array<[FamiliaMaterial, string]> = [['superior', 'Muebles superiores cocina'], ['inferior', 'Muebles inferiores cocina'], ['closet', 'Closet / Walk in closet'], ['banos', 'Baños / Auxiliares']];
  return familias.flatMap(([familia, titulo]) => {
    const seleccion = config[CLAVE_CONFIG_FAMILIA[familia] as keyof ConfigMaterialesProyecto] as MaterialesFamilia | undefined;
    const materiales = seleccion ?? (familia === 'inferior' ? { preset: config.preset, cantoCaja: config.cantoCaja, cantoFrentes: config.cantoFrentes } : undefined);
    if (!materiales?.preset) return [];
    return [{ familia, titulo, filas: [
      ['Caja / refuerzos', descripcionTableroProyecto(materiales.preset.caja, catalogo)],
      ['Refuerzo', descripcionTableroProyecto(materiales.preset.refuerzo ?? materiales.preset.caja, catalogo)],
      ['Frentes / paneles / rellenos', descripcionTableroProyecto(materiales.preset.frente, catalogo)],
      ['Fondo seleccionado (se usa donde el módulo lleva espaldar)', descripcionTableroProyecto(materiales.preset.fondo, catalogo)],
      ['Canto de caja', materiales.cantoCaja || 'No configurado'],
      ['Canto de frentes', materiales.cantoFrentes || 'No configurado'],
    ] as Array<[string, string]> }];
  });
}
