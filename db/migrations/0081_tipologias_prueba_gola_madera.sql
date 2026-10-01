-- Tipologías independientes tomadas de Prueba Tipologías.xlsx.
-- No se modifica ninguna de las familias BFD, OW ni W existentes.
-- Las fórmulas usan las variables vigentes del motor (TC, TB y RV) para que
-- los descuentos respeten el espesor de los tableros del perfil activo.

insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas)
values
  ('BFD-SM', 'Mueble inferior puertas con gola de madera', 'Base Full Door wood gola', 'inferior', 'muebles', 'Tipología independiente BFDxx-SM.', 'Gola de madera; conserva manijas y bisagras de BFD.'),
  ('OW-MO', 'Mueble superior para microondas sin puertas', 'Open wall microwave cabinet', 'superior', 'muebles', 'Tipología independiente OWXXXX-MO.', 'Base con profundidad P + 130 mm y respaldo incorporado.'),
  ('W-SM', 'Mueble superior de pared con gola de madera', 'Wall cabinet wood gola', 'superior', 'muebles', 'Tipología independiente WXXXX-SM.', 'Gola de madera; conserva manijas y bisagras de W.'),
  ('W-SM-PUSH', 'Mueble superior de pared con gola de madera y Push', 'Wall cabinet wood gola with Push', 'superior', 'muebles', 'Tipología independiente WXXXX24-SM-PUSH.', 'Push to Open exclusivo de esta tipología W.')
on conflict (pref) do nothing;

delete from public.cot_piezas_plantilla
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('BFD-SM','OW-MO','W-SM','W-SM-PUSH'));

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
select t.id, p.nombre, p.rol_tablero, p.formula_cantidad, p.formula_largo, p.formula_ancho, p.cantos::jsonb, p.tarugos, p.soportes, p.orden, p.notas, p.visualizacion::jsonb
from public.cot_tipos_mueble t
join (values
  -- BFDxx-SM: BFD independiente, un shelf fijo y refuerzo GOLA adicional.
  ('BFD-SM','base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,'BASE: P menos 18 mm + espesor de fondo.','{"version":1,"funcion":"base","plano":"XY","intercambiar":false}'),
  ('BFD-SM','lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,null,'{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false}'),
  ('BFD-SM','refuerzo_delantero','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,30,null,'{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false}'),
  ('BFD-SM','gola_madera','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,'Refuerzo GOLA de madera adicional.','{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false}'),
  ('BFD-SM','refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,50,null,'{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false}'),
  ('BFD-SM','entrepano','refuerzo','n_entrepanos','L-2*TC-0.03937','P >= 23.5 ? 558.8/25.4 : (P <= 12.5 ? 266.7/25.4 : P-1.5)','{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,60,'Shelf delante del fondo.','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false}'),
  ('BFD-SM','frente','frente','n_puertas','(L-n_puertas*RV)/n_puertas','A-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,70,'Puerta: alto del mueble menos 3,2 mm.','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false}'),
  ('BFD-SM','fondo','fondo','1','A-0.07874','L-0.62992','{}',0,0,80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true}'),

  -- OWXXXX-MO: la hoja no trae backing; se agrega según la regla vigente.
  ('OW-MO','base','caja','1','L-2*TC','P+5.11811','{"calibre":"19x0,45","largos":2,"anchos":2}',8,0,10,'BASE extendida: profundidad P + 130 mm.','{"version":1,"funcion":"base","plano":"XY","intercambiar":false}'),
  ('OW-MO','tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,20,null,'{"version":1,"funcion":"tapa","plano":"XY","intercambiar":false}'),
  ('OW-MO','lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,30,null,'{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false}'),
  ('OW-MO','refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,null,'{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false}'),
  ('OW-MO','fondo','fondo','1','A-0.866142','L-0.866142','{}',0,0,50,'BACKING agregado: la hoja no lo incluye.','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB"}'),

  -- WXXXX-SM: base y tapa separadas, GOLA de madera y reglas de W vigentes.
  ('W-SM','base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,null,'{"version":1,"funcion":"base","plano":"XY","intercambiar":false}'),
  ('W-SM','tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,20,null,'{"version":1,"funcion":"tapa","plano":"XY","intercambiar":false}'),
  ('W-SM','lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,30,null,'{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false}'),
  ('W-SM','gola_madera','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,'Refuerzo GOLA de madera adicional.','{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false}'),
  ('W-SM','refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,50,null,'{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false}'),
  ('W-SM','entrepano','refuerzo','n_entrepanos','L-2*TC-0.03937','P >= 23.5 ? 558.8/25.4 : (P <= 12.5 ? 266.7/25.4 : P-1.5)','{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,60,'Shelf delante del fondo.','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false}'),
  ('W-SM','frente','frente','n_puertas','(L-n_puertas*RV)/n_puertas','A-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,70,'Puerta: alto del mueble menos 3,2 mm.','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false}'),
  ('W-SM','fondo','fondo','1','L-0.62992','A-0.62992','{}',0,0,80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true}'),

  -- WXXXX24-SM-PUSH: misma regla de W-SM, con Push To Open exclusivo.
  ('W-SM-PUSH','base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,null,'{"version":1,"funcion":"base","plano":"XY","intercambiar":false}'),
  ('W-SM-PUSH','tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,20,null,'{"version":1,"funcion":"tapa","plano":"XY","intercambiar":false}'),
  ('W-SM-PUSH','lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,30,null,'{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false}'),
  ('W-SM-PUSH','gola_madera','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,'Refuerzo GOLA de madera adicional.','{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false}'),
  ('W-SM-PUSH','refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,50,null,'{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false}'),
  ('W-SM-PUSH','entrepano','refuerzo','n_entrepanos','L-2*TC-0.03937','P >= 23.5 ? 558.8/25.4 : (P <= 12.5 ? 266.7/25.4 : P-1.5)','{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,60,'Shelf delante del fondo.','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false}'),
  ('W-SM-PUSH','frente','frente','n_puertas','(L-n_puertas*RV)/n_puertas','A-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,70,'Puerta: alto del mueble menos 3,2 mm.','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false}'),
  ('W-SM-PUSH','fondo','fondo','1','L-0.62992','A-0.62992','{}',0,0,80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true}')
) as p(pref,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
  on p.pref = t.pref;

delete from public.cot_reglas_config
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('BFD-SM','OW-MO','W-SM','W-SM-PUSH'));

insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,notas)
select t.id, r.variable, r.condicion, r.valor, r.prioridad, r.notas
from public.cot_tipos_mueble t
join (values
  ('BFD-SM','n_puertas','L <= 21','1',10,'Regla adicional exclusiva BFD-SM.'),
  ('BFD-SM','n_puertas','L >= 24','2',20,'Regla adicional exclusiva BFD-SM.'),
  ('BFD-SM','n_puertas','true','1',99,'Regla adicional exclusiva BFD-SM.'),
  ('BFD-SM','n_entrepanos','true','1',10,'BFD-SM conserva un entrepaño.'),
  ('BFD-SM','n_cajones','true','0',10,'Sin gavetas.'),
  ('BFD-SM','n_patas','true','4',10,'Mueble inferior.'),
  ('BFD-SM','gola','true','0',10,'SM es gola de madera; no activa la variante de herrajes.'),
  ('OW-MO','n_puertas','true','0',10,'OW-MO sin puertas.'),
  ('OW-MO','n_entrepanos','true','0',10,'OW-MO sin entrepaños.'),
  ('OW-MO','n_cajones','true','0',10,'OW-MO sin gavetas.'),
  ('OW-MO','n_patas','true','0',10,'Mueble superior.'),
  ('OW-MO','gola','true','0',10,'Sin variante de gola.'),
  ('W-SM','n_puertas','L <= 21','1',10,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_puertas','L >= 24','2',20,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_puertas','true','1',99,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_entrepanos','A <= 16','0',10,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_entrepanos','A <= 24','1',20,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_entrepanos','A <= 36','2',30,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_entrepanos','true','3',99,'Regla adicional exclusiva W-SM.'),
  ('W-SM','n_cajones','true','0',10,'Sin gavetas.'),
  ('W-SM','n_patas','true','0',10,'Mueble superior.'),
  ('W-SM','gola','true','0',10,'SM es gola de madera; no activa la variante de herrajes.'),
  ('W-SM-PUSH','n_puertas','L <= 21','1',10,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_puertas','L >= 24','2',20,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_puertas','true','1',99,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_entrepanos','A <= 16','0',10,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_entrepanos','A <= 24','1',20,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_entrepanos','A <= 36','2',30,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_entrepanos','true','3',99,'Regla adicional exclusiva W-SM-PUSH.'),
  ('W-SM-PUSH','n_cajones','true','0',10,'Sin gavetas.'),
  ('W-SM-PUSH','n_patas','true','0',10,'Mueble superior.'),
  ('W-SM-PUSH','gola','true','0',10,'SM es gola de madera; no activa la variante de herrajes.')
) as r(pref,variable,condicion,valor,prioridad,notas) on r.pref=t.pref;

delete from public.cot_herrajes_plantilla
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('BFD-SM','OW-MO','W-SM','W-SM-PUSH'));

-- Conservan exactamente los herrajes de su familia base.
insert into public.cot_herrajes_plantilla (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,'Heredado de ' || origen.pref
from public.cot_tipos_mueble destino
join public.cot_tipos_mueble origen on (destino.pref='BFD-SM' and origen.pref='BFD') or (destino.pref in ('W-SM','W-SM-PUSH') and origen.pref='W')
join public.cot_herrajes_plantilla h on h.tipo_mueble_id=origen.id;

-- Push To Open se agrega exclusivamente a W-SM-PUSH.
insert into public.cot_herrajes_plantilla (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select id,'push','PUSHOPENHBM237','push','n_puertas',90,'Push To Open exclusivo de W-SM-PUSH.'
from public.cot_tipos_mueble where pref='W-SM-PUSH';
