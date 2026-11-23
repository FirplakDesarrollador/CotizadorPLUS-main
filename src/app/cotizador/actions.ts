'use server';
import { cotizar, cotizarGrupoConsolidado, type CotizarGrupoResult, type CotizarInput, type CotizarResult } from '@/lib/cotizar';
import { createClient } from '@/lib/supabase/server';

export async function herrajesGavetaAction() {
  const sb = await createClient();
  const { data, error } = await sb.from('cot_herrajes').select('codigo,nombre,categoria').in('categoria',['riel','barra']).eq('activo',true).order('codigo');
  if (error) throw new Error('No se pudo consultar el catálogo.');
  return (data ?? []) as Array<{ codigo: string; nombre: string | null; categoria: string }>;
}

export async function cotizarAction(input: CotizarInput): Promise<{ ok: true; result: CotizarResult } | { ok: false; error: string }> {
  try {
    const result = await cotizar(input);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

export async function cotizarGrupoAction(inputs: CotizarInput[]): Promise<{ ok: true; result: CotizarGrupoResult } | { ok: false; error: string }> {
  try {
    const result = await cotizarGrupoConsolidado(inputs, true);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}
