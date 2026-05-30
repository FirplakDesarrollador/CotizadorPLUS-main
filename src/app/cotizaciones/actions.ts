'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  crearCotizacion, agregarLinea, eliminarLinea, eliminarCotizacion, actualizarCotizacion,
  crearCocina, actualizarCocina, eliminarCocina,
  type AgregarLineaInput,
} from '@/lib/cotizaciones';

export async function crearCotizacionAction(formData: FormData) {
  const nombre = String(formData.get('nombre') || 'Cotización');
  const cliente_nombre = String(formData.get('cliente_nombre') || '');
  const moneda = (String(formData.get('moneda') || 'USD') as 'COP' | 'USD');
  const trm = Number(formData.get('trm') || 4200);
  const id = await crearCotizacion({ nombre, cliente_nombre, moneda, trm });
  redirect(`/cotizaciones/${id}`);
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

export async function actualizarCocinaAction(cotizacionId: string, cocinaId: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCocina(cocinaId, nombre);
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

export async function actualizarCotizacionAction(id: string, patch: { nombre?: string; cliente_nombre?: string; moneda?: 'COP' | 'USD'; trm?: number; estado?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    await actualizarCotizacion(id, patch);
    revalidatePath(`/cotizaciones/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function eliminarLineaAction(cotizacionId: string, lineaId: string) {
  await eliminarLinea(cotizacionId, lineaId);
  revalidatePath(`/cotizaciones/${cotizacionId}`);
}

export async function eliminarCotizacionAction(id: string) {
  await eliminarCotizacion(id);
  revalidatePath('/cotizaciones');
  redirect('/cotizaciones');
}
