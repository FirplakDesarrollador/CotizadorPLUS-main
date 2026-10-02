-- BOV: el largo del frente sigue el alto exterior descontando 3,2 mm.
update public.cot_piezas_plantilla p
set formula_largo='A-RV',
    notas='FRONT OVEN C: largo igual al alto del mueble menos 3,2 mm.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='BOV'
  and p.nombre='frente';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='BOV'
      and p.nombre='frente'
      and p.formula_largo='A-RV'
  ) then
    raise exception 'No se pudo ajustar el frente BOV a A-RV';
  end if;
end $$;
