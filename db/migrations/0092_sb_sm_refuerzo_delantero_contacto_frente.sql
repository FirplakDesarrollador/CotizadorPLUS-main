-- SB-SM: el refuerzo delantero toca la cara posterior de los frentes (y=0)
-- sin atravesarlos. No cambia cortes, cantidades ni consumos.
update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XZ","y":"0","z":"A-6*25.4","confirmado":true,"nota":"Refuerzo delantero vertical en contacto con la cara posterior de los frentes, sin sobrepasarlos."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SB-SM'
  and p.nombre = 'refuerzo_delantero';
