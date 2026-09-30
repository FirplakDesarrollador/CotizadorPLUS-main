-- Normaliza los nombres/roles de BBLFD y configura el refuerzo vertical.

do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref = 'BBLFD';
  if v is null then raise exception 'No existe BBLFD'; end if;

  update public.cot_piezas_plantilla set nombre='lateral', notas='Lateral derecho', updated_at=now()
  where tipo_mueble_id=v and nombre='side r';
  update public.cot_piezas_plantilla set nombre='lateral', notas='Lateral izquierdo', updated_at=now()
  where tipo_mueble_id=v and nombre='side l';
  update public.cot_piezas_plantilla set nombre='refuerzo_delantero', rol_tablero='refuerzo', notas='Refuerzo delantero', updated_at=now()
  where tipo_mueble_id=v and nombre='rail del';
  update public.cot_piezas_plantilla
  set nombre='refuerzo_vertical', rol_tablero='refuerzo', tarugos=4,
      notas='Refuerzo vertical entre blind door y frente; 2 tarugos por lado.',
      visualizacion=coalesce(visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":true,"confirmado":true}'::jsonb,
      updated_at=now()
  where tipo_mueble_id=v and nombre='ref del central';
  update public.cot_piezas_plantilla set nombre='refuerzo_trasero', notas='Refuerzo trasero superior', updated_at=now()
  where tipo_mueble_id=v and nombre='rail tras sup';
  update public.cot_piezas_plantilla set nombre='refuerzo_trasero', notas='Refuerzo trasero inferior', updated_at=now()
  where tipo_mueble_id=v and nombre='rail tras inf';
  update public.cot_piezas_plantilla set nombre='entrepano', notas='Entrepaño', updated_at=now()
  where tipo_mueble_id=v and nombre='shelf';
  update public.cot_piezas_plantilla set nombre='frente', notas='Frente; ancho definido por Door.', updated_at=now()
  where tipo_mueble_id=v and nombre='door';
  update public.cot_piezas_plantilla set nombre='fondo', notas='Fondo', updated_at=now()
  where tipo_mueble_id=v and nombre='backing';
end $$;
