-- Una tipologia sin puertas no lleva manijas ni bisagras.
-- La lista explicita limita la correccion a los tipos abiertos creados en 0184.

delete from public.cot_herrajes_plantilla h
using public.cot_tipos_mueble t
where t.id = h.tipo_mueble_id
  and t.pref in ('OBFD', 'OBFD-SM', 'OSBFD', 'OSBFD-SM')
  and lower(h.rol) in ('manija', 'bisagra');

do $$
declare v_pref text;
begin
  foreach v_pref in array array['OBFD', 'OBFD-SM', 'OSBFD', 'OSBFD-SM'] loop
    if not exists (select 1 from public.cot_tipos_mueble where pref = v_pref) then
      raise exception 'No existe la tipologia abierta %', v_pref;
    end if;
    if exists (
      select 1 from public.cot_herrajes_plantilla h
      join public.cot_tipos_mueble t on t.id = h.tipo_mueble_id
      where t.pref = v_pref and lower(h.rol) in ('manija', 'bisagra')
    ) then
      raise exception '% conserva manijas o bisagras', v_pref;
    end if;
  end loop;
end $$;
