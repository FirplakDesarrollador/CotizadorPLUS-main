-- DB-4 usa cuatro traseros bajos de gaveta, de 68mm. Las demás tipologías
-- uniformes DB conservan el trasero alto de 183mm.
update public.cot_piezas_plantilla p
set formula_ancho = 'n_cajones == 4 ? 68/25.4 : 183/25.4'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'DB'
  and p.nombre = 'trasero_gaveta';
