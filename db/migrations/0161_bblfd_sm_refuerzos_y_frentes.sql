-- Ajusta la variante SM desplegada y normaliza los ejes de frente/Blind Door
-- tanto en BBLFD original como en BBLFD-D-L/R-SM.
do $$
declare
  v_original uuid;
  v_sm uuid;
begin
  select id into v_original from public.cot_tipos_mueble where pref='BBLFD';
  select id into v_sm from public.cot_tipos_mueble where pref='BBLFD-D-L/R-SM';
  if v_original is null or v_sm is null then
    raise exception 'No se pudo resolver BBLFD o BBLFD-D-L/R-SM';
  end if;

  -- Todos los refuerzos de la variante SM tienen sección fija de 80 mm.
  update public.cot_piezas_plantilla
  set formula_ancho='80/25.4', updated_at=now()
  where tipo_mueble_id=v_sm
    and nombre in ('refuerzo_delantero','refuerzo_vertical','refuerzo_trasero')
    and formula_largo<>'80/25.4';

  update public.cot_piezas_plantilla
  set visualizacion=visualizacion || '{"nota":"Montante vertical de 80 mm centrado bajo la junta entre frentes."}'::jsonb,
      updated_at=now()
  where tipo_mueble_id=v_sm and nombre='refuerzo_vertical';

  -- Tramos a las caras del montante, centrado bajo la junta de 3,2 mm.
  update public.cot_piezas_plantilla
  set formula_largo='L-door-(RV/4)-(3*TC/2)', updated_at=now()
  where tipo_mueble_id=v_sm and nombre='refuerzo_delantero'
    and visualizacion->>'plano'='XY';

  update public.cot_piezas_plantilla
  set formula_largo='80/25.4',
      formula_ancho='door+(RV/4)-(3*TC/2)',
      updated_at=now()
  where tipo_mueble_id=v_sm and nombre='refuerzo_delantero'
    and visualizacion->>'plano'='XZ';

  update public.cot_piezas_plantilla
  set formula_largo='door+(RV/4)-(3*TC/2)', updated_at=now()
  where tipo_mueble_id=v_sm and nombre='gola_madera';

  -- Ejes de corte: ancho físico en formula_largo y alto físico en formula_ancho.
  -- La presentación compartida de frentes los muestra como alto × ancho.
  update public.cot_piezas_plantilla
  set formula_largo='door-RV',
      formula_ancho=case when tipo_mueble_id=v_sm then 'A-(30/25.4)' else 'A-RV' end,
      visualizacion='{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":true}',
      updated_at=now()
  where tipo_mueble_id in (v_original,v_sm) and nombre='frente';

  update public.cot_piezas_plantilla
  set formula_largo='L-door-(RV/2)',
      formula_ancho='A',
      visualizacion='{"version":1,"funcion":"frente_falso","plano":"XZ","intercambiar":false,"confirmado":true}',
      updated_at=now()
  where tipo_mueble_id in (v_original,v_sm) and lower(nombre)='blind door';

  if exists (
    select 1 from public.cot_piezas_plantilla
    where tipo_mueble_id=v_sm
      and nombre like 'refuerzo%'
      and formula_largo<>'80/25.4'
      and formula_ancho<>'80/25.4'
  ) then
    raise exception 'Quedaron refuerzos SM sin sección de 80 mm';
  end if;
end $$;
