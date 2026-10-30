-- Prueba transaccional: fixtures, filtros, agregados, RLS y opciones. Siempre rollback.
-- Ejecutar: node scripts/run-sql.mjs db/tests/dashboard_cotizaciones.sql
begin;
insert into public.cot_cotizaciones(id,nombre,cliente_nombre,codigo,pais,ciudad,cotizador_por,estado,total_cop,total_usd,created_at)
values
 ('f2290000-0000-4000-8000-000000000001','QA Dashboard Uno','Cliente QA','QA229-1','QA País','QA Ciudad','FIRPLAK','enviada',1000,10,'2026-10-01 05:00:00+00'),
 ('f2290000-0000-4000-8000-000000000002','QA Dashboard Dos','Cliente QA','QA229-2','QA País',null,'CEMA','borrador',3000,30,'2026-10-02 05:00:00+00'),
 ('f2290000-0000-4000-8000-000000000003','QA Dashboard Otro mes','Cliente QA','QA229-3','QA País',null,'FIRPLAK','enviada',5000,50,'2026-09-30 23:59:00+00');
insert into public.cot_cotizaciones(nombre,pais,cotizador_por,total_cop,total_usd,created_at)
select 'QA Dashboard Top ' || i, 'QA Top País ' || i, 'CEMA', 0, 0, '2026-10-02 12:00:00+00'::timestamptz from generate_series(1,7) i;

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"f2290000-0000-4000-8000-000000000099"}',true);
do $$
declare r jsonb; n bigint; visible bigint; v record;
begin
  r := public.cot_dashboard_resumen('2026-10-01 00:00-05','2026-11-01 00:00-05','QA País',10,2026,'FIRPLAK','enviada','QA229');
  if (r->>'total')::integer <> 1 or (r->>'cop')::numeric <> 1000 or (r->>'usd')::numeric <> 10 then
    raise exception 'Filtros combinados o agregados no coinciden: %',r;
  end if;
  if jsonb_array_length(r->'mensual') <> 12 or (r->'mensual'->11->>'valor')::numeric <> 1000 then
    raise exception 'La serie mensual no respeta el rango y los filtros';
  end if;
  r := public.cot_dashboard_resumen('2026-10-01 00:00-05','2026-11-01 00:00-05','QA País');
  if (r->>'total')::integer <> 2 or (r->>'ticketCop')::numeric <> 2000 or (r->>'borradores')::integer <> 1 or (r->>'enviadasCerradas')::integer <> 1 then
    raise exception 'Ticket o pipeline incorrecto: %',r;
  end if;
  if (select sum((p->>'cantidad')::integer) from jsonb_array_elements(r->'paises') p) <> 2 then
    raise exception 'Países no concilian con el total';
  end if;
  r := public.cot_dashboard_resumen('2026-10-01 00:00-05','2026-11-01 00:00-05',null,null,null,null,null,'QA Dashboard Top');
  if jsonb_array_length(r->'paises') <> 6 or r->'paises'->5->>'etiqueta' <> 'Otros' or (r->'paises'->5->>'cantidad')::integer <> 2 then
    raise exception 'El top 5 más Otros no concilia: %',r->'paises';
  end if;
  select count(*) into n from public.cot_dashboard_filtradas('2000-01-01','2100-01-01');
  select count(*) into visible from public.cot_cotizaciones;
  if n <> visible then raise exception 'El dashboard y el listado no respetan la misma visibilidad RLS'; end if;
  if not public.cot_dashboard_opciones()->'paises' ? 'QA País' then raise exception 'Opciones no incluyen países visibles'; end if;
  for v in select * from public.cot_dashboard_filtradas('2026-10-01 00:00-05','2026-11-01 00:00-05','QA País') loop
    if v.fecha_local < '2026-10-01' then raise exception 'Límite Bogotá inválido'; end if;
  end loop;
end $$;
reset role;
do $$ begin
  if has_function_privilege('anon','public.cot_dashboard_resumen(timestamptz,timestamptz,text,integer,integer,text,text,text)','EXECUTE') then raise exception 'El RPC es accesible anónimamente'; end if;
  if has_table_privilege('anon','public.vw_dashboard_cotizaciones','SELECT') then raise exception 'La vista es accesible anónimamente'; end if;
end $$;
rollback;
select 'Dashboard SQL: filtros, fechas, agregados y RLS aprobados; fixtures revertidos.' as resultado;
