-- El fondo (backing) de `W` con gola quedó con los ejes invertidos.
--
-- `0045_w_sm_hoja_real.sql` copió las medidas del backing tal como las lista la
-- hoja real (`BACKING F | 898.4 | 720.6`) y las puso como largo/ancho:
--
--   formula_largo = 'gola ? A-0.62992 : L-TC'    <- rama gola basada en A
--   formula_ancho = 'gola ? L-0.62992 : A-0.59'  <- rama gola basada en L
--
-- Pero la hoja ordena sus columnas por tamaño (la medida mayor primero), no por
-- eje: `BASE 706.6 x 304.8` es horizontal y `SIDE 914.4 x 304.8` es vertical.
-- El motor, en cambio, usa largo/ancho como ejes geométricos, y el eje lo fija
-- `visualizacion.intercambiar` de la pieza:
--
--   intercambiar=false -> largo es horizontal (base L), ancho es vertical (base A)
--   intercambiar=true  -> largo es vertical  (base A), ancho es horizontal (base L)
--
-- El fondo de `W` tiene `intercambiar=false`, igual que su rama sin gola
-- (`L-TC` / `A-0.59`). La rama con gola quedó con la convención contraria, así
-- que el panel se construía girado 90°: para W2936-SM daba 898.4mm de ancho
-- horizontal en un mueble de 736.6mm — sobresalía 161.8mm por los lados — y solo
-- 720.6mm de alto en una carcasa de 914.4mm.
--
-- Esta migración deja ambas ramas en la misma convención que `intercambiar=false`.
-- Es el mismo panel físico: 720.6 x 898.4 = 898.4 x 720.6, misma área y mismo
-- costo. Solo cambia qué medida es el largo y cuál el ancho.
--
-- La hoja real se sigue reproduciendo; el orden de columnas del HDR es una
-- convención de presentación y vive en `HdrTabla.tsx`, no en las fórmulas.
update public.cot_piezas_plantilla p
set formula_largo = 'gola ? L-0.62992 : L-TC',
    formula_ancho = 'gola ? A-0.62992 : A-0.59',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0047: corrige ejes del backing con gola (0045 los habia invertido)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'fondo'
  and p.formula_largo = 'gola ? A-0.62992 : L-TC'
  and p.formula_ancho = 'gola ? L-0.62992 : A-0.59';
