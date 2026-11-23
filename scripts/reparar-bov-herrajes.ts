/** Aplicación explícita: --apply. Respaldo antes de modificar catálogo o líneas. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '../src/lib/supabase/server';
import { recalcularGrupo, recomputarTotales } from '../src/lib/cotizaciones';

async function main() {
  const sb = await createClient();
  async function leer(tabla: string) {
    const rows = [];
    for (let desde = 0; ; desde += 500) {
      const { data, error } = await sb.from(tabla).select('*').order('id').range(desde, desde + 499);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < 500) return rows;
    }
  }
  const [tipos, plantillas, lineas, proyectos, areas, grupos, herrajes] = await Promise.all([
    leer('cot_tipos_mueble'), leer('cot_herrajes_plantilla'), leer('cot_cotizacion_lineas'),
    leer('cot_cotizaciones'), leer('cot_cocinas'), leer('cot_grupos_modulos'), leer('cot_herrajes'),
  ]);
  const bov = tipos.filter(t => ['BOV', 'BOV-SF'].includes(t.pref));
  const deseados = [
    { rol: 'pata', herraje_codigo: 'PATA10AJUST', selector_key: 'pata', formula_cantidad: 'n_patas', orden: 10 },
    { rol: 'tornillo', herraje_codigo: 'TORNILLO858', selector_key: 'tornillo', formula_cantidad: 'n_patas*4', orden: 20 },
  ];
  const insertar = [];
  for (const tipo of bov) for (const h of deseados) {
    if (!herrajes.some(r => r.codigo === h.herraje_codigo && r.activo && Number(r.precio) > 0)) throw new Error(`Referencia inválida: ${h.herraje_codigo}`);
    const existentes = plantillas.filter(p => p.tipo_mueble_id === tipo.id && p.rol === h.rol);
    if (existentes.some(p => p.herraje_codigo !== h.herraje_codigo || p.formula_cantidad !== h.formula_cantidad) || existentes.length > 1) throw new Error(`Conflicto en ${tipo.pref}/${h.rol}`);
    if (!existentes.length) insertar.push({ tipo_mueble_id: tipo.id, ...h });
  }
  const afectadas = lineas.filter(l => bov.some(t => t.id === l.tipo_mueble_id));
  console.log(JSON.stringify({ plantillasNuevas: insertar, lineasBov: afectadas.length, proyectos: [...new Set(afectadas.map(l => l.cotizacion_id))] }));
  if (!process.argv.includes('--apply')) return;
  const respaldo = path.join(os.tmpdir(), `cotizador-respaldo-bov-herrajes-${Date.now()}.json`);
  fs.writeFileSync(respaldo, JSON.stringify({ tipos, plantillas, lineas, proyectos, areas, grupos }), { flag: 'wx' });
  console.log(`Respaldo: ${respaldo}`);
  if (insertar.length) {
    const { error } = await sb.from('cot_herrajes_plantilla').insert(insertar);
    if (error) throw new Error(error.message);
  }
  const recalculados = new Set<string>();
  for (const linea of afectadas) {
    if (recalculados.has(linea.grupo_id)) continue;
    await recalcularGrupo(linea.grupo_id);
    recalculados.add(linea.grupo_id);
  }
  for (const id of new Set(afectadas.map(l => l.cotizacion_id))) await recomputarTotales(id);
  console.log(JSON.stringify({ gruposRecalculados: recalculados.size }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
