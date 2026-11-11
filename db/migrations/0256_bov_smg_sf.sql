-- BOV-SMG-SF: variante sin fondo con el frente interno y refuerzo vertical SMG.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare origen public.cot_tipos_mueble%rowtype; destino uuid;
begin
  select * into strict origen from public.cot_tipos_mueble where pref='BOV-SF';
  select id into destino from public.cot_tipos_mueble where pref='BOV-SMG-SF';
  if destino is null then
    destino:=gen_random_uuid();
    insert into public.cot_tipos_mueble
    select (jsonb_populate_record(null::public.cot_tipos_mueble,to_jsonb(origen)||jsonb_build_object(
      'id',destino,'pref','BOV-SMG-SF','pref_imperial','BOV-SMG-SF','pref_metrico','BOV-SMG-SF',
      'nombre_es','Mueble inferior para horno con espacio superior de 73 mm, sin fondo',
      'nombre_en','Oven base with 73 mm upper clearance, without back panel',
      'descripcion_es','BOV-SF con frente interno, 73 mm libres superiores y refuerzo delantero vertical.',
      'descripcion_en','BOV-SF with internal front, 73 mm upper clearance and vertical front brace.',
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

  update public.cot_piezas_plantilla p
  set formula_ancho='P-TF',
      visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"x":"TC","y":"TF","z":"0","confirmado":true}'::jsonb,
      updated_at=now()
  where p.tipo_mueble_id=destino and p.nombre='base';

  update public.cot_piezas_plantilla p
  set formula_largo='L-2*TC',formula_ancho='A-73/25.4',
      visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"x":"TC","y":"0","z":"0","confirmado":true}'::jsonb,
      updated_at=now()
  where p.tipo_mueble_id=destino and p.nombre='frente';

  update public.cot_piezas_plantilla p
  set formula_largo='80/25.4',formula_ancho='A-2*TC',tarugos=4,
      cantos=jsonb_set(coalesce(p.cantos,'{}'::jsonb)||'{"largos":2,"anchos":0}'::jsonb,
        '{calibre}',to_jsonb(coalesce(p.cantos->>'calibre','19x0,45')),true),
      visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||
        '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"x":"(L-80/25.4)/2","y":"27","z":"TC","confirmado":true,"nota":"Refuerzo vertical a 27 mm del borde delantero del lateral."}'::jsonb,
      updated_at=now()
  where p.tipo_mueble_id=destino and p.nombre='refuerzo_delantero';
end $$;
commit;
