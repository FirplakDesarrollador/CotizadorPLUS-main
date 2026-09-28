-- Familia DB-SM-FE: cajoneras con Gola de madera y cajas de gaveta de madera
-- para riel Full Extension de 500 mm. Fuente primaria: hoja de ruta
-- DB12-2S-SM-FE (12 x 30 x 24 in). La familia del selector no es un tipo de
-- base de datos: solo existen las tres variantes calculables de este archivo.

insert into public.cot_tipos_mueble
  (pref,nombre_es,nombre_en,categoria,margen_key,descripcion_es,notas,activo,
   etiquetas_und,usa_carton,permite_agrupacion,pref_imperial,pref_metrico,familia_code)
values
  ('DB-2S-SM-FE','Cajonera 2S con Gola y Full Extension','Drawer base 2S wood gola full extension',
   'inferior','muebles','DBXX-2S-SM-FE: dos gavetas pequenas y una grande.',
   'Sin manijas ni barras. Tres cajas de madera y tres rieles RIELFE500.',true,4,true,false,'DB-2S-SM-FE','DB-2S-SM-FE','COC01'),
  ('DB-2-SM-FE','Cajonera 2 gavetas con Gola y Full Extension','Two-drawer base wood gola full extension',
   'inferior','muebles','DBXX-2-SM-FE: dos gavetas grandes iguales.',
   'Sin manijas ni barras. Dos cajas de madera y dos rieles RIELFE500.',true,4,true,false,'DB-2-SM-FE','DB-2-SM-FE','COC01'),
  ('DB-3-SM-FE','Cajonera 3 gavetas con Gola y Full Extension','Three-drawer base wood gola full extension',
   'inferior','muebles','DBXX-3-SM-FE: tres gavetas grandes iguales.',
   'Sin manijas ni barras. Tres cajas de madera y tres rieles RIELFE500.',true,4,true,false,'DB-3-SM-FE','DB-3-SM-FE','COC01')
on conflict (pref) do update set
  nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,categoria=excluded.categoria,
  margen_key=excluded.margen_key,descripcion_es=excluded.descripcion_es,notas=excluded.notas,
  activo=true,etiquetas_und=excluded.etiquetas_und,usa_carton=excluded.usa_carton,
  permite_agrupacion=false,pref_imperial=excluded.pref_imperial,pref_metrico=excluded.pref_metrico,
  familia_code=excluded.familia_code,updated_at=now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE'));
delete from public.cot_reglas_config
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE'));
delete from public.cot_herrajes_plantilla
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE'));

-- Carcasa comun. Para DB12 reproduce: base/refuerzos/Golas 274,8 mm,
-- laterales 762 x 609,6 mm y fondo 760 x 288,8 mm.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,v.nombre,v.rol,v.cant,v.largo,v.ancho,v.cantos::jsonb,v.tarugos,v.soportes,
  'local',v.orden,v.notas,v.visualizacion::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('base','caja','1','L-2*TC','P-0.70866-TB','{"largos":2,"anchos":0,"calibre":"19x0,45"}',8,0,10,'BASE B.',null),
  ('lateral','caja','2','A','P','{"largos":2,"anchos":2,"calibre":"19x0,45"}',0,0,20,'SIDE R/L R17L B.',null),
  ('refuerzo_delantero','refuerzo','2','L-2*TC','3.14961','{"largos":2,"anchos":0,"calibre":"19x0,45"}',4,0,30,'Dos rails delanteros B de 80 mm.','{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"y":"20","confirmado":true}'),
  ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"largos":2,"anchos":0,"calibre":"19x0,45"}',4,0,40,'Dos rails traseros B de 80 mm; canto largo blanco.',null),
  ('gola_madera','refuerzo','2','L-2*TC','3.14961','{"largos":2,"anchos":0,"calibre":"19x0,45"}',0,0,50,'Gola superior e inferior B de 80 mm.','{"version":1,"funcion":"gola","plano":"XY","intercambiar":false,"y":"0","confirmado":true}'),
  ('fondo','fondo','1','A-0.07874','L-0.62992','{}',0,0,200,'FONDO MUEBLE F: A-2 mm por L-16 mm, tablero de 6 mm sin canto.','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}')
) as v(nombre,rol,cant,largo,ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
where t.pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE');

-- Gaveta pequena FE: laterales 500 x 100, trasero L-86 x 80,
-- contraparche L-86 x 100. Solo la variante 2S produce estas piezas.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,v.nombre,v.rol,v.cant,v.largo,v.ancho,v.cantos::jsonb,0,0,'local',v.orden,v.notas,v.visualizacion::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('lateral_gaveta_pequena','refuerzo','4','19.68504','3.93701','{"largos":2,"anchos":1,"calibre":"19x0,45"}',60,'Laterales de las dos gavetas pequenas: 500 x 100 mm; canto blanco.','{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":true,"confirmado":true}'),
  ('trasero_gaveta_pequena','refuerzo','2','L-3.38583','3.14961','{"largos":2,"anchos":0,"calibre":"19x0,45"}',70,'Traseros pequenos: L-86 mm x 80 mm; canto blanco.','{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('contraparche_pequeno','refuerzo','2','L-3.38583','3.93701','{"largos":2,"anchos":0,"calibre":"19x0,45"}',80,'Contraplacas pequenas: L-86 mm x 100 mm; canto blanco.','{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}')
) as v(nombre,rol,cant,largo,ancho,cantos,orden,notas,visualizacion)
where t.pref='DB-2S-SM-FE';

-- Gavetas grandes FE. La variante 2S lleva una; DB-2 lleva dos y DB-3 lleva tres.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,v.nombre,v.rol,
  case t.pref when 'DB-2S-SM-FE' then v.c2s when 'DB-2-SM-FE' then v.c2 else v.c3 end,
  v.largo,v.ancho,v.cantos::jsonb,0,0,'local',v.orden,v.notas,v.visualizacion::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('lateral_gaveta_grande','refuerzo','2','4','6','19.68504','7.87402','{"largos":2,"anchos":1,"calibre":"19x0,45"}',90,'Laterales de gaveta grande: 500 x 200 mm; canto blanco.','{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":true,"confirmado":true}'),
  ('trasero_gaveta_grande','refuerzo','1','2','3','L-3.38583','7.08661','{"largos":2,"anchos":0,"calibre":"19x0,45"}',100,'Traseros grandes: L-86 mm x 180 mm; canto blanco.','{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('contraparche_grande','refuerzo','1','2','3','L-3.38583','7.87402','{"largos":2,"anchos":0,"calibre":"19x0,45"}',110,'Contraplacas grandes: L-86 mm x 200 mm; canto blanco.','{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}')
) as v(nombre,rol,c2s,c2,c3,largo,ancho,cantos,orden,notas,visualizacion)
where t.pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE');

-- Todos los fondos de gaveta miden 508 mm x (L-72 mm), en tablero F de 6 mm.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,'base_gaveta','fondo',case when t.pref='DB-2-SM-FE' then '2' else '3' end,
  '19.99999','L-2.83465','{}'::jsonb,0,0,'local',120,
  'Fondos de gaveta FE: 508 mm x (L-72 mm).',
  '{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":true,"confirmado":true}'::jsonb
from public.cot_tipos_mueble t
where t.pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE');

-- Frentes: L-RV de ancho. 2S reproduce 173,9 / 173,9 / 351 mm a A=30;
-- las variantes iguales usan el reparto vertical validado de DB-2-SM/DB-3-SM.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,v.nombre,'frente',v.cant,'L-RV',v.alto,
  '{"largos":2,"anchos":2,"calibre":"22x1"}'::jsonb,0,0,'local',v.orden,v.notas,
  '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('frente_gaveta_pequena','2','alto_frente_pequeno',130,'Dos frentes pequenos de 173,9 mm a A=30.'),
  ('frente_gaveta_grande','1','A-n_cajones*RV-gola*2.11024-2*alto_frente_pequeno',140,'Frente inferior de 351 mm a A=30.')
) as v(nombre,cant,alto,orden,notas)
where t.pref='DB-2S-SM-FE';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,'frente','frente',case when t.pref='DB-2-SM-FE' then '2' else '3' end,
  'L-RV','(A-n_cajones*RV-gola*2.11024)/n_cajones',
  '{"largos":2,"anchos":2,"calibre":"22x1"}'::jsonb,0,0,'local',130,
  'Frentes iguales; reparto vertical DB-SM con 53,6 mm para las dos Golas.',
  '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
from public.cot_tipos_mueble t where t.pref in ('DB-2-SM-FE','DB-3-SM-FE');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id,v.variable,'true',
  case
    when v.variable='n_cajones' then case when t.pref='DB-2-SM-FE' then '2' else '3' end
    when v.variable='n_cajones_pequenos' then case when t.pref='DB-2S-SM-FE' then '2' else '0' end
    else v.valor
  end,5,true,v.notas
from public.cot_tipos_mueble t
cross join (values
  ('n_cajones','3','Cantidad fija de gavetas de la variante.'),
  ('n_cajones_pequenos','0','Cantidad fija de gavetas pequenas.'),
  ('n_cajones_ocultos','0','Sin gavetas ocultas.'),
  ('n_puertas','0','Sin puertas.'),
  ('n_entrepanos','0','Sin entrepanos.'),
  ('n_patas','4','Mueble inferior: cuatro patas.'),
  ('n_barras','0','Las cajas FE usan contraplaca de madera; no llevan barras.'),
  ('gola','1','Dos Golas de madera integradas.')
) as v(variable,valor,notas)
where t.pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id,'alto_frente_pequeno','true','(A-4*RV)/4-(13.4/25.4)',10,true,
  'DB-2S-SM-FE: frente pequeno de 173,9 mm a A=30.'
from public.cot_tipos_mueble t where t.pref='DB-2S-SM-FE';

-- Herrajes confirmados: patas, tornillos y un RIELFE500 por gaveta.
insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select t.id,v.rol,v.codigo,v.selector,v.cant,v.orden,v.notas
from public.cot_tipos_mueble t
cross join (values
  ('pata','PATA10AJUST','pata','n_patas',10,'Cuatro patas ajustables.'),
  ('tornillo','TORNILLO858','tornillo','n_patas*4',20,'Cuatro tornillos por pata.'),
  ('riel','RIELFE500','riel_fe','n_cajones',30,'Un par Full Extension de 500 mm por gaveta.')
) as v(rol,codigo,selector,cant,orden,notas)
where t.pref in ('DB-2S-SM-FE','DB-2-SM-FE','DB-3-SM-FE');
