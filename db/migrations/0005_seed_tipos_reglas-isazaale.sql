-- ============================================================================
-- Cotizador PLUS — Tipos de mueble (piloto) + reglas paramétricas documentadas
-- Reglas tomadas de la hoja 'dibujo cocina':
--   Puertas:   hasta 21" de largo = 1 puerta; >= 24" = 2 puertas.
--   Entrepaños: 0 hasta 16" alto; 1 de 17-24; 2 de 25-36; 3 hasta 42.
-- ============================================================================

-- ---- Tipos de mueble piloto ----
insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code) values
  -- Inferiores cocina
  ('B',    'Mueble inferior 1 cajón y puertas (Base)',        'Base cabinet',            'inferior', 'muebles', 'COC01'),
  ('BFD',  'Mueble inferior puertas (Base Full Door)',        'Base Full Door',          'inferior', 'muebles', 'COC01'),
  ('SBFD', 'Mueble inferior lavaplatos (Sink Base Full Door)','Sink Base Full Door',     'inferior', 'muebles', 'COC01'),
  ('DB',   'Mueble inferior cajonera (Drawer Base)',          'Drawer Base',             'inferior', 'muebles', 'COC01'),
  ('OVPC', 'Alacena para horno (Oven Pantry)',                'Oven Pantry Cabinet',     'inferior', 'muebles', 'COC01'),
  -- Superiores cocina
  ('W',    'Mueble superior de pared (Wall cabinet)',         'Wall cabinet',            'superior', 'muebles', 'COC01'),
  -- Vanities baño
  ('SVFD', 'Mueble inferior lavamanos puertas (Sink Vanity Full Door)', 'Sink Vanity Full Door', 'vanity', 'muebles', null),
  ('V',    'Mueble inferior baño 1 cajón 2 puertas (Vanity)', 'Vanity',                  'vanity',   'muebles', null),
  ('VDF',  'Mueble inferior baño cajones (Vanity Drawer)',    'Vanity Drawer Full',      'vanity',   'muebles', null),
  -- Complementos
  ('F',    'Relleno (Filler)',                                'Filler',                  'filler',   'fillers', null),
  ('PN',   'Panel (Panel)',                                   'Panel',                   'panel',    'pn_tk',   null),
  ('TK',   'Zócalo (Toe Kick)',                               'Toe Kick',                'zocalo',   'pn_tk',   null)
on conflict (pref) do update set
  nombre_es=excluded.nombre_es, nombre_en=excluded.nombre_en, categoria=excluded.categoria,
  margen_key=excluded.margen_key, familia_code=excluded.familia_code, updated_at=now();

-- ---- Reglas paramétricas globales (tipo_mueble_id = null) ----
-- Semántica del motor: para cada 'variable', se evalúan las reglas activas ordenadas
-- por prioridad ascendente y gana la PRIMERA cuya 'condicion' sea verdadera.
-- Variables disponibles en condicion/valor: L (largo), A (alto), P (profundidad).

delete from public.cot_reglas_config where tipo_mueble_id is null
  and variable in ('n_puertas','n_entrepanos');

insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, notas) values
  -- Nº de puertas según ancho/largo
  (null, 'n_puertas', 'L <= 21', '1', 10, 'dibujo cocina: hasta 21" = 1 puerta'),
  (null, 'n_puertas', 'L >= 24', '2', 20, 'dibujo cocina: >=24" = 2 puertas'),
  (null, 'n_puertas', 'true',    '1', 99, 'Default (22-23"): 1 puerta'),
  -- Nº de entrepaños según altura
  (null, 'n_entrepanos', 'A <= 16', '0', 10, 'dibujo cocina: sin entrepaño hasta 16"'),
  (null, 'n_entrepanos', 'A <= 24', '1', 20, 'dibujo cocina: 1 entrepaño de 17 a 24"'),
  (null, 'n_entrepanos', 'A <= 36', '2', 30, 'dibujo cocina: 2 entrepaños de 25 a 36"'),
  (null, 'n_entrepanos', 'true',    '3', 99, 'dibujo cocina: 3 entrepaños hasta 42"');
