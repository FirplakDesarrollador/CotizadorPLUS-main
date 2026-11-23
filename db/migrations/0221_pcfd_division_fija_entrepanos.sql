-- PCFD tiene una división fija con el mismo corte que base y tapa. La pieza
-- base_tapa_division representa las tres; los entrepaños restantes son móviles.

update public.cot_piezas_plantilla p
set formula_cantidad = case p.nombre
      when 'base_tapa_division' then '3'
      when 'entrepano' then 'n_entrepanos-1'
      else p.formula_cantidad
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and upper(t.pref) = 'PCFD'
  and p.nombre in ('base_tapa_division', 'entrepano');

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PCFD'
      and p.nombre = 'base_tapa_division'
      and p.formula_cantidad = '3'
  ) then
    raise exception 'PCFD no quedó con tres piezas base_tapa_division';
  end if;

  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PCFD'
      and p.nombre = 'entrepano'
      and p.formula_cantidad = 'n_entrepanos-1'
  ) then
    raise exception 'PCFD no quedó descontando la división fija';
  end if;
end;
$$;
