-- Ajuste exclusivo de visualización para SB-SM.
-- No cambia fórmulas de corte, cantidades ni consumos.

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","y":"20","z":"A-6*25.4-30","confirmado":true,"nota":"Refuerzo delantero vertical, 20 mm detrás de los frentes y 30 mm más abajo."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XY","y":"20","z":"A-6*25.4-H-132.4","confirmado":true,"nota":"Rail horizontal bajo 132,4 mm respecto a su posición anterior."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'refuerzo_horizontal';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"gola","plano":"XY","y":"0","z":"A-6*25.4-H-132.4","confirmado":true,"nota":"Gola horizontal en contacto con los frentes, bajada 132,4 mm."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'gola_madera';
