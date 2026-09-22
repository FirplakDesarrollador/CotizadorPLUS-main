-- UVFD usa la regla global n_puertas (1 puerta hasta 21", 2 desde 24").
-- La plantilla generada quedo con cantidad fija 2, lo que duplicaba la puerta
-- y sus costos en anchos estrechos como UVFD12.
update public.cot_piezas_plantilla p
set formula_cantidad = 'n_puertas'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UVFD'
  and p.nombre = 'frente'
  and p.formula_cantidad = '2';
