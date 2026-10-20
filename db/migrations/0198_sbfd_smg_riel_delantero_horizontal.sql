-- La vista lateral del IGES muestra el riel delantero como una placa horizontal
-- de 80 mm de profundidad bajo la cara superior, no como un panel vertical de
-- 80 mm de alto.
update public.cot_piezas_plantilla p
set visualizacion = '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"27","z":"A-TC","confirmado":true,"nota":"Riel delantero horizontal de 80 mm de profundidad, retirado 27 mm del frente para la gola metálica."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SBFD-SMG'
  and p.nombre = 'refuerzo_delantero';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'SBFD-SMG'
      and p.nombre = 'refuerzo_delantero'
      and p.visualizacion->>'plano' = 'XY'
      and p.visualizacion->>'y' = '27'
      and p.visualizacion->>'z' = 'A-TC'
  ) then
    raise exception 'No se corrigió el montaje horizontal del riel delantero SBFD-SMG';
  end if;
end $$;
