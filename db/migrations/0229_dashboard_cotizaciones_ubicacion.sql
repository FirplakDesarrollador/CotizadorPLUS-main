-- Ubicación histórica compatible y dashboard agregado. Todas las lecturas usan
-- SECURITY INVOKER y las políticas RLS existentes de cot_cotizaciones.
alter table public.cot_cotizaciones add column if not exists pais text not null default 'Colombia';
alter table public.cot_cotizaciones add column if not exists ciudad text;
create index if not exists idx_cot_cotizaciones_pais on public.cot_cotizaciones(pais);
create index if not exists idx_cot_cotizaciones_pais_fecha on public.cot_cotizaciones(pais, created_at);
create index if not exists idx_cot_cotizaciones_fecha on public.cot_cotizaciones(created_at);
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.cot_cotizaciones'::regclass and conname='cot_cotizaciones_pais_valido') then
    alter table public.cot_cotizaciones add constraint cot_cotizaciones_pais_valido check (length(btrim(pais)) between 1 and 100);
  end if;
end $$;
comment on column public.cot_cotizaciones.pais is 'País obligatorio. Colombia para cotizaciones históricas.';
comment on column public.cot_cotizaciones.ciudad is 'Ciudad opcional del proyecto.';

create or replace view public.vw_dashboard_cotizaciones with (security_invoker = true) as
select id,codigo,nombre,cliente_nombre,comprador_nombre,pais,ciudad,cotizador_por,estado,
       coalesce(total_cop,0) as total_cop,coalesce(total_usd,0) as total_usd,created_at,
       (created_at at time zone 'America/Bogota')::date as fecha_local
from public.cot_cotizaciones;
revoke all on public.vw_dashboard_cotizaciones from anon, public;
grant select on public.vw_dashboard_cotizaciones to authenticated, service_role;

-- Fuente única para KPIs, gráficas, tabla y CSV. No hay SQL dinámico ni bypass de RLS.
create or replace function public.cot_dashboard_filtradas(
  p_desde timestamptz, p_hasta timestamptz, p_pais text default null,
  p_mes integer default null, p_anio integer default null,
  p_empresa text default null, p_estado text default null, p_busqueda text default null
) returns setof public.vw_dashboard_cotizaciones
language sql stable security invoker set search_path = public, pg_temp as $$
  select q.* from public.vw_dashboard_cotizaciones q
  where q.created_at >= p_desde and q.created_at < p_hasta
    and (p_pais is null or q.pais = p_pais)
    and (p_mes is null or extract(month from q.fecha_local) = p_mes)
    and (p_anio is null or extract(year from q.fecha_local) = p_anio)
    and (p_empresa is null or q.cotizador_por = p_empresa)
    and (p_estado is null or q.estado = p_estado)
    and (p_busqueda is null or position(lower(p_busqueda) in lower(concat_ws(' ', q.codigo,q.nombre,q.cliente_nombre,q.comprador_nombre))) > 0);
$$;

create or replace function public.cot_dashboard_resumen(
  p_desde timestamptz, p_hasta timestamptz, p_pais text default null,
  p_mes integer default null, p_anio integer default null,
  p_empresa text default null, p_estado text default null, p_busqueda text default null
) returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  with filtradas as materialized (
    select * from public.cot_dashboard_filtradas(p_desde,p_hasta,p_pais,p_mes,p_anio,p_empresa,p_estado,p_busqueda)
  ), reloj as (
    select date_trunc('month', now() at time zone 'America/Bogota')::date as actual,
           date_trunc('month',(p_hasta - interval '1 millisecond') at time zone 'America/Bogota')::date as fin
  ), meses as (
    select generate_series(fin - interval '11 months', fin, interval '1 month')::date as mes from reloj
  ), por_mes as (
    select date_trunc('month',fecha_local)::date as mes,sum(total_cop) as valor,count(*) as cantidad from filtradas group by 1
  ), paises as (
    select pais,count(*) as cantidad from filtradas group by pais
  ), ranking as (
    select *,row_number() over(order by cantidad desc,pais) as posicion from paises
  ), paises_agrupados as (
    select case when posicion <= 5 then pais else 'Otros' end as etiqueta,sum(cantidad) as cantidad,
           min(posicion) as posicion from ranking group by case when posicion <= 5 then pais else 'Otros' end
  )
  select jsonb_build_object(
    'total',(select count(*) from filtradas),
    'cop',(select coalesce(sum(total_cop),0) from filtradas),
    'usd',(select coalesce(sum(total_usd),0) from filtradas),
    'ticketCop',(select coalesce(avg(total_cop),0) from filtradas),
    'ticketUsd',(select coalesce(avg(total_usd),0) from filtradas),
    'borradores',(select count(*) from filtradas where estado='borrador'),
    'enviadasCerradas',(select count(*) from filtradas where estado in ('enviada','aprobada','cerrada')),
    'mesActual',(select count(*) from filtradas,reloj where fecha_local >= actual and fecha_local < actual + interval '1 month'),
    'mesAnterior',(select count(*) from filtradas,reloj where fecha_local >= actual - interval '1 month' and fecha_local < actual),
    'mensual',(select coalesce(jsonb_agg(jsonb_build_object('mes',to_char(m.mes,'YYYY-MM'),'valor',coalesce(p.valor,0),'cantidad',coalesce(p.cantidad,0)) order by m.mes),'[]'::jsonb) from meses m left join por_mes p using(mes)),
    'paises',(select coalesce(jsonb_agg(jsonb_build_object('etiqueta',etiqueta,'cantidad',cantidad) order by posicion),'[]'::jsonb) from paises_agrupados),
    'empresas',(select coalesce(jsonb_agg(jsonb_build_object('etiqueta',cotizador_por,'cantidad',cantidad) order by cotizador_por),'[]'::jsonb) from (select cotizador_por,count(*) as cantidad from filtradas group by cotizador_por) t),
    'estados',(select coalesce(jsonb_agg(jsonb_build_object('etiqueta',estado,'cantidad',cantidad) order by estado),'[]'::jsonb) from (select estado,count(*) as cantidad from filtradas group by estado) t)
  );
$$;

create or replace function public.cot_dashboard_opciones() returns jsonb
language sql stable security invoker set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'paises',(select coalesce(jsonb_agg(pais order by pais),'[]'::jsonb) from (select distinct pais from public.vw_dashboard_cotizaciones) t),
    'estados',(select coalesce(jsonb_agg(estado order by estado),'[]'::jsonb) from (select distinct estado from public.vw_dashboard_cotizaciones) t),
    'anios',(select coalesce(jsonb_agg(anio order by anio desc),'[]'::jsonb) from (select distinct extract(year from fecha_local)::integer as anio from public.vw_dashboard_cotizaciones) t)
  );
$$;
revoke all on function public.cot_dashboard_filtradas(timestamptz,timestamptz,text,integer,integer,text,text,text) from public,anon;
revoke all on function public.cot_dashboard_resumen(timestamptz,timestamptz,text,integer,integer,text,text,text) from public,anon;
revoke all on function public.cot_dashboard_opciones() from public,anon;
grant execute on function public.cot_dashboard_filtradas(timestamptz,timestamptz,text,integer,integer,text,text,text) to authenticated,service_role;
grant execute on function public.cot_dashboard_resumen(timestamptz,timestamptz,text,integer,integer,text,text,text) to authenticated,service_role;
grant execute on function public.cot_dashboard_opciones() to authenticated,service_role;
