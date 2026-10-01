-- La medida del frente corresponde a cada puerta. Para dos puertas se resta un
-- reveal de 3.2mm por frente y se divide el ancho útil, permitiendo montarlas
-- lado a lado sin ocultar una fuera de la visualización.
update public.cot_piezas_plantilla p
set formula_largo = '(L-n_puertas*0.125984)/n_puertas'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre = 'frente';
