-- Retira del catálogo cotizable las tipologías superiores legacy solicitadas.
-- Las filas se conservan para no romper cotizaciones históricas.
update public.cot_tipos_mueble
set activo = false
where pref in ('S', 'SA', 'SBAS', 'SLOC', 'SMO');

do $$
begin
  if exists (
    select 1
    from public.cot_tipos_mueble
    where pref in ('S', 'SA', 'SBAS', 'SLOC', 'SMO')
      and activo
  ) then
    raise exception 'No se desactivaron todas las tipologías superiores legacy';
  end if;
end $$;
