-- DB-2-1INT-SM: dos frentes exteriores iguales y una gaveta interior.
-- Derivada de DB-2S-SM porque comparte tres cajas Tandem (dos pequenas y una
-- grande), pero la fachada se resuelve con dos frentes exteriores de 351 mm
-- para A=30 y un frente interior de 100 mm, segun la hoja DB22-2+INT SM.

insert into public.cot_tipos_mueble
  (pref, nombre_es, nombre_en, categoria, margen_key, descripcion_es, notas,
   activo, etiquetas_und, usa_carton, pref_imperial, pref_metrico,
   permite_agrupacion)
values
  ('DB-2-1INT-SM', 'Mueble inferior cajonera 2 gavetas + 1 interior con Gola',
   'Two-front drawer base with one inner drawer and wood gola',
   'inferior', 'muebles',
   'Tipologia independiente DBXX-2-1INT-SM: dos frentes exteriores iguales y una gaveta interior.',
   'Sin manijas. Tres cajas Tandem, una Gola de madera y un par de barras.',
   true, 4, true, null, null, true)
on conflict (pref) do update set
  nombre_es = excluded.nombre_es,
  nombre_en = excluded.nombre_en,
  categoria = excluded.categoria,
  margen_key = excluded.margen_key,
  descripcion_es = excluded.descripcion_es,
  notas = excluded.notas,
  activo = true,
  etiquetas_und = excluded.etiquetas_und,
  usa_carton = excluded.usa_carton,
  permite_agrupacion = true,
  updated_at = now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id = (
  select id from public.cot_tipos_mueble where pref = 'DB-2-1INT-SM'
);

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion,
   modo_agrupacion,clave_fusion,formula_largo_grupo)
select destino.id,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
  p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,p.notas,p.visualizacion,
  p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen
  on origen.id = p.tipo_mueble_id and origen.pref = 'DB-2S-SM'
join public.cot_tipos_mueble destino on destino.pref = 'DB-2-1INT-SM';

-- Para esta variante solo se usan los dos frentes exteriores y el frente
-- interior. Las plantillas pequena/grande de DB-2S-SM producirian duplicados.
delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-1INT-SM'
  and p.nombre in ('frente','frente_gaveta_pequena','frente_gaveta_grande');

update public.cot_piezas_plantilla p
set formula_cantidad = case
      when p.nombre = 'refuerzo_delantero' then '1'
      when p.nombre = 'gola_madera' then '1'
      else p.formula_cantidad
    end,
    notas = case
      when p.nombre = 'refuerzo_delantero' then 'DB-2-1INT-SM: un rail delantero superior.'
      when p.nombre = 'gola_madera' then 'DB-2-1INT-SM: una Gola de madera entre los dos frentes exteriores.'
      when p.nombre = 'frente_gaveta_exterior' then 'DB-2-1INT-SM: dos frentes exteriores iguales; 351 x 555,6 mm para DB22.'
      when p.nombre = 'frente_gaveta_interior' then 'DB-2-1INT-SM: frente interior de 100 mm; 100 x 525,6 mm para DB22.'
      else p.notas
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-1INT-SM';

delete from public.cot_reglas_config
where tipo_mueble_id = (
  select id from public.cot_tipos_mueble where pref = 'DB-2-1INT-SM'
);

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,r.notas
from public.cot_reglas_config r
join public.cot_tipos_mueble origen
  on origen.id = r.tipo_mueble_id and origen.pref = 'DB-2S-SM'
join public.cot_tipos_mueble destino on destino.pref = 'DB-2-1INT-SM';

update public.cot_reglas_config r
set valor = case r.variable
      when 'n_cajones' then '3'
      when 'n_cajones_pequenos' then '2'
      when 'n_cajones_ocultos' then '1'
      when 'n_barras' then '1'
      else r.valor
    end,
    notas = case r.variable
      when 'n_cajones' then 'DB-2-1INT-SM: tres cajas de gaveta.'
      when 'n_cajones_pequenos' then 'Dos cajas pequenas: superior e interior.'
      when 'n_cajones_ocultos' then 'Una gaveta interior detras del frente superior.'
      when 'n_barras' then 'Un par de barras para la caja grande de 183 mm.'
      when 'gola' then 'DB-2-1INT-SM usa una Gola de madera.'
      else r.notas
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = r.tipo_mueble_id
  and t.pref = 'DB-2-1INT-SM';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (
  select id from public.cot_tipos_mueble where pref = 'DB-2-1INT-SM'
);

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,
  'Heredado de DB-2S-SM para DB-2-1INT-SM.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen
  on origen.id = h.tipo_mueble_id and origen.pref = 'DB-2S-SM'
join public.cot_tipos_mueble destino on destino.pref = 'DB-2-1INT-SM';

do $$
declare
  v_tipo uuid;
begin
  select id into v_tipo from public.cot_tipos_mueble where pref = 'DB-2-1INT-SM';
  if v_tipo is null then raise exception 'No se creo DB-2-1INT-SM'; end if;
  if (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='frente_gaveta_exterior') <> 1
     or (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='frente_gaveta_interior') <> 1 then
    raise exception 'DB-2-1INT-SM debe conservar una plantilla de frente exterior y una interior';
  end if;
end $$;
