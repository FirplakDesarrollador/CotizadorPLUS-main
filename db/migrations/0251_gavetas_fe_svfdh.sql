-- 2026-11-07: frentes 2S SM/SMG, dimensiones FE y clones SVFDH.
begin;
update public.cot_reglas_config r set valor='alto_frente_grande/2-RV/2', notas='Cada frente pequeño: mitad del grande menos 1,6 mm.'
from public.cot_tipos_mueble t where t.id=r.tipo_mueble_id and t.pref ~ '^DB-2S-SMG?(-FE)?(-SF)?$'
and r.variable='alto_frente_pequeno' and r.valor is distinct from 'alto_frente_grande/2-RV/2';
update public.cot_piezas_plantilla p set notas='Frentes 2S SM/SMG: grande=(A-60 mm)/2; pequeño=grande/2-RV/2.'
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref ~ '^DB-2S-SMG?(-FE)?(-SF)?$' and p.nombre in ('frente_gaveta_pequena','frente_gaveta_grande');

update public.cot_piezas_plantilla p set formula_largo='(P >= 24-0.000000001 ? 500 : P >= 21-0.000000001 ? 450 : 350)/25.4'
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref ~ '^DB(-.*)?-FE(-SF)?$' and p.nombre ~ '^lateral_gaveta(_|$)';
update public.cot_piezas_plantilla p set formula_largo='((P >= 24-0.000000001 ? 500 : P >= 21-0.000000001 ? 450 : 350)/25.4)-8/25.4'
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref ~ '^DB(-.*)?-FE(-SF)?$' and p.nombre in ('fondo_gaveta','base_gaveta');
update public.cot_piezas_plantilla p set formula_largo='L-2*TC-26/25.4-2*'||case when exists(
 select 1 from public.cot_piezas_plantilla l where l.tipo_mueble_id=t.id and l.nombre ~ '^lateral_gaveta(_|$)' and l.rol_tablero='refuerzo'
) then 'TR' else 'TC' end
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref ~ '^DB(-.*)?-FE(-SF)?$' and p.nombre ~ '^(trasero_gaveta|contraparche)(_|$)';

do $$
declare origen public.cot_tipos_mueble%rowtype; destino uuid; variante text;
begin
 select * into strict origen from public.cot_tipos_mueble where pref='SVFD';
 foreach variante in array array['SVFDH','SVFDH-SMG'] loop
  destino:=null;
  select id into destino from public.cot_tipos_mueble where pref=variante;
  if destino is null then
   destino:=gen_random_uuid();
   insert into public.cot_tipos_mueble
   select (jsonb_populate_record(null::public.cot_tipos_mueble,to_jsonb(origen)||jsonb_build_object(
    'id',destino,'pref',variante,'pref_imperial',variante,'pref_metrico',variante,
    'nombre_es',origen.nombre_es||case when variante='SVFDH-SMG' then ' SMG' else '' end,
    'descripcion_es',case when variante='SVFDH' then origen.descripcion_es else 'SVFDH con frente 30 mm menor que el alto total.' end,
    'created_at',now(),'updated_at',now()))).*;
  end if;
  insert into public.cot_piezas_plantilla
  select (jsonb_populate_record(null::public.cot_piezas_plantilla,to_jsonb(p)||jsonb_build_object(
   'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
  from public.cot_piezas_plantilla p where p.tipo_mueble_id=origen.id
  and not exists(select 1 from public.cot_piezas_plantilla n where n.tipo_mueble_id=destino and n.nombre=p.nombre and n.orden=p.orden);
  insert into public.cot_reglas_config
  select (jsonb_populate_record(null::public.cot_reglas_config,to_jsonb(r)||jsonb_build_object(
   'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
  from public.cot_reglas_config r where r.tipo_mueble_id=origen.id
  and not exists(select 1 from public.cot_reglas_config n where n.tipo_mueble_id=destino and n.variable=r.variable and n.condicion=r.condicion and n.prioridad=r.prioridad);
  insert into public.cot_herrajes_plantilla
  select (jsonb_populate_record(null::public.cot_herrajes_plantilla,to_jsonb(h)||jsonb_build_object(
   'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
  from public.cot_herrajes_plantilla h where h.tipo_mueble_id=origen.id
  and not exists(select 1 from public.cot_herrajes_plantilla n where n.tipo_mueble_id=destino and n.rol=h.rol);
  update public.cot_piezas_plantilla set formula_ancho='A-30/25.4'
  where tipo_mueble_id=destino and variante='SVFDH-SMG' and nombre='frente' and formula_ancho is distinct from 'A-30/25.4';
 end loop;
end $$;
commit;
