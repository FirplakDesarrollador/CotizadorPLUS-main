-- BFD-SM: montaje específico del refuerzo frontal y la Gola de madera.
-- El corte no cambia: solo se parametriza su posición en las tres vistas.
update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","y":"20","confirmado":true,"nota":"Refuerzo vertical: 20 mm detrás de la cara posterior de los frentes."}'::jsonb
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'BFD-SM'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"gola","plano":"XY","y":"0","z":"A-AP-H","confirmado":true,"nota":"Gola de madera horizontal, en contacto con los frentes y pegada bajo el refuerzo delantero."}'::jsonb
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'BFD-SM'
  and p.nombre = 'gola_madera';
