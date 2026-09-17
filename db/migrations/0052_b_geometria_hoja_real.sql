-- `B`: tres medidas corregidas contra la hoja real de `B12`.
--
-- Fuente: hoja "B12 · MUEBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO CARB2"
-- (L=12", A=30", P=24" -> 304.8 x 762 x 609.6 mm).
--
-- De las 10 piezas, 7 ya coincidían al milímetro. Las otras tres conservaban
-- aproximaciones antiguas, y en los tres casos **el valor correcto ya existía en
-- otros tipos del catálogo** —las variantes FE y las cajoneras, creadas más tarde
-- desde hojas reales—, así que esto alinea `B` con ellas:
--
--   entrepaño ancho   P*0.5 = 304.8      ->  300.0   (como B-FE, UB-FE, V-FE)
--   base_gaveta largo L-2.95 = 229.9     ->  199.8   (como UDB)
--   fondo             L-TC/A = 289.8x762 ->  760 x 288.8  (como B-FE, DB, UDB)
--
-- Alcance confirmado con el usuario: solo `B`. `UB` y `V` arrastran exactamente las
-- mismas fórmulas, y `DV` la del cajón, pero se dejan hasta tener una hoja suya.

-- 1. Entrepaño: 300 mm constantes, no media profundidad.
--    La hoja lo titula "1/2 ENTREPAÑO" y la fórmula lo aproximaba como `P*0.5`,
--    que da 304.8 en P=24". Decidido constante, igual que las variantes FE.
update public.cot_piezas_plantilla p
set formula_ancho = '11.81102',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0052: entrepano de 300mm segun hoja B12 (antes P*0.5 = 304.8)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'B'
  and p.nombre = 'entrepano'
  and p.formula_ancho = 'P*0.5';

-- 2. Base de gaveta: 105 mm menos que el largo, no 75.
--    `L-4.13386` = L - 105 mm -> 199.8 mm en L=12", exactamente la hoja. `UDB` ya
--    usa esta misma fórmula; `DB` usa `L-4.13`, que queda 0.1 mm largo.
update public.cot_piezas_plantilla p
set formula_largo = 'L-4.13386',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0052: base de gaveta a L-105mm segun hoja B12 (antes L-2.95 = 229.9)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'B'
  and p.nombre = 'base_gaveta'
  and p.formula_largo = 'L-2.95';

-- 3. Fondo: 760 x 288.8, con los ejes del grupo al que ahora pertenece.
--    `A-0.07874` = A-2 mm y `L-0.62992` = L-16 mm. Al pasar el largo a base A hay
--    que voltear `intercambiar`, o la escena construiría el panel girado 90°
--    (ver WikiLLM/wiki/ejes_fondo_backing.md).
update public.cot_piezas_plantilla p
set formula_largo = 'A-0.07874',
    formula_ancho = 'L-0.62992',
    visualizacion = jsonb_set(coalesce(p.visualizacion, '{}'::jsonb), '{intercambiar}', 'true'::jsonb),
    notas = concat_ws(' | ', nullif(p.notas, ''), '0052: fondo 760x288.8 segun hoja B12; largo pasa a base A e intercambiar a true')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'B'
  and p.nombre = 'fondo'
  and p.formula_largo = 'L-TC'
  and p.formula_ancho = 'A';
