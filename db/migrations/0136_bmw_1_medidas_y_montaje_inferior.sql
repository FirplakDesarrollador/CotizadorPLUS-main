-- Corrige ejes de frentes y montaje inferior de BMW-1 segun BMW36-1.
-- No modifica BMW historico ni la plantilla de herrajes.
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BMW-1';
  if v is null then raise exception 'No existe BMW-1'; end if;

  update public.cot_piezas_plantilla
  set notas='ENTREPANO FIJO B; misma medida que la base: 884,4x585,6mm.',
      visualizacion='{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"z":"241.33","confirmado":true,"nota":"Entrepano fijo con la misma medida de la base; separa la gaveta inferior del vano superior."}'::jsonb
  where tipo_mueble_id=v and nombre='entrepano_fijo';

  update public.cot_piezas_plantilla
  set formula_largo='L-RV', formula_ancho='220.13/25.4',
      visualizacion='{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"z":"3.2","confirmado":true,"nota":"Frente de la gaveta inferior."}'::jsonb
  where tipo_mueble_id=v and nombre='frente_gaveta';

  update public.cot_piezas_plantilla
  set formula_largo='L-RV', formula_ancho='A-(220.13/25.4)-2*RV',
      visualizacion='{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"z":"226.53","confirmado":true,"nota":"Frente superior, sobre la gaveta inferior."}'::jsonb
  where tipo_mueble_id=v and nombre='frente';

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"z":"0","confirmado":true,"nota":"Fondo inferior limitado por el entrepano fijo a 241,33mm."}'::jsonb
  where tipo_mueble_id=v and nombre='fondo';
end $$;
