-- Copia atómica de sección, grupos y líneas; conserva todos los precios y JSON.
-- SECURITY INVOKER respeta los permisos actuales de propietario/admin y RLS.
create or replace function public.cot_duplicar_cocina(p_cotizacion_id uuid,p_cocina_id uuid)
returns uuid language plpgsql security invoker set search_path=public as $$
declare
 origen public.cot_cocinas%rowtype;
 grupo public.cot_grupos_modulos%rowtype;
 nueva uuid:=gen_random_uuid();
 nuevo_grupo uuid;
 mapa jsonb:='{}'::jsonb;
 cop numeric;
 usd numeric;
begin
 -- Serializa las copias de una misma cotización y aplica el gate de escritura.
 perform id from public.cot_cotizaciones where id=p_cotizacion_id for update;
 if not found then raise exception 'No tienes permiso para copiar esta sección' using errcode='42501'; end if;
 select * into origen from public.cot_cocinas
 where id=p_cocina_id and cotizacion_id=p_cotizacion_id for update;
 if not found then raise exception 'Sección no encontrada en esta cotización'; end if;
 perform id from public.cot_grupos_modulos where cocina_id=p_cocina_id for share;
 perform id from public.cot_cotizacion_lineas where cocina_id=p_cocina_id for share;
 if exists(select 1 from public.cot_grupos_modulos where cocina_id=p_cocina_id and cotizacion_id<>p_cotizacion_id)
 or exists(select 1 from public.cot_cotizacion_lineas l where l.cocina_id=p_cocina_id
   and (l.cotizacion_id<>p_cotizacion_id or (l.grupo_id is not null and not exists(
     select 1 from public.cot_grupos_modulos g where g.id=l.grupo_id and g.cocina_id=p_cocina_id))))
 then raise exception 'La sección contiene referencias inconsistentes'; end if;

 update public.cot_cocinas set orden=orden+1
 where cotizacion_id=p_cotizacion_id and orden>origen.orden;
 insert into public.cot_cocinas
 select (jsonb_populate_record(null::public.cot_cocinas,to_jsonb(origen)||jsonb_build_object(
   'id',nueva,'nombre',origen.nombre||'-copia','orden',origen.orden+1,
   'created_at',now(),'updated_at',now()))).*;

 for grupo in select * from public.cot_grupos_modulos where cocina_id=p_cocina_id order by orden,id loop
   nuevo_grupo:=gen_random_uuid();
   mapa:=mapa||jsonb_build_object(grupo.id::text,nuevo_grupo);
   insert into public.cot_grupos_modulos
   select (jsonb_populate_record(null::public.cot_grupos_modulos,to_jsonb(grupo)||jsonb_build_object(
     'id',nuevo_grupo,'cocina_id',nueva,'created_at',now(),'updated_at',now()))).*;
 end loop;

 insert into public.cot_cotizacion_lineas
 select (jsonb_populate_record(null::public.cot_cotizacion_lineas,to_jsonb(l)||jsonb_build_object(
   'id',gen_random_uuid(),'cocina_id',nueva,
   'grupo_id',case when l.grupo_id is null then null else (mapa->>l.grupo_id::text)::uuid end,
   'created_at',now(),'updated_at',now()))).*
 from public.cot_cotizacion_lineas l where l.cocina_id=p_cocina_id;

 -- precio_total ya incluye cantidad de línea; solo se multiplica por sección.
 select coalesce(sum(precio_total_cop),0)*greatest(coalesce(origen.cantidad,1),1),
        coalesce(sum(precio_total_usd),0)*greatest(coalesce(origen.cantidad,1),1)
 into cop,usd from public.cot_cotizacion_lineas where cocina_id=nueva;
 update public.cot_cocinas set total_cop=cop,total_usd=usd where id=nueva;
 update public.cot_cotizaciones
 set total_cop=coalesce(total_cop,0)+cop,total_usd=coalesce(total_usd,0)+usd
 where id=p_cotizacion_id;
 return nueva;
end $$;
revoke all on function public.cot_duplicar_cocina(uuid,uuid) from public,anon;
grant execute on function public.cot_duplicar_cocina(uuid,uuid) to authenticated;
