-- El BACKING de SVFD se corta con los ejes largo=A-2mm y ancho=L-16mm.
-- En el plano XZ, el ancho de corte debe representarse sobre X y el largo
-- sobre Z; sin intercambiar, el dibujo los mostraba invertidos.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb),
  '{intercambiar}',
  'true'::jsonb,
  true
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'SVFD'
  and p.nombre = 'fondo';
