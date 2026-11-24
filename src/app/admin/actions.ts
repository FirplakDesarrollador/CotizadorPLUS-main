'use server';
import { validarCatalogoMesones, type CatalogoMesones } from '@/lib/mesones';
import { revalidatePath } from 'next/cache';
import { getUserAndRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { normalizarTarifasInstalacion, type TarifasInstalacion } from '@/lib/instalacion-cotizacion';
import { upsertFila, eliminarFila, upsertParametros, upsertPerfil, eliminarPerfil, type CatalogoTabla } from '@/lib/admin';

async function assertAdmin() {
  const { rol } = await getUserAndRole();
  if (rol !== 'admin') throw new Error('Solo administradores pueden editar catálogos');
}

export async function guardarFilaAction(tabla: CatalogoTabla, id: string | null, row: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    await upsertFila(tabla, id, row);
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function guardarParametrosAction(updates: { key: string; value: unknown }[]): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    await upsertParametros(updates);
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function guardarMesonesAction(catalogo: CatalogoMesones) {
  try {
    await assertAdmin();
    validarCatalogoMesones(catalogo);
    const sb = await createClient();
    const { error } = await sb.from('cot_parametros').upsert({
      key: 'mesones', value: catalogo, descripcion: 'Catálogo y parámetros de cálculo de mesones',
    }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar el catálogo.' };
  }
}

export async function guardarTarifasInstalacionAction(tarifas: TarifasInstalacion): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    const sb = await createClient();
    for (const tabla of Object.values(tarifas)) {
      for (const tarifa of Object.values(tabla)) {
        if (!Number.isFinite(tarifa.costo) || tarifa.costo < 0 || !Number.isFinite(tarifa.margen) || tarifa.margen >= 100) {
          throw new Error('Revisa el costo y el margen. El margen debe ser menor que 100 %.');
        }
      }
    }
    const { error } = await sb.from('cot_parametros').upsert({
      key: 'instalacion',
      value: normalizarTarifasInstalacion(tarifas),
      descripcion: 'Tarifas unitarias de instalación en USD por zona',
    }, { onConflict: 'key' });
    if (error) throw error;
    revalidatePath('/admin');
    revalidatePath('/cotizaciones/[id]', 'page');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudieron guardar las tarifas.' };
  }
}

export async function eliminarFilaAction(tabla: CatalogoTabla, id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    await eliminarFila(tabla, id);
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function guardarPerfilAction(id: string | null, row: {
  nombre: string; descripcion?: string | null; valores: Record<string, string>;
  es_default?: boolean; activo?: boolean; orden?: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    if (!row.nombre?.trim()) throw new Error('El perfil necesita un nombre');
    await upsertPerfil(id, row);
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

export async function eliminarPerfilAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    await eliminarPerfil(id);
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}
