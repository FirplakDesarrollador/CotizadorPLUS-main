-- Corrección solicitada: en la tipología independiente W-SM el lateral se
-- corta al alto nominal A. El fondo conserva su holgura estructural de 16 mm.
-- La puerta sigue alineada arriba y sobresale solo 15,85 mm bajo el lateral.

update public.cot_piezas_plantilla p
set formula_largo = 'A',
    notas = 'Lateral W-SM: largo igual al alto nominal del mueble.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'lateral';

update public.cot_piezas_plantilla p
set formula_largo = 'L-0.62992',
    formula_ancho = 'A-0.62992',
    notas = 'Fondo W-SM: holgura estructural de 16 mm respecto al lateral de alto A.',
    visualizacion = '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"confirmado":true,"nota":"Fondo W-SM ajustado al lateral de alto nominal."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'fondo';
