-- BFD e IP son la misma fila: BFD es el prefijo imperial e IP su alias
-- métrico. Se prioriza mantener BFD disponible en ambos catálogos.
update public.cot_tipos_mueble
set activo = true
where pref = 'BFD';

do $$
begin
  if not exists (
    select 1 from public.cot_tipos_mueble where pref = 'BFD' and activo
  ) then
    raise exception 'BFD no quedó activa';
  end if;
end $$;
