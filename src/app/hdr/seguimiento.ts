import type { ModuloHDR } from './actions';
import { tituloModuloHdr } from './datosHdr';
import { esPanel } from '@/lib/nombres-modulos';
import { familiaMaterialPorPrefijo } from '@/lib/muebles';
import { normalizarBusqueda } from '@/lib/combobox-filtro';

export const GRUPOS_SEGUIMIENTO = ['Inferiores', 'Superiores', 'Baños', 'Clósets', 'Fillers', 'Paneles'] as const;
export type GrupoSeguimiento = typeof GRUPOS_SEGUIMIENTO[number];
export type TipoSeguimiento = { pref: string; categoria?: string | null };
export type EntradaSeguimiento = { nombre: string; grupo: GrupoSeguimiento };

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
