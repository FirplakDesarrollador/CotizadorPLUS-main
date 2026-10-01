-- BMW-1: el RAIL DELANTERO va en la esquina frontal superior.
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BMW-1';
  if v is null then raise exception 'No existe BMW-1'; end if;

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"A-H","confirmado":true,"nota":"Refuerzo delantero en la esquina frontal superior, con la cara superior al ras del mueble."}'::jsonb,
      notas='RAIL DELANTERO B; 884,4x80mm; montado en la esquina frontal superior.'
  where tipo_mueble_id=v and nombre='refuerzo_delantero';
end $$;
