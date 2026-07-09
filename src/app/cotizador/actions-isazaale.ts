'use server';
import { cotizar, type CotizarInput, type CotizarResult } from '@/lib/cotizar';

export async function cotizarAction(input: CotizarInput): Promise<{ ok: true; result: CotizarResult } | { ok: false; error: string }> {
  try {
    const result = await cotizar(input);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}
