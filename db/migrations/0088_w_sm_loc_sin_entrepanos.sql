-- W-SM-LOC es una tipología independiente basada en el W-SM vigente.
-- Conserva todas sus fórmulas y montaje confirmado; no tiene entrepaños a
-- ninguna altura. No modifica W, W-SM ni ninguna otra variante.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas, activo)
values
  ('W-SM-LOC', 'Mueble superior Gola de madera LOC sin entrepaños',
   'Wall cabinet wood gola LOC without shelves', 'superior', 'muebles',
   'Tipología independiente WXXXX-SM-LOC basada en W-SM, sin entrepaños.',
   'Sin manijas ni entrepaños. Conserva puerta SM, fondo y montaje de W-SM.', true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  nombre_en = excluded.nombre_en,
  categoria = excluded.categoria,
  margen_key = excluded.margen_key,
  descripcion_es = excluded.descripcion_es,
  notas = excluded.notas,
  activo = true,
  updated_at = now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'W-SM-LOC');

-- Copia la plantilla W-SM tal como está vigente, menos la pieza entrepano.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
select destino.id, p.nombre, p.rol_tablero, p.formula_cantidad, p.formula_largo, p.formula_ancho,
  p.resta_largo, p.resta_ancho, p.cantos, p.tarugos, p.soportes, p.orden, p.notas, p.visualizacion
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id = p.tipo_mueble_id and origen.pref = 'W-SM'
join public.cot_tipos_mueble destino on destino.pref = 'W-SM-LOC'
where p.nombre <> 'entrepano';

delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'W-SM-LOC');

-- Hereda reglas exclusivas W-SM excepto n_entrepanos, que LOC fija en cero.
insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id, r.variable, r.condicion, r.valor, r.prioridad, r.activo, r.notas
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id = r.tipo_mueble_id and origen.pref = 'W-SM'
join public.cot_tipos_mueble destino on destino.pref = 'W-SM-LOC'
where r.variable <> 'n_entrepanos';

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select id, 'n_entrepanos', 'true', '0', 10, true,
  'Regla exclusiva W-SM-LOC: sin entrepaños a ninguna altura.'
from public.cot_tipos_mueble
where pref = 'W-SM-LOC';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'W-SM-LOC');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
  'Heredado de W-SM; W-SM-LOC no lleva entrepaños.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id = h.tipo_mueble_id and origen.pref = 'W-SM'
join public.cot_tipos_mueble destino on destino.pref = 'W-SM-LOC';
