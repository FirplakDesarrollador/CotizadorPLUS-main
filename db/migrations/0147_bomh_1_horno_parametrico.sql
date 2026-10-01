-- BOMH36-1 MBLE INF COC MEDIO HORNO 1 GAVETA.
-- Se basa estructuralmente en BMW-1 sin modificar esa tipologia.
-- El hueco libre del horno es parametrico mediante horno_largo y horno_alto.
do $$
declare v uuid;
begin
  insert into public.cot_tipos_mueble
    (pref,nombre_es,nombre_en,descripcion_es,categoria,margen_key,familia_code,
     activo,permite_agrupacion,etiquetas_und,usa_carton,pref_imperial,pref_metrico,
     notas,updated_at)
  values
    ('BOMH-1','Mueble inferior para medio horno con 1 gaveta',
     'Base cabinet for half oven with 1 drawer',
     'Mueble inferior con hueco parametrico para horno empotrado y una gaveta inferior.',
     'inferior','muebles',null,true,false,4,true,'BOMH-1','BOMH-1',
     'Reconstruido desde BOMH36-1; hueco libre inicial 219,2x153,2mm.',now())
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
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'base','caja','1','L-30/25.4','P-24/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,
     'BASE B; 884,4x585,6mm en BOMH36-1.','local',
     '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'lateral','caja','2','A','P',
     '{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,
     'SIDE R/L B; 762x609,6mm.','local',
     '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_delantero','refuerzo','1','L-30/25.4','80/25.4',
     '{"calibre":"22x1","largos":2,"anchos":0}',0,0,30,
     'RAIL DEL VERTICAL C; 884,4x80mm.','local',
     '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"A-H","confirmado":true}'),
    (v,'refuerzo_trasero','refuerzo','2','L-30/25.4','80/25.4',
     '{"calibre":"19x0,45","largos":0,"anchos":2}',0,0,40,
     'RAIL TRASERO B; dos piezas de 884,4x80mm.','local',
     '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'entrepano_fijo','refuerzo','1','L-30/25.4','P-24/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,50,
     'ENTREPANO FIJO B; 884,4x585,6mm.','local',
     '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"y":"P-D","z":"332.8","confirmado":true}'),
    (v,'base_gaveta','caja','1','L-105/25.4','492/25.4',
     '{"calibre":"19x0,45","largos":0,"anchos":2}',0,0,60,
     'FONDO GAVETA INF B; 809,4x492mm.','local',
     '{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'trasero_gaveta','caja','1','L-117/25.4','68/25.4',
     '{"calibre":"19x0,45","largos":0,"anchos":1}',0,0,70,
     'TRASERO CAJON INF B; 797,4x68mm.','local',
     '{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'frente_izq','frente','1','horno_alto','((L-RV)-horno_largo)/2',
     '{"calibre":"22x1","largos":2,"anchos":0}',0,0,80,
     'FRENTE IZQ C; conserva el alto libre del horno y adapta su ancho.','local',
     '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"x":"0","z":"339.2","confirmado":true}'),
    (v,'frente_der','frente','1','horno_alto','((L-RV)-horno_largo)/2',
     '{"calibre":"22x1","largos":2,"anchos":0}',0,0,81,
     'FRENTE DER C; conserva el alto libre del horno y adapta su ancho.','local',
     '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"x":"L-W","z":"339.2","confirmado":true}'),
    (v,'frente_gaveta','frente','1','L-RV','332.8/25.4',
     '{"calibre":"22x1","largos":2,"anchos":2}',0,0,90,
     'FRENTE GAV INF C; 332,8x911,2mm.','local',
     '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"z":"3.2","confirmado":true}'),
    (v,'fondo','fondo','1','332.8/25.4','L-16/25.4','{}',0,0,100,
     'BACKING F; 332,8x898,4mm.','local',
     '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"z":"0","confirmado":true}');

  delete from public.cot_reglas_config where tipo_mueble_id=v;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
  values
    (v,'n_cajones','true','1',5,true,'BOMH-1: una gaveta inferior.'),
    (v,'n_puertas','true','0',5,true,'BOMH-1: los laterales del horno son frentes, no puertas.'),
    (v,'n_entrepanos','true','1',5,true,'BOMH-1: un entrepano fijo.'),
    (v,'n_patas','true','4',5,true,'BOMH-1: cuatro patas.'),
    (v,'horno_largo','true','219.2/25.4',5,true,'Largo libre inicial del horno empotrado.'),
    (v,'horno_alto','true','153.2/25.4',5,true,'Alto libre inicial del horno empotrado.');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden)
  values
    (v,'riel','RIELTANDEM','riel','n_cajones',10),
    (v,'manija','MANIJA415','manija','n_cajones',20),
    (v,'pata','PATA10AJUST','pata','n_patas',30),
    (v,'tornillo','TORNILLO858','tornillo','n_patas*4',40);
end $$;

do $$
begin
  if (select coalesce(sum((p.formula_cantidad)::int),0)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BOMH-1') <> 13 then
    raise exception 'BOMH-1 debe producir 13 piezas fisicas';
  end if;
end $$;
