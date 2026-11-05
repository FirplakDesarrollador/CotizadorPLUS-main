begin;
insert into public.cot_cotizaciones(nombre,estado)
 select 'QA238 Catálogo '||estado,estado from unnest(array['borrador','enviada','en_pausa','reproceso','aprobada','rechazada','descartada']) estado;
do $$ declare r jsonb; begin
 r:=public.cot_dashboard_resumen('2000-01-01','2100-01-01',null,null,null,null,null,'QA238 Catálogo');
 if (r->>'total')::integer<>7 or (r->>'pendientes')::integer<>1 or (r->>'enCurso')::integer<>2 or (r->>'cerradas')::integer<>2 or (r->>'perdidas')::integer<>2 then raise exception 'Agrupación de estados incorrecta: %',r;end if;
 begin
  insert into public.cot_cotizaciones(nombre,estado) values('QA238 Estado inválido','cerrada');
  raise exception 'Se admitió cerrada';
 exception when check_violation then null;end;
end $$;
rollback;
