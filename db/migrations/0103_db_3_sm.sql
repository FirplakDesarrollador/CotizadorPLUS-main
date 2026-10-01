-- DB-3-SM: variante independiente de DB-2-SM con tres gavetas iguales.
-- Conserva una sola fila para frente, base_gaveta y trasero_gaveta. Mantiene
-- dos pares refuerzo/Gola: superior y entre la segunda y tercera gaveta.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas, activo)
values
  ('DB-3-SM', 'Mueble inferior cajonera 3 gavetas con Gola',
   'Three-drawer base with wood gola', 'inferior', 'muebles',
   'Tipologia independiente DBXX-3-SM: tres gavetas iguales.',
   'Sin manijas. Dos Golas de madera: superior y entre la segunda y tercera gaveta.', true)
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
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB-3-SM');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion,
   modo_agrupacion,clave_fusion,formula_largo_grupo)
select destino.id,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
  p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,p.notas,p.visualizacion,
  p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id = p.tipo_mueble_id and origen.pref = 'DB-2-SM'
join public.cot_tipos_mueble destino on destino.pref = 'DB-3-SM';

update public.cot_piezas_plantilla p
set formula_cantidad = case
      when p.nombre = 'base_gaveta' then '3'
      when p.nombre = 'lateral_gaveta' then '6'
      when p.nombre in ('refuerzo_delantero','gola_madera') then '2'
      else p.formula_cantidad
    end,
    notas = case
      when p.nombre = 'frente' then 'DB-3-SM: tres frentes iguales.'
      when p.nombre = 'base_gaveta' then 'DB-3-SM: tres bases de gaveta iguales.'
      when p.nombre = 'trasero_gaveta' then 'DB-3-SM: tres traseros iguales de 183 mm.'
      when p.nombre in ('refuerzo_delantero','gola_madera') then 'DB-3-SM: par superior y par entre la segunda y tercera gaveta.'
      else p.notas
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-3-SM';

delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB-3-SM');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,r.notas
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id = r.tipo_mueble_id and origen.pref = 'DB-2-SM'
join public.cot_tipos_mueble destino on destino.pref = 'DB-3-SM';

update public.cot_reglas_config r
set valor = case r.variable
      when 'n_cajones' then '3'
      when 'n_cajones_pequenos' then '0'
      when 'n_barras' then '3'
      else r.valor
    end,
    notas = case r.variable
      when 'n_cajones' then 'DB-3-SM: tres gavetas iguales.'
      when 'n_cajones_pequenos' then 'DB-3-SM: sin gavetas pequenas.'
      when 'n_barras' then 'Un par de barras por cada trasero de 183 mm.'
      else r.notas
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = r.tipo_mueble_id
  and t.pref = 'DB-3-SM';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB-3-SM');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,
  'Heredado de DB-2-SM para DB-3-SM.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id = h.tipo_mueble_id and origen.pref = 'DB-2-SM'
join public.cot_tipos_mueble destino on destino.pref = 'DB-3-SM';
