-- ============================================================================
-- Cotizador PLUS — Geometrías adicionales reusando despieces base.
-- Línea U = misma geometría que B/BFD/W/DV. VFD=BFD, SV=SBFD(refvdel 7),
-- WBL=W, DV/DVE=DB, UB=B, UBFD=BFD, UW=W, UDV=DB, VPC=OVPC, D=PN, R=F.
-- Especiales (PC torre/TK, UW 5.5mm, BBLFD ciego, POD inserto) = pendientes aparte.
-- ============================================================================

-- Helper: copia piezas + herrajes + reglas propias de un tipo a otro
create or replace function public.cot_copiar_diseno(p_src text, p_dst text)
returns void language plpgsql as $$
declare s uuid; d uuid;
begin
  select id into s from public.cot_tipos_mueble where pref=p_src;
  select id into d from public.cot_tipos_mueble where pref=p_dst;
  if s is null or d is null then raise notice 'falta % o %', p_src, p_dst; return; end if;
  delete from public.cot_piezas_plantilla where tipo_mueble_id=d;
  delete from public.cot_herrajes_plantilla where tipo_mueble_id=d;
  delete from public.cot_reglas_config where tipo_mueble_id=d;
  insert into public.cot_piezas_plantilla (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas)
    select d,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas from public.cot_piezas_plantilla where tipo_mueble_id=s;
  insert into public.cot_herrajes_plantilla (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
    select d,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas from public.cot_herrajes_plantilla where tipo_mueble_id=s;
  insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
    select d,variable,condicion,valor,prioridad,activo,notas from public.cot_reglas_config where tipo_mueble_id=s;
  update public.cot_tipos_mueble set activo=true, usa_carton=(select usa_carton from public.cot_tipos_mueble where id=s), etiquetas_und=(select etiquetas_und from public.cot_tipos_mueble where id=s) where id=d;
end $$;

-- Crear tipos nuevos (si no existen)
insert into public.cot_tipos_mueble (pref,nombre_es,categoria,margen_key) values
  ('VFD','Mueble inferior baño puertas','vanity','muebles'),
  ('SV','Mueble inferior baño lavamanos (Sink Vanity)','vanity','muebles'),
  ('WBL','Mueble superior esquinero ciego','superior','muebles'),
  ('DV','Vanity con cajones','vanity','muebles'),
  ('DVE','Vanity con cajones (esquinero)','vanity','muebles'),
  ('UB','Mueble inferior (línea U)','inferior','muebles'),
  ('UBFD','Mueble inferior puertas (línea U)','inferior','muebles'),
  ('UW','Mueble superior (línea U)','superior','muebles'),
  ('UDV','Vanity cajones (línea U)','vanity','muebles'),
  ('VPC','Torre/pantry de baño','vanity','muebles'),
  ('D','Panel/puerta suelta','complemento','pn_tk'),
  ('R','Larguero/refuerzo','complemento','pn_tk')
on conflict (pref) do nothing;

-- Copias de diseño
select public.cot_copiar_diseno('BFD','VFD');
select public.cot_copiar_diseno('SBFD','SV');
select public.cot_copiar_diseno('W','WBL');
select public.cot_copiar_diseno('DB','DV');
select public.cot_copiar_diseno('DB','DVE');
select public.cot_copiar_diseno('B','UB');
select public.cot_copiar_diseno('BFD','UBFD');
select public.cot_copiar_diseno('W','UW');
select public.cot_copiar_diseno('DB','UDV');
select public.cot_copiar_diseno('OVPC','VPC');
select public.cot_copiar_diseno('PN','D');
select public.cot_copiar_diseno('F','R');

-- Ajuste SV: refuerzo vertical delantero ancho = 7 (C140), no 5
update public.cot_piezas_plantilla set formula_ancho='7'
  where nombre='refuerzo_delantero' and tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='SV');
