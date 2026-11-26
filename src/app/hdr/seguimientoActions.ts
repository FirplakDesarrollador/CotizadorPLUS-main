'use server';

import { getUserAndRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { prepararSeguimientoAction } from './actions';
import { validarAvanceSeguimiento, type DetalleSeguimiento, type ResumenSeguimiento } from './seguimiento';

const CAMPOS_RESUMEN = 'cotizacion_id,codigo,proyecto,revision,completadas,total';
const CAMPOS_DETALLE = 'cotizacion_id,codigo,proyecto,revision,completadas,total,entradas,responsables,marcas';
const CONFLICTO = 'El seguimiento cambió en otra sesión. Vuelve a abrir el seguimiento guardado para cargar la última versión.';
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

async function clienteSeguimiento() {
  const { user, rol } = await getUserAndRole();
  return user && rol === 'admin' ? createClient() : null;
}

export async function listarSeguimientosAction(): Promise<Resultado<ResumenSeguimiento[]>> {
  const sb = await clienteSeguimiento();
  if (!sb) return { ok: false, error: 'Solo los administradores pueden consultar seguimientos.' };
  const lista: ResumenSeguimiento[] = [];
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await sb.from('hdr_seguimientos').select(CAMPOS_RESUMEN)
      .order('actualizado_en', { ascending: false }).order('cotizacion_id').range(desde, desde + 499);
    if (error) return { ok: false, error: 'No se pudieron consultar los seguimientos guardados.' };
    lista.push(...data);
    if (data.length < 500) return { ok: true, valor: lista };
  }
}

export async function abrirSeguimientoAction(cotizacionId: string): Promise<Resultado<DetalleSeguimiento>> {
  const sb = await clienteSeguimiento();
  if (!sb) return { ok: false, error: 'Solo los administradores pueden abrir seguimientos.' };
  const { data, error } = await sb.from('hdr_seguimientos').select(CAMPOS_DETALLE)
    .eq('cotizacion_id', cotizacionId).maybeSingle();
  if (error) return { ok: false, error: 'No se pudo consultar el seguimiento.' };
  if (data) return { ok: true, valor: data as DetalleSeguimiento };
  try {
    return { ok: true, valor: await prepararSeguimientoAction(cotizacionId) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo preparar el seguimiento.' };
  }
}

export async function guardarSeguimientoAction(detalle: DetalleSeguimiento): Promise<Resultado<DetalleSeguimiento>> {
  const sb = await clienteSeguimiento();
  if (!sb) return { ok: false, error: 'Solo los administradores pueden guardar seguimientos.' };
  if (!detalle || !Array.isArray(detalle.entradas) || !detalle.entradas.length ||
    !Number.isSafeInteger(detalle.revision) || detalle.revision < 0) {
    return { ok: false, error: 'El seguimiento no contiene datos válidos.' };
  }
  const avance = validarAvanceSeguimiento(detalle.responsables, detalle.marcas, detalle.entradas.length);
  if (!avance) return { ok: false, error: 'Revisa las marcas y los responsables del seguimiento.' };

  const tabla = sb.from('hdr_seguimientos');
  if (detalle.revision === 0) {
    let original: DetalleSeguimiento;
    try {
      original = await prepararSeguimientoAction(detalle.cotizacion_id);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'No se pudo validar la cotización.' };
    }
    if (original.entradas.length !== detalle.entradas.length || original.entradas.some((e, i) =>
      e.nombre !== detalle.entradas[i]?.nombre || e.grupo !== detalle.entradas[i]?.grupo)) {
      return { ok: false, error: 'Los muebles de la cotización cambiaron. Vuelve a seleccionar la cotización para cargar el listado vigente.' };
    }
    const { data, error } = await tabla.insert({ ...original, ...avance, revision: 1 }).select(CAMPOS_DETALLE).single();
    if (error) return { ok: false, error: error.code === '23505' ? CONFLICTO : 'No se pudo guardar el seguimiento.' };
    return { ok: true, valor: data as DetalleSeguimiento };
  }

  const { data, error } = await tabla.update({ ...avance, revision: detalle.revision + 1, actualizado_en: new Date().toISOString() })
    .eq('cotizacion_id', detalle.cotizacion_id).eq('revision', detalle.revision).select(CAMPOS_DETALLE).maybeSingle();
  if (error) return { ok: false, error: 'No se pudo guardar el seguimiento.' };
  return data ? { ok: true, valor: data as DetalleSeguimiento } : { ok: false, error: CONFLICTO };
}
