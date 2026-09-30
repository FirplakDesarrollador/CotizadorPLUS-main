-- Materializa la regla global de entrepanos en TW y TW-SM-PUSH.
-- Conteo vigente: 0 hasta 16", 1 hasta 24", 2 hasta 36" y 3 en adelante.

do $$
declare
  v_pref text;
  v_tipo uuid;
begin
  foreach v_pref in array array['TW', 'TW-SM-PUSH'] loop
    select id into v_tipo from public.cot_tipos_mueble where pref = v_pref;
    if v_tipo is null then
      raise exception 'No existe la tipologia %', v_pref;
    end if;

    delete from public.cot_piezas_plantilla
    where tipo_mueble_id = v_tipo and nombre = 'entrepano';

    insert into public.cot_piezas_plantilla (
      tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo,
      formula_ancho, resta_largo, resta_ancho, cantos, tarugos, soportes,
      orden, notas, modo_agrupacion, clave_fusion, formula_largo_grupo,
      visualizacion
    ) values (
      v_tipo,
      'entrepano',
      'refuerzo',
      'n_entrepanos',
      'L-2*TC-0.03937',
      'P >= 23.5 ? 558.8/25.4 : (P <= 12.5 ? 266.7/25.4 : P-1.5)',
      0,
      0,
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,
      0,
      4,
      35,
      'Aplica la regla global de entrepanos de muebles superiores.',
      'local',
      null,
      null,
      '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":false}'::jsonb
    );
  end loop;
end $$;

