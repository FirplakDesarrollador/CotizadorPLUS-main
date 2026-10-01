-- El refuerzo delantero de SBFD/SVFD es un rail vertical frontal: atraviesa el
-- largo en X y sus 96mm se elevan sobre Z. Antes se mostraba acostado en XY.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb),
  '{plano}',
  '"XZ"'::jsonb,
  true
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('SBFD', 'SVFD')
  and p.nombre = 'refuerzo_delantero';
