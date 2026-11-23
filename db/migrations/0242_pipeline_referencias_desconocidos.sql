begin;
alter table public.cot_pipeline add column campos_desconocidos text[] not null default '{}';
alter table public.cot_pipeline alter column instalado drop not null;
comment on column public.cot_pipeline.campos_desconocidos is 'Campos elegidos explícitamente como Desconocido. El valor permanece NULL, distinto de cero, No o Sin dato histórico.';
comment on column public.cot_pipeline.codigo is 'Código histórico de origen (Excel); no es la referencia de Cotizador PLUS. Se conserva para procedencia e importación.';
create or replace function public.cot_pipeline_filtradas(p_q text default null,p_estado text default null,p_pais text default null,p_asesor text default null,p_estimador text default null)
returns setof public.cot_pipeline language sql stable security invoker set search_path=public,pg_temp as $$
 select p.* from public.cot_pipeline p left join public.cot_cotizaciones c on c.id=p.cotizacion_id where
 (p_q is null or position(lower(p_q) in lower(concat_ws(' ',p.codigo,p.nombre_proyecto,p.cliente,c.codigo,upper(left(c.id::text,8)),case when c.cotizador_por='CEMA' then c.plantilla_cema->>'quoteReference' end)))>0)
 and (p_estado is null or p.estado=p_estado) and (p_pais is null or p.pais=p_pais)
 and (p_asesor is null or p.asesor=p_asesor) and (p_estimador is null or p.estimador=p_estimador);
$$;
revoke all on function public.cot_pipeline_filtradas(text,text,text,text,text) from public,anon;
grant execute on function public.cot_pipeline_filtradas(text,text,text,text,text) to authenticated,service_role;
commit;
