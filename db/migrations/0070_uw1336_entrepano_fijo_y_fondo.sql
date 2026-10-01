-- UW1336: el shelf superior (300.2 x 281.8mm) es fijo.
-- Se ensambla como base/tapa con 8 tarugos, no con soportes metálicos.
update public.cot_piezas_plantilla p
set tarugos = 8,
    soportes = 0
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre = 'entrepano_superior';

-- BACKING F de la hoja: largo = 898.4mm (alto útil), ancho = 314.2mm.
update public.cot_piezas_plantilla p
set formula_largo = 'A-0.62992',
    formula_ancho = 'L+0.370079'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre = 'fondo';
