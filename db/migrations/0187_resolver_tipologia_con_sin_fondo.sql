-- Resuelve la tipologia en ambos sentidos:
--   Con fondo:  BFD-SM-SF -> BFD-SM
--   Sin fondo:  BFD-SM    -> BFD-SM-SF (creandola mediante 0186 si hace falta)

create or replace function public.cot_resolver_tipologia_fondo(
  p_tipo_actual uuid,
  p_con_fondo boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actual public.cot_tipos_mueble%rowtype;
  v_base uuid;
  v_pref_base text;
begin
  if not public.cot_is_authenticated() then
    raise exception 'No autorizado';
  end if;

  select * into v_actual
  from public.cot_tipos_mueble
  where id = p_tipo_actual and activo = true;
  if not found then raise exception 'Tipologia actual no encontrada'; end if;

  if p_con_fondo is not true then
    return public.cot_asegurar_tipologia_sin_fondo(v_actual.id);
  end if;

  if upper(v_actual.pref) not like '%-SF' then
    return v_actual.id;
  end if;

  v_pref_base := left(v_actual.pref, length(v_actual.pref) - 3);
  select id into v_base
  from public.cot_tipos_mueble
  where pref = v_pref_base and activo = true;

  if v_base is null then
    raise exception 'No existe la tipologia con fondo % para %', v_pref_base, v_actual.pref;
  end if;
  return v_base;
end;
$$;

revoke all on function public.cot_resolver_tipologia_fondo(uuid, boolean) from public, anon;
grant execute on function public.cot_resolver_tipologia_fondo(uuid, boolean) to authenticated;
