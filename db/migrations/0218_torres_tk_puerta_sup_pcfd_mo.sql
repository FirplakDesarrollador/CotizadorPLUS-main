-- Torres PC/VPC/PCFD: TK obligatorio (0 permitido) y frentes limitados por A-TK.
-- PC/VPC: dos niveles de puertas; PUERTA_SUP define el vano superior.
-- PCFD-MO: hueco central MO entre dos entrepaños fijos y puertas arriba/abajo.

do $$
declare
  v uuid;
  v_pcfd uuid;
  v_mo uuid;
begin
  foreach v in array array[
    (select id from public.cot_tipos_mueble where pref='PC'),
    (select id from public.cot_tipos_mueble where pref='VPC')
  ] loop
    if v is null then continue; end if;
    delete from public.cot_reglas_config where tipo_mueble_id=v and variable in ('n_puertas','zocalo','PUERTA_SUP');
    insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
      (v,'n_puertas','L < 24','1',5,'Una puerta por nivel bajo 24 in'),
      (v,'n_puertas','true','2',10,'Dos puertas por nivel desde 24 in'),
      (v,'zocalo','true','0',5,'TK predeterminado; formulario exige valor explícito'),
      (v,'PUERTA_SUP','true','(A-zocalo)/2',5,'Altura predeterminada del vano superior');

    update public.cot_piezas_plantilla set formula_largo='A-zocalo' where tipo_mueble_id=v and nombre='lateral';
    delete from public.cot_piezas_plantilla where tipo_mueble_id=v and nombre in ('puerta','puerta_superior','puerta_inferior');
    insert into public.cot_piezas_plantilla
      (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
    values
      (v,'puerta_superior','frente','n_puertas','(L-n_puertas*RV)/n_puertas','PUERTA_SUP-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,50,'Puertas superiores lado a lado; conservan luz RV','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":false}'),
      (v,'puerta_inferior','frente','n_puertas','(L-n_puertas*RV)/n_puertas','A-zocalo-PUERTA_SUP-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,51,'Puertas inferiores lado a lado; no sobrepasan los laterales','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":false}');
    update public.cot_herrajes_plantilla set formula_cantidad='n_puertas*2'
      where tipo_mueble_id=v and rol in ('bisagra','manija');
  end loop;

  select id into v_pcfd from public.cot_tipos_mueble where pref='PCFD';
  if v_pcfd is null then raise exception 'No existe PCFD'; end if;
  delete from public.cot_reglas_config where tipo_mueble_id=v_pcfd and variable='zocalo';
  insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas)
    values(v_pcfd,'zocalo','true','0',5,'TK predeterminado; formulario exige valor explícito');
  update public.cot_piezas_plantilla set formula_largo='A-zocalo'
    where tipo_mueble_id=v_pcfd and nombre='lateral';
  update public.cot_piezas_plantilla set formula_ancho='A-zocalo-RV'
    where tipo_mueble_id=v_pcfd and nombre='puerta_estandar';

  insert into public.cot_tipos_mueble(
    pref,nombre_es,nombre_en,categoria,margen_key,familia_code,descripcion_es,descripcion_en,
    notas,activo,etiquetas_und,usa_carton,pref_imperial,pref_metrico,permite_agrupacion
  ) select
    'PCFD-MO','Torre/alacena con espacio para microondas','Pantry cabinet with microwave opening',
    categoria,margen_key,familia_code,'Puertas superiores e inferiores separadas por vano MO.',
    'Upper and lower doors separated by MO opening.',notas,true,etiquetas_und,usa_carton,
    'PCFD-MO','PCFD-MO',permite_agrupacion
  from public.cot_tipos_mueble where id=v_pcfd
  on conflict(pref) do update set nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,
    descripcion_es=excluded.descripcion_es,descripcion_en=excluded.descripcion_en,activo=true,updated_at=now()
  returning id into v_mo;

  delete from public.cot_reglas_config where tipo_mueble_id=v_mo;
  insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
    (v_mo,'n_puertas','L < 24','1',5,'Una puerta por nivel bajo 24 in'),
    (v_mo,'n_puertas','true','2',10,'Dos puertas por nivel desde 24 in'),
    (v_mo,'n_entrepanos','true','3',5,'Tres entrepaños ajustables'),
    (v_mo,'zocalo','true','0',5,'TK predeterminado'),
    (v_mo,'MO','true','20',5,'Vano MO predeterminado de 20 in');

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v_mo;
  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
  values
    (v_mo,'lateral','caja','2','A-zocalo','P','{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,10,'Laterales descuentan TK','{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":false}'),
    (v_mo,'base_tapa','caja','2','L-2*TC','P-0.9','{"calibre":"19x0,45","largos":2}',8,0,20,'Base y tapa','{"version":1,"funcion":"base_tapa","plano":"XY","intercambiar":false,"confirmado":false}'),
    (v_mo,'entrepano_fijo','caja','2','L-2*TC','P-0.9','{"calibre":"19x0,45","largos":2}',8,0,30,'Dos límites estructurales del vano MO','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":false}'),
    (v_mo,'entrepano','refuerzo','n_entrepanos','L-2*TC-0.03937','P-1.54','{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,40,'Entrepaños ajustables fuera del vano MO','{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":false}'),
    (v_mo,'puerta_superior','frente','n_puertas','(L-n_puertas*RV)/n_puertas','(A-zocalo-MO)/2-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,50,'Puertas sobre MO','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":false}'),
    (v_mo,'puerta_inferior','frente','n_puertas','(L-n_puertas*RV)/n_puertas','(A-zocalo-MO)/2-RV','{"calibre":"22x1","largos":2,"anchos":2}',0,0,51,'Puertas bajo MO','{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":false}'),
    (v_mo,'refuerzo_trasero','refuerzo','3','L-2*TC','3.14961','{"calibre":"19x0,45","largos":2}',4,0,60,'Refuerzos traseros','{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":false}'),
    (v_mo,'fondo','fondo','1','L-TC','A-zocalo','{}',0,0,70,'Fondo limitado por laterales','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"confirmado":false}');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v_mo;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
  select v_mo,rol,herraje_codigo,selector_key,
    case when rol in ('bisagra','manija') then 'n_puertas*2' else formula_cantidad end,
    orden,notas
  from public.cot_herrajes_plantilla where tipo_mueble_id=v_pcfd and rol not in ('riel','push');
end $$;

do $$ begin
  if not exists(select 1 from public.cot_tipos_mueble where pref='PCFD-MO' and activo) then
    raise exception 'PCFD-MO no quedó activa';
  end if;
end $$;
