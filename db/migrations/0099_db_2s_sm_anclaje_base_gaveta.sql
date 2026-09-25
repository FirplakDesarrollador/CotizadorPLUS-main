-- El segundo par DB-2S-SM se ancla en el generador a la segunda base_gaveta,
-- que conoce las coordenadas reales de cada cajón. Se eliminan fórmulas Z
-- aproximadas de la configuración almacenada y se conservan planos y caras.

update public.cot_piezas_plantilla p
set visualizacion = (p.visualizacion - 'z') ||
  '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"y":"20","confirmado":true,"nota":"Refuerzo vertical; el montaje lo ancla arriba y bajo la segunda base de gaveta."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion = (p.visualizacion - 'z') ||
  '{"version":1,"funcion":"gola","plano":"XY","intercambiar":false,"y":"0","confirmado":true,"nota":"Gola horizontal contra el frente; el montaje la ancla bajo cada refuerzo."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'gola_madera';
