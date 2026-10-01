-- BMW no tiene lineas de cotizacion asociadas y fue reemplazada por BMW-1.
-- El FK de plantillas/reglas/herrajes elimina en cascada sus datos dependientes.
do $$
declare legacy_id uuid;
declare v uuid;
declare usos bigint;
begin
  select id into legacy_id from public.cot_tipos_mueble where pref='BMW';
  if legacy_id is not null then
    select count(*) into usos
    from public.cot_cotizacion_lineas
    where tipo_mueble_id=legacy_id;
    if usos <> 0 then
      raise exception 'BMW tiene % lineas de cotizacion y no se puede eliminar', usos;
    end if;
    delete from public.cot_tipos_mueble where id=legacy_id;
  end if;

  select id into v from public.cot_tipos_mueble where pref='BMW-1';
  if v is null then raise exception 'No existe BMW-1'; end if;

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"241.33-H","confirmado":true,"nota":"Refuerzo delantero en el frente, apoyado inmediatamente bajo el entrepano fijo."}'::jsonb,
      notas='RAIL DELANTERO B; 884,4x80mm; montado bajo el entrepano fijo.'
  where tipo_mueble_id=v and nombre='refuerzo_delantero';
end $$;
