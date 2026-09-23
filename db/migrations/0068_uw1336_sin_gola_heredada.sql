-- UW1336 no incluye perfiles/cantos de gola en la hoja de ruta.
update public.cot_piezas_plantilla p
set formula_cantidad = '0'
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id
  and t.pref='UW'
  and p.nombre in ('gola_frame','gola_canto');
