-- Fixtures y permisos se revierten al terminar; no usa secciones del usuario.
begin;
create temporary table qa_orden as select gen_random_uuid() q,gen_random_uuid() otra,
 gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() ajena,
 (select creado_por from public.cot_cotizaciones where creado_por is not null order by created_at limit 1) propietario;
grant select on qa_orden to authenticated;
insert into public.cot_cotizaciones(id,nombre,creado_por,total_cop,total_usd)
select q,'QA orden secciones',propietario,12345,3 from qa_orden
union all select otra,'QA orden ajena',propietario,0,0 from qa_orden;
insert into public.cot_cocinas(id,cotizacion_id,nombre,orden,total_cop,total_usd)
select a,q,'Cocina QA',3,12345,3 from qa_orden
union all select b,q,'Closet QA',9,0,0 from qa_orden
union all select ajena,otra,'Baño ajeno QA',0,0,0 from qa_orden;
insert into public.cot_cotizacion_lineas(cotizacion_id,cocina_id,cantidad,codigo_modulo,precio_total_cop,precio_total_usd,config)
select q,a,1,'QA-ORDEN',12345,3,'{"preset":{"frente":"REFERENCIA"}}'::jsonb from qa_orden;
create temporary table qa_lineas_antes as select to_jsonb(l) fila from public.cot_cotizacion_lineas l,qa_orden t where l.cotizacion_id=t.q;
grant select on qa_lineas_antes to authenticated;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',propietario)::text,true) from qa_orden;
set local role authenticated;
do $$ declare t record; antes jsonb; despues jsonb;
begin
 select * into t from qa_orden;
 perform public.cot_reordenar_cocinas(t.q,array[t.b,t.a]);
 if (select array_agg(id order by orden) from public.cot_cocinas where cotizacion_id=t.q)<>array[t.b,t.a]
 or (select array_agg(orden order by orden) from public.cot_cocinas where cotizacion_id=t.q)<>array[0,1]
 then raise exception 'No guardó el orden completo y normalizado'; end if;
 if (select total_cop from public.cot_cotizaciones where id=t.q)<>12345
 or (select total_usd from public.cot_cotizaciones where id=t.q)<>3
 or (select total_cop from public.cot_cocinas where id=t.a)<>12345
 then raise exception 'Ordenar alteró importes'; end if;
 if exists(select 1 from qa_lineas_antes a full join
   (select to_jsonb(l) fila from public.cot_cotizacion_lineas l where cotizacion_id=t.q) b on a.fila=b.fila
   where a.fila is null or b.fila is null)
 then raise exception 'Ordenar modificó muebles/materiales/precios'; end if;
 select jsonb_agg(to_jsonb(c) order by id) into antes from public.cot_cocinas c where cotizacion_id=t.q;
 perform public.cot_reordenar_cocinas(t.q,array[t.b,t.a]);
 select jsonb_agg(to_jsonb(c) order by id) into despues from public.cot_cocinas c where cotizacion_id=t.q;
 if antes<>despues then raise exception 'La segunda pasada no es idempotente'; end if;
 begin perform public.cot_reordenar_cocinas(t.q,array[t.a]); raise exception 'Aceptó lista incompleta'; exception when invalid_parameter_value then null; end;
 begin perform public.cot_reordenar_cocinas(t.q,array[t.a,t.a]); raise exception 'Aceptó repetidos'; exception when invalid_parameter_value then null; end;
 begin perform public.cot_reordenar_cocinas(t.q,array[t.a,t.ajena]); raise exception 'Aceptó sección ajena'; exception when invalid_parameter_value then null; end;
 begin perform public.cot_reordenar_cocinas(t.q,null); raise exception 'Aceptó lista nula'; exception when invalid_parameter_value then null; end;
 if (select array_agg(id order by orden) from public.cot_cocinas where cotizacion_id=t.q)<>array[t.b,t.a]
 then raise exception 'Un rechazo dejó cambios parciales'; end if;
 perform public.cot_reordenar_cocinas(t.q,array[t.a,t.b]);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',gen_random_uuid())::text,true);
set local role authenticated;
do $$ declare t record; begin
 select * into t from qa_orden;
 begin perform public.cot_reordenar_cocinas(t.q,array[t.b,t.a]); raise exception 'Permitió escritura a otro usuario'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
