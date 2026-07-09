-- ============================================================================
-- Cotizador PLUS — Roles de tablero correctos (caja/refuerzo/frente/fondo) +
-- re-encode SBFD + encode B. Verificado contra Excel (SBFD33=144915, B33=173716).
-- Roles según columna de material del Excel:
--   caja=Balance15 (laterales+base+refuerzo vert. delantero)
--   refuerzo=Polar15 (refuerzo trasero/horizontal, entrepaño, gaveta)
--   frente=Color18 (puertas + frente cajón)
--   fondo=backing
-- Piezas "canto-only" (rol nulo) aportan solo canto (p.ej. canto del frente de cajón).
-- ============================================================================

-- Preset de materiales por defecto (config estándar del Excel)
insert into public.cot_parametros (key, value, descripcion) values
  ('preset_default',
   '{"caja":"ECOCARB15COLOR","refuerzo":"ECOCARB15ARLINGTON","frente":"ECOCARB18COLOR","fondo":"PRICARB6CANDELARIA (POLAR)"}'::jsonb,
   'Tablero por defecto por rol (config estándar CEMA).')
on conflict (key) do update set value = excluded.value, descripcion = excluded.descripcion, updated_at = now();

-- ---- SBFD (re-encode con roles correctos) ----
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref = 'SBFD';
  delete from public.cot_piezas_plantilla where tipo_mueble_id = v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, tarugos, soportes, orden, notas) values
    (v, 'lateral',            'caja',     '2',         'A',           'P',     '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 0, 10, 'Laterales (Balance)'),
    (v, 'base',               'caja',     '1',         'L-1.18',      'P-0.9', '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 8, 0, 20, 'Base (Balance)'),
    (v, 'refuerzo_delantero', 'caja',     '1',         'L-1.18',      '5',     '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 30, 'Refuerzo vertical delantero (Balance)'),
    (v, 'refuerzo_trasero',   'refuerzo', '2',         'L-1.18',      '3.25',  '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 40, 'Refuerzos traseros (Polar)'),
    (v, 'frente',             'frente',   'n_puertas', 'L/n_puertas', 'A',     '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,    0, 0, 50, 'Puertas'),
    (v, 'fondo',              'fondo',    '1',         'L-0.59',      'A',     '{}'::jsonb,                                          0, 0, 60, 'Fondo');
end $$;

-- ---- B (Base: 1 gaveta, 2 puertas, 1/2 entrepaño) ----
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref = 'B';
  delete from public.cot_piezas_plantilla where tipo_mueble_id = v;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, tarugos, soportes, orden, notas) values
    (v, 'lateral',             'caja',     '2',         'A',           'P',      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 0, 10, 'Laterales (Balance)'),
    (v, 'base',                'caja',     '1',         'L-1.18',      'P-0.9',  '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 8, 0, 20, 'Base (Balance)'),
    (v, 'refuerzo_trasero',    'refuerzo', '2',         'L-1.18',      '3.25',   '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 30, 'Refuerzos traseros (Polar)'),
    (v, 'refuerzo_horizontal', 'refuerzo', '2',         'L-1.18',      '3.25',   '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 40, 'Refuerzos horizontal delantero (Polar)'),
    (v, 'entrepano',           'refuerzo', '1',         'L-1.181',     'P*0.5',  '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 4, 50, '1/2 entrepaño (Polar)'),
    (v, 'base_gaveta',         'refuerzo', '1',         'L-2.95',      'P-4.63', '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 0, 0, 60, 'Base de gaveta (Polar)'),
    (v, 'trasero_gaveta',      'refuerzo', '1',         'L-3.427',     '2.6875', '{"calibre":"19x0,45","largos":2,"anchos":0,"despEdges":0}'::jsonb, 0, 0, 70, 'Trasero de gaveta (Polar)'),
    (v, 'frente',              'frente',   'n_puertas', 'L/n_puertas', 'A',      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,    0, 0, 80, 'Puertas'),
    (v, 'frente_cajon',        null,       '1',         'L',           '0',      '{"calibre":"22x1","largos":2,"anchos":0,"despEdges":4}'::jsonb, 0, 0, 90, 'Frente de cajón (solo canto)'),
    (v, 'fondo',               'fondo',    '1',         'L-0.59',      'A',      '{}'::jsonb,                                          0, 0, 100, 'Fondo');
end $$;
