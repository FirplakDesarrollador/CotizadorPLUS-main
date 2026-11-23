/** Solo lectura por defecto. --apply marca pendientes L/R sin recalcular precios. */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '../src/lib/supabase/server';
import { getCotizadorData } from '../src/lib/cotizar';
import { codigoConMano, puertasSegunReglas, requiereManoPuerta, manoValida } from '../src/lib/mano-puerta';
import type { Regla, UnidadDim } from '../src/lib/engine';

type Linea = { id: string; cotizacion_id: string; tipo_mueble_id: string | null; grupo_id: string | null; posicion_grupo: number; codigo_modulo: string | null; largo: number; alto: number; prof: number; unidad_dim: UnidadDim; updated_at?: string; config: ({ manoPuerta?: unknown; manoPuertaPendiente?: boolean; overrides?: { n_puertas?: number } } & Record<string, unknown>) | null; [key: string]: unknown };

async function main() {
  const sb = await createClient();
  const catalogo = await getCotizadorData();
  const tipos = catalogo.tipos as { id: string; pref: string; reglasPuertas: Regla[] }[];
  const rows: Linea[] = [];
  for (let n = 0; ; n += 500) {
    const { data, error } = await sb.from('cot_cotizacion_lineas').select('*').order('id').range(n, n + 499);
    if (error) throw error;
    rows.push(...data as Linea[]);
    if (data.length < 500) break;
  }
  const cambios: { anterior: Linea; config: Record<string, unknown>; codigo: string | null }[] = [];
  const pendientes: unknown[] = [];
  for (const l of rows) {
    const tipo = tipos.find(t => t.id === l.tipo_mueble_id);
    if (!tipo || !['W-SM', 'WLD', 'WSM'].includes(tipo.pref)) continue;
    const config = l.config ?? {};
    const puertas = puertasSegunReglas(tipo.reglasPuertas, { largo: Number(l.largo), alto: Number(l.alto), prof: Number(l.prof), unidad: l.unidad_dim }, config.overrides?.n_puertas);
    if (puertas == null) throw new Error(`No se pudo determinar el número de puertas de ${l.id}`);
    const requiere = requiereManoPuerta(tipo.pref, puertas);
    const pendiente = requiere && !manoValida(config.manoPuerta);
    if (pendiente) pendientes.push({ cotizacionId: l.cotizacion_id, lineaId: l.id, codigo: l.codigo_modulo, pref: tipo.pref });
    if (!requiere && !config.manoPuertaPendiente) continue;
    const codigo = l.codigo_modulo == null ? null : codigoConMano(l.codigo_modulo.replace(/-[LR]$/, ''), tipo.pref, puertas, config.manoPuerta);
    const nuevoConfig = { ...config, manoPuertaPendiente: pendiente };
    if (JSON.stringify(nuevoConfig) !== JSON.stringify(config) || codigo !== l.codigo_modulo) cambios.push({ anterior: l, config: nuevoConfig, codigo });
  }
  const grupoIds = [...new Set(cambios.filter(c => c.codigo !== c.anterior.codigo_modulo).map(c => c.anterior.grupo_id).filter((g): g is string => !!g))];
  const grupos = grupoIds.length ? await sb.from('cot_grupos_modulos').select('*').in('id', grupoIds) : { data: [], error: null };
  if (grupos.error) throw grupos.error;
  console.log(JSON.stringify({ fase: 'auditoria', lineas: rows.length, cambios: cambios.length, pendientes }, null, 2));
  if (!process.argv.includes('--apply')) return;
  fs.mkdirSync('.tmp', { recursive: true });
  const respaldo = path.resolve('.tmp', `mano-puerta-respaldo-${Date.now()}.json`);
  fs.writeFileSync(respaldo, JSON.stringify({ lineas: cambios.map(c => c.anterior), grupos: grupos.data }, null, 2), { flag: 'wx' });
  for (const c of cambios) {
    let query = sb.from('cot_cotizacion_lineas').update({ config: c.config, codigo_modulo: c.codigo }).eq('id', c.anterior.id);
    if (c.anterior.updated_at) query = query.eq('updated_at', c.anterior.updated_at);
    const { data, error } = await query.select('*').single();
    if (error || !data) throw new Error(`No se pudo actualizar ${c.anterior.id}: ${error?.message}`);
    for (const key of Object.keys(c.anterior)) {
      if (['config', 'codigo_modulo', 'updated_at'].includes(key)) continue;
      if (JSON.stringify(data[key]) !== JSON.stringify(c.anterior[key])) throw new Error(`Cambio inesperado en ${key} de ${c.anterior.id}. Respaldo: ${respaldo}`);
    }
  }
  for (const grupo of grupos.data ?? []) {
    const lineas = rows.filter(l => l.grupo_id === grupo.id).sort((a, b) => Number(a.posicion_grupo) - Number(b.posicion_grupo));
    const codigo = lineas.map(l => cambios.find(c => c.anterior.id === l.id)?.codigo ?? l.codigo_modulo).filter(Boolean).join('.');
    if (codigo !== grupo.codigo_grupo) {
      const { error } = await sb.from('cot_grupos_modulos').update({ codigo_grupo: codigo }).eq('id', grupo.id);
      if (error) throw error;
    }
  }
  console.log(JSON.stringify({ fase: 'aplicado', cambios: cambios.length, respaldo, preciosMedidasCantidades: 'sin cambios' }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
