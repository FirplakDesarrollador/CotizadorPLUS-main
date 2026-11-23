begin;
create function public.cot_pipeline_filtradas(p_q text default null,p_estado text default null,p_pais text default null,p_asesor text default null,p_estimador text default null)
returns setof public.cot_pipeline language sql stable security invoker set search_path=public,pg_temp as $$
 select p.* from public.cot_pipeline p where
 (p_q is null or position(lower(p_q) in lower(concat_ws(' ',p.codigo,p.nombre_proyecto,p.cliente)))>0)
 and (p_estado is null or p.estado=p_estado) and (p_pais is null or p.pais=p_pais)
 and (p_asesor is null or p.asesor=p_asesor) and (p_estimador is null or p.estimador=p_estimador);
$$;
create function public.cot_pipeline_opciones() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object(
 'pais',(select coalesce(jsonb_agg(v order by v),'[]'::jsonb) from (select distinct pais v from public.cot_pipeline where pais is not null) x),
 'asesor',(select coalesce(jsonb_agg(v order by v),'[]'::jsonb) from (select distinct asesor v from public.cot_pipeline where asesor is not null) x),
 'estimador',(select coalesce(jsonb_agg(v order by v),'[]'::jsonb) from (select distinct estimador v from public.cot_pipeline where estimador is not null) x));
$$;
create function public.cot_pipeline_resumen(p_q text default null,p_estado text default null,p_pais text default null,p_asesor text default null,p_estimador text default null,p_hoy date default ((now() at time zone 'America/Bogota')::date))
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 with filas as materialized(select * from public.cot_pipeline_filtradas(p_q,p_estado,p_pais,p_asesor,p_estimador)),
 estados as (select e.estado,count(f.id) cantidad from (values('borrador'),('enviada'),('en_pausa'),('reproceso'),('aprobada'),('rechazada'),('descartada')) e(estado) left join filas f on f.estado=e.estado group by e.estado)
 select jsonb_build_object('total',(select count(*) from filas),
 'pendientes',(select count(*) from filas where estado='borrador'),
 'en_pausa',(select count(*) from filas where estado='en_pausa'),
 'vencidas',(select count(*) from filas where fecha_limite_envio<p_hoy and cotizacion_id is null),
 'fobUsd',(select coalesce(sum(monto_fob_usd),0) from filas),
 'fobCop',(select coalesce(sum(monto_fob_cop),0) from filas),
 'conteos',(select jsonb_object_agg(estado,cantidad) from estados),
 'estados',(select jsonb_agg(jsonb_build_object('etiqueta',estado,'cantidad',cantidad) order by estado) from estados));
$$;
revoke all on function public.cot_pipeline_filtradas(text,text,text,text,text) from public,anon;
revoke all on function public.cot_pipeline_opciones() from public,anon;
revoke all on function public.cot_pipeline_resumen(text,text,text,text,text,date) from public,anon;
grant execute on function public.cot_pipeline_filtradas(text,text,text,text,text) to authenticated,service_role;
grant execute on function public.cot_pipeline_opciones() to authenticated,service_role;
grant execute on function public.cot_pipeline_resumen(text,text,text,text,text,date) to authenticated,service_role;
commit;
