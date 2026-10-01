-- SB-SM: tipología independiente basada en la hoja SB30-SM
-- "MBLE INF COC 1 FRENTE FALSO 2 PUERTA CARB2".
-- No modifica BFD, SBFD ni las variantes SM existentes.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas, activo)
values
  ('SB-SM', 'Mueble inferior con frente falso, puertas y Gola de madera',
   'Base cabinet false front doors wood gola', 'inferior', 'muebles',
   'Tipología independiente SBXX-SM con frente falso y dos puertas según ancho.',
   'Sin manijas ni entrepaños. Gola de madera; puerta inferior a frente falso.', true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  nombre_en = excluded.nombre_en,
  categoria = excluded.categoria,
  margen_key = excluded.margen_key,
  descripcion_es = excluded.descripcion_es,
  notas = excluded.notas,
  activo = true,
  updated_at = now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SB-SM');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,orden,notas,visualizacion)
select t.id, p.nombre, p.rol_tablero, p.formula_cantidad, p.formula_largo, p.formula_ancho,
  p.cantos::jsonb, p.tarugos, p.soportes, p.orden, p.notas, p.visualizacion::jsonb
from public.cot_tipos_mueble t
join (values
  -- Hoja SB30-SM: BASE 732 x 585.6; SIDE 762 x 609.6.
  ('base','caja','1','L-2*TC','P-0.70866-TB','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,'Base: P menos 18 mm y espesor de fondo.','{"version":1,"funcion":"base","plano":"XY","intercambiar":false}'),
  ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,null,'{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false}'),
  -- RAIL DEL FRENTE C: 732 x 152.4. Se muestra vertical 20 mm tras los frentes.
  ('refuerzo_delantero','caja','1','L-2*TC','6','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,30,'Rail delantero alto de 152,4 mm.','{"version":1,"funcion":"travesano_frontal","plano":"XZ","y":"20","confirmado":true,"nota":"Refuerzo delantero vertical, 20 mm detrás de los frentes."}'),
  -- RAIL DEL C: 732 x 80; queda bajo el rail delantero, detrás de la Gola.
  ('refuerzo_horizontal','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,'Rail delantero de 80 mm.','{"version":1,"funcion":"travesano_frontal","plano":"XY","y":"20","z":"A-6*25.4-H","confirmado":true,"nota":"Rail horizontal bajo el refuerzo delantero."}'),
  -- GOLA C: 732 x 80, horizontal y en contacto con los frentes.
  ('gola_madera','caja','1','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,50,'Gola de madera de 80 mm.','{"version":1,"funcion":"gola","plano":"XY","y":"0","z":"A-6*25.4-H","confirmado":true,"nota":"Gola horizontal en contacto con los frentes y bajo el refuerzo delantero."}'),
  ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,60,null,'{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false}'),
  -- DOOR R/L: 579.6 x 377.8 en SB30-SM. Se intercambian ejes solo para el montaje XZ.
  ('frente','frente','n_puertas','A-7.1811','(L-n_puertas*RV)/n_puertas','{"calibre":"22x1","largos":2,"anchos":2}',0,0,70,'Puerta bajo el frente falso: alto A menos 182,4 mm.','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"confirmado":true,"nota":"Puerta inferior; queda bajo el frente falso y la separación de Gola."}'),
  -- FRENTE LISTON C: 122.4 x 758.8 en SB30-SM, ubicado en la parte superior.
  ('frente_falso','frente','1','4.8189','L-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,80,'Frente falso superior de 122,4 mm.','{"version":1,"funcion":"frente_falso","plano":"XZ","intercambiar":true,"confirmado":true,"nota":"Frente falso superior."}'),
  -- BACKING FS: 760 x 746.
  ('fondo','fondo','1','A-0.07874','L-0.62992','{}',0,0,90,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true,"nota":"Fondo delante de los refuerzos traseros."}')
) as p(nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
  on true
where t.pref = 'SB-SM';

delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SB-SM');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id, r.variable, r.condicion, r.valor, r.prioridad, true, r.notas
from public.cot_tipos_mueble t
join (values
  ('n_puertas','L <= 21','1',10,'Regla SB-SM: puerta única en anchos hasta 21 pulgadas.'),
  ('n_puertas','L >= 24','2',20,'Regla SB-SM: dos puertas desde 24 pulgadas.'),
  ('n_puertas','true','1',99,'Regla SB-SM por defecto.'),
  ('n_entrepanos','true','0',10,'SB-SM no lleva entrepaños.'),
  ('n_cajones','true','0',10,'SB-SM no lleva gavetas.'),
  ('n_patas','true','4',10,'Mueble inferior.'),
  ('gola','true','0',10,'SM es Gola de madera explícita; no activa variante transversal.')
) as r(variable,condicion,valor,prioridad,notas) on true
where t.pref = 'SB-SM';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SB-SM');

-- Herrajes funcionales de inferior SM: patas, tornillos y bisagras, sin manijas.
insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select t.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
  'Heredado de BFD-SM; SB-SM no usa manijas.'
from public.cot_tipos_mueble t
join public.cot_tipos_mueble origen on origen.pref = 'BFD-SM'
join public.cot_herrajes_plantilla h on h.tipo_mueble_id = origen.id
where t.pref = 'SB-SM';
