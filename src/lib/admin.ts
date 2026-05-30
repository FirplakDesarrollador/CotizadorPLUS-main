import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Whitelist de tablas y columnas editables desde el panel admin (seguridad).
export const CATALOGOS = {
  cot_tableros: ['proveedor', 'espesor_mm', 'sustrato', 'color_code', 'color_nombre', 'codigo', 'formato', 'area_m2', 'precio', 'descuento', 'precio_real', 'precio_m2', 'aumento_pct', 'actualizado', 'notas', 'activo'],
  cot_cantos: ['referencia', 'codigo', 'calibre', 'espesor_mm', 'ancho_mm', 'precio', 'actualizado', 'activo'],
  cot_herrajes: ['codigo', 'nombre', 'categoria', 'selector_key', 'precio', 'unidad', 'notas', 'activo'],
  cot_recargos_cliente: ['cliente_nombre', 'recargo_pct', 'incluye_herrajes', 'notas', 'activo'],
} as const;

export type CatalogoTabla = keyof typeof CATALOGOS;

const ORDEN: Record<CatalogoTabla, string> = {
  cot_tableros: 'codigo', cot_cantos: 'codigo', cot_herrajes: 'nombre', cot_recargos_cliente: 'cliente_nombre',
};

function sanitize(tabla: CatalogoTabla, row: Record<string, unknown>) {
  const allowed = CATALOGOS[tabla] as readonly string[];
  const out: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in row) {
      const v = row[k];
      out[k] = v === '' ? null : v;
    }
  }
  return out;
}

export async function listarCatalogo(tabla: CatalogoTabla) {
  const sb = await createClient();
  const { data, error } = await sb.from(tabla).select('*').order(ORDEN[tabla]);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getParametros(): Promise<Record<string, unknown>> {
  const sb = await createClient();
  const { data, error } = await sb.from('cot_parametros').select('key,value');
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function upsertParametros(updates: { key: string; value: unknown }[]) {
  const sb = await createClient();
  for (const u of updates) {
    const { error } = await sb.from('cot_parametros').update({ value: u.value }).eq('key', u.key);
    if (error) throw new Error(`${u.key}: ${error.message}`);
  }
}

export async function upsertFila(tabla: CatalogoTabla, id: string | null, row: Record<string, unknown>) {
  if (!(tabla in CATALOGOS)) throw new Error('Tabla no permitida');
  const sb = await createClient();
  const clean = sanitize(tabla, row);
  if (id) {
    const { error } = await sb.from(tabla).update(clean).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from(tabla).insert(clean);
    if (error) throw new Error(error.message);
  }
}

export async function eliminarFila(tabla: CatalogoTabla, id: string) {
  if (!(tabla in CATALOGOS)) throw new Error('Tabla no permitida');
  const sb = await createClient();
  const { error } = await sb.from(tabla).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
