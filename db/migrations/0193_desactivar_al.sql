-- Retira AL del catálogo cotizable sin borrar referencias históricas.
update public.cot_tipos_mueble
set activo = false
where pref = 'AL';

do $$
begin
  if exists (
    select 1 from public.cot_tipos_mueble where pref = 'AL' and activo
  ) then
    raise exception 'No se desactivó la tipología AL';
  end if;
end $$;
