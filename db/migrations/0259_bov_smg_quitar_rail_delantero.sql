-- BOV-SMG y BOV-SMG-SF ya no incluyen RAIL DELANTERO en su despiece.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in ('BOV-SMG', 'BOV-SMG-SF')
  and p.nombre = 'refuerzo_delantero';

update public.cot_tipos_mueble
set descripcion_es = 'BOV-SF con frente interno, 73 mm libres superiores y sin fondo.',
    descripcion_en = 'BOV-SF with internal front, 73 mm upper clearance and no back panel.',
    updated_at = now()
where pref = 'BOV-SMG-SF'
  and descripcion_es ilike '%refuerzo delantero%';

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref in ('BOV-SMG', 'BOV-SMG-SF')
      and p.nombre = 'refuerzo_delantero'
  ) then
    raise exception 'El rail delantero no quedó retirado de BOV-SMG/BOV-SMG-SF';
  end if;
end $$;

commit;
