/** Generate a migration from the reviewed live catalogue, without generated IDs. */
import fs from 'node:fs';
import { inferirMontaje } from '../src/lib/visualizacion-config';
import type { Pieza } from '../src/lib/engine';
const c=JSON.parse(fs.readFileSync('artifacts/interpretacion-db/catalogo-live.json','utf8')) as {
  tipos:{id:string;pref:string}[]; piezas:(Pieza & {tipo_mueble_id:string})[];
};
const quote=(s:string)=>`'${s.replaceAll("'","''")}'`;
const rows=new Set<string>();
for(const p of c.piezas) {
  const pref=c.tipos.find(t=>t.id===p.tipo_mueble_id)?.pref;
  if(!pref) continue;
  const config=inferirMontaje(p);
  // Corner back panels close perpendicular walls. Their square base follows the
  // original cutting envelope; no unsupported notch is invented.
  if(['WER','BLS'].includes(pref) && p.nombre==='fondo' && p.formula_cantidad==='2') {
    config.x='I==0?0:EP'; config.y='I==0?L-EP:0'; config.giro='I==0?0:90';
    config.nota='Respaldos perpendiculares de esquina; montaje inferido, confirmar recortes.';
  }
  rows.add(`  (${[pref,p.nombre,p.formula_largo??'',p.formula_ancho??'',p.formula_cantidad,JSON.stringify(config)].map(quote).join(',')})`);
}
const sql=`-- Mounting only: cutting formulas, prices and existing RLS remain unchanged.
-- Generated from 57 active furniture types. No generated database IDs.
alter table public.cot_piezas_plantilla add column if not exists visualizacion jsonb;
comment on column public.cot_piezas_plantilla.visualizacion is 'Mounting v1: funcion, plano XY/XZ/YZ, intercambiar, x/y/z formulas in mm, giro, confirmado, nota. Null uses inference. Independent of costing.';
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.cot_piezas_plantilla'::regclass and conname='cot_piezas_visualizacion_object') then
    alter table public.cot_piezas_plantilla add constraint cot_piezas_visualizacion_object
      check (visualizacion is null or (jsonb_typeof(visualizacion)='object' and visualizacion->>'version'='1'));
  end if;
end $$;
update public.cot_piezas_plantilla p set visualizacion=v.config::jsonb
from public.cot_tipos_mueble t, (values
${[...rows].join(',\n')}
) as v(pref,nombre,largo,ancho,cantidad,config)
where p.tipo_mueble_id=t.id and t.pref=v.pref and p.nombre=v.nombre
  and coalesce(p.formula_largo,'')=v.largo and coalesce(p.formula_ancho,'')=v.ancho
  and p.formula_cantidad=v.cantidad and p.visualizacion is null;
`;
fs.writeFileSync('db/migrations/0035_visualizacion_montaje.sql',sql);
console.log(`Generated ${rows.size} mounting rules.`);
