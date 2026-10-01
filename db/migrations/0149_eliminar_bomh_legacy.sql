-- BOMH historica no tiene lineas asociadas y fue reemplazada por BOMH-1.
-- Las plantillas, reglas y herrajes dependientes se eliminan por cascada.
do $$
declare
  legacy_id uuid;
  usos bigint;
begin
  select id into legacy_id
  from public.cot_tipos_mueble
  where pref='BOMH';

  if legacy_id is not null then
    select count(*) into usos
    from public.cot_cotizacion_lineas
    where tipo_mueble_id=legacy_id;

    if usos <> 0 then
      raise exception 'BOMH tiene % lineas de cotizacion y no se puede eliminar', usos;
    end if;

    delete from public.cot_tipos_mueble where id=legacy_id;
  end if;

  if not exists (
    select 1 from public.cot_tipos_mueble
    where pref='BOMH-1'
      and activo=true
      and nombre_es='BOMH-1 Mueble inferior medio horno'
  ) then
    raise exception 'BOMH-1 debe permanecer activa con su nombre definitivo';
  end if;
end $$;
