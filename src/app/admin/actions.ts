'use server';
import { revalidatePath } from 'next/cache';
import { getUserAndRole } from '@/lib/auth';
import { upsertFila, eliminarFila, upsertParametros, type CatalogoTabla } from '@/lib/admin';

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
