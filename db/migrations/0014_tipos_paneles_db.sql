-- ============================================================================
-- Cotizador PLUS — Paneles (F/PN/TK), DB (cajonera con n_cajones), OVPC, V(=B).
-- ============================================================================

-- Paneles: 1 pieza frente (L x A) + canto 22mm perímetro + 2 etiquetas. Sin fondo.
update public.cot_tipos_mueble set etiquetas_und = 2 where pref in ('F','PN','TK');

do $$
declare v uuid; p text;
begin
  foreach p in array array['F','PN','TK'] loop
    select id into v from public.cot_tipos_mueble where pref = p;
    delete from public.cot_piezas_plantilla where tipo_mueble_id = v;
    insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
      (v,'panel','frente','1','L','A','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,10);
    update public.cot_tipos_mueble set activo=true where id=v;
  end loop;
end $$;

-- Regla global: nº de cajones (default 2; el usuario puede sobreescribir)
delete from public.cot_reglas_config where tipo_mueble_id is null and variable='n_cajones';
insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, notas) values
  (null,'n_cajones','true','2',100,'Nº de cajones por defecto (override por el usuario en DB/cajoneras)');

-- DB (Drawer Base): caja(laterales+base) + refuerzos/gavetas escalan con n_cajones + frentes de cajón
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='DB';
  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base','caja','1','L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_trasero','refuerzo','2','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'refuerzo_horizontal','refuerzo','n_cajones','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,40),
   (v,'base_gaveta','refuerzo','n_cajones','L-2.95','P-4.63','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,0,0,50),
   (v,'trasero_gaveta','refuerzo','n_cajones','L-3.427','2.6875','{"calibre":"19x0,45","largos":2,"anchos":0,"despEdges":0}'::jsonb,0,0,60),
   (v,'frente','frente','n_cajones','L','A/n_cajones','{"calibre":"22x1","largos":2,"anchos":2}'::jsonb,0,0,70),
   (v,'fondo','fondo','1','L-0.59','A','{}'::jsonb,0,0,80);
  update public.cot_tipos_mueble set activo=true where id=v;
end $$;

-- OVPC (Oven Pantry): alto con hueco de horno (G-4.5), base/tapa x3, refuerzos x3, 5 entrepaños
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='OVPC';
  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;
  insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden) values
   (v,'lateral','caja','2','A-4.5','P','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,0,10),
   (v,'base_tapa','caja','3','L-1.18','P-0.9','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,8,0,20),
   (v,'refuerzo_trasero','refuerzo','3','L-1.18','3.25','{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb,4,0,30),
   (v,'entrepano','refuerzo','5','L-1.18','P-1.54','{"calibre":"19x0,45","largos":2,"anchos":2}'::jsonb,0,4,40),
   (v,'fondo','fondo','1','L-0.59','A-4.5','{}'::jsonb,0,0,50);
  update public.cot_tipos_mueble set activo=true where id=v;
end $$;
