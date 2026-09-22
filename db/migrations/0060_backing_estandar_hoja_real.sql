-- Patrón confirmado por hoja de ruta para BACKING estándar:
-- alto de carcasa menos 2mm por ancho de carcasa menos 16mm.
-- Estas familias aún usaban la convención anterior L-TC × A.
update public.cot_piezas_plantilla p
set formula_largo = 'A-0.07874',
    formula_ancho = 'L-0.62992',
    visualizacion = jsonb_set(
      coalesce(p.visualizacion, '{}'::jsonb),
      '{intercambiar}',
      'true'::jsonb,
      true
    )
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and p.nombre = 'fondo'
  and t.pref = any (array['BBL', 'BBLFD', 'BFD', 'BOMH', 'DV', 'DVE', 'SBFD', 'SV', 'UBFD', 'VFD']);

-- UDV ya tenía el corte correcto, pero conservaba los ejes de visualización
-- anteriores y podía mostrarse fuera de la carcasa con medidas no cuadradas.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb),
  '{intercambiar}',
  'true'::jsonb,
  true
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and p.nombre = 'fondo'
  and t.pref = 'UDV';
