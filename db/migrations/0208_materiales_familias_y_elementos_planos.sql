-- Materiales independientes para los tres elementos planos del proyecto.
-- El motor conserva fallback a `frente` para cotizaciones y versiones antiguas.
update public.cot_piezas_plantilla p
set rol_tablero = case t.pref
  when 'F' then 'filler'
  when 'PN' then 'panel'
  when 'TK' then 'zocalo'
end
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
    where (t.pref = 'F' and p.rol_tablero <> 'filler')
       or (t.pref = 'PN' and p.rol_tablero <> 'panel')
       or (t.pref = 'TK' and p.rol_tablero <> 'zocalo')
  ) then
    raise exception 'No se pudieron separar los materiales de F, PN y TK';
  end if;
end $$;
