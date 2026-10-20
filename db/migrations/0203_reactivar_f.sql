-- Reactiva la tipología F (filler) para que vuelva a estar disponible en los
-- catálogos compartidos por Simulador y Cotizaciones.
update public.cot_tipos_mueble
set activo = true,
    updated_at = now()
where pref = 'F';

do $$
begin
  if not exists (
    select 1 from public.cot_tipos_mueble where pref = 'F' and activo
  ) then
    raise exception 'F no quedó activa';
  end if;
end $$;
