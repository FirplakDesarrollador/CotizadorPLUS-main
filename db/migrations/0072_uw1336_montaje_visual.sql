-- Montaje validado para UW1336. Coordenadas en mm: X = largo, Y = profundidad,
-- Z = altura. El frente queda alineado a la tapa, el shelf 0 es fijo y el
-- BACKING queda inmediatamente delante de los rails posteriores.
update public.cot_piezas_plantilla p
set visualizacion = case p.nombre
  when 'frente' then jsonb_build_object(
    'version', 1, 'funcion', 'frente', 'plano', 'XZ',
    'z', 'A-H', 'confirmado', true,
    'nota', 'Puerta alineada con el borde superior del mueble.'
  )
  when 'entrepano_superior' then jsonb_build_object(
    'version', 1, 'funcion', 'estante', 'plano', 'XY',
    'z', 'TC+198.15', 'confirmado', true,
    'nota', 'Shelf 0 fijo a 198,15mm desde la cara interna de la base.'
  )
  when 'fondo' then jsonb_build_object(
    'version', 1, 'funcion', 'respaldo', 'plano', 'XZ',
    'y', 'P-TC-TB', 'confirmado', true,
    'nota', 'BACKING delante de los refuerzos traseros.'
  )
end
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre in ('frente', 'entrepano_superior', 'fondo');
