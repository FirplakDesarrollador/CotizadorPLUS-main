-- Asegura el ensamble y la orientacion del BBLFD-D-L/R.
-- Base: 4 tarugos por lado. Refuerzos: 2 tarugos por lado.

do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref = 'BBLFD';
  if v is null then raise exception 'No existe BBLFD'; end if;

  update public.cot_piezas_plantilla
  set tarugos = 8,
      notas = 'Base; 4 tarugos por lado.',
      updated_at = now()
  where tipo_mueble_id = v and nombre = 'base';

  update public.cot_piezas_plantilla
  set tarugos = 4,
      notas = case
        when nombre = 'refuerzo_vertical'
          then 'Refuerzo vertical perpendicular a los frentes; 2 tarugos por lado.'
        else coalesce(nullif(notas, ''), nombre) || '; 2 tarugos por lado.'
      end,
      updated_at = now()
  where tipo_mueble_id = v and nombre like 'refuerzo%';

  update public.cot_piezas_plantilla
  set visualizacion = coalesce(visualizacion, '{}'::jsonb) ||
        '{"version":1,"funcion":"travesano_frontal","plano":"YZ","intercambiar":false,"confirmado":true,"nota":"Montante perpendicular a los frentes, bajo el refuerzo delantero de 100 mm."}'::jsonb,
      updated_at = now()
  where tipo_mueble_id = v and nombre = 'refuerzo_vertical';
end $$;
