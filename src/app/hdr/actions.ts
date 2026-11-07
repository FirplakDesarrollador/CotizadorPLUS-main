'use server';
import { getUserAndRole } from '@/lib/auth';
import {
  getCotizacion, listarCotizaciones, inputDesdeLinea,
  type CotizacionHeader, type LineaPersistida,
} from '@/lib/cotizaciones';
import { cotizar, cotizarGrupo, type CotizarResult } from '@/lib/cotizar';
import { descripcionPiezaPlanaHdr } from './datosHdr';
import { esModuloLinea } from '@/lib/materiales-linea';

async function assertAdmin() {
  const { rol } = await getUserAndRole();
  if (rol !== 'admin') throw new Error('Solo administradores');
}

export async function listarCotizacionesAction(): Promise<CotizacionHeader[]> {
  await assertAdmin();
  return listarCotizaciones();
}

export type ModuloHDR = {
  lineaId: string;
  codigoModulo: string;
  nombreDescriptivo?: string;
  pref?: string;
  repeticionesArea?: number;
  cocinaNombre: string;
  cantidad: number;
  /** Grupo físico (laterales compartidos). Las líneas de un grupo no se separan. */
  grupoId: string | null;
} & ({ ok: true; result: CotizarResult } | { ok: false; error: string });

// Recalcula, con las fórmulas ACTUALES del motor (no la foto guardada en `breakdown`,
// que puede venir de antes de un fix), el despiece de cada módulo de una cotización.
// Los módulos agrupados (laterales compartidos) se recalculan juntos con cotizarGrupo(),
// igual que hace recalcularGrupo() al guardar — si no, se pierde la geometría del grupo.
export async function modulosDeCotizacionAction(cotizacionId: string): Promise<ModuloHDR[]> {
  await assertAdmin();
  const { cocinas, lineasSinCocina } = await getCotizacion(cotizacionId);

  const items: { linea: LineaPersistida; cocinaNombre: string; repeticionesArea: number }[] = [];
  for (const c of cocinas as unknown as { nombre: string; cantidad?: number; lineas: LineaPersistida[] }[]) {
    for (const l of c.lineas) {
      if (esModuloLinea(l)) items.push({ linea: l, cocinaNombre: c.nombre, repeticionesArea: Math.max(1, Number(c.cantidad || 1)) });
    }
  }
  for (const l of lineasSinCocina as unknown as LineaPersistida[]) {
    if (esModuloLinea(l)) items.push({ linea: l, cocinaNombre: '—', repeticionesArea: 1 });
  }

  const porGrupo = new Map<string, typeof items>();
  const sueltas: typeof items = [];
  for (const item of items) {
    const gid = item.linea.grupo_id;
    if (gid) {
      const arr = porGrupo.get(gid) ?? [];
      arr.push(item);
      porGrupo.set(gid, arr);
    } else {
      sueltas.push(item);
    }
  }

  const etiqueta = (l: LineaPersistida) => l.codigo_modulo ?? l.pref ?? '?';
  const descripcion = (l: LineaPersistida) => descripcionPiezaPlanaHdr(l.pref, l.anotaciones);
  const resultados: ModuloHDR[] = [];

  for (const { linea, cocinaNombre, repeticionesArea } of sueltas) {
    try {
      const result = await cotizar(inputDesdeLinea(linea));
      resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), nombreDescriptivo: descripcion(linea), pref: linea.pref ?? undefined, repeticionesArea, cocinaNombre, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: true, result });
    } catch (e) {
      resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), cocinaNombre, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: false, error: e instanceof Error ? e.message : 'Error' });
    }
  }

  for (const grupo of porGrupo.values()) {
    try {
      const inputs = grupo.map(({ linea }) => inputDesdeLinea(linea));
      const calculated = await cotizarGrupo(inputs);
      grupo.forEach(({ linea, cocinaNombre, repeticionesArea }, i) => {
        const base = calculated.lineas[i] as CotizarResult;
        const result: CotizarResult = {
          ...base,
          trm: Number(base.trm ?? inputs[i].trm ?? 4200),
          margen: Number(base.margen ?? calculated.preparados[i]?.margen ?? 0),
        };
        resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), nombreDescriptivo: descripcion(linea), pref: linea.pref ?? undefined, repeticionesArea, cocinaNombre, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: true, result });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      for (const { linea, cocinaNombre } of grupo) {
        resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), cocinaNombre, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: false, error: msg });
      }
    }
  }

  return resultados;
}
