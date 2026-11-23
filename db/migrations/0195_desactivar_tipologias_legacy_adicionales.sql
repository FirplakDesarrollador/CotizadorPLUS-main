-- Retira del catálogo todos los tipos que coincidan con los códigos solicitados,
-- ya sea como prefijo interno, imperial o métrico. Las filas se conservan para
-- no romper cotizaciones históricas.
update public.cot_tipos_mueble
set activo = false
where pref in ('S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH')
   or pref_imperial in ('S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH')
   or pref_metrico in ('S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH');

do $$
begin
  if exists (
    select 1
    from public.cot_tipos_mueble
    where activo
      and (
        pref in ('S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH')
        or pref_imperial in ('S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH')
        or pref_metrico in ('S', 'SA', 'SLOC', 'SMO', 'ICP', 'ILVP', 'ALP', 'AL', 'ALH')
      )
  ) then
    raise exception 'Quedan tipologías legacy activas';
  end if;
end $$;
