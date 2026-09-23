-- OW3018 se fabrica en carcasa de 18mm: los 36mm de descuento deben permanecer
-- fijos para reproducir la hoja aun si el perfil de material activo cambia.
update public.cot_piezas_plantilla p
set formula_largo = case p.nombre
  when 'base' then 'L-1.417323'
  when 'tapa' then 'L-1.417323'
  when 'refuerzo_trasero' then 'L-1.417323'
  else p.formula_largo
end,
visualizacion = case when p.nombre='base' then jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb), '{y}', to_jsonb('P-D'::text), true
) else p.visualizacion end
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='OW'
  and p.nombre in ('base','tapa','refuerzo_trasero');

-- El usuario solicita incluir de nuevo la lámina de cartón en materiales.
update public.cot_tipos_mueble
set usa_carton = true
where pref='OW';
