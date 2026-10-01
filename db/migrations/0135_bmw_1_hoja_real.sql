-- BMW36-1 MBLE INF COC MICROONDAS 1 GAVETA.
-- Nueva tipologia independiente; BMW historico permanece sin cambios.
do $$
declare v uuid;
begin
  insert into public.cot_tipos_mueble
    (pref,nombre_es,nombre_en,descripcion_es,categoria,margen_key,familia_code,
     activo,permite_agrupacion,etiquetas_und,notas,updated_at)
  values
    ('BMW-1','Mueble inferior para microondas con 1 gaveta',
     'Microwave base cabinet with 1 drawer',
     'Mueble inferior para microondas con un frente inferior y una gaveta superior.',
     'inferior','muebles',null,true,false,4,
     'Geometria reconstruida desde BMW36-1: 36x30x24in.',now())
  on conflict (pref) do update set
    nombre_es=excluded.nombre_es,
    nombre_en=excluded.nombre_en,
    descripcion_es=excluded.descripcion_es,
    categoria=excluded.categoria,
    margen_key=excluded.margen_key,
    activo=true,
    permite_agrupacion=false,
    etiquetas_und=excluded.etiquetas_und,
    notas=excluded.notas,
    updated_at=now()
  returning id into v;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'base','caja','1','L-30/25.4','P-24/25.4',
      '{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,
      'BASE B; 884,4x585,6mm en BMW36-1.','local',
      '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'lateral','caja','2','A','P',
      '{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,
      'SIDE R/L B; 762x609,6mm en BMW36-1.','local',
      '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_delantero','refuerzo','1','L-30/25.4','80/25.4',
      '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,30,
      'RAIL DELANTERO B; 884,4x80mm; montado en la esquina frontal superior.','local',
      '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"A-H","confirmado":true,"nota":"Refuerzo delantero en la esquina frontal superior, con la cara superior al ras del mueble."}'),
    (v,'refuerzo_trasero','refuerzo','2','L-30/25.4','80/25.4',
      '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,40,
      'RAIL TRASERO B; dos piezas de 884,4x80mm.','local',
      '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'entrepano_fijo','refuerzo','1','L-30/25.4','P-24/25.4',
      '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,50,
      'ENTREPANO FIJO B; misma medida que la base: 884,4x585,6mm.','local',
      '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"y":"P-D","z":"224.93-H/2","confirmado":true,"nota":"Entrepano fijo centrado en la junta de los frentes y extendido entre los frentes y el fondo."}'),
    (v,'base_gaveta','caja','1','L-105/25.4','492/25.4',
      '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,60,
      'FONDO GAVETA INF B; 809,4x492mm.','local',
      '{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'trasero_gaveta','caja','1','L-117/25.4','68/25.4',
      '{"calibre":"19x0,45","largos":1,"anchos":0}',0,0,70,
      'TRASERO CAJON INF B; 797,4x68mm.','local',
      '{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'frente_gaveta','frente','1','L-RV','220.13/25.4',
      '{"calibre":"22x1","largos":2,"anchos":2}',0,0,80,
      'FRENTE GAVETA INF C; 220,13x911,2mm.','local',
      '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"z":"3.2","confirmado":true,"nota":"Frente de la gaveta inferior."}'),
    (v,'frente','frente','1','L-RV','A-(220.13/25.4)-2*RV',
      '{"calibre":"22x1","largos":2,"anchos":2}',0,0,90,
      'FRENTE C; 535,47x911,2mm a A=30in.','local',
      '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"z":"226.53","confirmado":true,"nota":"Frente superior, sobre la gaveta inferior."}'),
    (v,'fondo','fondo','1','241.33/25.4','L-16/25.4',
      '{"calibre":"19x0,45","largos":0,"anchos":0}',0,0,100,
      'BACKING F; 241,33x898,4mm.','local',
      '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"z":"0","confirmado":true,"nota":"Fondo inferior limitado por el entrepano fijo a 241,33mm."}');

  delete from public.cot_reglas_config where tipo_mueble_id=v;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,notas)
  values
    (v,'n_cajones','true','1',5,'BMW-1: una gaveta.'),
    (v,'n_puertas','true','0',5,'BMW-1: el frente inferior no es puerta.'),
    (v,'n_entrepanos','true','1',5,'BMW-1: un entrepano fijo.'),
    (v,'n_patas','true','4',5,'BMW-1: cuatro patas.');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad)
  values
    (v,'riel','RIELTANDEM','riel','n_cajones'),
    (v,'manija','MANIJA415','manija','n_cajones'),
    (v,'pata','PATA10AJUST','pata','n_patas'),
    (v,'tornillo','TORNILLO858','tornillo','n_patas*4');
end $$;

do $$
begin
  if (select coalesce(sum((p.formula_cantidad)::int),0)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BMW-1') <> 12 then
    raise exception 'BMW-1 debe producir 12 piezas fisicas';
  end if;
end $$;
