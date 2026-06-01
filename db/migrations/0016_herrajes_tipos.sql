-- ============================================================================
-- Cotizador PLUS — Herrajes por tipo (cot_herrajes_plantilla) + reglas de
-- conteo (n_patas/n_cajones/n_puertas) por tipo. Validado vs Excel (J = hardware).
-- Lógica: pata=n_patas, tornillo=n_patas*4, bisagra=n_puertas,
--   manija=n_puertas+n_cajones, riel=n_cajones, barra(DB-2)=n_cajones si <=2.
-- ============================================================================

-- Catálogo: rieles y barras
insert into public.cot_herrajes (codigo,nombre,categoria,selector_key,precio,unidad,notas) values
  ('RIELTANDEM','Riel cajón Tandem (par)','riel','riel',49706.8,'par','costos unitarios B84 (1.3*38236)'),
  ('BARRAEST','Barra estabilizadora (par)','barra','barra',9800,'par','costos unitarios B37')
on conflict (codigo) do update set precio=excluded.precio, nombre=excluded.nombre, updated_at=now();

-- ---- Reglas de conteo ----
-- n_patas: global 4; W/paneles 0
delete from public.cot_reglas_config where variable='n_patas';
insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
  (null,'n_patas','true','4',100,'Default: 4 patas (muebles de piso)');
do $$ declare v uuid; p text; begin
  foreach p in array array['W','F','PN','TK'] loop
    select id into v from public.cot_tipos_mueble where pref=p;
    if v is not null then insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_patas','true','0',10,'Sin patas'); end if;
  end loop;
end $$;

-- n_cajones: global 0; B/V=1; DB=2 (default, override usuario)
delete from public.cot_reglas_config where variable='n_cajones';
insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
  (null,'n_cajones','true','0',100,'Default: sin cajones');
do $$ declare v uuid; begin
  select id into v from public.cot_tipos_mueble where pref='B';  if v is not null then insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_cajones','true','1',10,'B: 1 gaveta'); end if;
  select id into v from public.cot_tipos_mueble where pref='V';  if v is not null then insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_cajones','true','1',10,'V: 1 gaveta'); end if;
  select id into v from public.cot_tipos_mueble where pref='DB'; if v is not null then insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_cajones','true','2',10,'DB: 2 cajones por defecto (override)'); end if;
end $$;

-- n_puertas: DB=0 (sin puertas); OVPC=4
do $$ declare v uuid; begin
  select id into v from public.cot_tipos_mueble where pref='DB'; if v is not null then delete from public.cot_reglas_config where tipo_mueble_id=v and variable='n_puertas'; insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_puertas','true','0',10,'DB: sin puertas'); end if;
  select id into v from public.cot_tipos_mueble where pref='OVPC'; if v is not null then delete from public.cot_reglas_config where tipo_mueble_id=v and variable='n_puertas'; insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values (v,'n_puertas','true','4',10,'OVPC: 4 puertas'); end if;
end $$;

-- ---- Plantillas de herrajes por tipo ----
do $$
declare v uuid;
  function_holder int;
begin
  -- helper inline por tipo
  -- B (puertas + 1 gaveta)
  select id into v from public.cot_tipos_mueble where pref='B'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas + n_cajones',40),
   (v,'riel','RIELTANDEM','riel','n_cajones',50);

  -- V (= B)
  select id into v from public.cot_tipos_mueble where pref='V'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas + n_cajones',40),
   (v,'riel','RIELTANDEM','riel','n_cajones',50);

  -- BFD (puertas, sin gaveta)
  select id into v from public.cot_tipos_mueble where pref='BFD'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas + n_cajones',40);

  -- SVFD (= SBFD)
  select id into v from public.cot_tipos_mueble where pref='SVFD'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30),(v,'manija','MANIJA415','manija','n_puertas + n_cajones',40);

  -- W (superior): solo bisagras + manijas
  select id into v from public.cot_tipos_mueble where pref='W'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',10),(v,'manija','MANIJA415','manija','n_puertas + n_cajones',20);

  -- DB (cajonera): patas, manija, rieles (n_cajones), barra si 2 cajones
  select id into v from public.cot_tipos_mueble where pref='DB'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'manija','MANIJA415','manija','n_puertas + n_cajones',30),(v,'riel','RIELTANDEM','riel','n_cajones',40),
   (v,'barra','BARRAEST','barra','n_cajones<=2 ? n_cajones : 0',50);

  -- OVPC (alacena horno): patas + bisagras (4 puertas)
  select id into v from public.cot_tipos_mueble where pref='OVPC'; delete from public.cot_herrajes_plantilla where tipo_mueble_id=v;
  insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden) values
   (v,'pata','PATA10AJUST','pata','n_patas',10),(v,'tornillo','TORNILLO858','tornillo','n_patas*4',20),
   (v,'bisagra','BISAGRAPAR','bisagra','n_puertas',30);
end $$;
