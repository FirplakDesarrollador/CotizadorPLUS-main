-- Catálogo unificado: superset del anterior, sin alterar ninguna fila.
begin;
alter table public.cot_cotizaciones drop constraint cot_cotizaciones_estado_check;
alter table public.cot_cotizaciones add constraint cot_cotizaciones_estado_check
 check (estado in ('borrador','enviada','en_pausa','reproceso','aprobada','rechazada','descartada'));
comment on constraint cot_cotizaciones_estado_check on public.cot_cotizaciones is 'Catálogo compartido con Pipeline CEFI; conserva todos los estados históricos.';
comment on column public.cot_cotizaciones.estado is 'borrador, enviada, en_pausa, reproceso, aprobada, rechazada, descartada.';
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
    'pendientes',(select count(*) from filtradas where estado='borrador'),
    'enCurso',(select count(*) from filtradas where estado in ('en_pausa','reproceso')),
    'cerradas',(select count(*) from filtradas where estado in ('enviada','aprobada')),
    'perdidas',(select count(*) from filtradas where estado in ('rechazada','descartada')),
    'borradores',(select count(*) from filtradas where estado='borrador'),
    'enviadasCerradas',(select count(*) from filtradas where estado in ('enviada','aprobada')),
    'mesActual',(select count(*) from filtradas,reloj where fecha_local >= actual and fecha_local < actual + interval '1 month'),
    'mesAnterior',(select count(*) from filtradas,reloj where fecha_local >= actual - interval '1 month' and fecha_local < actual),
    'mensual',(select coalesce(jsonb_agg(jsonb_build_object('mes',to_char(m.mes,'YYYY-MM'),'valor',coalesce(p.valor,0),'cantidad',coalesce(p.cantidad,0)) order by m.mes),'[]'::jsonb) from meses m left join por_mes p using(mes)),
    'paises',(select coalesce(jsonb_agg(jsonb_build_object('etiqueta',etiqueta,'cantidad',cantidad) order by posicion),'[]'::jsonb) from paises_agrupados),
    'empresas',(select coalesce(jsonb_agg(jsonb_build_object('etiqueta',cotizador_por,'cantidad',cantidad) order by cotizador_por),'[]'::jsonb) from (select cotizador_por,count(*) as cantidad from filtradas group by cotizador_por) t),
    'estados',(select coalesce(jsonb_agg(jsonb_build_object('etiqueta',estado,'cantidad',cantidad) order by estado),'[]'::jsonb) from (select estado,count(*) as cantidad from filtradas group by estado) t)
  );
$$;


commit;
