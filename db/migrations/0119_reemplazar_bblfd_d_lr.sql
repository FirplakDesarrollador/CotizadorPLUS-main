-- Reemplaza BBLFD por la construccion BBLFDxx-D<Door><L/R> de la hoja de ruta.

update public.cot_tipos_mueble
set nombre_es = 'BBLFD-D-L/R — Mueble inferior esquinero 1 puerta',
    nombre_en = 'Blind base full door L/R',
    descripcion_es = 'Mueble inferior esquinero con Door parametrico, mano L/R, blind door fijo y un entrepano.',
    notas = 'Door y la mano L/R son obligatorios. Codigo: BBLFD<largo>-D<Door><L/R>.',
    activo = true,
    permite_agrupacion = false,
    updated_at = now()
where pref = 'BBLFD';

do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref = 'BBLFD';
  if v is null then raise exception 'No existe BBLFD'; end if;

  delete from public.cot_piezas_plantilla where tipo_mueble_id = v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'base','caja','1','L-2*TC','P-(18/25.4)-TB','{"calibre":"19x0,45","largos":0,"anchos":2}',8,0,10,'BASE C','local','{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'lateral','caja','1','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,'Lateral derecho','local','{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"L-W","confirmado":true}'),
    (v,'lateral','caja','1','A','P','{"calibre":"19x0,45","largos":1,"anchos":2}',0,0,30,'Lateral izquierdo','local','{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"0","confirmado":true}'),
    (v,'refuerzo_delantero','refuerzo','1','L-2*TC','100/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,'Refuerzo delantero','local','{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_vertical','refuerzo','1','A-2*TC','100/25.4','{"calibre":"19x0,45","largos":1,"anchos":1}',4,0,50,'Refuerzo vertical entre blind door y frente; 2 tarugos por lado.','local','{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":true,"confirmado":true}'),
    (v,'refuerzo_trasero','refuerzo','1','L-2*TC','80/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,60,'Refuerzo trasero superior','local','{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_trasero','refuerzo','1','L-2*TC','80/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,70,'Refuerzo trasero inferior','local','{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'entrepano','refuerzo','1','L-2*TC-(1/25.4)','P-(150.8/25.4)','{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,80,'Entrepaño','local','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'blind door','frente','1','A','P-(0.03/25.4)','{"calibre":"22x1","largos":2,"anchos":2}',0,0,90,'Puerta fija BLIND DOOR C','local','{"version":1,"funcion":"frente_falso","plano":"XZ","intercambiar":true,"confirmado":true}'),
    (v,'frente','frente','1','A-RV','door','{"calibre":"22x1","largos":2,"anchos":2}',0,0,100,'Frente; ancho definido por Door.','local','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"confirmado":true}'),
    (v,'fondo','fondo','1','A-(2/25.4)','L-(16/25.4)','{}',0,0,110,'Fondo','local','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true}');

  delete from public.cot_reglas_config where tipo_mueble_id = v;
  insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas)
  values
    (v,'n_patas','true','4',5,'Mueble inferior.'),
    (v,'n_puertas','true','1',5,'Siempre una puerta movil.'),
    (v,'n_cajones','true','0',5,'Sin gavetas.'),
    (v,'n_entrepanos','true','1',5,'Siempre un shelf.');
end $$;
