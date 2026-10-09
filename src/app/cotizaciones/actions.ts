'use server';
import { revalidatePath } from 'next/cache';
import type { TipoMaterial } from '@/lib/materiales-linea';
import { redirect } from 'next/navigation';
import {
  crearCotizacion, agregarLinea, editarLinea, eliminarLinea, eliminarCotizacion, actualizarCotizacion,
  crearCocina, actualizarCocina, eliminarCocina, duplicarLineaACocina, cambiarGrupoLinea, desagruparGrupo,
  reordenarGruposCocina,
  guardarVersionCotizacion, restaurarVersionCotizacion,
  agregarLineaMaterial, getMaterialesDisponibles, type MaterialDisponible,
  type AgregarLineaInput,
} from '@/lib/cotizaciones';
import type { CemaTemplate } from '@/lib/cema-template';
import type { FirplakTemplate } from '@/lib/firplak-template';

export async function reordenarGruposCocinaAction(cocinaId: string, nuevosGrupoIds: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const cotizacionId = await reordenarGruposCocina(cocinaId, nuevosGrupoIds);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo reordenar los muebles' };
  }
}


export async function crearCotizacionAction(
  _prev: unknown,
  formData: FormData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const nombre = String(formData.get('nombre') || 'Cotización');
    const cliente_nombre = String(formData.get('cliente_nombre') || '');
    const comprador_nombre = String(formData.get('comprador_nombre') || '');
    const cotizador_por = String(formData.get('cotizador_por') || 'FIRPLAK') === 'CEMA' ? 'CEMA' : 'FIRPLAK';
    const moneda = (String(formData.get('moneda') || 'USD') as 'COP' | 'USD');
    const trm = Number(formData.get('trm') || 4200);
    const sistema_medida = String(formData.get('sistema_medida') || 'imperial') === 'metrico' ? 'metrico' : 'imperial';
    let configDefault: Record<string, unknown> | null = null;
    const configRaw = formData.get('config_default');
    if (typeof configRaw === 'string' && configRaw) {
      try { configDefault = JSON.parse(configRaw); } catch { configDefault = null; }
    }
    const id = await crearCotizacion({ nombre, cliente_nombre, comprador_nombre, cotizador_por, moneda, trm, sistema_medida, configDefault });
    revalidatePath('/cotizaciones');
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al crear' };
  }
}

export async function cambiarGrupoLineaAction(lineaId: string, etiqueta: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const cotizacionId = await cambiarGrupoLinea(lineaId, etiqueta);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo reagrupar el módulo' };
  }
}

export async function desagruparGrupoAction(grupoId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const cotizacionId = await desagruparGrupo(grupoId);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo desagrupar el grupo' };
  }
}

// El formulario pide los catalogos al abrirse, en vez de enhebrarlos como props
// por toda la jerarquia de la cotizacion.
export async function getMaterialesDisponiblesAction(): Promise<Record<TipoMaterial, MaterialDisponible[]>> {
  return getMaterialesDisponibles();
}

export async function agregarLineaMaterialAction(
  cocinaId: string,
  entrada: { tipo: TipoMaterial; codigo: string; cantidad: number },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const cotizacionId = await agregarLineaMaterial(cocinaId, entrada);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function agregarLineaAction(cocinaId: string, input: AgregarLineaInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const cotizacionId = await agregarLinea(cocinaId, input);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function crearCocinaAction(cotizacionId: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await crearCocina(cotizacionId, nombre);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function actualizarCocinaAction(cotizacionId: string, cocinaId: string, data: { nombre?: string; cantidad?: number } | string): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCocina(cocinaId, data);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function eliminarCocinaAction(cotizacionId: string, cocinaId: string) {
  await eliminarCocina(cocinaId, cotizacionId);
  revalidatePath(`/cotizaciones/${cotizacionId}`);
}

export async function actualizarCotizacionAction(id: string, patch: { nombre?: string; cliente_nombre?: string; comprador_nombre?: string; moneda?: 'COP' | 'USD'; trm?: number; estado?: string; configDefault?: Record<string, unknown> | null }): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCotizacion(id, patch);
    revalidatePath(`/cotizaciones/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function guardarPlantillaCemaAction(id: string, plantillaCema: CemaTemplate): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCotizacion(id, { plantillaCema });
    revalidatePath(`/cotizaciones/${id}/imprimir`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar la plantilla CEMA' };
  }
}

export async function guardarPlantillaFirplakAction(id: string, plantillaFirplak: FirplakTemplate): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCotizacion(id, { plantillaFirplak });
    revalidatePath(`/cotizaciones/${id}/imprimir`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar la plantilla FIRPLAK' };
  }
}

export async function editarLineaAction(lineaId: string, input: AgregarLineaInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const cotizacionId = await editarLinea(lineaId, input);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function eliminarLineaAction(cotizacionId: string, lineaId: string) {
  await eliminarLinea(cotizacionId, lineaId);
  revalidatePath(`/cotizaciones/${cotizacionId}`);
}

export async function duplicarLineaAction(lineaId: string, nuevaCocinaId: string, cotizacionId: string, cantidad?: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await duplicarLineaACocina(lineaId, nuevaCocinaId, cotizacionId, cantidad);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function eliminarCotizacionAction(id: string) {
  await eliminarCotizacion(id);
  revalidatePath('/cotizaciones');
  redirect('/cotizaciones');
}

// Versión para la lista: borra y revalida sin redirigir (devuelve estado).
export async function borrarCotizacionAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await eliminarCotizacion(id);
    revalidatePath('/cotizaciones');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// Renombrar rápido una cotización desde la lista.
export async function renombrarCotizacionAction(id: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCotizacion(id, { nombre });
    revalidatePath('/cotizaciones');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function guardarVersionCotizacionAction(cotizacionId: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const cleanNombre = nombre?.trim();
    if (!cleanNombre) return { ok: false, error: 'El nombre de la versión es obligatorio.' };
    await guardarVersionCotizacion(cotizacionId, cleanNombre);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar la versión' };
  }
}

export async function restaurarVersionCotizacionAction(cotizacionId: string, versionId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await restaurarVersionCotizacion(cotizacionId, versionId);
    revalidatePath(`/cotizaciones/${cotizacionId}`);
    revalidatePath('/cotizaciones');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo restaurar la versión' };
  }
}
