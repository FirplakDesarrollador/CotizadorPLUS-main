-- ============================================================================
-- Cotizador PLUS — remanentes de 0028 en el tipo DB preexistente
--
-- 0028 corrigió la geometría por valor de fórmula (WHERE formula_x = '...'),
-- así que sanó automáticamente casi todas las piezas de DB. Tres quedaron
-- fuera porque su valor viejo no coincidía con ningún patrón de 0028:
--
--   1. refuerzo_trasero/refuerzo_horizontal seguían en 3.25 in (82,55 mm).
--      La hoja de ruta y el propio perfil de gola (0028 §6) usan 80 mm
--      (3.14961 in) para el mismo rol de pieza; 0028 nunca tocó el ancho
--      de los rieles, solo su largo (L-1.18 -> L-2*TC).
--   2. refuerzo_horizontal nunca se renombró a refuerzo_delantero, que es
--      el nombre que 0028 §6 usa para restar 1 refuerzo cuando hay gola
--      (3 -> 2). Sin el rename, esa resta no aplicaba a DB.
--   3. trasero_gaveta (la fila que cubre las tipologías parejas: DB-2/3/4,
--      activas en producción) seguía en L-3.427 / 2.6875 in (68,26 mm).
--      Confirmado con el ejemplo DB24-2 (L=24"): Firplak da 492,6 x 183 mm.
--      L-4.607 = 24-4.607 = 19.393 in = 492,58 mm (match independiente,
--      derivado originalmente de un DB15-1S de ancho distinto). 183 mm ya
--      es el valor usado en trasero_gaveta_grande para tipologías mixtas —
--      es la misma pieza física, solo que antes DB-2/3/4 usaba un valor
--      distinto y sin sustento (68 mm) para la altura del trasero.
-- ============================================================================

update public.cot_piezas_plantilla
   set nombre = 'refuerzo_delantero'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'refuerzo_horizontal';

-- El rename ocurre después de que 0028 §6 ya corrió, así que no heredó el
-- ajuste "3 -> 2 refuerzos delanteros con gola" que esa migración aplicó
-- solo a filas ya llamadas refuerzo_delantero en su momento.
update public.cot_piezas_plantilla
   set formula_cantidad = '(' || formula_cantidad || ')-gola'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'refuerzo_delantero'
   and formula_cantidad not like '%gola%';

update public.cot_piezas_plantilla
   set formula_ancho = '3.14961'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre in ('refuerzo_trasero', 'refuerzo_delantero')
   and formula_ancho = '3.25';

update public.cot_piezas_plantilla
   set formula_largo = 'L-4.607', formula_ancho = '183/25.4'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'trasero_gaveta';
