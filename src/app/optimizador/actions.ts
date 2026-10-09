'use server';
import { getUserAndRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { normalizarConfig, type ConfigOptimizador } from '@/lib/corte/config';
import type { ModuloEntrada } from '@/lib/corte/lista';
import { modulosDeCotizacionAction } from '../hdr/actions';

async function assertAdmin() {
  const { rol } = await getUserAndRole();
  if (rol !== 'admin') throw new Error('Solo administradores');
}

export async function guardarConfigOptimizadorAction(raw: unknown): Promise<{ ok: true; config: ConfigOptimizador } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const config = normalizarConfig(raw);
    const sb = await createClient();
    const { data, error } = await sb.from('cot_parametros').update({ value: config }).eq('key', 'optimizador').select('key');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error('Falta la llave "optimizador" en cot_parametros (migración 0180).');
    return { ok: true, config };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al guardar' };
  }
}

export type ProyectoOptimizador = {
  modulos: (ModuloEntrada & { lineaId: string; cocina: string; piezasPorModulo: number })[];
  errores: { codigo: string; error: string }[];
};

// Despiece actual de cada módulo de la cotización (recalculado con el motor vigente,
// grupos incluidos), reducido a lo que necesita la lista de corte.
export async function proyectoDesdeCotizacionAction(cotizacionId: string): Promise<ProyectoOptimizador> {
  await assertAdmin();
  const modulos = await modulosDeCotizacionAction(cotizacionId);
  const out: ProyectoOptimizador = { modulos: [], errores: [] };
  for (const m of modulos) {
    if (!m.ok) { out.errores.push({ codigo: m.codigoModulo, error: m.error }); continue; }
    const piezas = m.result.piezas
      .filter((p) => p.cant > 0)
      .map((p) => ({
        pieza: p.pieza, rol: p.rol, cant: p.cant, largoIn: p.largoIn, anchoIn: p.anchoIn,
        cantoLargos: p.cantoLargos, cantoAnchos: p.cantoAnchos, cantoCalibre: p.cantoCalibre,
      }));
    out.modulos.push({
      lineaId: m.lineaId,
      codigo: m.codigoModulo,
      cocina: m.cocinaNombre,
      cantidad: m.cantidad,
      piezas,
      piezasPorModulo: Math.round(piezas.reduce((s, p) => s + p.cant, 0) * 100) / 100,
      tableroPorRol: Object.fromEntries(m.result.maderaPorRol.map((r) => [r.rol, r.codigo])),
    });
  }
  return out;
}
