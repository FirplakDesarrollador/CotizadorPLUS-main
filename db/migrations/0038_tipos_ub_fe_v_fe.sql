-- Tipos UB-FE y V-FE: variantes full extension de `UB` y `V`, hermanas de `B-FE` (0037).
-- Son tipologias NUEVAS: `B`, `UB` y `V` no se tocan.
--
-- Misma estructura que B-FE (caja de gaveta en MADERA dimensionada al RIELFE500 de
-- 500mm, tomada de la hoja real B12-FE), con lo propio de cada familia:
--   UB-FE: hereda de `UB` la variante `removible` (base mas profunda + 2 refuerzos).
--   V-FE : hereda de `V` la categoria 'vanity'.
-- Ninguna hereda la agrupacion: igual que B-FE quedan en permite_agrupacion=false
-- hasta tener una hoja de ruta de un modulo agrupado que valide la geometria.
insert into cot_tipos_mueble
  (pref, nombre_es, categoria, margen_key, etiquetas_und, usa_carton, permite_agrupacion,
   pref_imperial, pref_metrico, familia_code, activo)
values
  ('UB-FE', 'Mueble inferior 1 cajon 1 puerta (linea U)', 'inferior', 'muebles', 4, true, false,
   'UB-FE', 'UB-FE', null, true),
  ('V-FE',  'Mueble inferior bano 1 cajon 1 puerta (Vanity)', 'vanity', 'muebles', 4, true, false,
   'V-FE', 'V-FE', null, true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  categoria = excluded.categoria,
  activo = true;

-- Re-ejecutable.
delete from cot_piezas_plantilla p using cot_tipos_mueble t
  where p.tipo_mueble_id = t.id and t.pref in ('UB-FE', 'V-FE');
delete from cot_reglas_config r using cot_tipos_mueble t
  where r.tipo_mueble_id = t.id and t.pref in ('UB-FE', 'V-FE');
delete from cot_herrajes_plantilla h using cot_tipos_mueble t
  where h.tipo_mueble_id = t.id and t.pref in ('UB-FE', 'V-FE');

-- ---------------------------------------------------------------------------
-- Reglas. n_puertas se deja a la regla global (1 si L<=21", 2 si L>=24"), que es
-- como ya funcionan `UB` y `V`.
-- ---------------------------------------------------------------------------
insert into cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, activo)
select t.id, v.variable, v.condicion, v.valor, v.prioridad, true
from cot_tipos_mueble t, (values
  ('n_cajones',    'true', '1', 5),
  ('n_entrepanos', 'true', '1', 5)
) as v(variable, condicion, valor, prioridad)
where t.pref in ('UB-FE', 'V-FE');

-- Alto del frente de gaveta: 6" (152.4mm) en V-FE, igual que B-FE; pero 5.5" (139.7mm)
-- en UB-FE. La linea U trabaja con un alto de mueble de 28 3/4" (730.25mm) en vez de
-- 30", y con ese alto la pila cierra exacta:
--   584.15 (puerta) + 3.2 + 139.7 (frente gaveta) + 3.2 = 730.25 = A
insert into cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, activo)
select t.id, 'alto_frente_gaveta', 'true', v.valor, 5, true
from cot_tipos_mueble t, (values
  ('UB-FE', '5.5'),
  ('V-FE',  '6')
) as v(pref, valor)
where t.pref = v.pref;

-- ---------------------------------------------------------------------------
-- Piezas comunes (identicas a B-FE, en el mismo orden de la hoja B12-FE).
-- ---------------------------------------------------------------------------
insert into cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho,
   cantos, tarugos, soportes, modo_agrupacion, orden)
select t.id, v.nombre, v.rol, v.cant, v.largo, v.ancho, v.cantos::jsonb, v.tarugos, v.soportes, 'local', v.orden
from cot_tipos_mueble t, (values
  ('base',               'caja',     '1',            'L-2*TC',             'P-0.70866-TB',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 8, 0,  10),
  ('lateral',            'caja',     '2',            'A',                  'P',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 0,  20),
  ('refuerzo_delantero', 'refuerzo', '2',            'L-2*TC',             '3.14961',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 4, 0,  30),
  ('refuerzo_trasero',   'refuerzo', '2',            'L-2*TC',             '3.14961',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 4, 0,  40),
  ('entrepano',          'refuerzo', 'n_entrepanos', 'L-2*TC-0.03937',     '11.81102',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 4,  50),
  ('trasero_gaveta',     'refuerzo', 'n_cajones',    'L-3.38583',          '3.14961',
     '{"largos":2,"anchos":0,"calibre":"19x0,45","despEdges":0}', 0, 0,  60),
  ('lateral_gaveta_der', 'refuerzo', 'n_cajones',    '3.93701',            '19.68504',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 0,  70),
  ('lateral_gaveta_izq', 'refuerzo', 'n_cajones',    '3.93701',            '19.68504',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 0,  80),
  ('contraparche',       'refuerzo', 'n_cajones',    'L-4.38583',          '3.93701',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 0, 0,  90),
  ('frente',             'frente',   'n_puertas',    '(L-n_puertas*RV)/n_puertas',
     'A-n_cajones*alto_frente_gaveta-(n_cajones+1)*RV',
     '{"largos":2,"anchos":2,"calibre":"22x1"}', 0, 0, 100),
  ('frente_cajon',       'frente',   'n_cajones',    'L-RV',               'alto_frente_gaveta',
     '{"largos":2,"anchos":2,"calibre":"22x1"}', 0, 0, 110),
  ('fondo_gaveta',       'fondo',    'n_cajones',    'L-2.83465',          '19.37008',
     '{}', 0, 0, 120),
  ('fondo',              'fondo',    '1',            'A-0.07874',          'L-0.62992',
     '{}', 0, 0, 130)
) as v(nombre, rol, cant, largo, ancho, cantos, tarugos, soportes, orden)
where t.pref in ('UB-FE', 'V-FE');

-- ---------------------------------------------------------------------------
-- Solo UB-FE: variante `removible` heredada de `UB`. La base se ahonda a P-TC y
-- aparecen dos refuerzos extra (140mm y 120.75mm). Requiere ademas agregar 'UB-FE'
-- a PREFS_CON_REMOVIBLE en src/lib/muebles.ts para que la casilla salga en la UI.
-- ---------------------------------------------------------------------------
update cot_piezas_plantilla p
set formula_ancho = 'removible ? P-TC : (P-0.70866-TB)'
from cot_tipos_mueble t
where p.tipo_mueble_id = t.id and t.pref = 'UB-FE' and p.nombre = 'base';

insert into cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho,
   cantos, tarugos, soportes, modo_agrupacion, orden)
select t.id, v.nombre, 'refuerzo', 'removible', 'L-2*TC', v.ancho,
       '{"largos":2,"anchos":0,"calibre":"19x0,45"}'::jsonb, 0, 0, 'local', v.orden
from cot_tipos_mueble t, (values
  ('refuerzo_delantero_removible', '5.51181', 200),
  ('refuerzo_trasero_removible',   '4.75394', 210)
) as v(nombre, ancho, orden)
where t.pref = 'UB-FE';

-- ---------------------------------------------------------------------------
-- Herrajes: iguales a B-FE (riel full extension de 500mm).
-- ---------------------------------------------------------------------------
insert into cot_herrajes_plantilla (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden)
select t.id, v.rol, v.codigo, v.selector, v.cant, v.orden
from cot_tipos_mueble t, (values
  ('pata',    'PATA10AJUST', 'pata',    'n_patas',              10),
  ('tornillo','TORNILLO858', 'tornillo','n_patas*4',            20),
  ('bisagra', 'BISAGRAPAR',  'bisagra', 'n_puertas',            30),
  ('manija',  'MANIJA415',   'manija',  'n_puertas + n_cajones',40),
  ('riel',    'RIELFE500',   'riel_fe', 'n_cajones',            50)
) as v(rol, codigo, selector, cant, orden)
where t.pref in ('UB-FE', 'V-FE');
