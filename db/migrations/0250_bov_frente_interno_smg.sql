-- 2026-11-07: BOV interno sin holguras; BOV-SMG deja 73 mm superiores exactos.
begin;

-- TR usa el refuerzo real expuesto por el motor. El fallback mantiene compatibilidad
-- con motores anteriores mientras se publica el código (los BOV actuales usan TC=TR).
insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,activo)
select id,'TR','true','typeof TR === typeof TC ? TR : TC',5,true
from public.cot_tipos_mueble t where pref in ('BOV','BOV-SF')
and not exists(select 1 from public.cot_reglas_config r where r.tipo_mueble_id=t.id and r.variable='TR');

update public.cot_piezas_plantilla p set formula_ancho='P-TR'
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref in ('BOV','BOV-SF') and p.nombre='base' and p.formula_ancho is distinct from 'P-TR';

update public.cot_piezas_plantilla p set formula_largo='L-2*TC', formula_ancho='A-TC',
 visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"x":"TC","y":"0","z":"TC","confirmado":true}'::jsonb
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref in ('BOV','BOV-SF') and p.nombre='frente'
 and (p.formula_largo is distinct from 'L-2*TC' or p.formula_ancho is distinct from 'A-TC'
 or not coalesce(p.visualizacion,'{}'::jsonb) @> '{"x":"TC","y":"0","z":"TC","intercambiar":false}'::jsonb);

-- Conserva la pieza y su corte; la ubica detrás del frente interno para que no se crucen.
update public.cot_piezas_plantilla p set visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"y":"TF"}'::jsonb
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref in ('BOV','BOV-SF') and p.nombre='refuerzo_delantero' and p.visualizacion->>'y' is distinct from 'TF';

do $$
declare origen public.cot_tipos_mueble%rowtype; destino uuid;
begin
 select * into strict origen from public.cot_tipos_mueble where pref='BOV';
 select id into destino from public.cot_tipos_mueble where pref='BOV-SMG';
 if destino is null then
  destino:=gen_random_uuid();
  insert into public.cot_tipos_mueble
  select (jsonb_populate_record(null::public.cot_tipos_mueble,to_jsonb(origen)||jsonb_build_object(
    'id',destino,'pref','BOV-SMG','pref_imperial','BOV-SMG','pref_metrico','BOV-SMG',
    'nombre_es','Mueble inferior para horno con espacio superior de 73 mm',
    'nombre_en','Oven base with 73 mm upper clearance',
    'descripcion_es','BOV con frente interno y 73 mm libres hasta el borde superior. Sin holguras adicionales.',
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
 update public.cot_piezas_plantilla set formula_ancho='A-TC-73/25.4'
 where tipo_mueble_id=destino and nombre='frente' and formula_ancho is distinct from 'A-TC-73/25.4';
end $$;
commit;
