-- Variante independiente BBLFD-D-L/R-SM basada en la plantilla BBLFD vigente.
insert into public.cot_tipos_mueble
  (pref,nombre_es,nombre_en,categoria,margen_key,familia_code,descripcion_es,
   descripcion_en,notas,activo,etiquetas_und,usa_carton,pref_imperial,
   pref_metrico,permite_agrupacion)
select
  'BBLFD-D-L/R-SM',
  'BBLFD-D-L/R-SM — Mueble inferior esquinero Blind Door con Gola',
  'Blind base full door L/R wood gola',
  categoria,margen_key,familia_code,
  'Variante independiente de BBLFD-D-L/R con refuerzos divididos y Gola de madera.',
  descripcion_en,
  'Door y mano L/R obligatorios. Código BBLFD<largo>-D<Door><L/R>-SM.',
  true,etiquetas_und,usa_carton,'BBLFD-D-L/R-SM','BBLFD-D-L/R-SM',false
from public.cot_tipos_mueble
where pref='BBLFD'
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
  select id into v_origen from public.cot_tipos_mueble where pref='BBLFD';
  select id into v_destino from public.cot_tipos_mueble where pref='BBLFD-D-L/R-SM';
  if v_origen is null or v_destino is null then
    raise exception 'No se pudo resolver BBLFD o BBLFD-D-L/R-SM';
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
  where tipo_mueble_id=v_origen;

  -- El montante sube un calibre: A-TC.
  update public.cot_piezas_plantilla
  set formula_largo='A-TC',
      notas='Refuerzo vertical A-TC; perpendicular a los frentes; 2 tarugos por lado.',
      updated_at=now()
  where tipo_mueble_id=v_destino and nombre='refuerzo_vertical';

  -- Tramo horizontal del lado del Blind Door: termina en la cara del montante.
  update public.cot_piezas_plantilla
  set formula_largo='L-door-(RV/4)-(3*TC/2)',
      formula_ancho='80/25.4',
      notas='Refuerzo delantero horizontal: lateral a cara del refuerzo vertical.',
      visualizacion='{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"confirmado":true,"nota":"Tramo horizontal del lado Blind Door; no atraviesa el montante."}',
      updated_at=now()
  where tipo_mueble_id=v_destino and nombre='refuerzo_delantero';

  update public.cot_piezas_plantilla
  set formula_ancho='80/25.4', updated_at=now()
  where tipo_mueble_id=v_destino and nombre='refuerzo_vertical';

  update public.cot_piezas_plantilla
  set visualizacion=visualizacion || '{"nota":"Montante vertical de 80 mm centrado bajo la junta entre frentes."}'::jsonb,
      updated_at=now()
  where tipo_mueble_id=v_destino and nombre='refuerzo_vertical';

  -- Tramo del lado de la puerta: panel vertical de 80 mm, a 20 mm del frente.
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,modo_agrupacion,visualizacion)
  values
    (v_destino,'refuerzo_delantero','refuerzo','1','80/25.4','door+(RV/4)-(3*TC/2)',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,55,
     'Refuerzo delantero adicional vertical de 80 mm; a 20 mm del frente; 2 tarugos por lado.',
     'local','{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":true,"y":"20","z":"A-H","confirmado":true,"nota":"Tramo vertical del lado de la puerta."}'),
    (v_destino,'gola_madera','caja','1','door+(RV/4)-(3*TC/2)','80/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,57,
     'Gola de madera horizontal bajo el refuerzo adicional; 2 tarugos por lado.',
     'local','{"version":1,"funcion":"gola","plano":"XY","intercambiar":false,"y":"0","z":"A-80-TC","confirmado":true,"nota":"Pegada a la cara interna del frente y bajo el refuerzo adicional."}');

  -- La puerta móvil baja 30 mm respecto al alto total.
  update public.cot_piezas_plantilla
  set formula_largo='door-RV',
      formula_ancho='A-(30/25.4)',
      notas='Frente móvil: alto total menos 30 mm; ancho definido por Door.',
      visualizacion='{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":true}',
      updated_at=now()
  where tipo_mueble_id=v_destino and nombre='frente';

  update public.cot_piezas_plantilla
  set formula_largo='L-door-(RV/2)',
      formula_ancho='A',
      visualizacion='{"version":1,"funcion":"frente_falso","plano":"XZ","intercambiar":false,"confirmado":true}',
      updated_at=now()
  where tipo_mueble_id=v_destino and lower(nombre)='blind door';

  delete from public.cot_reglas_config where tipo_mueble_id=v_destino;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
  select v_destino,variable,condicion,valor,prioridad,activo,notas
  from public.cot_reglas_config where tipo_mueble_id=v_origen;
  insert into public.cot_reglas_config
    (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
  values (v_destino,'gola','true','1',5,true,'Gola de madera integrada; sin manija.');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v_destino;
  insert into public.cot_herrajes_plantilla
    (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  select v_destino,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas
  from public.cot_herrajes_plantilla
  where tipo_mueble_id=v_origen and rol<>'manija';

  if (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v_destino) <> 13
     or (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v_destino and nombre='refuerzo_delantero') <> 2
     or not exists (
       select 1 from public.cot_piezas_plantilla
       where tipo_mueble_id=v_destino and nombre='refuerzo_vertical' and formula_largo='A-TC'
     )
     or not exists (
       select 1 from public.cot_piezas_plantilla
       where tipo_mueble_id=v_destino and nombre='gola_madera' and tarugos=4
     ) then
    raise exception 'La plantilla BBLFD-D-L/R-SM quedó incompleta';
  end if;
end $$;
