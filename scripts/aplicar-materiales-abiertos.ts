/** Solo lectura por defecto. --apply limita escrituras a abiertos pendientes y sus totales. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '../src/lib/supabase/server';
import { getCotizacion, inputDesdeLinea, sincronizarMaterialesCotizacion, type LineaPersistida } from '../src/lib/cotizaciones';
import { cargarCatalogoPrecompilado, cotizarGrupo } from '../src/lib/cotizar';
import { aplicarMaterialesProyecto, materialesDelDespieceCoinciden, usaCajaMaterialFrente } from '../src/lib/materiales-proyecto';

async function main() {
  const sb = await createClient();
  const proyectos = await sb.from('cot_cotizaciones').select('id,nombre');
  if (proyectos.error) throw new Error(proyectos.error.message);
  const catalogo = await cargarCatalogoPrecompilado();
  const plan: Array<{ id: string; nombre: string; lineas: string[]; grupos: number }> = [];
  const respaldo: unknown[] = [];
  for (const proyecto of proyectos.data ?? []) {
    const q = await getCotizacion(proyecto.id);
    const pendientes: string[] = [];
    const grupos = new Set<string>();
    for (const area of q.cocinas) {
      for (const linea of area.lineas as Array<LineaPersistida & { breakdown?: Record<string, unknown> | null }>) {
        const pref = catalogo.tiposById[linea.tipo_mueble_id ?? '']?.pref;
        if (!usaCajaMaterialFrente(pref)) continue;
        const actual = inputDesdeLinea(linea);
        const siguiente = aplicarMaterialesProyecto(actual, q.cabecera.config_default ?? {}, pref, area.nombre);
        if (JSON.stringify(actual.preset) === JSON.stringify(siguiente.preset) && materialesDelDespieceCoinciden(linea.breakdown, siguiente.preset)) continue;
        if (!siguiente.preset.frente || !catalogo.tablerosByCode[siguiente.preset.frente]) throw new Error(`Frente sin catálogo: ${linea.id}`);
        if (!linea.grupo_id) throw new Error(`Abierto sin grupo: ${linea.id}`);
        pendientes.push(linea.id);
        grupos.add(linea.grupo_id);
      }
    }
    if (!pendientes.length) continue;
    const permitidas = new Set(pendientes);
    // Ningún grupo puede provocar escrituras en otra tipología o línea no planificada.
    for (const area of q.cocinas) {
      for (const grupo of grupos) {
        const miembros = (area.lineas as LineaPersistida[]).filter(l => l.grupo_id === grupo);
        if (!miembros.length) continue;
        if (miembros.some(l => !permitidas.has(l.id))) throw new Error(`Grupo fuera del alcance: ${grupo}`);
        await cotizarGrupo(miembros.map(l => aplicarMaterialesProyecto(inputDesdeLinea(l), q.cabecera.config_default ?? {}, catalogo.tiposById[l.tipo_mueble_id ?? '']?.pref, area.nombre)), catalogo);
      }
    }
    const gruposDb = await sb.from('cot_grupos_modulos').select('*').eq('cotizacion_id', proyecto.id);
    if (gruposDb.error) throw new Error(gruposDb.error.message);
    respaldo.push({ proyecto: q.cabecera, areas: q.cocinas, grupos: gruposDb.data, lineasSinCocina: q.lineasSinCocina });
    plan.push({ id: proyecto.id, nombre: proyecto.nombre, lineas: pendientes, grupos: grupos.size });
  }
  console.log(JSON.stringify({ fase: 'plan-limitado', proyectos: plan }, null, 2));
  if (!process.argv.includes('--apply') || !plan.length) return;
  const archivo = path.join(os.tmpdir(), `cotizador-respaldo-abiertos-${Date.now()}.json`);
  fs.writeFileSync(archivo, JSON.stringify(respaldo), { encoding: 'utf8', flag: 'wx' });
  console.log(`Respaldo: ${archivo}`);
  for (const proyecto of plan) {
    const resultado = await sincronizarMaterialesCotizacion(proyecto.id, { lineasPermitidas: proyecto.lineas });
    console.log(JSON.stringify({ fase: 'aplicacion-limitada', proyecto: proyecto.nombre, ...resultado }));
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
