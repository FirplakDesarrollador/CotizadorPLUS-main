-- Tipologia independiente basada exclusivamente en la hoja WBL3840 D22 7/8L-SM.
-- No copia piezas, reglas ni herrajes de la tipologia WBL existente.
insert into public.cot_tipos_mueble
  (pref,nombre_es,nombre_en,categoria,margen_key,descripcion_es,notas,activo,permite_agrupacion)
values
  ('WBL-D-L/R-SM','WBL-D-L/R-SM — Mueble superior Blind Door','Blind Door wall cabinet L/R SM',
   'superior','muebles','Mueble superior con puerta parametrica, apertura L/R y Blind Door fijo.',
   'Codigo WBL<largo><alto>-D<Puerta><L/R>-SM. Geometria creada desde la hoja WBL3840 D22 7/8L-SM.',
   true,false)
on conflict (pref) do update set
  nombre_es=excluded.nombre_es,
  nombre_en=excluded.nombre_en,
  categoria=excluded.categoria,
  margen_key=excluded.margen_key,
  descripcion_es=excluded.descripcion_es,
  notas=excluded.notas,
  activo=true,
  permite_agrupacion=false,
  updated_at=now();

do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='WBL-D-L/R-SM';
  if v is null then raise exception 'No se pudo crear WBL-D-L/R-SM'; end if;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v,'base','caja','1','L-(30/25.4)','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,'BASE - R20L B','local','{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'tapa','caja','1','L-(30/25.4)','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,20,'TAPA - R20L B','local','{"version":1,"funcion":"tapa","plano":"XY","intercambiar":false,"confirmado":true}'),
    (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,30,'SIDE R/L - R20L B','local','{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_trasero','refuerzo','2','L-(30/25.4)','80/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,'RAIL TRASERO P','local','{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'),
    (v,'entrepano','refuerzo','n_entrepanos','L-(31/25.4)','P-(38.1/25.4)','{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,50,'SHELF P; cantidad segun regla de superiores.','local','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"y":"P-TC-TB-D","confirmado":true}'),
    (v,'frente','frente','1','door-RV','A+(15.85/25.4)','{"calibre":"22x1","largos":2,"anchos":2}',0,0,60,'DOOR C; ancho Puerta menos reveal de 3,2mm.','local','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"z":"A-H","confirmado":true}'),
    (v,'Blind Door','frente','1','L-door','A+(19.05/25.4)','{"calibre":"22x1","largos":2,"anchos":2}',0,0,70,'Nombre fijo Blind Door.','local','{"version":1,"funcion":"frente_falso","plano":"XZ","intercambiar":false,"z":"A-H","confirmado":true}'),
    (v,'fondo','fondo','1','A-(16/25.4)','L-(16/25.4)','{}',0,0,80,'BACKING F','local','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}');

  delete from public.cot_reglas_config where tipo_mueble_id=v;
  insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas)
  values
    (v,'n_puertas','true','1',5,'Una puerta movil mas Blind Door fijo.'),
    (v,'n_cajones','true','0',5,'Sin gavetas.'),
    (v,'n_patas','true','0',5,'Mueble superior.'),
    (v,'gola','true','0',5,'SM integrado en la tipologia; sin manija.'),
    (v,'n_entrepanos','A <= 17','0',10,'Regla comun de muebles superiores.'),
    (v,'n_entrepanos','A <= 27','1',20,'Regla comun de muebles superiores.'),
    (v,'n_entrepanos','A <= 40','2',30,'Regla comun de muebles superiores.'),
    (v,'n_entrepanos','true','3',99,'Regla comun de muebles superiores.');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  values
    (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',10,'Bisagras de la puerta movil; SM no usa manija.');
end $$;

do $$
begin
  if (select count(*) from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id where t.pref='WBL-D-L/R-SM') <> 8 then
    raise exception 'WBL-D-L/R-SM debe tener exactamente 8 plantillas de pieza';
  end if;
end $$;
