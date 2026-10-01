-- BACKING (pieza `fondo`) de la tipología DB: la fórmula actual (largo=A, ancho=L-TC)
-- no coincidía con la hoja de ruta real de DB18-1S (762x442.2mm calculado vs 760x441.2mm
-- real -- 2mm y 1mm de diferencia, fuera del margen de redondeo que sí cumplen las otras
-- 17 piezas de esa misma hoja).
--
-- La hoja real da: largo(eje A)=760mm=A-2mm, ancho(eje L)=441.2mm=L-16mm.
-- Confirmado independiente: UDB/USVFD/UVFD (tipologías generadas por
-- scripts/generar_tipologias.py directamente desde hojas de ruta reales de familias de
-- cajones emparentadas) ya usan exactamente 'A-0.07874' (A-2mm) / 'L-0.62992' (L-16mm)
-- para su pieza `fondo` -- DB nunca se re-apuntó a ese patrón cuando se generaron esas
-- tipologías. Ver WikiLLM/wiki/validacion_hojas_de_ruta.md.
update cot_piezas_plantilla p
set formula_largo = 'A-0.07874',
    formula_ancho = 'L-0.62992'
from cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'DB'
  and p.nombre = 'fondo';
