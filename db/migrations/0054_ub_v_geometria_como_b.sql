-- `UB` y `V`: las mismas tres correcciones que `B` recibió en 0052.
--
-- No hay hoja de `UB` ni de `V`. Lo que sí hay es que ambos son análogos exactos
-- de `B`: arrastran sus tres fórmulas antiguas, y sus propias variantes FE
-- —`UB-FE` y `V-FE`— ya traen la geometría validada, igual que `B-FE` la traía
-- frente a `B` antes de que la hoja de `B12` confirmara cuál de las dos era buena.
--
--   entrepaño ancho   P*0.5              ->  11.81102              (300 mm)
--   base_gaveta largo L-2.95             ->  L-4.13386             (L − 105 mm)
--   fondo             L-TC / A           ->  A-0.07874 / L-0.62992 (A−2 / L−16 mm)
--
-- Ninguno de los dos tiene líneas de cotización guardadas, así que la corrección
-- no recostea nada.
--
-- Alcance confirmado con el usuario: solo `UB` y `V`. Los demás tipos rezagados
-- (`BBL`, `DV`, `DVE`, `PCFD`, `UDV`, `BFD`, `SBFD`, `BOMH`, `SV`, `SVFD`,
-- `UBFD`, `BBLFD`) no tienen variante FE que respalde el cambio y se dejan hasta
-- tener una hoja suya. `SBFD` y `BFD` además suman 15 líneas guardadas.

-- 1. Entrepaño: 300 mm constantes.
update public.cot_piezas_plantilla p
set formula_ancho = '11.81102',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0054: entrepano de 300mm, como B/B-FE/UB-FE/V-FE')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('UB', 'V')
  and p.nombre = 'entrepano'
  and p.formula_ancho = 'P*0.5';

-- 2. Base de gaveta: 105 mm exactos.
update public.cot_piezas_plantilla p
set formula_largo = 'L-4.13386',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0054: base de gaveta a L-105mm, como B/DB/POD/UDB/UV')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('UB', 'V')
  and p.nombre = 'base_gaveta'
  and p.formula_largo = 'L-2.95';

-- 3. Fondo: A−2 × L−16, con el eje del grupo al que pasa a pertenecer.
--    Al mover el largo a base `A` hay que voltear `intercambiar`, o la escena
--    construiría el panel girado 90° (ver WikiLLM/wiki/ejes_fondo_backing.md).
update public.cot_piezas_plantilla p
set formula_largo = 'A-0.07874',
    formula_ancho = 'L-0.62992',
    visualizacion = jsonb_set(coalesce(p.visualizacion, '{}'::jsonb), '{intercambiar}', 'true'::jsonb),
    notas = concat_ws(' | ', nullif(p.notas, ''), '0054: fondo A-2/L-16 e intercambiar a true, como B/B-FE/DB')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('UB', 'V')
  and p.nombre = 'fondo'
  and p.formula_largo = 'L-TC'
  and p.formula_ancho = 'A';
