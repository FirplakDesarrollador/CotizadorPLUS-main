-- Retira F, OILVP e ILVP del catálogo cotizable sin borrar referencias
-- históricas. OILVP e ILVP son los prefijos métricos de OSBFD y SBFD.
-- Simulador y Cotizaciones solo cargan tipos con activo = true.
update public.cot_tipos_mueble
set activo = false
where pref in ('F', 'OSBFD', 'SBFD');

do $$
begin
  if exists (
    select 1
    from public.cot_tipos_mueble
    where pref in ('F', 'OSBFD', 'SBFD')
      and activo
  ) then
    raise exception 'No se desactivaron F, OILVP e ILVP';
  end if;
end $$;
