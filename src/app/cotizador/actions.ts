'use server';
import { cotizar, cotizarGrupoConsolidado, type CotizarGrupoResult, type CotizarInput, type CotizarResult } from '@/lib/cotizar';

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
    const result = await cotizarGrupoConsolidado(inputs);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}
