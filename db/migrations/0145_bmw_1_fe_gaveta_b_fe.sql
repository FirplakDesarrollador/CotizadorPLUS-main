-- BMW-1-FE conserva toda la estructura y los frentes de BMW-1.
-- Exclusivamente la caja de gaveta y su riel proceden de B-FE.
do $$
declare
  v uuid;
  v_bmw uuid;
begin
  select id into v_bmw from public.cot_tipos_mueble where pref='BMW-1';
  if v_bmw is null then raise exception 'No existe BMW-1'; end if;

  insert into public.cot_tipos_mueble
    (pref,nombre_es,nombre_en,descripcion_es,categoria,margen_key,familia_code,
     activo,permite_agrupacion,etiquetas_und,usa_carton,pref_imperial,pref_metrico,
     notas,updated_at)
  values
    ('BMW-1-FE','Mueble inferior para microondas con 1 gaveta FE',
     'Microwave base cabinet with 1 full-extension drawer',
     'Estructura BMW-1 con caja de gaveta de madera y riel full extension de B-FE.',
     'inferior','muebles',null,true,false,4,true,'BMW-1-FE','BMW-1-FE',
     'Estructura general BMW-1; solo el conjunto de gaveta procede de B-FE.',now())
  on conflict (pref) do update set
    nombre_es=excluded.nombre_es, nombre_en=excluded.nombre_en,
    descripcion_es=excluded.descripcion_es, categoria=excluded.categoria,
    margen_key=excluded.margen_key, activo=true, permite_agrupacion=false,
    etiquetas_und=excluded.etiquetas_und, usa_carton=excluded.usa_carton,
    pref_imperial=excluded.pref_imperial, pref_metrico=excluded.pref_metrico,
    notas=excluded.notas, updated_at=now()
  returning id into v;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  -- Estructura, entrepano, frentes y fondo: copia exacta del BMW-1 vigente.
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     resta_largo,resta_ancho,cantos,orden,notas,tarugos,soportes,modo_agrupacion,
     clave_fusion,formula_largo_grupo,visualizacion)
  select
    v,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
    p.resta_largo,p.resta_ancho,p.cantos,p.orden,p.notas,p.tarugos,p.soportes,
    p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo,p.visualizacion
  from public.cot_piezas_plantilla p
  where p.tipo_mueble_id=v_bmw
    and p.nombre not in ('base_gaveta','trasero_gaveta');

  -- Gaveta: copia exclusivamente la caja de madera validada en B-FE.
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'trasero_gaveta','refuerzo','n_cajones','L-86/25.4','80/25.4',
     '{"calibre":"19x0,45","largos":1,"anchos":0,"despEdges":0}',0,0,60,
     'Gaveta B-FE: trasero L-86mm por 80mm.','local',
     '{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'lateral_gaveta_der','refuerzo','n_cajones','100/25.4','500/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,70,
     'Gaveta B-FE: lateral derecho de 100x500mm.','local',
     '{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":false,"confirmado":true}'),
    (v,'lateral_gaveta_izq','refuerzo','n_cajones','100/25.4','500/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,71,
     'Gaveta B-FE: lateral izquierdo de 100x500mm.','local',
     '{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":false,"confirmado":true}'),
    (v,'contraparche','refuerzo','n_cajones','L-86/25.4','100/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,72,
     'Gaveta B-FE: contraparche corregido a L-86mm por 100mm.','local',
     '{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'fondo_gaveta','fondo','n_cajones','L-72/25.4','492/25.4',
     '{}',0,0,73,'Gaveta B-FE: fondo de 6mm, L-72mm por 492mm.','local',
     '{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":false,"confirmado":true}');

  delete from public.cot_reglas_config where tipo_mueble_id=v;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
  select v,variable,condicion,valor,prioridad,activo,
         replace(coalesce(notas,''),'BMW-1:','BMW-1-FE:')
  from public.cot_reglas_config where tipo_mueble_id=v_bmw;

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  select v,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas
  from public.cot_herrajes_plantilla
  where tipo_mueble_id=v_bmw and rol <> 'riel';
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  values (v,'riel','RIELFE500','riel_fe','n_cajones',50,
          'Riel full extension de 500mm heredado exclusivamente de B-FE.');
end $$;

do $$
begin
  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BMW-1-FE') <> 13 then
    raise exception 'BMW-1-FE debe tener 13 renglones de piezas';
  end if;
  if (select coalesce(sum(case when p.formula_cantidad='n_cajones' then 1
                               else (p.formula_cantidad)::int end),0)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BMW-1-FE') <> 15 then
    raise exception 'BMW-1-FE debe producir 15 piezas fisicas';
  end if;
end $$;
