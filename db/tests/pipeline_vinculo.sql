-- INSERT de una cotización nueva dentro de una transacción con rollback.
-- Nunca UPDATE ni DELETE sobre cot_cotizaciones: cambios de estado simulados
-- con el mismo trigger real en una tabla temporal de eventos.
begin;
insert into public.cot_pipeline(id,cliente) values('f2400000-0000-4000-8000-000000000001','QA Vínculo');
insert into public.cot_cotizaciones(id,nombre,pipeline_origen_id)
 values('f2400000-0000-4000-8000-000000000002','QA Vínculo transaccional','f2400000-0000-4000-8000-000000000001');
do $$ begin
 if (select cotizacion_id from public.cot_pipeline where id='f2400000-0000-4000-8000-000000000001')<>'f2400000-0000-4000-8000-000000000002'::uuid then raise exception 'INSERT real no enlazó Pipeline'; end if;
 begin
  insert into public.cot_cotizaciones(nombre,pipeline_origen_id) values('QA Duplicado','f2400000-0000-4000-8000-000000000001');
  raise exception 'Se permitió crear dos cotizaciones para el mismo origen';
 exception when unique_violation then null; end;
end $$;
create temporary table pipeline_evento(id uuid,estado text,pipeline_origen_id uuid);
create trigger evento after insert or update of estado on pipeline_evento for each row execute function public.cot_pipeline_sincronizar_cotizacion();
insert into pipeline_evento values('f2400000-0000-4000-8000-000000000002','borrador','f2400000-0000-4000-8000-000000000001');
do $$ begin
 if not exists(select 1 from public.cot_pipeline where id='f2400000-0000-4000-8000-000000000001' and cotizacion_id is not null and estado='borrador') then raise exception 'El enlace inicial falló'; end if;
end $$;
update pipeline_evento set estado='enviada';
do $$ begin
 if (select estado from public.cot_pipeline where id='f2400000-0000-4000-8000-000000000001')<>'enviada' then raise exception 'La sincronización hacia adelante falló'; end if;
 if not exists(select 1 from pg_constraint where conrelid='public.cot_pipeline'::regclass and confrelid='public.cot_cotizaciones'::regclass and contype='f' and confdeltype='n') then raise exception 'El FK debe conservar Pipeline mediante ON DELETE SET NULL'; end if;
 if not exists(select 1 from pg_constraint where conrelid='public.cot_cotizaciones'::regclass and contype='u' and conname='cot_cotizaciones_pipeline_origen_id_key') then raise exception 'Falta unicidad contra creaciones concurrentes'; end if;
end $$;
rollback;
