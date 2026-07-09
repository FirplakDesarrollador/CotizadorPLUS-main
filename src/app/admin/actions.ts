'use server';
import { revalidatePath } from 'next/cache';
import { getUserAndRole } from '@/lib/auth';
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
