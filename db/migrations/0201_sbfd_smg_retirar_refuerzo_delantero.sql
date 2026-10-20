-- El refuerzo delantero horizontal de SBFD-SMG comienza después del mecanizado
-- frontal de la gola metálica, por lo que se retira 27 mm hacia el fondo.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
      jsonb_set(
        coalesce(p.visualizacion, '{}'::jsonb),
        '{y}', to_jsonb('27'::text)
      ),
      '{nota}',
      to_jsonb('Riel delantero horizontal de 80 mm de profundidad, retirado 27 mm del frente para la gola metálica.'::text)
    ),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SBFD-SMG'
  and p.nombre = 'refuerzo_delantero';

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'SBFD-SMG'
      and p.nombre = 'refuerzo_delantero'
      and p.visualizacion->>'plano' = 'XY'
      and p.visualizacion->>'y' = '27'
      and p.visualizacion->>'z' = 'A-TC'
  ) then
    raise exception 'El refuerzo delantero SBFD-SMG no quedó retirado 27 mm';
  end if;
end $$;
