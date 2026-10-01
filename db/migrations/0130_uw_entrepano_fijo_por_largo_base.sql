-- UW: todo entrepano cuyo largo usa exactamente la misma formula que la base
-- es estructural/fijo y debe identificarse como entrepano_fijo.
update public.cot_piezas_plantilla p
set nombre = 'entrepano_fijo',
    notas = concat_ws(' ', nullif(p.notas, ''), 'Largo igual al de la base; entrepano fijo.'),
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre in ('entrepano_superior', 'entrepano', 'shelf', 'shlef')
  and exists (
    select 1
    from public.cot_piezas_plantilla base
    where base.tipo_mueble_id = p.tipo_mueble_id
      and base.nombre = 'base'
      and regexp_replace(base.formula_largo, '\s+', '', 'g') = regexp_replace(p.formula_largo, '\s+', '', 'g')
  );

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    join public.cot_piezas_plantilla base on base.tipo_mueble_id=t.id and base.nombre='base'
    where t.pref='UW'
      and p.nombre='entrepano_fijo'
      and regexp_replace(base.formula_largo, '\s+', '', 'g') = regexp_replace(p.formula_largo, '\s+', '', 'g')
  ) then
    raise exception 'UW no tiene entrepano_fijo con el mismo largo de la base';
  end if;
end $$;
