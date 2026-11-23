create table if not exists public.optimizador_guardados (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid null,
  proyecto_nombre text not null,
  nombre text not null check (length(trim(nombre)) between 1 and 160),
  autor_id uuid not null,
  autor_email text not null,
  created_at timestamptz not null default now(),
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  resultado jsonb not null check (jsonb_typeof(resultado) = 'object')
);
create index if not exists optimizador_guardados_fecha_idx on public.optimizador_guardados(created_at desc);
alter table public.optimizador_guardados enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='optimizador_guardados' and policyname='optimizador_guardados_sel') then
    create policy optimizador_guardados_sel on public.optimizador_guardados for select to authenticated using(auth.uid() is not null);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='optimizador_guardados' and policyname='optimizador_guardados_ins') then
    create policy optimizador_guardados_ins on public.optimizador_guardados for insert to authenticated with check(auth.uid()=autor_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='optimizador_guardados' and policyname='optimizador_guardados_del') then
    create policy optimizador_guardados_del on public.optimizador_guardados for delete to authenticated using(autor_id=auth.uid() or public.cot_is_admin());
  end if;
end $$;
revoke all on public.optimizador_guardados from anon, authenticated;
grant select, insert, delete on public.optimizador_guardados to authenticated;
-- También protege la procedencia al insertar directamente mediante REST.
create or replace function public.optimizador_guardado_procedencia() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or new.autor_id is distinct from auth.uid() then raise exception 'No autorizado'; end if;
  select email into new.autor_email from auth.users where id=auth.uid();
  if new.autor_email is null then raise exception 'El autor no tiene correo'; end if;
  new.created_at := clock_timestamp();
  return new;
end $$;
revoke all on function public.optimizador_guardado_procedencia() from public;
do $$ begin
  if not exists(select 1 from pg_trigger where tgrelid='public.optimizador_guardados'::regclass and tgname='optimizador_guardado_procedencia') then
    create trigger optimizador_guardado_procedencia before insert on public.optimizador_guardados for each row execute function public.optimizador_guardado_procedencia();
  end if;
end $$;
