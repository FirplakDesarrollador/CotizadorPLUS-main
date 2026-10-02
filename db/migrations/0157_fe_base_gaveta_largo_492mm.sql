-- Muebles FE: normalizar el fondo de gaveta y fijar su largo en 492 mm.
-- No se modifica ninguna otra dimension ni propiedad de la pieza.
update public.cot_piezas_plantilla p
set nombre='fondo_gaveta',
    formula_ancho=case
      when replace(p.formula_ancho,' ','') in ('492/25.4','19.37008')
       and replace(p.formula_largo,' ','') not in ('492/25.4','19.37008')
        then p.formula_largo
      else p.formula_ancho
    end,
    formula_largo='492/25.4'
where p.nombre in ('base_gaveta','fondo_gaveta')
  and exists (
    select 1
    from public.cot_tipos_mueble t
    where t.id=p.tipo_mueble_id
      and t.pref like '%-FE'
  );

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    where p.nombre in ('base_gaveta','fondo_gaveta')
      and exists (
        select 1
        from public.cot_tipos_mueble t
        where t.id=p.tipo_mueble_id
          and t.pref like '%-FE'
      )
      and (
        p.nombre is distinct from 'fondo_gaveta'
        or p.formula_largo is distinct from '492/25.4'
        or replace(p.formula_ancho,' ','') in ('492/25.4','19.37008')
      )
  ) then
    raise exception 'Quedaron muebles FE sin normalizar como fondo_gaveta de 492 mm de largo';
  end if;
end $$;
