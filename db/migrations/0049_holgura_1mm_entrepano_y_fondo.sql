-- Holgura de 1mm en entrepaños y en el fondo de los superiores de pared.
--
-- Reportado desde el despiece de un `W` con manija: el entrepaño salía 706.6mm y
-- el fondo 721.6 x 899.4mm, cuando deben ser 705.6 y 720.6 x 898.4 — 1mm menos en
-- cada medida que toca la estructura.
--
-- El análisis del catálogo confirma que el 1mm no es un caso aislado de `W`, sino
-- un patrón que ya estaba en los tipos validados más recientemente:
--
--   entrepaño  `B-FE`, `UB-FE`, `V-FE`  ->  L-2*TC-0.03937  (1mm, incondicional)
--   fondo      `S`, `SA`, `SBAS`, `SLOC`, `SMO`  ->  A-0.62992 / L-0.62992  (16mm)
--
-- `W` tenía el 1mm del entrepaño condicionado a `gola` (lo introdujo 0045 desde la
-- hoja de W2936-SM) y un fondo de 15mm. Queda alineado con esos tipos.
--
-- 0.03937" = 1mm. `TC` = 15mm, así que `L-TC` = L-15mm y `L-0.62992` = L-16mm:
-- la diferencia entre ambos es exactamente el 1mm que faltaba.

-- 1. Entrepaño: el 1mm pasa a ser incondicional en todos los tipos que no lo tenían.
--    Alcance confirmado con el usuario: todos los que usan `L-2*TC`.
update public.cot_piezas_plantilla
set formula_largo = 'L-2*TC-0.03937',
    notas = concat_ws(' | ', nullif(notas, ''), '0049: holgura de 1mm en el entrepano')
where nombre = 'entrepano'
  and formula_largo = 'L-2*TC';

-- `W` lo tenía condicionado a gola desde 0045; con gola el valor no cambia.
update public.cot_piezas_plantilla p
set formula_largo = 'L-2*TC-0.03937',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0049: el 1mm del entrepano deja de depender de gola')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'entrepano'
  and p.formula_largo = 'L-2*TC-gola*0.03937';

-- 2. Fondo de los superiores de pared: de 15mm a 16mm de holgura.
--    Alcance confirmado: `W`, `TW`, `UW`, `WBL`, los cuatro que comparten `L-TC`/`A-0.59`.
--    Quedan igual que `S`/`SA`/`SBAS`/`SLOC`/`SMO`.
update public.cot_piezas_plantilla p
set formula_largo = 'L-0.62992',
    formula_ancho = 'A-0.62992',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0049: fondo con holgura de 16mm, como el resto de superiores')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('TW', 'UW', 'WBL')
  and p.nombre = 'fondo'
  and p.formula_largo = 'L-TC'
  and p.formula_ancho = 'A-0.59';

-- `W` lleva rama de gola en el ancho (0048: el fondo sigue al lateral, que con SM
-- se corta 1" más corto). Solo se corrige la rama con manija. El largo queda sin
-- condición porque ambas ramas coinciden en `L-0.62992`.
--
-- El eje se conserva: `largo` es el horizontal (base L) y `ancho` el vertical
-- (base A), que es lo que exige `intercambiar=false`. Ver 0047.
update public.cot_piezas_plantilla p
set formula_largo = 'L-0.62992',
    formula_ancho = 'gola ? A-1.62992 : A-0.62992',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0049: fondo con holgura de 16mm tambien en la rama con manija')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'fondo'
  and p.formula_largo = 'gola ? L-0.62992 : L-TC'
  and p.formula_ancho = 'gola ? A-1.62992 : A-0.59';
