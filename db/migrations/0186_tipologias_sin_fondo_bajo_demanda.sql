-- Crea bajo demanda una variante SF consultable en el Simulador.
-- La operacion es idempotente y serializada por prefijo para evitar duplicados.

create or replace function public.cot_asegurar_tipologia_sin_fondo(p_tipo_fuente uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fuente public.cot_tipos_mueble%rowtype;
  v_destino uuid;
  v_pref_destino text;
  v_creado boolean := false;
begin
  if not public.cot_is_authenticated() then
    raise exception 'No autorizado';
  end if;

  select * into v_fuente
  from public.cot_tipos_mueble
  where id = p_tipo_fuente and activo = true;
  if not found then raise exception 'Tipologia fuente no encontrada'; end if;

  if upper(v_fuente.pref) like '%-SF' then return v_fuente.id; end if;
  v_pref_destino := v_fuente.pref || '-SF';
  perform pg_advisory_xact_lock(hashtextextended('cot_tipo_sf:' || v_pref_destino, 0));

  select id into v_destino from public.cot_tipos_mueble where pref = v_pref_destino;
  if v_destino is not null then return v_destino; end if;

  insert into public.cot_tipos_mueble (
    pref,nombre_es,nombre_en,categoria,margen_key,margen_pct,familia_code,
    descripcion_es,descripcion_en,notas,activo,etiquetas_und,usa_carton,
    pref_imperial,pref_metrico,permite_agrupacion
  ) values (
    v_pref_destino,
    coalesce(v_fuente.nombre_es, v_fuente.pref) || ' (sin fondo)',
    coalesce(v_fuente.nombre_en, v_fuente.pref) || ' (without back panel)',
    v_fuente.categoria,v_fuente.margen_key,v_fuente.margen_pct,v_fuente.familia_code,
    'Variante SF de ' || v_fuente.pref || ': sin respaldo y con base calculada a P-TC.',
    'SF variant of ' || v_fuente.pref || ': without back panel; base depth is P-TC.',
    v_fuente.notas,v_fuente.activo,v_fuente.etiquetas_und,v_fuente.usa_carton,
    coalesce(v_fuente.pref_imperial,v_fuente.pref) || '-SF',
    coalesce(v_fuente.pref_metrico,v_fuente.pref) || '-SF',
    v_fuente.permite_agrupacion
  ) returning id into v_destino;
  v_creado := true;

  if v_creado then
    insert into public.cot_piezas_plantilla (
      tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
      resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,modo_agrupacion,
      clave_fusion,formula_largo_grupo,visualizacion
    )
    select v_destino,p.nombre,p.rol_tablero,p.formula_cantidad,
      case when lower(p.nombre)='base'
             and coalesce(p.formula_ancho,'') !~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
             and coalesce(p.formula_largo,'') ~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
           then 'P-TC' else p.formula_largo end,
      case when lower(p.nombre)='base'
             and coalesce(p.formula_ancho,'') ~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
           then 'P-TC' else p.formula_ancho end,
      p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,p.notas,
      p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo,p.visualizacion
    from public.cot_piezas_plantilla p
    where p.tipo_mueble_id=v_fuente.id and lower(p.nombre)<>'fondo';

    insert into public.cot_reglas_config
      (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
    select v_destino,variable,condicion,valor,prioridad,activo,notas
    from public.cot_reglas_config where tipo_mueble_id=v_fuente.id;

    insert into public.cot_herrajes_plantilla
      (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
    select v_destino,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas
    from public.cot_herrajes_plantilla where tipo_mueble_id=v_fuente.id;
  end if;

  if exists (select 1 from public.cot_piezas_plantilla where tipo_mueble_id=v_destino and lower(nombre)='fondo') then
    raise exception '% conserva una pieza de fondo', v_pref_destino;
  end if;
  if exists (
    select 1
    from public.cot_piezas_plantilla fuente
    join public.cot_piezas_plantilla destino on destino.tipo_mueble_id=v_destino
      and lower(destino.nombre)='base'
    where fuente.tipo_mueble_id=v_fuente.id and lower(fuente.nombre)='base'
      and (coalesce(fuente.formula_largo,'') || coalesce(fuente.formula_ancho,''))
          ~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
      and not (destino.formula_largo='P-TC' or destino.formula_ancho='P-TC')
  ) then
    raise exception 'La base de % no fue ajustada a P-TC', v_pref_destino;
  end if;
  return v_destino;
end;
$$;

revoke all on function public.cot_asegurar_tipologia_sin_fondo(uuid) from public, anon;
grant execute on function public.cot_asegurar_tipologia_sin_fondo(uuid) to authenticated;
