-- W con gola (SM): el lateral se corta 1" menos que el alto nominal.
--
-- Corrección de producción sobre `0045_w_sm_hoja_real.sql`. En un `W` con sistema
-- de frente SM la carcasa no mide el alto nominal: el lateral va 1" más corto y
-- esa pulgada la ocupa la gola. Para un `W2936-SM` (A=36") el lateral es 35".
--
-- La hoja transcrita en 0045 registraba `SIDE = 914.4mm` (36"), que es el alto
-- nominal, no el corte real del lateral. Confirmado con el usuario: gobierna 35".
-- La transcripción de esa fila queda corregida en la wiki.
--
-- Solo aplica a la rama con gola. Un `W` con manija conserva `lateral = A`, que no
-- tiene evidencia que lo contradiga.
update public.cot_piezas_plantilla p
set formula_largo = 'gola ? A-1 : A',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0048: W-SM corta el lateral 1" menos que el alto nominal')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'lateral'
  and p.formula_largo = 'A';

-- El backing sigue al lateral, no al alto nominal.
--
-- Con `lateral = A-1`, el backing de `A-0.62992` (898.4mm para A=36") quedaría
-- 9.4mm MÁS ALTO que el lateral de 889mm: imposible de armar. Mantiene su misma
-- holgura de 16mm respecto al lateral nuevo, así que la resta pasa de 0.62992"
-- a 1.62992" -> 873.0mm.
--
-- El eje se conserva: `ancho` es el vertical (base A) porque el fondo de W tiene
-- `intercambiar=false`. Ver 0047 y WikiLLM/wiki/ejes_fondo_backing.md.
update public.cot_piezas_plantilla p
set formula_ancho = 'gola ? A-1.62992 : A-0.59',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0048: backing de W-SM sigue al lateral (A-1), no al alto nominal')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'fondo'
  and p.formula_ancho = 'gola ? A-0.62992 : A-0.59';
