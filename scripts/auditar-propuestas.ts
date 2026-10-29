/**
 * Lectura: node --conditions=react-server --env-file=.env --import tsx scripts/auditar-propuestas.ts
 * Reparación autorizada: añadir --apply. Respalda las filas antes de escribir.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '../src/lib/supabase/server';
import { getCotizacion, inputDesdeLinea, sincronizarMaterialesCotizacion, type LineaPersistida } from '../src/lib/cotizaciones';
import { cargarCatalogoPrecompilado, cotizarGrupo } from '../src/lib/cotizar';
import { aplicarMaterialesProyecto, materialesDelDespieceCoinciden, resolverCodigoTablero, type ConfigMaterialesProyecto } from '../src/lib/materiales-proyecto';
import { separarPropuesta, type AreaPropuesta, type LineaPropuesta } from '../src/lib/propuesta-cotizacion';

async function main() {
  const sb = await createClient();
  const [proyectos, catalogo] = await Promise.all([
    sb.from('cot_cotizaciones').select('*').order('created_at'),
    cargarCatalogoPrecompilado(),
  ]);
  if (proyectos.error) throw new Error(proyectos.error.message);
  const codigos = Object.keys(catalogo.tablerosByCode).map(codigo => ({ codigo }));
  const respaldo: unknown[] = [];
  const informe: unknown[] = [];
  let diferencias = 0;
  let errores = 0;
  for (const proyecto of proyectos.data ?? []) {
    const q = await getCotizacion(proyecto.id);
    const gruposDb = await sb.from('cot_grupos_modulos').select('*').eq('cotizacion_id', proyecto.id);
    if (gruposDb.error) throw new Error(gruposDb.error.message);
    respaldo.push({ proyecto, areas: q.cocinas, grupos: gruposDb.data, lineasSinCocina: q.lineasSinCocina });
    const propuesta = separarPropuesta(q.cocinas as AreaPropuesta[]);
    const cfg = proyecto.config_default as ConfigMaterialesProyecto ?? {};
    const grupos = new Map<string, ReturnType<typeof inputDesdeLinea>[]>();
    let materialesDiferentes = 0;
    let referenciasFaltantes = 0;
    for (const area of q.cocinas) {
      for (const linea of area.lineas as Array<LineaPersistida & LineaPropuesta & { grupo_id: string }>) {
        if (!linea.tipo_mueble_id) continue;
        const input = inputDesdeLinea(linea);
        const siguiente = aplicarMaterialesProyecto(input, cfg, catalogo.tiposById[linea.tipo_mueble_id]?.pref, area.nombre);
        siguiente.preset = Object.fromEntries(Object.entries(siguiente.preset).map(([rol, codigo]) => [rol, resolverCodigoTablero(codigo, codigos)]));
        if (JSON.stringify(input.preset) !== JSON.stringify(siguiente.preset) || input.cantoCaja !== siguiente.cantoCaja || input.cantoFrentes !== siguiente.cantoFrentes || !materialesDelDespieceCoinciden(linea.breakdown, siguiente.preset)) materialesDiferentes++;
        for (const codigo of Object.values(siguiente.preset)) if (!catalogo.tablerosByCode[codigo]) referenciasFaltantes++;
        const rows = grupos.get(linea.grupo_id) ?? [];
        rows.push(siguiente);
        grupos.set(linea.grupo_id, rows);
      }
    }
    // Preflight de toda la cotización antes de permitir cualquier reparación.
    let gruposInvalidos = 0;
    for (const inputs of grupos.values()) {
      try { await cotizarGrupo(inputs, catalogo); } catch (error) {
        gruposInvalidos++;
        console.error(JSON.stringify({ proyecto: proyecto.nombre, error: error instanceof Error ? error.message : String(error) }));
      }
    }
    const diferenciaCop = Math.abs(propuesta.totalCop - Number(proyecto.total_cop));
    const diferenciaUsd = Math.abs(propuesta.totalUsd - Number(proyecto.total_usd));
    const sinArea = q.lineasSinCocina.length;
    diferencias += materialesDiferentes;
    errores += referenciasFaltantes + gruposInvalidos + sinArea + Number(diferenciaCop >= 0.01 || diferenciaUsd >= 0.01);
    informe.push({ id: proyecto.id, nombre: proyecto.nombre, areas: q.cocinas.length, adicionales: propuesta.adicionales.length, materialesDiferentes, referenciasFaltantes, gruposInvalidos, sinArea, diferenciaCop, diferenciaUsd, totalMueblesCop: propuesta.totalMueblesCop, totalAdicionalCop: propuesta.totalAdicionalCop, totalCop: propuesta.totalCop });
  }
  console.log(JSON.stringify({ fase: 'auditoria', proyectos: informe, diferencias, errores }, null, 2));
  if (errores) throw new Error('Preflight rechazado: corrige las referencias o los grupos antes de aplicar.');
  if (process.argv.includes('--apply')) {
    const archivo = path.join(os.tmpdir(), `cotizador-respaldo-materiales-${Date.now()}.json`);
    fs.writeFileSync(archivo, JSON.stringify(respaldo), { encoding: 'utf8', flag: 'wx' });
    console.log(`Respaldo anterior a la corrección: ${archivo}`);
    for (const proyecto of proyectos.data ?? []) {
      const resultado = await sincronizarMaterialesCotizacion(proyecto.id);
      console.log(JSON.stringify({ fase: 'aplicacion', proyecto: proyecto.nombre, ...resultado }));
    }
  } else if (diferencias && process.argv.includes('--strict')) {
    throw new Error('Hay diferencias de materiales pendientes.');
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
