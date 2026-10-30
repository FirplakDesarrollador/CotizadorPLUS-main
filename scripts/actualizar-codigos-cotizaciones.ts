/** Solo códigos: --apply respalda y actualiza atómicamente, sin recalcular precios. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '../src/lib/supabase/server';
import { cargarCatalogoPrecompilado } from '../src/lib/cotizar';
import { codigoComercial, codigoGrupo, type CodigoComercialInput } from '../src/lib/module-groups';
import { leerCatalogoPaginado } from '../src/lib/catalogo-paginado';
import { inputDesdeLinea, type LineaPersistida } from '../src/lib/cotizaciones';

async function main() {
  const sb=await createClient();
  const [catalogo,quotes,lines,groups]=await Promise.all([
    cargarCatalogoPrecompilado(),
    sb.from('cot_cotizaciones').select('id,nombre,sistema_medida,total_cop,total_usd'),
    leerCatalogoPaginado((a,b)=>sb.from('cot_cotizacion_lineas').select('*').order('id').range(a,b)),
    leerCatalogoPaginado((a,b)=>sb.from('cot_grupos_modulos').select('id,codigo_grupo').order('id').range(a,b)),
  ]);
  if(quotes.error) throw new Error(quotes.error.message);
  const proyectos=quotes.data as {id:string;nombre:string;sistema_medida:string;total_cop:number;total_usd:number}[];
  const cambios:{id:string;antes:string|null;despues:string}[]=[];
  const porProyecto:Record<string,number>={};
  const rows=lines.data as (LineaPersistida & {codigo_modulo:string|null})[];
  const codes=new Map<string,string>();
  for(const row of rows) {
    if(!row.tipo_mueble_id) continue; // Adicionales conservan su referencia de catálogo.
    const tipo=catalogo.tiposById[row.tipo_mueble_id];
    const quote=proyectos.find(q=>q.id===row.cotizacion_id);
    if(!tipo || !quote) throw new Error(`Tipo o proyecto no encontrado: ${row.id}`);
    const input=inputDesdeLinea(row);
    const caja=catalogo.tablerosByCode[input.preset.caja];
    const frente=catalogo.tablerosByCode[input.preset.frente];
    if(!caja || !frente) throw new Error(`Material no encontrado: ${row.id}`);
    const sistema:CodigoComercialInput['sistema']=quote.sistema_medida==='metrico'?'metrico':'imperial';
    const despues=codigoComercial({ ...input,
      pref:(sistema==='metrico'?tipo.pref_metrico:tipo.pref_imperial)||tipo.pref,
      sistema,zocaloIn:input.overrides?.zocalo,
      espesorCajaMm:Number(caja.espesor_mm),espesorFrenteMm:Number(frente.espesor_mm),
    });
    codes.set(row.id,despues);
    if(despues!==row.codigo_modulo) {
      cambios.push({id:row.id,antes:row.codigo_modulo,despues});
      porProyecto[quote.nombre]=(porProyecto[quote.nombre]??0)+1;
    }
  }
  const grupos=(groups.data as {id:string;codigo_grupo:string|null}[]).flatMap(g=>{
    const members=rows.filter(l=>l.grupo_id===g.id).sort((a,b)=>a.posicion_grupo-b.posicion_grupo);
    if(!members.length || members.some(l=>!codes.has(l.id))) return [];
    const despues=codigoGrupo(members.map(l=>codes.get(l.id)!));
    return despues===g.codigo_grupo?[]:[{id:g.id,antes:g.codigo_grupo as string|null,despues}];
  });
  console.log(JSON.stringify({cotizaciones:quotes.data?.length,lineas:cambios.length,grupos:grupos.length,porProyecto,ejemplos:cambios.slice(0,8)},null,2));
  if(!process.argv.includes('--apply') || !cambios.length && !grupos.length) return;
  const backup=path.join(os.tmpdir(),`cotizador-respaldo-codigos-${Date.now()}.json`);
  fs.writeFileSync(backup,JSON.stringify({quotes:quotes.data,lineas:lines.data,grupos:groups.data}),{flag:'wx'});
  // Literales JSON escapados como SQL estándar; no se interpolan en un shell.
  const literal=(value:unknown)=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`;
  const sql=`begin;
  create temporary table cambios_lineas as select * from jsonb_to_recordset(${literal(cambios)}) as x(id uuid,antes text,despues text);
  create temporary table cambios_grupos as select * from jsonb_to_recordset(${literal(grupos)}) as x(id uuid,antes text,despues text);
  do $$ begin
    if exists(select 1 from cambios_lineas c left join cot_cotizacion_lineas l on l.id=c.id where l.id is null or l.codigo_modulo is distinct from c.antes)
    or exists(select 1 from cambios_grupos c left join cot_grupos_modulos g on g.id=c.id where g.id is null or g.codigo_grupo is distinct from c.antes)
    then raise exception 'Los códigos cambiaron durante la auditoría; vuelve a ejecutar'; end if;
  end $$;
  update cot_cotizacion_lineas l set codigo_modulo=c.despues,
    breakdown=case when jsonb_typeof(l.breakdown->'piezas')='array' then
      jsonb_set(l.breakdown,'{piezas}',coalesce((select jsonb_agg(
        case when p->>'origen'='A'||l.posicion_grupo::text||' '||c.antes
          then jsonb_set(p,'{origen}',to_jsonb('A'||l.posicion_grupo::text||' '||c.despues))
          else p end order by n)
        from jsonb_array_elements(l.breakdown->'piezas') with ordinality as x(p,n)), '[]'::jsonb))
      else l.breakdown end
    from cambios_lineas c where l.id=c.id;
  update cot_grupos_modulos g set codigo_grupo=c.despues from cambios_grupos c where g.id=c.id;
  commit;`;
  const file=path.join(os.tmpdir(),`cotizador-codigos-${Date.now()}.sql`);
  fs.writeFileSync(file,sql,{flag:'wx'});
  console.log(`Respaldo: ${backup}`);
  execFileSync(process.execPath,['scripts/run-sql.mjs',file],{stdio:'inherit'});
}
main().catch(error=>{console.error(error);process.exitCode=1;});
