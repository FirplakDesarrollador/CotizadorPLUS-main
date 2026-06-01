-- ============================================================================
-- Cotizador PLUS — Torres/pantry: PC, PCFD, VPC. Hueco de zócalo (toe-kick)
-- como variable `zocalo` (PC/PCFD=5.25", VPC=4.5"; override por usuario).
-- lateral/puerta/fondo usan alto (A - zocalo). base/tapa x3 (PC) o x2 (PCFD), 5 entrepaños.
-- ============================================================================

insert into public.cot_tipos_mueble (pref,nombre_es,categoria,margen_key) values
  ('PC','Torre/alacena (Pantry Cabinet)','inferior','muebles'),
  ('PCFD','Torre/alacena puerta completa','inferior','muebles')
on conflict (pref) do nothing;

-- Variable zocalo: global 5.25; VPC=4.5
delete from public.cot_reglas_config where variable='zocalo';
insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
  (null,'zocalo','true','5.25',100,'Alto de zócalo/toe-kick por defecto (in)');
do $$ declare v uuid; begin
  select id into v from public.cot_tipos_mueble where pref='VPC';
  if v is not null then insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'zocalo','true','4.5',5,'VPC baño: zócalo 4.5"'); end if;
  -- PC/PCFD: 2 puertas apiladas (PC) / 1 (PCFD)
  select id into v from public.cot_tipos_mueble where pref='PC';
  if v is not null then delete from public.cot_reglas_config where tipo_mueble_id=v and variable='n_puertas'; insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_puertas','true','2',5,'PC: 2 puertas apiladas'); end if;
  select id into v from public.cot_tipos_mueble where pref='VPC';
  if v is not null then delete from public.cot_reglas_config where tipo_mueble_id=v and variable='n_puertas'; insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_puertas','true','2',5,'VPC: 2 puertas apiladas'); end if;
  select id into v from public.cot_tipos_mueble where pref='PCFD';
  if v is not null then delete from public.cot_reglas_config where tipo_mueble_id=v and variable='n_puertas'; insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_puertas','true','1',5,'PCFD: 1 puerta completa'); end if;
end $$;

-- Plantilla de torre (parametrizada por base_count)
do $$
declare v uuid; p record;
begin
  for p in (select pref, (case when pref='PCFD' then 2 else 3 end) as bases from (values ('PC'),('PCFD'),('VPC')) as t(pref)) loop
    select id into v from public.cot_tipos_mueble where pref=p.pref;
    if v is null then continue; end if;
    delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
    insert into public.cot_piezas_plantilla(tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
     (v,'lateral','caja','2','A-zocalo','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
     (v,'base_tapa','caja',p.bases::text,'L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
     (v,'refuerzo_trasero','refuerzo','3','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
     (v,'entrepano','refuerzo','5','L-1.18','P-1.54','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,4,40),
     (v,'puerta','frente','n_puertas','L/n_puertas','A-zocalo','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,50),
     (v,'fondo','fondo','1','L-0.59','A-zocalo','{}'::jsonb,0,0,60);
    -- herrajes: patas, tornillos, bisagras (n_puertas), manijas
    delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
    insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
     (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
     (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas',40);
    update public.cot_tipos_mueble set activo=true where id=v;
  end loop;
end $$;
