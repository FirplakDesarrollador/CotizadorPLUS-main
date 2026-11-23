-- Base, tapa y entrepaños fijos de PCFD-MO terminan antes del fondo. El ancho
-- descuenta 18 mm de retiro y el espesor real TB del tablero de fondo.

update public.cot_piezas_plantilla p
set formula_ancho = 'P-0.70866-TB',
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and upper(t.pref) = 'PCFD-MO'
  and p.nombre in ('base_tapa', 'entrepano_fijo');

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PCFD-MO'
      and p.nombre in ('base_tapa', 'entrepano_fijo')
      and p.formula_ancho is distinct from 'P-0.70866-TB'
  ) then
    raise exception 'PCFD-MO conserva piezas horizontales sin descuento de fondo';
  end if;
end;
$$;
