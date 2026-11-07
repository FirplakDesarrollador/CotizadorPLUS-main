import { CLAVE_CONFIG_FAMILIA, familiaMaterialPorPrefijo, type FamiliaMaterial } from './muebles';
import { usaTableroGaveta } from './gavetas';

export type MaterialesFamilia = { preset?: Record<string, string>; cantoCaja?: string; cantoFrentes?: string };
export type PersonalizacionMateriales = MaterialesFamilia;
type SeleccionMateriales = { preset: Record<string, string>; cantoCaja?: string; cantoFrentes?: string; personalizacionMateriales?: PersonalizacionMateriales };
export type ConfigMaterialesProyecto = {
  preset?: Record<string, string>;
  cantoCaja?: string;
  cantoFrentes?: string;
  materialesInferiores?: MaterialesFamilia;
  materialesSuperiores?: MaterialesFamilia;
  materialesCloset?: MaterialesFamilia;
  materialesBanos?: MaterialesFamilia;
};

/** Incluye las variantes sin fondo derivadas y OW-MO, sin alcanzar OSBFD. */
export function usaCajaMaterialFrente(pref: string | null | undefined): boolean {
  return /^(?:OBFD|OBFD-SM|OSBFD-SM|OW|OW-MO)(?:-SF)?$/.test(String(pref ?? '').trim().toUpperCase());
}

/** En abiertos, el espaldar visible debe conservar el color del frente. */
export function usaFondoMaterialFrente(pref: string | null | undefined): boolean {
  return usaCajaMaterialFrente(pref);
}

export function presetMaterialesTipologia(preset: Record<string, string>, pref: string | null | undefined): Record<string, string> {
  if (!usaCajaMaterialFrente(pref) || !preset.frente) return { ...preset };
  // El código de tablero conserva proveedor, sustrato y color; solo cambia
  // el espesor del frente por 6 mm para el espaldar visible del abierto.
  const fondo = preset.frente.replace(/\d+(?:[.,]\d+)?/, '6');
  return { ...preset, caja: preset.frente, refuerzo: preset.frente, fondo };
}

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
export function aplicarMaterialesProyecto<T extends SeleccionMateriales>(
  input: T, config: ConfigMaterialesProyecto, pref: string | null | undefined, nombreArea = '',
): T {
  const materiales = materialesDelProyecto(config, pref, nombreArea);
  const { gaveta, ...presetFamilia } = materiales.preset ?? {};
  const individual = input.personalizacionMateriales;
  return {
    ...input,
    preset: presetMaterialesTipologia({ ...input.preset, ...presetFamilia, ...(usaTableroGaveta(pref) && gaveta ? { gaveta } : {}), ...individual?.preset }, pref),
    ...((individual?.cantoCaja ?? materiales.cantoCaja) ? { cantoCaja: individual?.cantoCaja ?? materiales.cantoCaja } : {}),
    ...((individual?.cantoFrentes ?? materiales.cantoFrentes) ? { cantoFrentes: individual?.cantoFrentes ?? materiales.cantoFrentes } : {}),
  };
}

/** Guarda solo las diferencias elegidas en esta línea; los demás campos siguen al proyecto. */
export function personalizarMaterialesLinea<T extends SeleccionMateriales>(input: T, config: ConfigMaterialesProyecto, pref: string | null | undefined, nombreArea = ''): T & { personalizacionMateriales: PersonalizacionMateriales } {
  const global = aplicarMaterialesProyecto({ ...input, personalizacionMateriales: undefined }, config, pref, nombreArea);
  const personalizacionMateriales: PersonalizacionMateriales = {
    preset: Object.fromEntries(Object.entries(input.preset).filter(([rol, codigo]) => codigo !== global.preset[rol])),
    ...(input.cantoCaja && input.cantoCaja !== global.cantoCaja ? { cantoCaja: input.cantoCaja } : {}),
    ...(input.cantoFrentes && input.cantoFrentes !== global.cantoFrentes ? { cantoFrentes: input.cantoFrentes } : {}),
  };
  return { ...input, personalizacionMateriales };
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
type LineaEspecificacion = { pref?: string | null; codigo_modulo?: string | null; config?: (MaterialesFamilia & { personalizacionMateriales?: PersonalizacionMateriales | null }) | null };
export function especificacionesProyecto(config: ConfigMaterialesProyecto, catalogo: readonly TableroProyecto[], areas: readonly { nombre: string; lineas: readonly LineaEspecificacion[] }[] = []): EspecificacionProyecto[] {
  const familias: Array<[FamiliaMaterial, string]> = [['superior', 'Muebles superiores cocina'], ['inferior', 'Muebles inferiores cocina'], ['closet', 'Closet / Walk in closet'], ['banos', 'Baños / Auxiliares']];
  const generales = familias.flatMap(([familia, titulo]) => {
    const seleccion = config[CLAVE_CONFIG_FAMILIA[familia] as keyof ConfigMaterialesProyecto] as MaterialesFamilia | undefined;
    const materiales = seleccion ?? (familia === 'inferior' ? { preset: config.preset, cantoCaja: config.cantoCaja, cantoFrentes: config.cantoFrentes } : undefined);
    if (!materiales?.preset) return [];
    const tieneAbiertos = areas.some(area => area.lineas.some(linea => usaCajaMaterialFrente(linea.pref) && familiaMaterialDelArea(linea.pref, area.nombre) === familia));
    return [{ familia, titulo, filas: [
      ['Caja / refuerzos', descripcionTableroProyecto(materiales.preset.caja, catalogo)],
      ['Refuerzo', descripcionTableroProyecto(materiales.preset.refuerzo ?? materiales.preset.caja, catalogo)],
      ...(materiales.preset.gaveta ? [['Tablero Gaveta (15 mm)', descripcionTableroProyecto(materiales.preset.gaveta, catalogo)]] : []),
      ['Frentes / paneles / rellenos', descripcionTableroProyecto(materiales.preset.frente, catalogo)],
      ...(tieneAbiertos ? [['Caja / refuerzos de OBFD, OBFD-SM, OSBFD-SM, OW y OW-MO (incluidas variantes sin fondo)', descripcionTableroProyecto(materiales.preset.frente, catalogo)]] : []),
      ...(tieneAbiertos ? [['Fondo de abiertos OBFD, OBFD-SM, OSBFD-SM, OW y OW-MO (6 mm, color del frente; solo con fondo)', descripcionTableroProyecto(presetMaterialesTipologia(materiales.preset, 'OW').fondo, catalogo)]] : []),
      ['Fondo general (solo donde lleva espaldar; los abiertos usan el fondo indicado arriba)', descripcionTableroProyecto(materiales.preset.fondo, catalogo)],
      ['Canto de caja', materiales.cantoCaja || 'No configurado'],
      ['Canto de frentes', materiales.cantoFrentes || 'No configurado'],
    ] as Array<[string, string]> }];
  });
  const etiquetas: Record<string, string> = { caja: 'Caja', refuerzo: 'Refuerzos', frente: 'Frentes / paneles / rellenos', fondo: 'Fondo', gaveta: 'Tablero Gaveta' };
  const individuales: EspecificacionProyecto[] = areas.flatMap(area => area.lineas.flatMap(linea => {
    const seleccion = linea.config?.personalizacionMateriales;
    if (!seleccion) return [];
    const filas: Array<[string, string]> = Object.entries(seleccion.preset ?? {}).map(([rol, codigo]) => [etiquetas[rol] ?? rol, descripcionTableroProyecto(linea.config?.preset?.[rol] ?? codigo, catalogo)]);
    if (seleccion.cantoCaja) filas.push(['Canto de caja', seleccion.cantoCaja]);
    if (seleccion.cantoFrentes) filas.push(['Canto de frentes', seleccion.cantoFrentes]);
    return filas.length ? [{ familia: familiaMaterialDelArea(linea.pref, area.nombre), titulo: `Selección individual · ${linea.codigo_modulo ?? linea.pref ?? 'Mueble'} · ${area.nombre}`, filas }] : [];
  }));
  return [...generales, ...individuales];
}
