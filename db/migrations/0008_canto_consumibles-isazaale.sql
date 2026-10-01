-- ============================================================================
-- Cotizador PLUS — Modelo de canto por aristas + consumibles (tarugos, soportes,
-- cartón, etiquetas). Verificado contra Excel (SBFD33).
--
-- Canto por pieza (jsonb 'cantos'): {"calibre","largos","anchos"} = nº de aristas
--   enchapadas a lo largo de cada dimensión. Longitud_cm por rol de canto =
--   Σ cant*(largos*largoIn + anchos*anchoIn)*2.54 + (n_aristas*5cm de desperdicio).
--   Costo = (long_cm/100) * precio_canto.  calibre->cot_cantos.calibre.
-- Frente se modela como n_puertas piezas de (L/n_puertas) x A: mantiene el área
--   total (L*A) y reproduce el perímetro de canto exacto.
-- Consumibles por pieza: tarugos, soportes (nº por unidad de pieza).
-- ============================================================================

alter table public.cot_piezas_plantilla
  add column if not exists tarugos  numeric not null default 0,
  add column if not exists soportes numeric not null default 0;

alter table public.cot_tipos_mueble
  add column if not exists etiquetas_und int not null default 4;

create unique index if not exists uq_cot_herrajes_codigo on public.cot_herrajes (codigo);

-- Consumibles como insumos (costos unitarios del Excel)
insert into public.cot_herrajes (codigo, nombre, categoria, selector_key, precio, unidad, notas) values
  ('TARUGO8x30', 'Tarugo preimpregnado 8x30mm', 'consumible', 'tarugo',   142.56, 'und', 'costos unitarios B31'),
  ('CARTON',     'Lámina cartón protección',     'consumible', 'carton',   6886,   'und', 'costos unitarios B29'),
  ('ETIQUETA',   'Etiqueta',                      'consumible', 'etiqueta', 594,    'und', 'costos unitarios B30'),
  ('SOPORTE5x9', 'Soporte entrepaño 5x9 L',       'consumible', 'soporte',  47,     'und', 'costos unitarios B32')
on conflict (codigo) do update set precio=excluded.precio, nombre=excluded.nombre, updated_at=now();

-- Reescribir piezas SBFD con canto por aristas + consumibles
do $$
declare v_tipo uuid;
begin
  select id into v_tipo from public.cot_tipos_mueble where pref = 'SBFD';
  delete from public.cot_piezas_plantilla where tipo_mueble_id = v_tipo;

  insert into public.cot_piezas_plantilla
    (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, tarugos, soportes, orden, notas) values
    (v_tipo, 'lateral',            'caja',   '2',           'A',               'P',     '{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb, 0, 0, 10, 'Laterales: Alto x Prof'),
    (v_tipo, 'base',               'caja',   '1',           'L-1.18',          'P-0.9', '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 8, 0, 20, 'Base; 8 tarugos'),
    (v_tipo, 'refuerzo_trasero',   'caja',   '2',           'L-1.18',          '3.25',  '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 30, 'Refuerzos traseros; 4 tarugos c/u'),
    (v_tipo, 'refuerzo_delantero', 'caja',   '1',           'L-1.18',          '5',     '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 4, 0, 40, 'Refuerzo delantero; 4 tarugos'),
    (v_tipo, 'frente',             'frente', 'n_puertas',   'L/n_puertas',     'A',     '{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,    0, 0, 50, 'Puertas: n_puertas piezas de (L/n) x A'),
    (v_tipo, 'fondo',              'fondo',  '1',           'L-0.59',          'A',     '{}'::jsonb,                                          0, 0, 60, 'Fondo (backing), sin canto');
end $$;
