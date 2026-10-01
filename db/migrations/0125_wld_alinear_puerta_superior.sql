-- WLD: deja el canto superior del frente 3,2 mm bajo la cara exterior
-- de la tapa, sin cambiar las medidas de corte.

update public.cot_piezas_plantilla p
set visualizacion = coalesce(p.visualizacion, '{}'::jsonb) || jsonb_build_object(
      'version', 1,
      'funcion', 'frente',
      'plano', 'XZ',
      'intercambiar', true,
      'z', 'A-3.2-H',
      'confirmado', true,
      'nota', 'WLD: canto superior del frente 3.2mm bajo la cara exterior de la tapa.'
    ),
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'WLD'
  and p.nombre = 'frente';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'WLD'
      and p.nombre = 'frente'
      and p.visualizacion->>'z' = 'A-3.2-H'
  ) then
    raise exception 'No se pudo configurar la separacion superior del frente WLD';
  end if;
end $$;
