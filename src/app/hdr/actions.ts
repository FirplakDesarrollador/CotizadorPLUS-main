'use server';
import { codigoConMano, manoValida, requiereManoPuerta } from '@/lib/mano-puerta';
import { getUserAndRole } from '@/lib/auth';
import {
  getCotizacion, listarCotizaciones, inputDesdeLinea,
  type CotizacionHeader, type LineaPersistida,
} from '@/lib/cotizaciones';
import { cotizar, cotizarGrupo, prepararCotizacion, cargarCatalogoPrecompilado, type CotizarResult } from '@/lib/cotizar';
import { validarEntrepanosHdr } from './validacion';
import { descripcionPiezaPlanaHdr, descripcionModulo, resultadoFisicoHdr, type ResultadoHdr } from './datosHdr';
import { esModuloLinea } from '@/lib/materiales-linea';
import { calcularMueble } from '@/lib/engine';
import { coincideNombreHdr } from './seguimiento';
import type { CatalogoPrecompilado } from '@/lib/cotizar';

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
  avisosValidacion?: string[];
  aperturaPendiente?: boolean;
  pref?: string;
  repeticionesArea?: number;
  cocinaNombre: string;
  cantidad: number;
  /** Grupo físico (laterales compartidos). Las líneas de un grupo no se separan. */
  grupoId: string | null;
  origenes?: { lineaId: string; codigoModulo: string; cantidad: number; repeticionesArea: number }[];
} & ({ ok: true; result: ResultadoHdr } | { ok: false; error: string });

// Recalcula, con las fórmulas ACTUALES del motor (no la foto guardada en `breakdown`,
// que puede venir de antes de un fix), el despiece de cada módulo de una cotización.
// Los módulos agrupados (laterales compartidos) se recalculan juntos con cotizarGrupo(),
// igual que hace recalcularGrupo() al guardar — si no, se pierde la geometría del grupo.
export async function modulosDeCotizacionAction(cotizacionId: string): Promise<ModuloHDR[]> {
  await assertAdmin();
  return calcularModulosDeCotizacion(cotizacionId);
}

async function calcularModulosDeCotizacion(cotizacionId: string, catalogoPrefetch?: CatalogoPrecompilado): Promise<ModuloHDR[]> {
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

  const puertasActuales = new Map<string, number | undefined>();
  const etiqueta = (l: LineaPersistida) => codigoConMano(l.codigo_modulo ?? l.pref ?? '?', l.pref, puertasActuales.get(l.id), l.config?.manoPuerta);
  const avisoMano = (l: LineaPersistida) => requiereManoPuerta(l.pref, puertasActuales.get(l.id)) && !manoValida(l.config?.manoPuerta)
    ? ['Falta completar la apertura L/R de este mueble de una puerta en la cotización.'] : [];
  const descripcion = (l: LineaPersistida) => descripcionPiezaPlanaHdr(l.pref, l.anotaciones);
  const resultados: ModuloHDR[] = [];
  // Un catálogo compartido para el contraste; no repetir consultas por mueble.
  const necesitaValidacion = items.some(({ linea }) => inputDesdeLinea(linea).overrides?.n_entrepanos != null);
  const catalogo = catalogoPrefetch ?? (porGrupo.size || necesitaValidacion ? await cargarCatalogoPrecompilado() : undefined);

  for (const { linea, cocinaNombre, repeticionesArea } of sueltas) {
    try {
      const input = inputDesdeLinea(linea);
      const preparado = catalogoPrefetch ? await prepararCotizacion(input, catalogoPrefetch) : undefined;
      const result = preparado ? { ...calcularMueble(preparado.calc), trm: preparado.trm, margen: preparado.margen } : await cotizar(input);
      puertasActuales.set(linea.id, result.vars?.n_puertas);
      const avisosValidacion = input.overrides?.n_entrepanos != null
        ? validarEntrepanosHdr((preparado ?? await prepararCotizacion(input, catalogo)).calc) : [];
      avisosValidacion.push(...avisoMano(linea));
      resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), nombreDescriptivo: descripcion(linea), avisosValidacion, aperturaPendiente: avisoMano(linea).length > 0, pref: linea.pref ?? undefined, repeticionesArea, cocinaNombre, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: true, result });
    } catch (e) {
      resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), cocinaNombre, repeticionesArea, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: false, error: e instanceof Error ? e.message : 'Error' });
    }
  }

  for (const grupo of porGrupo.values()) {
    try {
      const inputs = grupo.map(({ linea }) => inputDesdeLinea(linea));
      const calculated = await cotizarGrupo(inputs, catalogo);
      grupo.forEach(({ linea }, i) => puertasActuales.set(linea.id, calculated.lineas[i].vars?.n_puertas));
      const avisosValidacion = grupo.flatMap(({ linea }, i) => inputs[i].overrides?.n_entrepanos != null
        ? validarEntrepanosHdr(calculated.preparados[i].calc).map(aviso => `${etiqueta(linea)}: ${aviso}`) : []);
      avisosValidacion.push(...grupo.flatMap(({ linea }) => avisoMano(linea).map(aviso => `${etiqueta(linea)}: ${aviso}`)));
      if (grupo.length > 1) {
        if (grupo.some(m => Number(m.linea.cantidad) !== 1 || m.repeticionesArea !== grupo[0].repeticionesArea)) throw new Error('El grupo físico tiene cantidades o repeticiones incompatibles; revísalo antes de generar HDR.');
        const origenes = grupo.map(({ linea, repeticionesArea }) => ({ lineaId: linea.id, codigoModulo: etiqueta(linea), cantidad: Number(linea.cantidad), repeticionesArea }));
        const nombres = grupo.map(({ linea }, i) => `A${i + 1}: ${descripcion(linea) ?? descripcionModulo(calculated.lineas[i] as CotizarResult, linea.pref ?? undefined)}`.trim());
        const result = resultadoFisicoHdr(calculated, Number(inputs[0].trm ?? 4200), Number(calculated.preparados[0]?.margen ?? 0), grupo.map(({ linea }) => linea.pref ?? ''));
        resultados.push({ lineaId: grupo[0].linea.id, codigoModulo: `GRUPO ${grupo.map(({ linea }) => etiqueta(linea)).join(' + ')}`, nombreDescriptivo: nombres.join(' | '), avisosValidacion, aperturaPendiente: grupo.some(({ linea }) => avisoMano(linea).length > 0), cocinaNombre: grupo[0].cocinaNombre, repeticionesArea: grupo[0].repeticionesArea, cantidad: 1, grupoId: grupo[0].linea.grupo_id ?? null, origenes, ok: true, result });
        continue;
      }
      grupo.forEach(({ linea, cocinaNombre, repeticionesArea }, i) => {
        const base = calculated.lineas[i] as CotizarResult;
        const result: CotizarResult = {
          ...base,
          trm: Number(base.trm ?? inputs[i].trm ?? 4200),
          margen: Number(base.margen ?? calculated.preparados[i]?.margen ?? 0),
        };
        resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), nombreDescriptivo: descripcion(linea), avisosValidacion, aperturaPendiente: avisoMano(linea).length > 0, pref: linea.pref ?? undefined, repeticionesArea, cocinaNombre, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: true, result });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      for (const { linea, cocinaNombre, repeticionesArea } of grupo) {
        resultados.push({ lineaId: linea.id, codigoModulo: etiqueta(linea), cocinaNombre, repeticionesArea, cantidad: Number(linea.cantidad || 1), grupoId: linea.grupo_id ?? null, ok: false, error: msg });
      }
    }
  }

  return resultados;
}

export type MuebleEncontradoHdr = { cotizacionId: string; proyecto: string; modulo: ModuloHDR };

/** Busca nombres HDR completos o parciales en las cotizaciones accesibles; no guarda cambios. */
export async function buscarMueblesHdrAction(texto: string): Promise<{ muebles: MuebleEncontradoHdr[]; errores: string[] }> {
  await assertAdmin();
  if (typeof texto !== 'string' || !texto.trim()) return { muebles: [], errores: [] };
  if (texto.length > 200) throw new Error('Escribe un nombre de hasta 200 caracteres.');
  const [cotizaciones, catalogo] = await Promise.all([listarCotizaciones(), cargarCatalogoPrecompilado()]);
  const muebles: MuebleEncontradoHdr[] = [], errores: string[] = [];
  // Catálogo compartido y tres cotizaciones simultáneas para acotar la carga de consultas.
  for (let i = 0; i < cotizaciones.length; i += 3) {
    const bloque = cotizaciones.slice(i, i + 3);
    const resultados = await Promise.allSettled(bloque.map(c => calcularModulosDeCotizacion(c.id, catalogo)));
    resultados.forEach((r, j) => {
      const c = bloque[j], proyecto = c.nombre || c.codigo || 'Sin nombre';
      if (r.status === 'rejected') { errores.push(`No se pudo revisar la cotización ${proyecto}.`); return; }
      for (const modulo of r.value) {
        if (coincideNombreHdr(modulo, texto)) muebles.push({ cotizacionId: c.id, proyecto, modulo });
        if (!modulo.ok) errores.push(`${proyecto} · ${modulo.codigoModulo}: ${modulo.error}`);
      }
    });
  }
  return { muebles, errores };
}
