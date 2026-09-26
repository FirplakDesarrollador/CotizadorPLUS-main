-- ============================================================================
-- Cotizador PLUS — muebles esquineros ciegos BBL (Blind Base)
-- Fuente: Simulación muebles CEMA (1).xlsx, hoja "Costos Muebles",
-- filas 2451-2513; despiece contrastado con la hoja "madera".
--
-- El Excel contiene 57 referencias BBLFD y 2 referencias BBL. Los sufijos de
-- mano de puerta, sin manija, gola y acabado no cambian la carcasa base, por lo
-- que se modelan como dos plantillas paramétricas y no como SKUs duplicados.
-- ============================================================================

insert into public.cot_tipos_mueble (
  pref, nombre_es, nombre_en, categoria, margen_key, familia_code,
  descripcion_es, descripcion_en, notas, activo, etiquetas_und, usa_carton,
  pref_imperial, pref_metrico, permite_agrupacion
) values
  (
    'BBLFD',
    'Base esquinero ciego de puertas (Blind Base Full Door)',
    'Blind Base Full Door',
    'inferior', 'muebles', 'COC01',
    'Mueble inferior esquinero ciego con puerta, frente falso y un entrepaño. Admite dos puertas mediante override.',
    'Blind corner base cabinet with one door and one shelf. Two doors are supported through an override.',
    'Excel CEMA: 57 referencias, anchos 30-47 in, alto 30 in y fondos 18/24 in. El frente falso mide P y el vano total de puertas mide L-P.',
    true, 4, true, 'BBLFD', 'BBLFD', false
  ),
  (
    'BBL',
    'Base esquinero ciego con cajón (Blind Base)',
    'Blind Base with Drawer',
    'inferior', 'muebles', 'COC01',
    'Mueble inferior esquinero ciego con una puerta, un cajón y medio entrepaño.',
    'Blind corner base cabinet with one door, one drawer and a half shelf.',
    'Excel CEMA: referencias BBL48-1C y BBL39-1C-D14 7/8; alto 30 in y fondo 24 in.',
    true, 4, true, 'BBL', 'BBL', false
  )
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  nombre_en = excluded.nombre_en,
  categoria = excluded.categoria,
  margen_key = excluded.margen_key,
  familia_code = excluded.familia_code,
  descripcion_es = excluded.descripcion_es,
  descripcion_en = excluded.descripcion_en,
  notas = excluded.notas,
  activo = excluded.activo,
  etiquetas_und = excluded.etiquetas_und,
  usa_carton = excluded.usa_carton,
  pref_imperial = excluded.pref_imperial,
  pref_metrico = excluded.pref_metrico,
  permite_agrupacion = excluded.permite_agrupacion,
  updated_at = now();

do $$
declare
  v_bblfd uuid;
  v_bbl uuid;
begin
  select id into v_bblfd from public.cot_tipos_mueble where pref = 'BBLFD';
  select id into v_bbl from public.cot_tipos_mueble where pref = 'BBL';

  if v_bblfd is null or v_bbl is null then
    raise exception 'No fue posible crear los tipos BBLFD/BBL';
  end if;

  -- BBLFD: 1 puerta y 1 entrepaño. El refuerzo vertical de bisagras aparece
  -- en la hoja madera, pero la fórmula de costo no lo suma a ningún tablero;
  -- se conserva como pieza informativa con rol_tablero nulo.
  delete from public.cot_piezas_plantilla where tipo_mueble_id = v_bblfd;
  insert into public.cot_piezas_plantilla (
    tipo_mueble_id, nombre, rol_tablero, formula_cantidad,
    formula_largo, formula_ancho, cantos, tarugos, soportes, orden, notas
  ) values
    (v_bblfd, 'lateral', 'caja', '2', 'A', 'P',
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 0, 10, 'Laterales Balance 15 mm'),
    (v_bblfd, 'base', 'caja', '1', 'L-1.18', 'P-0.9',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 8, 0, 20, 'Base Balance 15 mm'),
    (v_bblfd, 'refuerzo_trasero', 'refuerzo', '2', 'L-1.18', '3.25',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 30, 'Refuerzos traseros Polar 15 mm'),
    (v_bblfd, 'refuerzo_vert_bisagras', null, '1', 'A', '3.25',
      '{}'::jsonb, 0, 0, 40, 'Pieza declarada por el Excel, no costeada en su suma de madera'),
    (v_bblfd, 'refuerzo_delantero', 'caja', '1', 'L-27.75', '3.25',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 50, 'Refuerzo delantero parcial del tramo ciego'),
    (v_bblfd, 'entrepano', 'refuerzo', '1', 'L-1.181', 'P',
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 4, 60, 'Entrepaño completo Polar 15 mm'),
    (v_bblfd, 'puerta', 'frente', 'n_puertas', '(L-P)/n_puertas', 'A',
      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb, 0, 0, 70, 'El vano L-P se divide en partes iguales entre las puertas'),
    (v_bblfd, 'frente_falso', 'frente', '1', 'P', 'A',
      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb, 0, 0, 75, 'La longitud frontal del paño ciego es igual a la profundidad P'),
    (v_bblfd, 'fondo', 'fondo', '1', 'L-0.59', 'A',
      '{}'::jsonb, 0, 0, 80, 'Fondo/backing');

  -- BBL: misma carcasa ciega, con un cajón. Los descuentos de 27/27.75 in
  -- corresponden al tramo ciego observado en las filas BBL48 y BBL39.
  delete from public.cot_piezas_plantilla where tipo_mueble_id = v_bbl;
  insert into public.cot_piezas_plantilla (
    tipo_mueble_id, nombre, rol_tablero, formula_cantidad,
    formula_largo, formula_ancho, cantos, tarugos, soportes, orden, notas
  ) values
    (v_bbl, 'lateral', 'caja', '2', 'A', 'P',
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 0, 10, 'Laterales Balance 15 mm'),
    (v_bbl, 'base', 'caja', '1', 'L-1.18', 'P-0.9',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 8, 0, 20, 'Base Balance 15 mm'),
    (v_bbl, 'refuerzo_trasero', 'refuerzo', '2', 'L-1.18', '3.25',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 30, 'Refuerzos traseros Polar 15 mm'),
    (v_bbl, 'refuerzo_horizontal', 'refuerzo', '2', 'L-27.75', '3.25',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 40, 'Refuerzos horizontales del vano útil'),
    (v_bbl, 'refuerzo_vert_bisagras', null, '1', 'A', '3.25',
      '{}'::jsonb, 0, 0, 50, 'Pieza declarada por el Excel, no costeada en su suma de madera'),
    (v_bbl, 'refuerzo_profundidad', null, '1', 'P', '3.25',
      '{}'::jsonb, 0, 0, 60, 'Pieza declarada por el Excel, no costeada en su suma de madera'),
    (v_bbl, 'entrepano', 'refuerzo', '1', 'L-1.181', 'P*0.5',
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 4, 70, 'Medio entrepaño Polar 15 mm'),
    (v_bbl, 'base_gaveta', 'refuerzo', '1', 'L-30.70', 'P-4.63',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 0, 0, 80, 'Base de gaveta descontando el tramo ciego'),
    (v_bbl, 'trasero_gaveta', 'refuerzo', '1', 'L-30.427', '2.6875',
      '{"calibre":"19x0,45","largos":2,"anchos":0,"despEdges":0}'::jsonb, 0, 0, 90, 'Trasero de gaveta descontando el tramo ciego'),
    (v_bbl, 'frente', 'frente', '1', 'L', 'A',
      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb, 0, 0, 100, 'Área total de puerta y frente de cajón según Excel'),
    (v_bbl, 'frente_cajon', null, '1', 'L-27.75', '0',
      '{"calibre":"22x1","largos":2,"anchos":0,"despEdges":4}'::jsonb, 0, 0, 110, 'Frente de cajón: canto adicional; la madera ya está incluida en frente'),
    (v_bbl, 'fondo', 'fondo', '1', 'L-0.59', 'A',
      '{}'::jsonb, 0, 0, 120, 'Fondo/backing');

  delete from public.cot_reglas_config
  where tipo_mueble_id in (v_bblfd, v_bbl);

  insert into public.cot_reglas_config (
    tipo_mueble_id, variable, condicion, valor, prioridad, notas
  ) values
    (v_bblfd, 'n_patas', 'true', '4', 5, 'BBLFD: cuatro patas'),
    (v_bblfd, 'n_puertas', 'true', '1', 5, 'BBLFD: una puerta por defecto; admite override a 2'),
    (v_bblfd, 'n_cajones', 'true', '0', 5, 'BBLFD: sin cajones'),
    (v_bblfd, 'n_entrepanos', 'true', '1', 5, 'BBLFD: un entrepaño'),
    (v_bbl, 'n_patas', 'true', '4', 5, 'BBL: cuatro patas'),
    (v_bbl, 'n_puertas', 'true', '1', 5, 'BBL: una puerta'),
    (v_bbl, 'n_cajones', 'true', '1', 5, 'BBL: un cajón'),
    (v_bbl, 'n_entrepanos', 'true', '1', 5, 'BBL: medio entrepaño físico');

  delete from public.cot_herrajes_plantilla
  where tipo_mueble_id in (v_bblfd, v_bbl);

  insert into public.cot_herrajes_plantilla (
    tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas
  ) values
    (v_bblfd, 'pata', 'PATA10AJUST', 'pata', 'n_patas', 10, '4 patas = 15.896 COP en Excel'),
    (v_bblfd, 'tornillo', 'TORNILLO858', 'tornillo', 'n_patas*4', 20, '16 tornillos = 736 COP en Excel'),
    (v_bblfd, 'bisagra', 'BISAGRAPAR', 'bisagra', 'n_puertas', 30, 'Un par por puerta'),
    (v_bblfd, 'manija', 'MANIJA415', 'manija', 'n_puertas', 40, 'Excluir para variantes -SM'),
    (v_bbl, 'pata', 'PATA10AJUST', 'pata', 'n_patas', 10, '4 patas'),
    (v_bbl, 'tornillo', 'TORNILLO858', 'tornillo', 'n_patas*4', 20, '16 tornillos'),
    (v_bbl, 'bisagra', 'BISAGRAPAR', 'bisagra', 'n_puertas', 30, 'Un par por puerta'),
    (v_bbl, 'manija', 'MANIJA415', 'manija', 'n_puertas+n_cajones', 40, 'Una manija de puerta y una de cajón'),
    (v_bbl, 'riel', 'RIELTANDEM', 'riel', 'n_cajones', 50, 'Un par de rieles para el cajón');
end $$;
