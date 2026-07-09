-- ============================================================================
-- Cotizador PLUS — Plantilla de piezas: SBFD (Sink Base Full Door)
-- Derivado y verificado contra Excel (madera/canto fila 722, SBFD33).
-- Geometría en pulgadas; el motor: area_cm2 = cant * largo_in * ancho_in * 2.54^2,
-- luego por rol_tablero suma, aplica (1+desperdicio) y * precio_m2/10000.
-- rol_tablero: caja | frente | fondo  (el preset de materiales se elige al cotizar).
-- Validación esperada (SBFD33, L=33 A=30 P=24, caja=ECOCARB15ARLINGTON,
--   frente=ECOCARB18COLOR, fondo=PRICARB6CANDELARIA (POLAR)): madera ≈ 112,351 COP.
-- ============================================================================

do $$
declare v_tipo uuid;
begin
  select id into v_tipo from public.cot_tipos_mueble where pref = 'SBFD';
  if v_tipo is null then raise exception 'tipo SBFD no existe'; end if;

  delete from public.cot_piezas_plantilla where tipo_mueble_id = v_tipo;

  insert into public.cot_piezas_plantilla
    (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, notas) values
    (v_tipo, 'lateral',            'caja',   '2',           'A',        'P',        '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 10, 'Laterales: Alto x Prof'),
    (v_tipo, 'base',               'caja',   '1',           'L-1.18',   'P-0.9',    '{"calibre":"19x0,45","largos":1,"anchos":1}'::jsonb, 20, 'Base inferior'),
    (v_tipo, 'refuerzo_trasero',   'caja',   '2',           'L-1.18',   '3.25',     '{"calibre":"19x0,45","largos":1}'::jsonb,            30, 'Refuerzos traseros (ancho 3.25")'),
    (v_tipo, 'refuerzo_delantero', 'caja',   '1',           'L-1.18',   '5',        '{"calibre":"19x0,45","largos":1}'::jsonb,            40, 'Refuerzo delantero superior (ancho 5")'),
    (v_tipo, 'frente',             'frente', '1',           'L',        'A',        '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,    50, 'Puertas (área total L x A, indep. del nº puertas)'),
    (v_tipo, 'fondo',              'fondo',  '1',           'L-0.59',   'A',        '{}'::jsonb,                                          60, 'Fondo (backing)');
end $$;
