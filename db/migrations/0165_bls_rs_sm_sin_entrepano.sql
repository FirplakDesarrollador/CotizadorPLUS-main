-- BLS-RS-SM: copia exacta de BLS sin la pieza entrepano.
insert into public.cot_tipos_mueble
  (pref,nombre_es,nombre_en,categoria,margen_key,familia_code,descripcion_es,
   descripcion_en,notas,activo,etiquetas_und,usa_carton,pref_imperial,
   pref_metrico,permite_agrupacion)
select
  'BLS-RS-SM',
  'BLS-RS-SM — Mueble inferior esquinero Lazy Susan sin entrepaño',
  'Lazy Susan base cabinet without shelf',
  categoria,margen_key,familia_code,
  'Variante de BLS sin entrepaño; conserva todas las demás piezas y configuraciones.',
  descripcion_en,
  'Copia de BLS sin entrepaño.',
  true,etiquetas_und,usa_carton,'BLS-RS-SM','BLS-RS-SM',false
from public.cot_tipos_mueble
where pref='BLS'
on conflict (pref) do update set
  nombre_es=excluded.nombre_es,
  nombre_en=excluded.nombre_en,
  categoria=excluded.categoria,
  margen_key=excluded.margen_key,
  familia_code=excluded.familia_code,
  descripcion_es=excluded.descripcion_es,
  descripcion_en=excluded.descripcion_en,
  notas=excluded.notas,
  activo=true,
  etiquetas_und=excluded.etiquetas_und,
  usa_carton=excluded.usa_carton,
  pref_imperial=excluded.pref_imperial,
  pref_metrico=excluded.pref_metrico,
  permite_agrupacion=false,
  updated_at=now();

do $$
declare
  v_origen uuid;
  v_destino uuid;
begin
  select id into v_origen from public.cot_tipos_mueble where pref='BLS';
  select id into v_destino from public.cot_tipos_mueble where pref='BLS-RS-SM';
  if v_origen is null or v_destino is null then
    raise exception 'No se pudo resolver BLS o BLS-RS-SM';
  end if;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v_destino;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,modo_agrupacion,
     clave_fusion,formula_largo_grupo,visualizacion)
  select
    v_destino,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
    resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,modo_agrupacion,
    clave_fusion,formula_largo_grupo,visualizacion
  from public.cot_piezas_plantilla
  where tipo_mueble_id=v_origen and lower(nombre) not like 'entrepano%';

  delete from public.cot_reglas_config where tipo_mueble_id=v_destino;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
  select v_destino,variable,condicion,valor,prioridad,activo,notas
  from public.cot_reglas_config where tipo_mueble_id=v_origen;

  update public.cot_reglas_config
  set valor='0', notas='BLS-RS-SM: sin entrepaño.'
  where tipo_mueble_id=v_destino and variable='n_entrepanos';

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v_destino;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  select v_destino,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas
  from public.cot_herrajes_plantilla where tipo_mueble_id=v_origen;

  if exists (
    select 1 from public.cot_piezas_plantilla
    where tipo_mueble_id=v_destino and lower(nombre) like 'entrepano%'
  ) or (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v_destino)
       <> (select count(*)-1 from public.cot_piezas_plantilla where tipo_mueble_id=v_origen)
  then
    raise exception 'BLS-RS-SM no coincide con BLS menos el entrepaño';
  end if;
end $$;
