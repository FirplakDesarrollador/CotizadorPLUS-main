-- La Blind Door queda a ras del lateral exterior y solo descuenta 1,6 mm en la junta.
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

  update public.cot_piezas_plantilla
  set formula_largo='L-door-(RV/2)', updated_at=now()
  where tipo_mueble_id in (v_original,v_sm) and lower(nombre)='blind door';

  update public.cot_piezas_plantilla
  set formula_largo='L-door-(RV/4)-(3*TC/2)', updated_at=now()
  where tipo_mueble_id=v_sm and nombre='refuerzo_delantero'
    and visualizacion->>'plano'='XY';

  update public.cot_piezas_plantilla
  set formula_ancho='door+(RV/4)-(3*TC/2)', updated_at=now()
  where tipo_mueble_id=v_sm and nombre='refuerzo_delantero'
    and visualizacion->>'plano'='XZ';

  update public.cot_piezas_plantilla
  set formula_largo='door+(RV/4)-(3*TC/2)', updated_at=now()
  where tipo_mueble_id=v_sm and nombre='gola_madera';
end $$;
