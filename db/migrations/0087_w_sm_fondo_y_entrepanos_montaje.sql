-- Montaje W-SM: el fondo se sitúa delante de los refuerzos traseros y los
-- entrepaños llegan exactamente a su cara anterior, sin atravesarlo.
-- Las fórmulas de corte y los costos no se modifican.

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"y":"P-TC-TB","confirmado":true,"nota":"Fondo W-SM delante de los refuerzos traseros."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'fondo';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"estante","plano":"XY","y":"P-TC-TB-D","confirmado":true,"nota":"Entrepano W-SM termina en la cara anterior del fondo."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'entrepano';
