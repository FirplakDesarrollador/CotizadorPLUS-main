-- Ensamble lateral de SB-SM según la referencia visual:
-- 1) refuerzo delantero vertical superior;
-- 2) refuerzo horizontal vertical, solapado 20 mm;
-- 3) Gola horizontal inmediatamente bajo el refuerzo horizontal.
-- No se modifican cortes, cantidades ni consumos.

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","y":"20","z":"A-6*25.4","confirmado":true,"nota":"Refuerzo delantero vertical superior, 20 mm detrás de los frentes."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","y":"20","z":"A-132.4-3.14961*25.4","confirmado":true,"nota":"Refuerzo horizontal montado vertical, 20 mm solapado con el refuerzo delantero."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'refuerzo_horizontal';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"gola","plano":"XY","y":"0","z":"A-132.4-3.14961*25.4-H","confirmado":true,"nota":"Gola horizontal bajo el refuerzo horizontal y en contacto con los frentes."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'gola_madera';
