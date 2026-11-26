import type { ModuloHDR } from './actions';
import { tituloModuloHdr } from './datosHdr';
import { esPanel } from '@/lib/nombres-modulos';
import { familiaMaterialPorPrefijo } from '@/lib/muebles';
import { normalizarBusqueda } from '@/lib/combobox-filtro';

export const GRUPOS_SEGUIMIENTO = ['Inferiores', 'Superiores', 'Baños', 'Clósets', 'Fillers', 'Paneles'] as const;
export type GrupoSeguimiento = typeof GRUPOS_SEGUIMIENTO[number];
export type TipoSeguimiento = { pref: string; categoria?: string | null };
export type EntradaSeguimiento = { nombre: string; grupo: GrupoSeguimiento };

export const ACTIVIDADES_SEGUIMIENTO = ['HDR Existente', 'Modelo 3D', 'Perforado', 'Creación Hoja de Ruta', 'Revisión HDR', 'Corrección HDR', 'Crear CAM SCM', 'Crear CAM HOLZHER', 'Crear CAM HUAHUA', 'prg Tarugadora', 'Tetris', 'Planimetría', 'Crear empaque', 'Revisión de empaque', 'prg tangenciadora', 'prg láser', 'Diseño de etiqueta', 'Entrega de ruta y programas a producción'] as const;
export const BLOQUES_SEGUIMIENTO = [
  { fase: 'Diseño', inicio: 0, fin: 6, responsable: 'Angie/Lizeth' },
  { fase: 'Diseño', inicio: 6, fin: 10, responsable: 'Elias' },
  { fase: 'Empaque', inicio: 10, fin: 17, responsable: 'Mariana/Liz/Angie/Elias' },
  { fase: 'Entrega', inicio: 17, fin: 18, responsable: 'Angie/Liz' },
] as const;

export type ResumenSeguimiento = {
  cotizacion_id: string;
  codigo: string | null;
  proyecto: string;
  revision: number;
  completadas: number;
  total: number;
};

export type DetalleSeguimiento = ResumenSeguimiento & {
  entradas: EntradaSeguimiento[];
  responsables: string[];
  marcas: number[][];
};

export const MAX_RESPONSABLE_SEGUIMIENTO = 160;

export function crearDetalleSeguimiento(cotizacion: { id: string; codigo: string | null; nombre: string | null }, entradas: EntradaSeguimiento[]): DetalleSeguimiento {
  return {
    cotizacion_id: cotizacion.id,
    codigo: cotizacion.codigo,
    proyecto: cotizacion.nombre || 'Proyecto sin nombre',
    revision: 0,
    completadas: 0,
    total: entradas.length * ACTIVIDADES_SEGUIMIENTO.length,
    entradas,
    responsables: BLOQUES_SEGUIMIENTO.map(b => b.responsable),
    marcas: entradas.map(() => []),
  };
}

export function porcentajeSeguimiento(completadas: number, total: number) {
  return total > 0 ? Math.floor(completadas * 10000 / total) / 100 : 0;
}

export function validarAvanceSeguimiento(responsables: unknown, marcas: unknown, cantidadMuebles: number) {
  if (!Array.isArray(responsables) || responsables.length !== BLOQUES_SEGUIMIENTO.length ||
    !responsables.every(r => typeof r === 'string' && r.length <= MAX_RESPONSABLE_SEGUIMIENTO)) return null;
  if (!Array.isArray(marcas) || marcas.length !== cantidadMuebles || !marcas.every(fila =>
    Array.isArray(fila) && fila.length === new Set(fila).size &&
    fila.every(i => Number.isInteger(i) && i >= 0 && i < ACTIVIDADES_SEGUIMIENTO.length))) return null;
  return {
    responsables: responsables.map((r: string) => r.trim()),
    marcas: marcas as number[][],
    completadas: marcas.reduce((total, fila) => total + fila.length, 0),
  };
}

function grupoDe(m: ModuloHDR, tipos: readonly TipoSeguimiento[]): GrupoSeguimiento {
  const pref = m.pref ?? (m.ok ? m.result.piezas.find(p => p.contextoHdr)?.contextoHdr?.pref : undefined) ?? '';
  if (esPanel(pref)) return 'Paneles';
  if (/^F(?:-|$)/i.test(pref)) return 'Fillers';
  const categoria = normalizarBusqueda(tipos.find(t => t.pref === pref)?.categoria ?? '');
  if (/closet/i.test(m.cocinaNombre) || categoria === 'closet') return 'Clósets';
  if (['vanity', 'banos', 'bano'].includes(categoria)) return 'Baños';
  if (categoria === 'superior') return 'Superiores';
  const familia = familiaMaterialPorPrefijo(pref);
  return familia === 'closet' ? 'Clósets' : familia === 'banos' ? 'Baños' : familia === 'superior' ? 'Superiores' : 'Inferiores';
}

/** Deduplicación sensible a cada carácter: no normaliza el nombre de producción. */
export function entradasSeguimiento(modulos: readonly ModuloHDR[], tipos: readonly TipoSeguimiento[]): EntradaSeguimiento[] {
  if (modulos.some(m => !m.ok)) throw new Error('Hay muebles con error de despiece. Corrígelos antes de generar el seguimiento.');
  const comparar = new Intl.Collator('es', { sensitivity: 'variant', numeric: true }).compare;
  const ordenadas = modulos.map(m => ({ nombre: tituloModuloHdr(m), grupo: grupoDe(m, tipos) }))
    .sort((a, b) => GRUPOS_SEGUIMIENTO.indexOf(a.grupo) - GRUPOS_SEGUIMIENTO.indexOf(b.grupo) || comparar(a.nombre, b.nombre));
  const vistos = new Set<string>();
  return ordenadas.filter(e => { if (vistos.has(e.nombre)) return false; vistos.add(e.nombre); return true; });
}

export function coincideNombreHdr(m: ModuloHDR, texto: string): boolean {
  const nombre = normalizarBusqueda(tituloModuloHdr(m));
  return normalizarBusqueda(texto).trim().split(/\s+/).filter(Boolean).every(p => nombre.includes(p));
}
