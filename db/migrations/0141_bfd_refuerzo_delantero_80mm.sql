-- Solo BFD simple: todos los refuerzos delanteros miden 80 mm.
-- Excluye BFD-SM, SBFD, SBFD-SM, UBFD y cualquier otro prefijo derivado.
update public.cot_piezas_plantilla p
set formula_ancho='80/25.4',
    notas=concat_ws(' | ',nullif(p.notas,''),
      'BFD simple: refuerzo delantero fijo de 80mm para cualquier largo.')
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='BFD'
  and p.nombre='refuerzo_delantero';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='BFD'
      and p.nombre='refuerzo_delantero'
      and p.formula_ancho='80/25.4'
  ) then
    raise exception 'No se pudo fijar BFD.refuerzo_delantero en 80mm';
  end if;
end $$;
