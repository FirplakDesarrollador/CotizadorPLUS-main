-- UW: la cara inferior del entrepano_superior debe coincidir con el borde
-- inferior de la puerta. La puerta mide A-7.841732in y se ancla en Z=A-H;
-- por tanto, ambos elementos terminan exactamente en Z=7.841732*25.4mm.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb),
  '{z}', to_jsonb('7.841732*25.4'::text), true
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre = 'entrepano_superior';

-- Los entrepanos interiores conservan la holgura de 40mm respecto al
-- entrepano superior ahora alineado con el final de la puerta.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb),
  '{z}',
  to_jsonb('7.841732*25.4+H+40+I*((A-(7.841732*25.4+H+40)-TC-H)/N)'::text),
  true
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre = 'entrepano';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'UW'
      and p.nombre = 'entrepano_superior'
      and p.visualizacion->>'z' = '7.841732*25.4'
  ) then
    raise exception 'No se actualizo la alineacion del entrepano_superior de UW';
  end if;
end $$;
