-- FL no tiene lineas de cotizacion asociadas al momento de esta migracion.
-- El borrado del tipo elimina por cascada su unica plantilla de pieza.
-- La guarda evita perder historial si aparece una referencia entre la
-- auditoria y la aplicacion de la migracion.

do $$
declare
  fl_id uuid;
begin
  select id into fl_id
  from public.cot_tipos_mueble
  where pref = 'FL';

  if fl_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.cot_cotizacion_lineas
    where tipo_mueble_id = fl_id or pref = 'FL'
  ) then
    raise exception 'No se puede eliminar FL: existen lineas de cotizacion asociadas.';
  end if;

  delete from public.cot_tipos_mueble
  where id = fl_id;
end $$;
