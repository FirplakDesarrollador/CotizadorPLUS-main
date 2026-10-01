'use server';
import { revalidatePath } from 'next/cache';
import { getUserAndRole } from '@/lib/auth';
import { upsertPieza, deletePieza, upsertRegla, deleteRegla, upsertHerraje, deleteHerraje, getDiseno } from '@/lib/diseno';
import { cotizar, type CotizarResult } from '@/lib/cotizar';

export async function getDisenoAction(tipoId: string) {
  await assertAdmin();
  return getDiseno(tipoId);
}

async function assertAdmin() {
  const { rol } = await getUserAndRole();
  if (rol !== 'admin') throw new Error('Solo administradores');
}
type R = { ok: boolean; error?: string };
const wrap = async (fn: () => Promise<void>): Promise<R> => {
  try { await assertAdmin(); await fn(); revalidatePath('/admin/diseno'); return { ok: true }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Error' }; }
};

export async function guardarPiezaAction(id: string | null, row: Record<string, unknown>) { return wrap(() => upsertPieza(id, row)); }
export async function eliminarPiezaAction(id: string) { return wrap(() => deletePieza(id)); }
export async function guardarReglaAction(id: string | null, row: Record<string, unknown>) { return wrap(() => upsertRegla(id, row)); }
export async function eliminarReglaAction(id: string) { return wrap(() => deleteRegla(id)); }
export async function guardarHerrajeAction(id: string | null, row: Record<string, unknown>) { return wrap(() => upsertHerraje(id, row)); }
export async function eliminarHerrajeAction(id: string) { return wrap(() => deleteHerraje(id)); }

// Previsualización de costo (sin/with herrajes) con un preset y dimensiones dadas.
export async function previewAction(input: { tipoId: string; largo: number; alto: number; prof: number; unidad: 'in' | 'cm' | 'mm'; preset: Record<string, string>; conHerrajes: boolean })
  : Promise<{ ok: true; result: CotizarResult } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const result = await cotizar({ ...input });
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}
