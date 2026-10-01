import 'server-only';
import { createClient } from '@/lib/supabase/server';

// ====== Editor de DISEÑO de muebles: piezas, reglas y herrajes por tipo ======

const PIEZA_COLS = ['tipo_mueble_id', 'nombre', 'rol_tablero', 'formula_cantidad', 'formula_largo', 'formula_ancho', 'resta_largo', 'resta_ancho', 'cantos', 'tarugos', 'soportes', 'orden', 'notas'];
const REGLA_COLS = ['tipo_mueble_id', 'variable', 'condicion', 'valor', 'prioridad', 'activo', 'notas'];
const HERRAJE_COLS = ['tipo_mueble_id', 'rol', 'herraje_codigo', 'selector_key', 'formula_cantidad', 'orden', 'notas'];

function pick(cols: readonly string[], row: Record<string, unknown>) {
  const o: Record<string, unknown> = {};
  for (const k of cols) if (k in row) o[k] = row[k] === '' ? null : row[k];
  return o;
}

export async function getTiposBasic() {
  const sb = await createClient();
  const { data } = await sb.from('cot_tipos_mueble').select('id,pref,nombre_es,categoria,etiquetas_und').order('pref');
  return data ?? [];
}

export async function getDiseno(tipoId: string) {
  const sb = await createClient();
  const [{ data: piezas }, { data: reglas }, { data: herrajes }, { data: tableros }, { data: cantos }, { data: herrajeCat }] = await Promise.all([
    sb.from('cot_piezas_plantilla').select('*').eq('tipo_mueble_id', tipoId).order('orden'),
    sb.from('cot_reglas_config').select('*').eq('tipo_mueble_id', tipoId).order('variable').order('prioridad'),
    sb.from('cot_herrajes_plantilla').select('*').eq('tipo_mueble_id', tipoId).order('orden'),
    sb.from('cot_tableros').select('codigo').eq('activo', true).order('codigo'),
    sb.from('cot_cantos').select('calibre').eq('activo', true),
    sb.from('cot_herrajes').select('codigo,nombre,categoria').eq('activo', true).order('nombre'),
  ]);
  return {
    piezas: piezas ?? [], reglas: reglas ?? [], herrajes: herrajes ?? [],
    tableros: (tableros ?? []).map((t) => t.codigo),
    cantos: [...new Set((cantos ?? []).map((c) => c.calibre))],
    herrajeCat: herrajeCat ?? [],
  };
}

async function up(table: string, cols: readonly string[], id: string | null, row: Record<string, unknown>) {
  const sb = await createClient();
  const clean = pick(cols, row);
  if (id) { const { error } = await sb.from(table).update(clean).eq('id', id); if (error) throw new Error(error.message); }
  else { const { error } = await sb.from(table).insert(clean); if (error) throw new Error(error.message); }
}
async function del(table: string, id: string) {
  const sb = await createClient();
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export const upsertPieza = (id: string | null, row: Record<string, unknown>) => up('cot_piezas_plantilla', PIEZA_COLS, id, row);
export const deletePieza = (id: string) => del('cot_piezas_plantilla', id);
export const upsertRegla = (id: string | null, row: Record<string, unknown>) => up('cot_reglas_config', REGLA_COLS, id, row);
export const deleteRegla = (id: string) => del('cot_reglas_config', id);
export const upsertHerraje = (id: string | null, row: Record<string, unknown>) => up('cot_herrajes_plantilla', HERRAJE_COLS, id, row);
export const deleteHerraje = (id: string) => del('cot_herrajes_plantilla', id);
