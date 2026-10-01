-- Nombre visible definitivo de BOMH-1.
update public.cot_tipos_mueble
set nombre_es='BOMH-1 Mueble inferior medio horno',
    updated_at=now()
where pref='BOMH-1';

do $$
begin
  if not exists (
    select 1 from public.cot_tipos_mueble
    where pref='BOMH-1'
      and nombre_es='BOMH-1 Mueble inferior medio horno'
  ) then
    raise exception 'No se actualizo el nombre de BOMH-1';
  end if;
end $$;
