-- Tipo B-FE: mueble inferior de 1 cajon + 1 puerta con riel FULL EXTENSION.
-- Estructura copiada de la hoja de ruta real "B12-FE MBLE INF COC 1 GAVETA 1 PUERTA
-- 1/2 ENTREPANO" (L=12", A=30", P=24"). Las 15 medidas de esa hoja se reproducen con
-- 0.00mm de diferencia; ver WikiLLM/wiki/validacion_hojas_de_ruta.md.
--
-- Diferencia clave contra el tipo `B` (riel Tandem, caja de gaveta metalica): aqui la
-- gaveta es una caja de MADERA armada con piezas propias (laterales der/izq de 100x500,
-- contraparche, fondo de gaveta) dimensionadas al riel de 500mm -- por eso el largo de
-- los laterales de gaveta es exactamente 500mm, igual que el RIELFE500 del catalogo.
--
-- Cierre vertical del frente (lo que confirma el alto de la puerta):
--   603.2 (puerta) + 3.2 (reveal) + 152.4 (frente gaveta) + 3.2 (reveal) = 762 = A
insert into cot_tipos_mueble
  (pref, nombre_es, categoria, margen_key, etiquetas_und, usa_carton, permite_agrupacion,
   pref_imperial, pref_metrico, familia_code, activo)
values
  ('B-FE', 'Mueble inferior 1 cajon 1 puerta (Base)', 'inferior', 'muebles', 4, true, false,
   'B-FE', 'B-FE', 'COC01', true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  categoria = excluded.categoria,
  activo = true;

-- Re-ejecutable: limpia plantillas previas de B-FE antes de insertarlas.
delete from cot_piezas_plantilla p using cot_tipos_mueble t
  where p.tipo_mueble_id = t.id and t.pref = 'B-FE';
delete from cot_reglas_config r using cot_tipos_mueble t
  where r.tipo_mueble_id = t.id and t.pref = 'B-FE';
delete from cot_herrajes_plantilla h using cot_tipos_mueble t
  where h.tipo_mueble_id = t.id and t.pref = 'B-FE';

-- ---------------------------------------------------------------------------
-- Reglas. n_puertas se deja a la regla global (1 si L<=21", 2 si L>=24"), que
-- reproduce la hoja (L=12" -> 1 puerta). n_entrepanos se fija en 1: la regla global
-- daria 2 para A=30", pero la hoja trae un solo entrepano (el "1/2" del titulo es
-- media profundidad, 300mm, no media cantidad).
-- ---------------------------------------------------------------------------
insert into cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, activo)
select t.id, v.variable, v.condicion, v.valor, v.prioridad, true
from cot_tipos_mueble t, (values
  ('n_cajones',          'true', '1', 5),
  ('n_entrepanos',       'true', '1', 5),
  -- Alto del frente de gaveta: 6" fijos (152.4mm en la hoja).
  ('alto_frente_gaveta', 'true', '6', 5)
) as v(variable, condicion, valor, prioridad)
where t.pref = 'B-FE';

-- ---------------------------------------------------------------------------
-- Piezas. Constantes en pulgadas (el motor trabaja en pulgadas):
--   3.14961 = 80mm   3.93701 = 100mm   11.81102 = 300mm
--   19.37008 = 492mm 19.68504 = 500mm  0.03937 = 1mm
--   L-3.38583 = L-86mm   L-4.38583 = L-111.4mm   L-2.83465 = L-72mm
--   A-0.07874 = A-2mm    L-0.62992 = L-16mm
-- ---------------------------------------------------------------------------
insert into cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho,
   cantos, tarugos, soportes, modo_agrupacion, orden)
select t.id, v.nombre, v.rol, v.cant, v.largo, v.ancho, v.cantos::jsonb, v.tarugos, v.soportes, 'local', v.orden
from cot_tipos_mueble t, (values
  -- Caja. El `orden` sigue el mismo orden de filas de la hoja (BASE, SIDE, RAIL DEL,
  -- RAIL TRAS, SHELF, gaveta, frentes, fondos) para que el HDR salga letrado igual.
  ('base',               'caja',     '1',            'L-2*TC',             'P-0.70866-TB',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 8, 0,  10),
  ('lateral',            'caja',     '2',            'A',                  'P',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 0,  20),
  ('refuerzo_delantero', 'refuerzo', '2',            'L-2*TC',             '3.14961',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 4, 0,  30),
  ('refuerzo_trasero',   'refuerzo', '2',            'L-2*TC',             '3.14961',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 4, 0,  40),
  -- Entrepano de media profundidad (300mm), 1mm mas angosto que los rieles para poder entrar.
  ('entrepano',          'refuerzo', 'n_entrepanos', 'L-2*TC-0.03937',     '11.81102',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 4,  50),
  -- Caja de gaveta en madera (riel full extension de 500mm)
  ('trasero_gaveta',     'refuerzo', 'n_cajones',    'L-3.38583',          '3.14961',
     '{"largos":2,"anchos":0,"calibre":"19x0,45","despEdges":0}', 0, 0,  60),
  ('lateral_gaveta_der', 'refuerzo', 'n_cajones',    '3.93701',            '19.68504',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 0,  70),
  ('lateral_gaveta_izq', 'refuerzo', 'n_cajones',    '3.93701',            '19.68504',
     '{"largos":2,"anchos":2,"calibre":"19x0,45"}', 0, 0,  80),
  ('contraparche',       'refuerzo', 'n_cajones',    'L-4.38583',          '3.93701',
     '{"largos":2,"anchos":0,"calibre":"19x0,45"}', 0, 0,  90),
  -- Frentes. El alto de la puerta es lo que queda del alto del mueble despues de
  -- descontar el/los frentes de gaveta y un reveal por cada junta.
  ('frente',             'frente',   'n_puertas',    '(L-n_puertas*RV)/n_puertas',
     'A-n_cajones*alto_frente_gaveta-(n_cajones+1)*RV',
     '{"largos":2,"anchos":2,"calibre":"22x1"}', 0, 0, 100),
  ('frente_cajon',       'frente',   'n_cajones',    'L-RV',               'alto_frente_gaveta',
     '{"largos":2,"anchos":2,"calibre":"22x1"}', 0, 0, 110),
  -- Fondos de 6mm (sin canto)
  ('fondo_gaveta',       'fondo',    'n_cajones',    'L-2.83465',          '19.37008',
     '{}', 0, 0, 120),
  ('fondo',              'fondo',    '1',            'A-0.07874',          'L-0.62992',
     '{}', 0, 0, 130)
) as v(nombre, rol, cant, largo, ancho, cantos, tarugos, soportes, orden)
where t.pref = 'B-FE';

-- ---------------------------------------------------------------------------
-- Herrajes. Igual que `B` salvo el riel: aqui es RIELFE500 (full extension 500mm),
-- que es justo el largo de los laterales de gaveta de la hoja.
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
where t.pref = 'B-FE';
