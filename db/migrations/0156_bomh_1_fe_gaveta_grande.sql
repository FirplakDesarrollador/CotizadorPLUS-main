-- BOMH-1-FE: copia independiente de BOMH-1.
-- Solo sustituye la caja Tandem por una gaveta grande de madera con RIELFE500.
do $$
declare
  v uuid;
  v_base uuid;
begin
  select id into v_base from public.cot_tipos_mueble where pref='BOMH-1';
  if v_base is null then raise exception 'No existe BOMH-1'; end if;

  insert into public.cot_tipos_mueble
    (pref,nombre_es,nombre_en,descripcion_es,categoria,margen_key,familia_code,
     activo,permite_agrupacion,etiquetas_und,usa_carton,pref_imperial,pref_metrico,
     notas,updated_at)
  values
    ('BOMH-1-FE','BOMH-1-FE Mueble inferior medio horno',
     'Half-oven base cabinet with 1 full-extension drawer',
     'BOMH-1 con una gaveta grande de madera y riel full extension de 500mm.',
     'inferior','muebles',null,true,false,4,true,'BOMH-1-FE','BOMH-1-FE',
     'Estructura BOMH-1; solo la gaveta cambia a grande FE.',now())
  on conflict (pref) do update set
    nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,
    descripcion_es=excluded.descripcion_es,categoria=excluded.categoria,
    margen_key=excluded.margen_key,activo=true,permite_agrupacion=false,
    etiquetas_und=excluded.etiquetas_und,usa_carton=excluded.usa_carton,
    pref_imperial=excluded.pref_imperial,pref_metrico=excluded.pref_metrico,
    notas=excluded.notas,updated_at=now()
  returning id into v;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     resta_largo,resta_ancho,cantos,orden,notas,tarugos,soportes,modo_agrupacion,
     clave_fusion,formula_largo_grupo,visualizacion)
  select
    v,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
    p.resta_largo,p.resta_ancho,p.cantos,p.orden,p.notas,p.tarugos,p.soportes,
    p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo,p.visualizacion
  from public.cot_piezas_plantilla p
  where p.tipo_mueble_id=v_base
    and p.nombre not in ('base_gaveta','trasero_gaveta');

  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'lateral_gaveta_grande','refuerzo','2','500/25.4','200/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":1}',0,0,60,
     'Gaveta grande FE: dos laterales de 500x200mm.','local',
     '{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":true,"confirmado":true}'),
    (v,'trasero_gaveta_grande','refuerzo','1','L-86/25.4','180/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":2}',6,0,70,
     'Gaveta grande FE: trasero L-86mm por 180mm; enchape en ambos lados largos.','local',
     '{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'contraparche_grande','refuerzo','1','L-86/25.4','200/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',6,0,71,
     'Gaveta grande FE: contraparche L-86mm por 200mm.','local',
     '{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'base_gaveta','fondo','1','508/25.4','L-72/25.4','{}',0,0,72,
     'Gaveta grande FE: fondo de 6mm, 508mm por L-72mm.','local',
     '{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":true,"confirmado":true}');

  delete from public.cot_reglas_config where tipo_mueble_id=v;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
  select v,variable,condicion,valor,prioridad,activo,
         replace(coalesce(notas,''),'BOMH-1:','BOMH-1-FE:')
  from public.cot_reglas_config where tipo_mueble_id=v_base;

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  select v,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas
  from public.cot_herrajes_plantilla
  where tipo_mueble_id=v_base and rol <> 'riel';
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  values (v,'riel','RIELFE500','riel_fe','n_cajones',10,
          'Riel full extension de 500mm para la gaveta grande.');
end $$;

do $$
begin
  if (select coalesce(sum(case when p.formula_cantidad='n_cajones' then 1
                               else (p.formula_cantidad)::int end),0)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BOMH-1-FE') <> 16 then
    raise exception 'BOMH-1-FE debe producir 16 piezas fisicas';
  end if;
end $$;
