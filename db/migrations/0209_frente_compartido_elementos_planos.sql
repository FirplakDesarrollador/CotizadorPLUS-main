-- Filler, Panel y Zocalo usan el mismo tablero configurado para los frentes.
update public.cot_piezas_plantilla p
set rol_tablero = 'frente'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('F', 'PN', 'TK')
  and p.nombre = 'panel';

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref in ('F', 'PN', 'TK')
      and p.nombre = 'panel'
      and p.rol_tablero <> 'frente'
  ) then
    raise exception 'F, PN y TK deben usar el tablero de frente';
  end if;
end $$;
