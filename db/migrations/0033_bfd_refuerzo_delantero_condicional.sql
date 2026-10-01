-- ============================================================================
-- Cotizador PLUS — BFD.refuerzo_delantero se escapó de la corrección 0032
--
-- 0032 corrigió el ancho de riel/refuerzo (3.25 in = 82,55mm -> 3.14961 in =
-- 80mm) buscando coincidencia EXACTA con '3.25'. BFD.refuerzo_delantero tiene
-- una fórmula condicional ('L<12 ? 5 : 3.25': módulos angostos <12" usan un
-- refuerzo de 5 in, el resto 3.25 in) que no matcheaba por ser una expresión,
-- no el valor puro. El usuario confirmó que los refuerzos traseros y
-- delanteros de B y BFD son todos de 80mm — B ya estaba correcto (ambos
-- refuerzos en 3.14961); solo faltaba esta fila condicional de BFD. La rama
-- "L<12 ? 5" no se toca: es un valor distinto, sin relación con el defecto
-- de 82,55mm que se viene corrigiendo.
-- ============================================================================
update public.cot_piezas_plantilla
   set formula_ancho = 'L<12 ? 5 : 3.14961'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'BFD')
   and nombre = 'refuerzo_delantero'
   and formula_ancho = 'L<12 ? 5 : 3.25';
