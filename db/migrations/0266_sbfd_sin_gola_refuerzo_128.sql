-- SBFD: copia curada de SBFD-SM sin gola de madera.
-- Refuerzo delantero de 128 mm inmediatamente detrás de los frentes (y = 0),
-- puerta con reveal de 3,2 mm desde arriba (A-RV) y manijas por puerta.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  origen public.cot_tipos_mueble%rowtype;
  destino public.cot_tipos_mueble%rowtype;
begin
  select * into strict origen from public.cot_tipos_mueble where pref = 'SBFD-SM' and activo;
  select * into strict destino from public.cot_tipos_mueble where pref = 'SBFD';

  -- Se conserva la identidad de la fila (id y prefijos) para no romper
  -- referencias históricas; solo se actualiza su configuración.
  update public.cot_tipos_mueble set
    nombre_es = 'Mueble inferior lavaplatos con puertas, sin gola',
    nombre_en = 'Sink base full door, no gola',
    categoria = origen.categoria,
    margen_key = origen.margen_key,
    margen_pct = origen.margen_pct,
    familia_code = origen.familia_code,
    descripcion_es = 'Copia de SBFD-SM sin gola: refuerzo delantero de 128 mm inmediatamente detrás de los frentes y puerta con reveal de 3,2 mm arriba.',
    descripcion_en = 'SBFD-SM copy without gola: 128 mm front rail immediately behind the fronts and 3.2 mm top reveal on the door.',
    notas = 'Sin gola de madera; una manija por puerta.',
    activo = true,
    etiquetas_und = origen.etiquetas_und,
    usa_carton = origen.usa_carton,
    permite_agrupacion = origen.permite_agrupacion,
    grupo_optimizador = origen.grupo_optimizador,
    updated_at = now()
  where id = destino.id;

  delete from public.cot_piezas_plantilla where tipo_mueble_id = destino.id;
  insert into public.cot_piezas_plantilla
  select (jsonb_populate_record(null::public.cot_piezas_plantilla,
    to_jsonb(p) || jsonb_build_object(
      'id', gen_random_uuid(),
      'tipo_mueble_id', destino.id,
      'created_at', now(),
      'updated_at', now()))).*
  from public.cot_piezas_plantilla p where p.tipo_mueble_id = origen.id;

  delete from public.cot_reglas_config where tipo_mueble_id = destino.id;
  insert into public.cot_reglas_config
  select (jsonb_populate_record(null::public.cot_reglas_config,
    to_jsonb(r) || jsonb_build_object(
      'id', gen_random_uuid(),
      'tipo_mueble_id', destino.id,
      'created_at', now(),
      'updated_at', now()))).*
  from public.cot_reglas_config r where r.tipo_mueble_id = origen.id;

  delete from public.cot_herrajes_plantilla where tipo_mueble_id = destino.id;
  insert into public.cot_herrajes_plantilla
  select (jsonb_populate_record(null::public.cot_herrajes_plantilla,
    to_jsonb(h) || jsonb_build_object(
      'id', gen_random_uuid(),
      'tipo_mueble_id', destino.id,
      'created_at', now(),
      'updated_at', now()))).*
  from public.cot_herrajes_plantilla h where h.tipo_mueble_id = origen.id;

  -- Sin gola: se retira la pieza de madera que acompaña a SBFD-SM.
  delete from public.cot_piezas_plantilla
  where tipo_mueble_id = destino.id and nombre = 'gola_madera';

  -- Refuerzo delantero de 128 mm (5.03937 in) pegado a la cara posterior de
  -- los frentes: y = 0 en el montaje.
  update public.cot_piezas_plantilla set
    formula_ancho = '128/25.4',
    resta_ancho = 0,
    notas = 'Refuerzo delantero de 128 mm inmediatamente detrás de los frentes.',
    visualizacion = coalesce(visualizacion, '{}'::jsonb) ||
      '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"y":"0","nota":"Refuerzo vertical de 128 mm en contacto con la cara posterior de los frentes.","confirmado":true}'::jsonb,
    updated_at = now()
  where tipo_mueble_id = destino.id and nombre = 'refuerzo_delantero';

  -- Puerta con reducción de 3,2 mm desde la parte superior.
  update public.cot_piezas_plantilla set
    formula_ancho = 'A-RV',
    resta_ancho = 0,
    notas = 'Puerta con reveal de 3,2 mm arriba (A-RV).',
    updated_at = now()
  where tipo_mueble_id = destino.id and nombre = 'frente';

  -- Sin gola la puerta vuelve a llevar manija.
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas)
  values
    (destino.id, 'manija', 'MANIJA415', 'manija', 'n_puertas + n_cajones', 40,
     'Una manija por puerta y cajón');
end $$;

do $$
declare
  destino uuid;
begin
  select id into strict destino from public.cot_tipos_mueble where pref = 'SBFD' and activo;

  if (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id = destino) <> 6 then
    raise exception 'SBFD debe quedar con seis piezas (sin gola)';
  end if;
  if exists (select 1 from public.cot_piezas_plantilla where tipo_mueble_id = destino and nombre = 'gola_madera') then
    raise exception 'SBFD no debe conservar la gola de madera';
  end if;
  if not exists (
    select 1 from public.cot_piezas_plantilla
    where tipo_mueble_id = destino and nombre = 'refuerzo_delantero'
      and formula_ancho = '128/25.4' and coalesce(visualizacion->>'y', '') = '0'
  ) then
    raise exception 'El refuerzo delantero de SBFD debe medir 128 mm y estar inmediatamente detrás de los frentes';
  end if;
  if not exists (
    select 1 from public.cot_piezas_plantilla
    where tipo_mueble_id = destino and nombre = 'frente' and formula_ancho = 'A-RV'
  ) then
    raise exception 'La puerta de SBFD debe reducir 3,2 mm desde arriba (A-RV)';
  end if;
  if not exists (
    select 1 from public.cot_herrajes_plantilla
    where tipo_mueble_id = destino and rol = 'manija'
  ) then
    raise exception 'SBFD sin gola debe conservar la manija';
  end if;
  if not exists (
    select 1 from public.cot_reglas_config
    where tipo_mueble_id = destino and variable = 'n_entrepanos' and valor = '0'
  ) then
    raise exception 'SBFD debe conservar la regla sin entrepaño de SBFD-SM';
  end if;
end $$;
commit;
