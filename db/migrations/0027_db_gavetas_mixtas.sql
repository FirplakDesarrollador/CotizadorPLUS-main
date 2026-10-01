-- ============================================================================
-- Cotizador PLUS — piezas diferenciadas por posición para tipologías DB mixtas
-- (DB-1S: 1 cajón pequeño + 2 grandes; DB-2S: 2 pequeños + 1 grande).
-- Hasta ahora el motor trataba todos los cajones como iguales (A/n_cajones),
-- por lo que el despiece no coincidía con la lista de corte real (frentes y
-- traseros de tamaño distinto según el cajón sea pequeño o grande).
-- ============================================================================

-- Variable derivada: nº de cajones "pequeños" de la tipología DB elegida.
-- Default 0 (tipologías parejas); AddLineForm/CotizadorForm la sobreescriben
-- vía overrides cuando se elige una tipología con dbTipo.npeq > 0.
insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad)
select id, 'n_cajones_pequenos', 'true', '0', 5
from public.cot_tipos_mueble where pref = 'DB';

-- "frente" y "trasero_gaveta" originales quedan en 0 piezas cuando la
-- tipología es mixta (n_cajones_pequenos > 0); las nuevas piezas
-- *_pequena/*_grande toman su lugar. Tipologías parejas (npeq=0) no cambian.
update public.cot_piezas_plantilla
set formula_cantidad = 'n_cajones_pequenos>0?0:n_cajones'
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
  and nombre in ('frente', 'trasero_gaveta');

-- base_gaveta (fondo de cada cajón): el largo no restaba el mismo margen que
-- "base" (L-1.18); el faltante se detectó comparando contra una lista de
-- corte real de un DB15-1S. No depende de la tipología (el fondo mide igual
-- en cajones pequeños y grandes).
update public.cot_piezas_plantilla
set formula_largo = 'L-4.13'
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
  and nombre = 'base_gaveta';

-- Frentes por posición. El cajón pequeño mide 6" fijas de alto; los grandes
-- se reparten el resto del Alto en partes iguales, descontando una separación
-- (reveal) de 3.2mm por cajón (confirmado contra la lista de corte real).
insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'frente_gaveta_pequena', 'frente',
  'n_cajones_pequenos',
  'L',
  '6',
  '{"anchos":2,"largos":2,"calibre":"22x1"}'::jsonb,
  71, 0, 0
from public.cot_tipos_mueble where pref = 'DB';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'frente_gaveta_grande', 'frente',
  'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0',
  'L',
  '(n_cajones-n_cajones_pequenos)>0?(A-n_cajones*3.2/25.4-6*n_cajones_pequenos)/(n_cajones-n_cajones_pequenos):0',
  '{"anchos":2,"largos":2,"calibre":"22x1"}'::jsonb,
  72, 0, 0
from public.cot_tipos_mueble where pref = 'DB';

-- Traseros de gaveta por posición. El largo corrige el mismo margen faltante
-- que base_gaveta (L-4.607 en vez de L-3.427); el alto es fijo por posición
-- (68mm en cajones pequeños, 183mm en grandes — confirmado por el usuario).
insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'trasero_gaveta_pequena', 'refuerzo',
  'n_cajones_pequenos',
  'L-4.607',
  '68/25.4',
  '{"anchos":0,"largos":2,"calibre":"19x0,45","despEdges":0}'::jsonb,
  61, 0, 0
from public.cot_tipos_mueble where pref = 'DB';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'trasero_gaveta_grande', 'refuerzo',
  'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0',
  'L-4.607',
  '183/25.4',
  '{"anchos":0,"largos":2,"calibre":"19x0,45","despEdges":0}'::jsonb,
  62, 0, 0
from public.cot_tipos_mueble where pref = 'DB';
