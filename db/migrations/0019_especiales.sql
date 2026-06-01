-- ============================================================================
-- Cotizador PLUS — Especiales: TW (superior esquinero), BOMH (base microondas),
-- BBLFD (base esquinero ciego, con pieza refuerzo vertical bisagras).
-- ============================================================================

insert into public.cot_tipos_mueble (pref,nombre_es,categoria,margen_key) values
  ('TW','Mueble superior esquinero (Transition Wall)','superior','muebles'),
  ('BOMH','Base para microondas','inferior','muebles'),
  ('BBLFD','Base esquinero ciego (Blind Base)','inferior','muebles')
on conflict (pref) do nothing;

-- Reglas por tipo
do $$ declare v uuid; begin
  select id into v from public.cot_tipos_mueble where pref='TW';
  if v is not null then
    delete from public.cot_reglas_config where tipo_mueble_id=v;
    insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
      (v,'n_patas','true','0',5,'Superior'),(v,'n_puertas','true','1',5,'1 puerta'),(v,'n_cajones','true','0',5,'');
  end if;
  select id into v from public.cot_tipos_mueble where pref='BOMH';
  if v is not null then
    delete from public.cot_reglas_config where tipo_mueble_id=v;
    insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
      (v,'n_patas','true','4',5,''),(v,'n_puertas','true','1',5,''),(v,'n_cajones','true','0',5,'');
  end if;
  select id into v from public.cot_tipos_mueble where pref='BBLFD';
  if v is not null then
    delete from public.cot_reglas_config where tipo_mueble_id=v;
    insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
      (v,'n_patas','true','4',5,''),(v,'n_puertas','true','1',5,''),(v,'n_cajones','true','0',5,'');
  end if;
end $$;

-- Piezas
do $$ declare v uuid; begin
  -- TW (superior esquinero): base+tapa x2, puerta L x (A+0.75), fondo (L-0.59)(A-0.59)
  select id into v from public.cot_tipos_mueble where pref='TW'; delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla(tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base_tapa','caja','2','L-1.18','P','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'puerta','frente','1','L','A+0.75','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,40),
   (v,'fondo','fondo','1','L-0.59','A-0.59','{}'::jsonb,0,0,50);
  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',10),(v,'manija','MANIJA415','manija','n_puertas',20);

  -- BOMH (microondas): refuerzo vertical delantero x5 (ancho 5), frente L x 6
  select id into v from public.cot_tipos_mueble where pref='BOMH'; delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla(tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base','caja','1','L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_delantero','caja','5','L-1.18','5','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,40),
   (v,'frente','frente','1','L','6','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,50),
   (v,'fondo','fondo','1','L-0.59','A','{}'::jsonb,0,0,60);
  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas',40);

  -- BBLFD (esquinero ciego): refvbis (A x 3.25) + refvdel parcial (L-27.75) + entrepaño full depth
  select id into v from public.cot_tipos_mueble where pref='BBLFD'; delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla(tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base','caja','1','L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'refuerzo_vert_bisagras','refuerzo','1','A','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,0,0,40),
   (v,'refuerzo_delantero','caja','1','L-27.75','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,50),
   (v,'entrepano','refuerzo','1','L-1.181','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,4,60),
   (v,'puerta','frente','1','L','A','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,70),
   (v,'fondo','fondo','1','L-0.59','A','{}'::jsonb,0,0,80);
  delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas',40);

  update public.cot_tipos_mueble set activo=true where pref in ('TW','BOMH','BBLFD');
end $$;
