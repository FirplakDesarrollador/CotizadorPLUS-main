-- Todo entrepano de 300 mm usa cuatro soportes metalicos de 5 mm por unidad.
-- El motor multiplica `soportes` por la cantidad evaluada de la plantilla,
-- por lo que dos entrepanos consumen 8 soportes, tres consumen 12, etc.

update public.cot_piezas_plantilla p
set soportes = 4,
    notas = concat_ws(' | ', nullif(p.notas, ''),
      '0172: cuatro soportes de entrepano metalico 5mm por cada entrepano de 300mm'),
    updated_at = now()
where lower(p.nombre) in ('entrepano', 'shelf', 'shlef')
  and replace(p.formula_ancho, ' ', '') in ('11.81102', '300/25.4', '300.0/25.4');

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    where lower(p.nombre) in ('entrepano', 'shelf', 'shlef')
      and replace(p.formula_ancho, ' ', '') in ('11.81102', '300/25.4', '300.0/25.4')
      and p.soportes <> 4
  ) then
    raise exception 'Existe un entrepano de 300 mm sin cuatro soportes metalicos';
  end if;
end $$;
