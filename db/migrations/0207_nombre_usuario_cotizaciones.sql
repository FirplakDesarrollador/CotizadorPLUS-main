-- Nombre visible elegido al iniciar sesión y consulta segura de autores.
alter table public.cot_perfiles
  add column if not exists nombre text;

create or replace function public.cot_guardar_nombre_usuario(p_nombre text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  v_nombre := btrim(coalesce(p_nombre, ''));
  if v_nombre = '' then
    raise exception 'El nombre es obligatorio';
  end if;
  if char_length(v_nombre) > 80 then
    raise exception 'El nombre no puede superar 80 caracteres';
  end if;

  insert into public.cot_perfiles(user_id, nombre)
  values (auth.uid(), v_nombre)
  on conflict (user_id) do update
    set nombre = excluded.nombre,
        updated_at = now();

  return v_nombre;
end;
$$;

create or replace function public.cot_nombres_usuarios(p_user_ids uuid[])
returns table(user_id uuid, nombre text)
language sql
stable
security definer
set search_path = public
as $$
  select p.user_id, p.nombre
  from public.cot_perfiles p
  where auth.uid() is not null
    and p.user_id = any(coalesce(p_user_ids, array[]::uuid[]));
$$;

revoke all on function public.cot_guardar_nombre_usuario(text) from public;
revoke all on function public.cot_nombres_usuarios(uuid[]) from public;
grant execute on function public.cot_guardar_nombre_usuario(text) to authenticated;
grant execute on function public.cot_nombres_usuarios(uuid[]) to authenticated;
