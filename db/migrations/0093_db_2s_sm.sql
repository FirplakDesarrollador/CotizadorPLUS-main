-- DB-2S-SM: cajonera independiente basada en la hoja DB26-2S SM.
-- Conserva la geometría DB de 2 cajones pequeños + 1 grande y añade la
-- configuración SM (dos perfiles de Gola y sin manijas). No modifica DB.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas, activo)
values
  ('DB-2S-SM', 'Mueble inferior cajonera 2S con Gola',
   'Drawer base 2S wood gola', 'inferior', 'muebles',
   'Tipología independiente DBXX-2S-SM: 2 gavetas pequeñas y 1 grande.',
   'Sin manijas. Gola superior e inferior; un par de barras para la gaveta grande.', true)
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
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB-2S-SM');

-- Copia la construcción DB vigente: laterales, base, rails, gavetas y fondo.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
select destino.id, p.nombre, p.rol_tablero, p.formula_cantidad, p.formula_largo, p.formula_ancho,
  p.resta_largo, p.resta_ancho, p.cantos, p.tarugos, p.soportes, p.orden,
  p.notas, p.visualizacion
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id = p.tipo_mueble_id and origen.pref = 'DB'
join public.cot_tipos_mueble destino on destino.pref = 'DB-2S-SM';

-- La hoja expresa los frentes como alto × ancho. Se intercambian los ejes solo
-- para que el montaje XZ conserve ancho horizontal y alto vertical.
update public.cot_piezas_plantilla p
set formula_largo = 'alto_frente_pequeno',
    formula_ancho = 'L-RV',
    visualizacion = '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":true,"confirmado":true,"nota":"Frente pequeño DB-2S-SM: alto × ancho según hoja."}'::jsonb,
    notas = 'Frente de gaveta pequeña: alto × ancho según DB26-2S SM.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'frente_gaveta_pequena';

update public.cot_piezas_plantilla p
set formula_largo = '(n_cajones-n_cajones_pequenos)>0 ? (A-n_cajones*RV-gola*2.11024-n_cajones_pequenos*alto_frente_pequeno)/(n_cajones-n_cajones_pequenos) : 0',
    formula_ancho = 'L-RV',
    visualizacion = '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":true,"confirmado":true,"nota":"Frente de gaveta grande: alto × ancho según hoja."}'::jsonb,
    notas = 'Frente de gaveta grande: alto × ancho según DB26-2S SM.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'frente_gaveta_grande';

-- El fondo queda delante de los refuerzos traseros para el montaje visual.
update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true,"nota":"Fondo DB-2S-SM delante de los refuerzos traseros."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'fondo';

delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB-2S-SM');

-- Reutiliza la regla DB que distribuye los frentes pequeños con Gola.
insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id, r.variable, r.condicion, r.valor, r.prioridad, true, r.notas
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id = r.tipo_mueble_id and origen.pref = 'DB'
join public.cot_tipos_mueble destino on destino.pref = 'DB-2S-SM'
where r.variable in ('alto_frente_pequeno_base','alto_frente_pequeno');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id, r.variable, r.condicion, r.valor, r.prioridad, true, r.notas
from public.cot_tipos_mueble t
join (values
  ('n_cajones','true','3',5,'DB-2S-SM: tres gavetas.'),
  ('n_cajones_pequenos','true','2',5,'DB-2S-SM: dos gavetas pequeñas superiores.'),
  ('n_cajones_ocultos','true','0',5,'Sin gavetas ocultas.'),
  ('n_puertas','true','0',5,'Sin puertas.'),
  ('n_entrepanos','true','0',5,'Sin entrepaños.'),
  ('n_patas','true','4',5,'Mueble inferior.'),
  ('n_barras','true','1',5,'Un par de barras para el trasero de 183 mm.'),
  ('gola','true','1',5,'DB-SM usa Gola superior e inferior.')
) as r(variable,condicion,valor,prioridad,notas) on true
where t.pref = 'DB-2S-SM';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB-2S-SM');

-- Herrajes DB funcionales sin manijas: patas, tornillos, rieles y barras.
insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
  'Heredado de DB; DB-2S-SM elimina manijas.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id = h.tipo_mueble_id and origen.pref = 'DB'
join public.cot_tipos_mueble destino on destino.pref = 'DB-2S-SM'
where lower(h.rol) <> 'manija';
