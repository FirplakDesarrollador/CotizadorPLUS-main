-- Exclusivo DB-2S-SM-FE: profundidad/largo de las tres bases de gaveta a 492mm.
update public.cot_piezas_plantilla p
set formula_largo='492/25.4',
    notas=concat_ws(' | ',nullif(p.notas,''),
      'DB-2S-SM-FE: base de gaveta de 492mm.')
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='DB-2S-SM-FE'
  and p.nombre='base_gaveta';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='DB-2S-SM-FE'
      and p.nombre='base_gaveta'
      and p.formula_largo='492/25.4'
  ) then
    raise exception 'No se pudo fijar DB-2S-SM-FE.base_gaveta en 492mm';
  end if;
end $$;
