import { unidadesFisicas } from '@/lib/corte/clasificacion';
import { normCalibre } from '@/lib/engine';
import type { MaterialLinea } from '@/lib/materiales-linea';
import type { ModuloHDR } from '../hdr/actions';
import { consumoModuloHdr, normalizarDesperdicio } from '../hdr/consumos';

export type MaterialSueltoConsumo = Pick<MaterialLinea, 'tipo' | 'codigo' | 'cantidad'>;
export type ResumenConsumos = {
  tableros: { codigo: string; m2Neto: number; m2Suelto: number }[];
  cantos: { codigo: string; cantidad: number }[];
  herrajes: { codigo: string; cantidad: number; nombre?: string }[];
};

export function m2Estimados(tablero: ResumenConsumos['tableros'][number], desperdicio: number) {
  return tablero.m2Neto * (1 + normalizarDesperdicio(desperdicio) / 100) + tablero.m2Suelto;
}

export function resumirConsumosProyecto(modulos: readonly ModuloHDR[], sueltos: readonly MaterialSueltoConsumo[]): ResumenConsumos {
  const tableros = new Map<string, ResumenConsumos['tableros'][number]>();
  const cantos = new Map<string, ResumenConsumos['cantos'][number]>();
  const herrajes = new Map<string, ResumenConsumos['herrajes'][number]>();

  function sumarTablero(codigo: string, cantidad: number, campo: 'm2Neto' | 'm2Suelto') {
    const fila = tableros.get(codigo) ?? { codigo, m2Neto: 0, m2Suelto: 0 };
    fila[campo] += cantidad;
    tableros.set(codigo, fila);
  }
  function sumarCantidad(mapa: typeof cantos, codigo: string, cantidad: number, clave = codigo) {
    if (!clave || !Number.isFinite(cantidad) || cantidad <= 0) return;
    const fila = mapa.get(clave) ?? { codigo, cantidad: 0 };
    fila.cantidad += cantidad;
    mapa.set(clave, fila);
  }
  for (const modulo of modulos) {
    if (!modulo.ok) continue;
    const unidades = unidadesFisicas(modulo.cantidad, modulo.repeticionesArea);
    const consumo = consumoModuloHdr(modulo, unidades, 0);
    for (const tablero of consumo.materiales) sumarTablero(tablero.codigo, tablero.m2Neto, 'm2Neto');
    for (const canto of consumo.cantos) sumarCantidad(cantos, canto.calibre, canto.metros, normCalibre(canto.calibre).replace(/\./g, ','));
    for (const herraje of modulo.result.herrajes) {
      if (herraje.codigo) sumarCantidad(herrajes, herraje.codigo, herraje.cant * unidades);
    }
  }
  for (const { tipo, codigo, cantidad } of sueltos) {
    if (!codigo || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    if (tipo === 'tablero') sumarTablero(codigo, cantidad, 'm2Suelto');
    if (tipo === 'canto') sumarCantidad(cantos, codigo, cantidad, normCalibre(codigo).replace(/\./g, ','));
    if (tipo === 'herraje') sumarCantidad(herrajes, codigo, cantidad);
  }
  const comparar = (a: { codigo: string }, b: { codigo: string }) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true });
  return { tableros: [...tableros.values()].sort(comparar), cantos: [...cantos.values()].sort(comparar), herrajes: [...herrajes.values()].sort(comparar) };
}
