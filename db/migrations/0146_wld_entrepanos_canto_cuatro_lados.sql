-- WLD exclusivamente: todos sus entrepanos llevan canto en los cuatro lados.
update public.cot_piezas_plantilla p
set cantos = jsonb_set(
      jsonb_set(coalesce(p.cantos, '{}'::jsonb), '{largos}', '2'::jsonb, true),
      '{anchos}', '2'::jsonb, true
    ),
    notas = concat_ws(' | ', nullif(p.notas, ''),
      '0146: canto en los cuatro lados (2 largos y 2 anchos).'),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'WLD'
  and lower(p.nombre) in ('entrepano','entrepano_fijo','entrepano_superior','shelf','shlef');

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='WLD'
      and lower(p.nombre) in ('entrepano','entrepano_fijo','entrepano_superior','shelf','shlef')
      and (p.cantos->>'largos')::int=2
      and (p.cantos->>'anchos')::int=2
  ) then
    raise exception 'No se actualizaron los entrepanos de WLD';
  end if;
end $$;
