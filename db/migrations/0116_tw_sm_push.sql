-- TW-SM-PUSH: variante independiente de TW con una sola puerta basculante,
-- holgura vertical de 3,2 mm y dispositivo Push To Open.

insert into public.cot_tipos_mueble (
  pref, nombre_es, nombre_en, categoria, margen_key, margen_pct, familia_code,
  descripcion_es, descripcion_en, notas, activo, etiquetas_und, usa_carton,
  pref_imperial, pref_metrico, permite_agrupacion
)
select
  'TW-SM-PUSH', 'Mueble superior basculante con push',
  'Push-to-open lift-up wall cabinet', categoria, margen_key, margen_pct,
  familia_code, 'Mueble superior basculante con push',
  'Push-to-open lift-up wall cabinet',
  'Basado en TW. Siempre usa una puerta con 3,2 mm de holgura vertical y sin manija.',
  true, etiquetas_und, usa_carton, 'TW-SM-PUSH', 'TW-SM-PUSH', true
from public.cot_tipos_mueble
where pref = 'TW'
on conflict (pref) do update set
  nombre_es = excluded.nombre_es, nombre_en = excluded.nombre_en,
  categoria = excluded.categoria, margen_key = excluded.margen_key,
  margen_pct = excluded.margen_pct, familia_code = excluded.familia_code,
  descripcion_es = excluded.descripcion_es, descripcion_en = excluded.descripcion_en,
  notas = excluded.notas, activo = excluded.activo,
  etiquetas_und = excluded.etiquetas_und, usa_carton = excluded.usa_carton,
  pref_imperial = excluded.pref_imperial, pref_metrico = excluded.pref_metrico,
  permite_agrupacion = excluded.permite_agrupacion, updated_at = now();

do $$
declare
  v_tw uuid;
  v_new uuid;
begin
  select id into v_tw from public.cot_tipos_mueble where pref = 'TW';
  select id into v_new from public.cot_tipos_mueble where pref = 'TW-SM-PUSH';
  if v_tw is null or v_new is null then
    raise exception 'No se pudo localizar TW o crear TW-SM-PUSH';
  end if;

  delete from public.cot_piezas_plantilla where tipo_mueble_id = v_new;
  insert into public.cot_piezas_plantilla (
    tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo,
    formula_ancho, resta_largo, resta_ancho, cantos, tarugos, soportes,
    orden, notas, modo_agrupacion, clave_fusion, formula_largo_grupo, visualizacion
  )
  select
    v_new, p.nombre, p.rol_tablero,
    case when p.nombre = 'puerta' then '1' else p.formula_cantidad end,
    case when p.nombre = 'puerta' then 'L-(3.2/25.4)' else p.formula_largo end,
    case when p.nombre = 'puerta' then 'A-(3.2/25.4)' else p.formula_ancho end,
    p.resta_largo, p.resta_ancho, p.cantos, p.tarugos, p.soportes, p.orden,
    case when p.nombre = 'puerta'
      then 'Una puerta siempre; ancho y alto del mueble menos 3,2 mm.' else p.notas end,
    case
      when p.nombre = 'lateral' then 'lateral_compartido'
      when p.nombre in ('base_tapa', 'refuerzo_trasero', 'fondo') then 'continua'
      else 'local'
    end,
    case
      when p.nombre = 'base_tapa' then 'base_tapa'
      when p.nombre = 'refuerzo_trasero' then 'refuerzo_trasero'
      when p.nombre = 'fondo' then 'fondo'
      else null
    end,
    case
      when p.nombre in ('base_tapa', 'refuerzo_trasero') then 'LG-(2*TC)'
      when p.nombre = 'fondo' then 'LG-TC'
      else null
    end,
    case when p.nombre = 'puerta'
      then (p.visualizacion - 'z') || '{"confirmado":false}'::jsonb
      else p.visualizacion
    end
  from public.cot_piezas_plantilla p
  where p.tipo_mueble_id = v_tw;

  delete from public.cot_reglas_config where tipo_mueble_id = v_new;
  insert into public.cot_reglas_config
    (tipo_mueble_id, variable, condicion, valor, prioridad, activo, notas)
  values
    (v_new, 'n_patas', 'true', '0', 5, true, 'Mueble superior.'),
    (v_new, 'n_puertas', 'true', '1', 5, true, 'Siempre una puerta, sin importar el ancho.'),
    (v_new, 'n_cajones', 'true', '0', 5, true, 'Sin gavetas.'),
    (v_new, 'gola', 'true', '0', 5, true, 'El sufijo SM es propio de la tipologia; no agrega manija.');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id = v_new;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas)
  select v_new, h.rol, h.herraje_codigo, h.selector_key, '1', h.orden,
    'Heredado de TW; cantidad asociada a la puerta unica.'
  from public.cot_herrajes_plantilla h
  where h.tipo_mueble_id = v_tw and lower(h.rol) <> 'manija';

  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas)
  values (v_new, 'push', 'PUSHOPENHBM237', 'push', '1', 90,
    'Un Push To Open para la puerta basculante unica.');
end $$;
