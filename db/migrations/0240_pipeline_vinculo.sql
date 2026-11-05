-- Enlace atómico al INSERT normal, sin actualizar cotizaciones históricas.
begin;
alter table public.cot_cotizaciones add column pipeline_origen_id uuid unique references public.cot_pipeline(id) on delete set null;
comment on column public.cot_cotizaciones.pipeline_origen_id is 'Origen opcional CEFI: la unicidad impide crear dos cotizaciones desde una oportunidad concurrentemente.';
create unique index cot_pipeline_cotizacion_unica on public.cot_pipeline(cotizacion_id) where cotizacion_id is not null;
create function public.cot_pipeline_sincronizar_cotizacion() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;
begin
 if tg_op='INSERT' and new.pipeline_origen_id is not null then
  update public.cot_pipeline set cotizacion_id=new.id,estado=new.estado
   where id=new.pipeline_origen_id and (cotizacion_id is null or cotizacion_id=new.id);
  get diagnostics n=row_count;
  if n<>1 then raise exception 'La oportunidad ya está vinculada o no tienes permiso para vincularla'; end if;
 elsif tg_op='UPDATE' and new.estado is distinct from old.estado then
  update public.cot_pipeline set estado=new.estado where cotizacion_id=new.id;
 end if;
 return new;
end $$;
revoke all on function public.cot_pipeline_sincronizar_cotizacion() from public,anon;
grant execute on function public.cot_pipeline_sincronizar_cotizacion() to authenticated,service_role;
create trigger cot_pipeline_estado_cotizacion after insert or update of estado on public.cot_cotizaciones
 for each row execute function public.cot_pipeline_sincronizar_cotizacion();
commit;
