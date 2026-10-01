-- BMW-1: centra el entrepano fijo en la junta de los dos frentes.
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BMW-1';
  if v is null then raise exception 'No existe BMW-1'; end if;

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"y":"P-D","z":"224.93-H/2","confirmado":true,"nota":"Entrepano fijo centrado en la junta de los frentes y extendido entre los frentes y el fondo."}'::jsonb,
      notas='ENTREPANO FIJO B; misma medida que la base: 884,4x585,6mm; centrado en la union de los frentes.'
  where tipo_mueble_id=v and nombre='entrepano_fijo';

  update public.cot_piezas_plantilla
  set visualizacion=jsonb_set(
        visualizacion,
        '{nota}',
        '"Fondo inferior cuya cara superior coincide con el entrepano fijo centrado en la junta de los frentes."'::jsonb
      )
  where tipo_mueble_id=v and nombre='fondo';
end $$;
