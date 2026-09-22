-- Hoja de ruta real: "SVFD36 MBLE INF LVM 2 PUERTAS CARB2" (36 x 30 x 21 in).
-- El rail delantero mide 96 mm, no 5 in (127 mm), y el BACKING mide
-- A-2 mm por L-16 mm: 760 x 898.4 mm.
update public.cot_piezas_plantilla p
set formula_ancho = '3.77953'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'SVFD'
  and p.nombre = 'refuerzo_delantero';

update public.cot_piezas_plantilla p
set formula_largo = 'A-0.07874',
    formula_ancho = 'L-0.62992'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'SVFD'
  and p.nombre = 'fondo';
