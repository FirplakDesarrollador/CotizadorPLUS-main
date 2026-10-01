-- SBFD-SM es una variante independiente de BFD-SM.
-- Conserva sus fórmulas, herrajes y montaje; la única diferencia es no tener
-- pieza ni regla de entrepaño. La migración nunca modifica BFD-SM.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas, activo)
values
  ('SBFD-SM', 'Mueble inferior puertas con Gola de madera sin entrepaño',
   'Base full door wood gola without shelf', 'inferior', 'muebles',
   'Tipología independiente SBFDxx-SM basada en BFD-SM, sin entrepaño.',
   'Sin manijas. Puerta A - 30 mm. Sin entrepaño; conserva la Gola de madera.', true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  nombre_en = excluded.nombre_en,
  categoria = excluded.categoria,
  margen_key = excluded.margen_key,
  descripcion_es = excluded.descripcion_es,
  notas = excluded.notas,
  activo = true,
  updated_at = now();

-- Copia las piezas vigentes de BFD-SM, incluidas las coordenadas visuales
-- confirmadas en 0083, pero excluye expresamente el entrepaño.
delete from public.cot_piezas_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBFD-SM');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
select destino.id, p.nombre, p.rol_tablero, p.formula_cantidad, p.formula_largo, p.formula_ancho,
  p.resta_largo, p.resta_ancho, p.cantos, p.tarugos, p.soportes, p.orden, p.notas, p.visualizacion
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id = p.tipo_mueble_id and origen.pref = 'BFD-SM'
join public.cot_tipos_mueble destino on destino.pref = 'SBFD-SM'
where p.nombre <> 'entrepano';

-- Se heredan las reglas BFD-SM salvo la del entrepaño, que se fija en cero.
delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBFD-SM');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id, r.variable, r.condicion, r.valor, r.prioridad, r.activo, r.notas
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id = r.tipo_mueble_id and origen.pref = 'BFD-SM'
join public.cot_tipos_mueble destino on destino.pref = 'SBFD-SM'
where r.variable <> 'n_entrepanos';

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select id, 'n_entrepanos', 'true', '0', 10, true,
  'Regla exclusiva SBFD-SM: sin entrepaño.'
from public.cot_tipos_mueble
where pref = 'SBFD-SM';

-- Mantiene exactamente los herrajes funcionales de BFD-SM (sin manijas).
delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBFD-SM');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
  'Heredado de BFD-SM; SBFD-SM no lleva entrepaño.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id = h.tipo_mueble_id and origen.pref = 'BFD-SM'
join public.cot_tipos_mueble destino on destino.pref = 'SBFD-SM';
