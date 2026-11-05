begin;
insert into public.cot_pipeline(nombre_proyecto,cliente,pais,estado,fecha_limite_envio,monto_fob_usd,monto_fob_cop)
values('QA241 Uno','QA241 Cliente','QA241 País','borrador','2026-01-01',100,400000),('QA241 Dos','QA241 Cliente','QA241 País','en_pausa',null,200,800000);
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"f2410000-0000-4000-8000-000000000099"}',true);
do $$ declare r jsonb; n integer; begin
 r:=public.cot_pipeline_resumen('QA241',null,'QA241 País',null,null,'2026-11-05');
 if (r->>'total')::integer<>2 or (r->>'pendientes')::integer<>1 or (r->>'en_pausa')::integer<>1 or (r->>'vencidas')::integer<>1 then raise exception 'KPIs Pipeline incorrectos: %',r; end if;
 if (r->>'fobUsd')::numeric<>300 or (r->>'fobCop')::numeric<>1200000 then raise exception 'Montos no concilian'; end if;
 if (select sum((e->>'cantidad')::integer) from jsonb_array_elements(r->'estados') e)<>2 then raise exception 'Estados no concilian'; end if;
 select count(*) into n from public.cot_pipeline_filtradas('QA241','en_pausa');if n<>1 then raise exception 'Filtros incorrectos';end if;
 if not public.cot_pipeline_opciones()->'pais' ? 'QA241 País' then raise exception 'Opciones perdidas';end if;
 select count(*) into n from public.cot_pipeline_filtradas('%);drop table');if n<>0 then raise exception 'Búsqueda debe ser texto literal';end if;
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname in ('cot_pipeline_filtradas','cot_pipeline_opciones','cot_pipeline_resumen') and prosecdef) then raise exception 'RPC no puede ser SECURITY DEFINER';end if;
end $$;
reset role;
rollback;
