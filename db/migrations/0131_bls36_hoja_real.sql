-- BLS36 MBLE INF COC LAZY SUSAN: reconstruccion desde la hoja entregada.
-- Sustituye la plantilla anterior, que mezclaba piezas de tres variantes BLS.
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BLS';
  if v is null then raise exception 'No existe BLS'; end if;

  update public.cot_tipos_mueble
  set nombre_es='BLS — Mueble inferior esquinero Lazy Susan',
      nombre_en='Lazy Susan base cabinet',
      descripcion_es='Mueble inferior esquinero de 2 puertas y 1 entrepano.',
      notas='Geometria validada con hoja BLS36: 36x30x24in, 2 puertas y 1 entrepano.',
      activo=true,
      permite_agrupacion=false,
      updated_at=now()
  where id=v;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'base','caja','1','L','L','{"calibre":"19x0,45","largos":2,"anchos":2}',8,0,10,'BASE B; 914,4x914,4mm en BLS36.','local','{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'lateral','caja','1','A-TC','P','{"calibre":"19x0,45","largos":2,"anchos":1}',0,0,20,'SIDE R - R17L762 B.','local','{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"L-W","confirmado":true}'),
    (v,'lateral','caja','1','A-TC','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,30,'SIDE L - R17L762 B.','local','{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"0","confirmado":true}'),
    (v,'refuerzo_delantero_superior','refuerzo','1','L-2*TC','200/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,40,'RAIL DEL SUP B.','local','{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_delantero_central','refuerzo','1','L-(624.6/25.4)','80/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,50,'RAIL DEL CEN B; 289,8x80mm en BLS36.','local','{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_trasero','refuerzo','1','A-TC','177.8/25.4','{"calibre":"19x0,45","largos":2,"anchos":1}',0,0,60,'REF TRAS P.','local','{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'fondo_izquierdo','caja','1','L-4.94882','A-TC','{"calibre":"19x0,45","largos":1,"anchos":0}',0,0,70,'BACKING IZQ P; tablero de 15mm.','local','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"x":"0","y":"L-EP","giro":0,"confirmado":true}'),
    (v,'fondo_derecho','caja','1','L-4.94882','A-TC','{"calibre":"19x0,45","largos":1,"anchos":0}',0,0,80,'BACKING DER P; tablero de 15mm.','local','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"x":"EP","y":"0","giro":90,"confirmado":true}'),
    (v,'entrepano','refuerzo','1','29.82677','29.82677','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,90,'SHELF P; 757,6x757,6mm.','local','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'frente','frente','2','A-RV','L*0.30556','{"calibre":"22x1","largos":2,"anchos":2}',0,0,100,'DOOR R/L C; 758,8x279,4mm en BLS36.','local','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"confirmado":true}');

  delete from public.cot_reglas_config where tipo_mueble_id=v;
  insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas)
  values
    (v,'n_puertas','true','2',5,'BLS: dos puertas.'),
    (v,'n_entrepanos','true','1',5,'BLS: un entrepano.'),
    (v,'n_cajones','true','0',5,'BLS: sin gavetas.'),
    (v,'n_patas','true','4',5,'Mueble inferior.');
end $$;

do $$
begin
  if (select coalesce(sum((p.formula_cantidad)::int),0) from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id where t.pref='BLS') <> 11 then
    raise exception 'BLS36 debe producir 11 piezas fisicas';
  end if;
end $$;
