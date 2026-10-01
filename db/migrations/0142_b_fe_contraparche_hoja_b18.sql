-- B-FE exclusivamente: B18-FE confirma CONTRAPARCHE de 371,2x100mm.
-- 371,2 = L(457,2)-86mm, igual al largo del trasero de gaveta.
update public.cot_piezas_plantilla p
set formula_largo='L-86/25.4',
    notas=concat_ws(' | ',nullif(p.notas,''),
      'B18-FE: CONTRAPARCHE 371,2x100mm; largo L-86mm.')
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='B-FE'
  and p.nombre='contraparche';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='B-FE'
      and p.nombre='contraparche'
      and p.formula_largo='L-86/25.4'
  ) then
    raise exception 'No se pudo corregir B-FE.contraparche';
  end if;
end $$;
