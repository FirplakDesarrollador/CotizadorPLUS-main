-- Montaje DB-2S-SM según la guía lateral de producción.
-- Los rails delanteros se ven verticales en la vista lateral; las dos Golas
-- de madera se ven horizontales y permanecen en contacto con los frentes.
-- Los cortes, cantidades y costos no cambian.

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"y":"20","confirmado":true,"nota":"Refuerzo delantero vertical, 20 mm detrás de la cara posterior de los frentes."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"gola","plano":"XY","intercambiar":false,"y":"0","confirmado":true,"nota":"Gola de madera horizontal, en contacto con los frentes."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'gola_madera';
