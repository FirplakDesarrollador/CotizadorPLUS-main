-- TW: código con largo/alto/profundidad y puerta 15,85 mm más alta que A.
-- La posición visual deja el borde superior de la puerta 3,2 mm bajo el lateral.

update public.cot_piezas_plantilla p
set formula_ancho = 'A+(15.85/25.4)',
    notas = 'Puerta: alto del modulo mas 15,85 mm; borde superior 3,2 mm bajo el lateral.',
    visualizacion = coalesce(p.visualizacion, '{}'::jsonb) || jsonb_build_object(
      'version', 1,
      'funcion', 'frente',
      'plano', 'XZ',
      'intercambiar', false,
      'z', 'A-3.2-H',
      'confirmado', true,
      'nota', 'Borde superior de la puerta 3,2 mm debajo del borde superior del lateral.'
    ),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'TW'
  and p.nombre = 'puerta';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'TW'
      and p.nombre = 'puerta'
      and p.formula_ancho = 'A+(15.85/25.4)'
      and p.visualizacion->>'z' = 'A-3.2-H'
  ) then
    raise exception 'No se pudo configurar la puerta de TW';
  end if;
end $$;
