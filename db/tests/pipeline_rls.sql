-- Solo cot_pipeline; fixtures aislados y rollback. No altera cotizaciones.
begin;
insert into public.cot_pipeline(id,cliente,creado_por) select 'f2390000-0000-4000-8000-000000000001','QA Pipeline RLS',id from auth.users order by created_at limit 1;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"f2390000-0000-4000-8000-000000000099"}',true);
do $$ declare n integer; begin
 if not exists(select 1 from public.cot_pipeline where id='f2390000-0000-4000-8000-000000000001') then raise exception 'Un autenticado debe poder leer'; end if;
 update public.cot_pipeline set cliente='MODIFICACION NO AUTORIZADA' where id='f2390000-0000-4000-8000-000000000001';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'RLS permitió UPDATE ajeno'; end if;
 begin
  insert into public.cot_pipeline(cliente) values('INSERT NO AUTORIZADO');
  raise exception 'RLS permitió INSERT sin creador';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
