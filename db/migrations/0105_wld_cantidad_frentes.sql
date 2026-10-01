-- WLD ya calcula el ancho de cada frente con n_puertas, pero su cantidad
-- quedo fija en 2 desde la plantilla generada. Esto duplicaba un frente de
-- ancho completo en muebles de hasta 21 pulgadas.
-- Se corrige exclusivamente la cantidad; la altura A-RV se conserva intacta.

update public.cot_piezas_plantilla p
set formula_cantidad = 'n_puertas',
    notas = concat_ws(' | ', nullif(p.notas, ''),
      '0105: cantidad de frentes gobernada por n_puertas; altura A-RV conservada.'),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'WLD'
  and p.nombre = 'frente';
