-- Los dos laterales de SBFD-SMG llevan un mecanizado frontal superior para
-- recibir el perfil de gola metálica: 27 mm hacia el fondo y 73 mm hacia abajo.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
      jsonb_set(
        coalesce(p.visualizacion, '{}'::jsonb),
        '{nota}', to_jsonb('Par lateral con mecanizado frontal superior para gola metálica.'::text)
      ),
      '{recorte}',
      '{"borde":"frontal_superior","profundidad":"27","alto":"73"}'::jsonb
    ),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SBFD-SMG'
  and p.nombre = 'lateral';

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'SBFD-SMG'
      and p.nombre = 'lateral'
      and p.formula_cantidad = '2'
      and p.visualizacion#>>'{recorte,borde}' = 'frontal_superior'
      and p.visualizacion#>>'{recorte,profundidad}' = '27'
      and p.visualizacion#>>'{recorte,alto}' = '73'
  ) then
    raise exception 'El mecanizado 27 x 73 mm no quedó aplicado a los laterales SBFD-SMG';
  end if;
end $$;
