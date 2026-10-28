-- PCFD no ofrece variante sin fondo: normaliza el historico y evita recrearla.
-- PC, PCFD, PCFD-MO y OVPC conservan el campo TK, pero sin valor por defecto.

create or replace function public.cot_resolver_tipologia_fondo(p_tipo_actual uuid, p_con_fondo boolean)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_actual public.cot_tipos_mueble%rowtype;
  v_base uuid;
  v_pref_base text;
begin
  if not public.cot_is_authenticated() then raise exception 'No autorizado'; end if;
  select * into v_actual from public.cot_tipos_mueble where id = p_tipo_actual;
  if not found then raise exception 'Tipologia actual no encontrada'; end if;

  v_pref_base := case when upper(v_actual.pref) like '%-SF'
    then left(v_actual.pref, length(v_actual.pref) - 3) else v_actual.pref end;

  if upper(v_pref_base) in ('F', 'PN', 'TK', 'DFE', 'PCFD') then
    select id into v_base from public.cot_tipos_mueble
    where upper(pref) = upper(v_pref_base) and activo = true;
    if v_base is null then raise exception 'No existe la tipologia base %', v_pref_base; end if;
    return v_base;
  end if;

  if v_actual.activo is not true then raise exception 'Tipologia actual no encontrada'; end if;
  if p_con_fondo is not true then return public.cot_asegurar_tipologia_sin_fondo(v_actual.id); end if;
  if upper(v_actual.pref) not like '%-SF' then return v_actual.id; end if;
  select id into v_base from public.cot_tipos_mueble
  where upper(pref) = upper(v_pref_base) and activo = true;
  if v_base is null then raise exception 'No existe la tipologia con fondo % para %', v_pref_base, v_actual.pref; end if;
  return v_base;
end;
$$;

revoke all on function public.cot_resolver_tipologia_fondo(uuid, boolean) from public, anon;
grant execute on function public.cot_resolver_tipologia_fondo(uuid, boolean) to authenticated;
revoke execute on function public.cot_asegurar_tipologia_sin_fondo(uuid) from authenticated;

with equivalencia as (
  select variante.id as variante_id, base.id as base_id, base.pref as base_pref
  from public.cot_tipos_mueble variante
  join public.cot_tipos_mueble base on upper(base.pref) = 'PCFD' and base.activo = true
  where upper(variante.pref) = 'PCFD-SF'
)
update public.cot_cotizacion_lineas l
set tipo_mueble_id = e.base_id, pref = e.base_pref,
    codigo_modulo = replace(l.codigo_modulo, '-SF', ''),
    config = jsonb_set(coalesce(l.config, '{}'::jsonb), '{conFondo}', 'true'::jsonb, true),
    updated_at = now()
from equivalencia e where l.tipo_mueble_id = e.variante_id;

update public.cot_tipos_mueble set activo = false, updated_at = now()
where upper(pref) = 'PCFD-SF';

-- VPC se excluye deliberadamente y conserva su TK0 actual.
delete from public.cot_reglas_config r using public.cot_tipos_mueble t
where r.tipo_mueble_id = t.id and r.variable = 'zocalo'
  and upper(t.pref) in ('PC', 'PCFD', 'PCFD-MO', 'OVPC');

update public.cot_grupos_modulos g set codigo_grupo = x.codigo_grupo, updated_at = now()
from (
  select l.grupo_id, string_agg(l.codigo_modulo, '.' order by l.posicion_grupo, l.orden, l.created_at) as codigo_grupo
  from public.cot_cotizacion_lineas l where l.grupo_id is not null and l.codigo_modulo is not null group by l.grupo_id
) x where g.id = x.grupo_id and g.codigo_grupo is distinct from x.codigo_grupo;

do $$
begin
  if exists (select 1 from public.cot_tipos_mueble where upper(pref) = 'PCFD-SF' and activo) then
    raise exception 'PCFD-SF quedo activa';
  end if;
  if exists (
    select 1 from public.cot_reglas_config r join public.cot_tipos_mueble t on t.id = r.tipo_mueble_id
    where r.variable = 'zocalo' and upper(t.pref) in ('PC', 'PCFD', 'PCFD-MO', 'OVPC')
  ) then raise exception 'Quedaron valores TK predeterminados en torres'; end if;
end;
$$;
