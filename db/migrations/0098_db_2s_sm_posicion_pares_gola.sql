-- Posiciones por nivel de DB-2S-SM:
--   I=0: refuerzo y Gola superiores.
--   I=1: refuerzo y Gola justo debajo de la segunda gaveta pequeña.
-- Los 28,4 mm representan la holgura superior (1,6 mm) y la mitad de la
-- abertura de Gola (26,8 mm) empleadas por el montaje de las tres gavetas.

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"y":"20","z":"I===0 ? A-H : A-2*alto_frente_pequeno-RV-28.4-H","confirmado":true,"nota":"Refuerzo vertical: uno superior y uno debajo de la segunda gaveta."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"gola","plano":"XY","intercambiar":false,"y":"0","z":"I===0 ? A-80-H : A-2*alto_frente_pequeno-RV-28.4-80-H","confirmado":true,"nota":"Gola horizontal: bajo el refuerzo superior y bajo la segunda gaveta."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'gola_madera';
