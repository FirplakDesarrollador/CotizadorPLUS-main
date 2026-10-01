-- W-SM: mueble superior de pared con sistema de frente SM (gola/sin manijas).
-- Fuente primaria: hoja real adjunta por el usuario "W2936-SM MBLE SUP COC
-- 2 PUERTAS 2 ENTREPANOS" (L=29", A=36", P=12").
--
-- SM sigue siendo una variante transversal (`overrides.gola=1`), no un tipo
-- duplicado `W-SM`. Esta migracion solo agrega las ramas condicionales que la
-- hoja real confirma para el tipo W cuando gola=1. Con gola=0, W conserva su
-- comportamiento previo.

-- Orden de HDR igual a la hoja: BASE, TAPA, SIDE, RAIL, SHELF, DOOR, BACKING.
update public.cot_piezas_plantilla p
set orden = case p.nombre
  when 'base_tapa' then 10
  when 'lateral' then 20
  when 'refuerzo_trasero' then 30
  when 'entrepano' then 40
  when 'frente' then 50
  when 'fondo' then 60
  else p.orden
end
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre in ('base_tapa','lateral','refuerzo_trasero','entrepano','frente','fondo');

-- En W2936-SM, los entrepanos miden 705.6mm de largo: L - 30mm - 1mm.
-- La resta de 1mm solo aplica a la variante SM para no cambiar W con manija
-- sin una hoja real equivalente.
update public.cot_piezas_plantilla p
set formula_largo = 'L-2*TC-gola*0.03937',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0045: W-SM resta 1mm al largo del entrepano segun hoja W2936-SM')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'entrepano'
  and p.formula_largo <> 'L-2*TC-gola*0.03937';

-- Puertas W2936-SM: 930.25 x 365.1mm. El ancho horizontal ya lo daba
-- `(L-n_puertas*RV)/n_puertas`; lo nuevo es el alto de puerta en SM:
-- A + 15.85mm = A + 0.62402in. W con manija queda en A-RV.
update public.cot_piezas_plantilla p
set formula_ancho = 'gola ? A+0.62402 : A-RV',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0045: W-SM alto puerta A+15.85mm segun hoja W2936-SM')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'frente'
  and p.formula_ancho <> 'gola ? A+0.62402 : A-RV';

-- BACKING W2936-SM: 898.4 x 720.6mm = (A-16mm) x (L-16mm).
-- Se deja condicional porque esta sesion solo aporto evidencia de W-SM.
update public.cot_piezas_plantilla p
set formula_largo = 'gola ? A-0.62992 : L-TC',
    formula_ancho = 'gola ? L-0.62992 : A-0.59',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0045: W-SM backing A-16mm x L-16mm segun hoja W2936-SM')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'W'
  and p.nombre = 'fondo'
  and (p.formula_largo <> 'gola ? A-0.62992 : L-TC'
    or p.formula_ancho <> 'gola ? L-0.62992 : A-0.59');
