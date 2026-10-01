-- WSM: tipologia superior independiente segun la hoja WSM93614.
-- Se basa en la estructura vigente de W-SM, pero no modifica esa tipologia.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas, activo)
values
  ('WSM', 'Mueble superior WSM de 14 pulgadas',
   '14-inch WSM wall cabinet', 'superior', 'muebles',
   'Tipologia independiente WSM: codigo WSM + ancho + alto + profundidad.',
   'Profundidad predeterminada 14 in. Puerta de alto A y laterales de alto A-1 in.', true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es, nombre_en = excluded.nombre_en,
  categoria = excluded.categoria, margen_key = excluded.margen_key,
  descripcion_es = excluded.descripcion_es, notas = excluded.notas,
  activo = true, updated_at = now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WSM');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion,
   modo_agrupacion,clave_fusion,formula_largo_grupo)
select destino.id,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
  p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,p.notas,p.visualizacion,
  p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id = p.tipo_mueble_id and origen.pref = 'W-SM'
join public.cot_tipos_mueble destino on destino.pref = 'WSM'
where p.nombre <> 'gola_madera';

update public.cot_piezas_plantilla p
set formula_largo = case p.nombre
      when 'lateral' then 'A-1'
      when 'frente' then '(L-n_puertas*RV)/n_puertas'
      when 'fondo' then 'A-1.866142'
      else p.formula_largo
    end,
    formula_ancho = case p.nombre
      when 'lateral' then 'P'
      when 'entrepano' then 'P-1.73622'
      when 'frente' then 'A'
      when 'fondo' then 'L-0.866142'
      else p.formula_ancho
    end,
    cantos = case
      when p.nombre in ('base','tapa','lateral','entrepano') then '{"calibre":"22x1","largos":2,"anchos":2,"forceCalibre":true}'::jsonb
      when p.nombre = 'refuerzo_trasero' then '{"calibre":"22x1","largos":2,"anchos":0,"forceCalibre":true}'::jsonb
      when p.nombre = 'frente' then '{"calibre":"22x1","largos":2,"anchos":2,"forceCalibre":true}'::jsonb
      else p.cantos
    end,
    notas = case p.nombre
      when 'lateral' then 'WSM: lateral una pulgada menor que el alto nominal.'
      when 'entrepano' then 'WSM: profundidad 311,5 mm cuando P=14 in.'
      when 'frente' then 'WSM: puerta con el alto nominal completo A.'
      when 'fondo' then 'WSM: fondo 867 x 206,6 mm para WSM93614.'
      else p.notas
    end,
    visualizacion = case p.nombre
      when 'lateral' then '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":true}'::jsonb
      when 'entrepano' then '{"version":1,"funcion":"estante","plano":"XY","y":"P-TC-TB-D","confirmado":true}'::jsonb
      when 'frente' then '{"version":1,"funcion":"frente","plano":"XZ","z":"A-H","confirmado":true}'::jsonb
      when 'fondo' then '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}'::jsonb
      else p.visualizacion
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id and t.pref = 'WSM';

delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WSM');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,
  'Heredado de W-SM para WSM; W-SM no se modifica.'
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id = r.tipo_mueble_id and origen.pref = 'W-SM'
join public.cot_tipos_mueble destino on destino.pref = 'WSM';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'WSM');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,
  'Heredado de W-SM para WSM.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id = h.tipo_mueble_id and origen.pref = 'W-SM'
join public.cot_tipos_mueble destino on destino.pref = 'WSM';
