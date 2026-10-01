-- ============================================================================
-- Cotizador PLUS — PCFD paramétrico con gavetas ocultas y entrepaños editables.
-- Fuente: Simulación muebles CEMA (1).xlsx, filas 5448-5451.
--
-- Modo estándar: n_cajones=0, n_entrepanos=5.
-- Modo OP: el usuario define n_cajones (2OP/4OP observados), n_entrepanos y
-- zocalo (4.5" para TK4). La plantilla conserva compatibilidad con PCFD sin OP.
-- ============================================================================

insert into public.cot_herrajes
  (codigo, nombre, categoria, selector_key, precio, unidad, notas)
values
  (
    'PUSHOPENHBM237',
    'Dispositivo PUSH TO OPEN imán HBM237-02',
    'push',
    'push',
    5600,
    'und',
    'CEMA costos unitarios; PCFD OP filas 5448-5451: 2 unidades = COP 11.200'
  )
on conflict (codigo) do update
set nombre = excluded.nombre,
    categoria = excluded.categoria,
    selector_key = excluded.selector_key,
    precio = excluded.precio,
    unidad = excluded.unidad,
    notas = excluded.notas,
    updated_at = now();

do $$
declare
  v_pcfd uuid;
begin
  select id into v_pcfd
  from public.cot_tipos_mueble
  where pref = 'PCFD';

  if v_pcfd is null then
    raise exception 'No existe el tipo de mueble PCFD';
  end if;

  update public.cot_tipos_mueble
  set nombre_es = 'Torre/alacena puerta completa, gavetas OP opcionales',
      activo = true
  where id = v_pcfd;

  -- Valores automáticos conservadores. Los formularios aplican los presets
  -- 2OP/4OP como overrides editables sin alterar el PCFD estándar.
  delete from public.cot_reglas_config
  where tipo_mueble_id = v_pcfd
    and variable in ('n_puertas', 'n_cajones', 'n_entrepanos');

  insert into public.cot_reglas_config
    (tipo_mueble_id, variable, condicion, valor, prioridad, notas)
  values
    (v_pcfd, 'n_puertas', 'L < 24', '1', 5, 'PCFD CEMA: menos de 24 in usa una puerta'),
    (v_pcfd, 'n_puertas', 'true', '2', 10, 'PCFD CEMA: desde 24 in usa dos puertas'),
    (v_pcfd, 'n_cajones', 'true', '0', 5, 'PCFD estándar sin gavetas; override editable para OP'),
    (v_pcfd, 'n_entrepanos', 'true', '5', 5, 'PCFD estándar; override editable, OP observado usa 3');

  delete from public.cot_piezas_plantilla
  where tipo_mueble_id = v_pcfd;

  insert into public.cot_piezas_plantilla
    (
      tipo_mueble_id, nombre, rol_tablero, formula_cantidad,
      formula_largo, formula_ancho, cantos, tarugos, soportes, orden, notas
    )
  values
    (
      v_pcfd, 'lateral', 'caja', '2',
      'A-zocalo', 'P',
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,
      0, 0, 10, 'CEMA OP: laterales descuentan TK; TK4=4.5 in'
    ),
    (
      v_pcfd, 'base_tapa_division', 'caja', 'n_cajones>0 ? 3 : 2',
      'L-1.18', 'P-0.9',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,
      8, 0, 20, 'OP agrega una división horizontal: 3 piezas; estándar conserva 2'
    ),
    (
      v_pcfd, 'refuerzo_trasero', 'refuerzo', '3',
      'L-1.18', '3.25',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,
      4, 0, 30, 'Tres refuerzos traseros según CEMA'
    ),
    (
      v_pcfd, 'entrepano', 'refuerzo', 'n_entrepanos',
      'L-1.18', 'P-1.54',
      '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,
      0, 4, 40, 'Cantidad editable; las variantes OP observadas usan 3'
    ),
    (
      v_pcfd, 'puerta_estandar', 'frente', 'n_cajones<=0 ? n_puertas : 0',
      'L/n_puertas', 'A-zocalo',
      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,
      0, 0, 50, 'Frente del PCFD estándar sin gavetas'
    ),
    (
      v_pcfd, 'frente_area_op', 'frente', 'n_cajones>0 ? 1 : 0',
      'L', '(A-5.25)*1.25',
      '{}'::jsonb,
      0, 0, 60, 'Área agregada CEMA de puertas y frentes para 2OP/4OP'
    ),
    (
      v_pcfd, 'frente_canto_puertas_op', null, 'n_cajones>0 ? n_puertas : 0',
      'L', '(A-5.25)/n_puertas',
      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,
      0, 0, 70, 'Solo canto; reproduce AR/BN de CEMA'
    ),
    (
      v_pcfd, 'frente_canto_gavetas_op', null, 'n_cajones',
      'L', 'n_cajones>0 ? (A-5.25)/n_cajones : 0',
      '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,
      0, 0, 80, 'Solo canto; cantidad editable de frentes ocultos'
    ),
    (
      v_pcfd, 'base_gaveta', 'refuerzo', 'n_cajones',
      'L-2.95', 'P-4.63',
      '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,
      0, 0, 90, 'Una base por gaveta'
    ),
    (
      v_pcfd, 'trasero_gaveta', 'refuerzo', 'n_cajones',
      'L-3.427', '2.6875',
      '{"calibre":"19x0,45","largos":2,"anchos":0,"despEdges":0}'::jsonb,
      0, 0, 100, 'Un trasero por gaveta'
    ),
    (
      v_pcfd, 'frente_delgado_informativo_op', null, 'n_cajones>0 ? 1 : 0',
      'L', '5.25',
      '{}'::jsonb,
      0, 0, 110, 'Área CEMA de 5.5 mm = L*5.25; informativa porque el Excel no la costea'
    ),
    (
      v_pcfd, 'fondo', 'fondo', '1',
      'L-0.59', 'n_cajones>0 ? A-5.25 : A-zocalo',
      '{}'::jsonb,
      0, 0, 120, 'Fondo OP usa descuento fijo CEMA de 5.25 in'
    );

  delete from public.cot_herrajes_plantilla
  where tipo_mueble_id = v_pcfd;

  insert into public.cot_herrajes_plantilla
    (
      tipo_mueble_id, rol, herraje_codigo, selector_key,
      formula_cantidad, orden, notas
    )
  values
    (v_pcfd, 'pata', 'PATA10AJUST', 'pata', 'n_patas', 10, 'Cuatro patas por defecto'),
    (v_pcfd, 'tornillo', 'TORNILLO858', 'tornillo', 'n_patas*4', 20, 'Cuatro tornillos por pata'),
    (v_pcfd, 'bisagra', 'BISAGRAPAR', 'bisagra', 'n_cajones>0 ? n_puertas*2 : n_puertas', 30, 'OP usa dos pares por puerta alta'),
    (v_pcfd, 'manija', 'MANIJA415', 'manija', 'n_cajones>0 ? 0 : n_puertas', 40, 'Las variantes OP-PUSH no usan manijas'),
    (v_pcfd, 'riel', 'RIELTANDEM', 'riel', 'n_cajones', 50, 'Un par de rieles por gaveta'),
    (v_pcfd, 'push', 'PUSHOPENHBM237', 'push', 'n_cajones>0 ? 2 : 0', 60, 'Dos dispositivos magnéticos para PCFD OP');
end $$;

