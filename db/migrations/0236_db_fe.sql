-- DB-FE: una tipología paramétrica con las variantes de DB y cajas de madera FE.
begin;
do $$
declare origen public.cot_tipos_mueble%rowtype; destino uuid; fe uuid;
 pequena text; grande text; pieza public.cot_piezas_plantilla%rowtype; cantidad text;
begin
 select * into strict origen from public.cot_tipos_mueble where pref='DB';
 select id into strict fe from public.cot_tipos_mueble where pref='DB-2S-SM-FE';
 if not exists(select 1 from public.cot_herrajes where codigo='RIELFE500') then raise exception 'Falta RIELFE500'; end if;
 select id into destino from public.cot_tipos_mueble where pref='DB-FE';
 if destino is null then
  destino:=gen_random_uuid();
  insert into public.cot_tipos_mueble
  select (jsonb_populate_record(null::public.cot_tipos_mueble,to_jsonb(origen)||jsonb_build_object(
    'id',destino,'pref','DB-FE','pref_imperial','DB-FE','pref_metrico','DB-FE',
    'nombre_es','Cajonera DB Full Extension','nombre_en','Drawer Base Full Extension',
    'descripcion_es','Cajonera DB con variantes 1S, 2S, 2, 3, 4 y 2-1INT; cajas de madera y riel Full Extension 500 mm.',
    'notas','Carcasa y frentes de DB; gavetas FE. Sin Gola ni barras estabilizadoras Tandem.',
    'activo',true,'created_at',now(),'updated_at',now()))).*;
 end if;
 delete from public.cot_piezas_plantilla where tipo_mueble_id=destino;
 delete from public.cot_reglas_config where tipo_mueble_id=destino;
 delete from public.cot_herrajes_plantilla where tipo_mueble_id=destino;

 -- Copia exacta de DB: se reemplaza exclusivamente su caja de gaveta Tandem.
 insert into public.cot_piezas_plantilla
 select (jsonb_populate_record(null::public.cot_piezas_plantilla,to_jsonb(p)||jsonb_build_object(
   'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
 from public.cot_piezas_plantilla p where tipo_mueble_id=origen.id
   and nombre not in ('base_gaveta','trasero_gaveta_pequena','trasero_gaveta_grande');
 select formula_cantidad into strict pequena from public.cot_piezas_plantilla where tipo_mueble_id=origen.id and nombre='trasero_gaveta_pequena';
 select formula_cantidad into strict grande from public.cot_piezas_plantilla where tipo_mueble_id=origen.id and nombre='trasero_gaveta_grande';

 -- Dimensiones, cantos, tarugos y montaje FE vigentes; cantidades de cada variante DB.
 for pieza in select * from public.cot_piezas_plantilla where tipo_mueble_id=fe
   and nombre in ('lateral_gaveta_pequena','lateral_gaveta_grande','trasero_gaveta_pequena','trasero_gaveta_grande','contraparche_pequeno','contraparche_grande','fondo_gaveta')
 loop
  cantidad:=case when pieza.nombre='fondo_gaveta' then 'n_cajones'
    when pieza.nombre like '%pequen%' then '('||pequena||')' else '('||grande||')' end;
  if pieza.nombre like 'lateral_gaveta_%' then cantidad:='2*'||cantidad; end if;
  insert into public.cot_piezas_plantilla
  select (jsonb_populate_record(null::public.cot_piezas_plantilla,to_jsonb(pieza)||jsonb_build_object(
    'id',gen_random_uuid(),'tipo_mueble_id',destino,'formula_cantidad',cantidad,
    'created_at',now(),'updated_at',now()))).*;
 end loop;
 if (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=destino and nombre like 'lateral_gaveta_%')<>2
 or not exists(select 1 from public.cot_piezas_plantilla where tipo_mueble_id=destino and nombre='fondo_gaveta' and formula_largo='492/25.4')
 then raise exception 'Fuentes FE incompletas'; end if;

 insert into public.cot_reglas_config
 select (jsonb_populate_record(null::public.cot_reglas_config,to_jsonb(r)||jsonb_build_object(
   'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
 from public.cot_reglas_config r where tipo_mueble_id=origen.id;
 insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,activo)
 values(destino,'gola','true','0',1000,true),(destino,'n_barras','true','0',1000,true);

 insert into public.cot_herrajes_plantilla
 select (jsonb_populate_record(null::public.cot_herrajes_plantilla,to_jsonb(h)||jsonb_build_object(
   'id',gen_random_uuid(),'tipo_mueble_id',destino,
   'herraje_codigo',case when h.rol='riel' then 'RIELFE500' else h.herraje_codigo end,
   'selector_key',case when h.rol='riel' then 'riel_fe' else h.selector_key end,
   'created_at',now(),'updated_at',now()))).*
 from public.cot_herrajes_plantilla h where tipo_mueble_id=origen.id and rol<>'barra';
end $$;
commit;
