-- SBFD: el refuerzo delantero mide 128 mm de ancho, no 127.
--
-- La plantilla lo tenía en `5` pulgadas exactas = 127.0 mm. Producción lo corta a
-- 128 mm. `5.03937` in = 128.0000 mm, con la misma convención de cinco decimales
-- que ya usan otras piezas del catálogo (`3.14961` = 80 mm, `11.81102` = 300 mm).
--
-- Solo cambia el ancho. El rol de tablero sigue siendo `caja`: el espesor de la
-- pieza no entra en esta corrección.
--
-- Alcance confirmado con el usuario: solo `SBFD`. Los otros siete tipos cuyo
-- refuerzo delantero también cuelga del rol `caja` (BBLFD, BFD, BOMH, SV, SVFD,
-- UBFD, VFD) quedan como están, sin evidencia que los respalde.
update public.cot_piezas_plantilla p
set formula_ancho = '5.03937',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0051: refuerzo delantero de SBFD a 128mm (antes 5in = 127mm)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'SBFD'
  and p.nombre = 'refuerzo_delantero'
  and p.formula_ancho = '5';
