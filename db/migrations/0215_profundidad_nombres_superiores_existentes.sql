-- Añade la profundidad a los códigos comerciales ya persistidos de muebles
-- superiores. La aplicación ya lo hace para líneas nuevas mediante
-- codigoComercial(); esta migración pone al día el histórico actual.
--
-- Solo se modifica una línea cuando la parte anterior al primer guion coincide
-- exactamente con el código antiguo calculado desde sus dimensiones. Así es
-- idempotente y no duplica la profundidad en TW, WSM, W de 24 in ni líneas
-- creadas después del cambio. WCC queda excluido porque pertenece a clóset.

create or replace function pg_temp.cot_codigo_medida(
  p_valor numeric,
  p_unidad text,
  p_sistema text
) returns text
language plpgsql
immutable
as $$
declare
  v numeric;
  v_dieciseisavos bigint;
  v_entero bigint;
  v_numerador bigint;
  v_divisor bigint;
begin
  if p_valor is null then return ''; end if;

  v := case
    when p_sistema = 'imperial' and p_unidad = 'cm' then p_valor / 2.54
    when p_sistema = 'imperial' and p_unidad = 'mm' then p_valor / 25.4
    when p_sistema = 'metrico' and p_unidad = 'in' then p_valor * 2.54
    when p_sistema = 'metrico' and p_unidad = 'mm' then p_valor / 10
    else p_valor
  end;

  if p_sistema <> 'imperial' then
    return trim(trailing '.' from trim(trailing '0' from
      to_char(v, 'FM999999999999990.999999999999999')));
  end if;

  v_dieciseisavos := round(v * 16);
  v_entero := v_dieciseisavos / 16;
  v_numerador := mod(v_dieciseisavos, 16);
  if v_numerador = 0 then return v_entero::text; end if;

  v_divisor := gcd(v_numerador, 16);
  return case when v_entero = 0 then '' else v_entero::text || ' ' end
    || (v_numerador / v_divisor)::text || '/' || (16 / v_divisor)::text;
end;
$$;

with candidatas as (
  select
    l.id,
    split_part(l.codigo_modulo, '-', 1) as base_actual,
    split_part(t.pref, '-', 1)
      || pg_temp.cot_codigo_medida(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
      || case
           when split_part(upper(t.pref), '-', 1) in ('W','UW','OW','WBL','WER','WLD','WPC','WSM')
             or upper(t.pref) = 'TW' or upper(t.pref) like 'TW-%'
           then pg_temp.cot_codigo_medida(l.alto, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
           else ''
         end as base_antigua,
    pg_temp.cot_codigo_medida(l.prof, l.unidad_dim, coalesce(c.sistema_medida, 'imperial')) as profundidad
  from public.cot_cotizacion_lineas l
  join public.cot_tipos_mueble t on t.id = l.tipo_mueble_id
  join public.cot_cotizaciones c on c.id = l.cotizacion_id
  where l.codigo_modulo is not null
    and l.prof is not null
    and upper(t.pref) <> 'WCC'
    and (
      upper(t.pref) = 'TW'
      or upper(t.pref) like 'TW-%'
      or (
        strpos(upper(t.pref), 'W') > 0
        and (strpos(upper(t.pref), 'B') = 0 or strpos(upper(t.pref), 'W') < strpos(upper(t.pref), 'B'))
      )
    )
), actualizadas as (
  update public.cot_cotizacion_lineas l
  set codigo_modulo = c.base_antigua || c.profundidad
    || substring(l.codigo_modulo from length(c.base_actual) + 1),
      updated_at = now()
  from candidatas c
  where l.id = c.id
    and c.base_actual = c.base_antigua
    and c.profundidad <> ''
  returning l.grupo_id
), grupos_afectados as (
  select distinct grupo_id from actualizadas where grupo_id is not null
)
update public.cot_grupos_modulos g
set codigo_grupo = x.codigo_grupo,
    updated_at = now()
from (
  select l.grupo_id,
         string_agg(l.codigo_modulo, '.' order by l.posicion_grupo, l.orden, l.created_at) as codigo_grupo
  from public.cot_cotizacion_lineas l
  join grupos_afectados a on a.grupo_id = l.grupo_id
  group by l.grupo_id
) x
where g.id = x.grupo_id;

do $$
begin
  if exists (
    select 1
    from public.cot_cotizacion_lineas l
    join public.cot_tipos_mueble t on t.id = l.tipo_mueble_id
    join public.cot_cotizaciones c on c.id = l.cotizacion_id
    where l.codigo_modulo is not null
      and l.prof is not null
      and upper(t.pref) <> 'WCC'
      and (
        upper(t.pref) = 'TW' or upper(t.pref) like 'TW-%'
        or (strpos(upper(t.pref), 'W') > 0
          and (strpos(upper(t.pref), 'B') = 0 or strpos(upper(t.pref), 'W') < strpos(upper(t.pref), 'B')))
      )
      and split_part(l.codigo_modulo, '-', 1) =
        split_part(t.pref, '-', 1)
        || pg_temp.cot_codigo_medida(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
        || case
             when split_part(upper(t.pref), '-', 1) in ('W','UW','OW','WBL','WER','WLD','WPC','WSM')
               or upper(t.pref) = 'TW' or upper(t.pref) like 'TW-%'
             then pg_temp.cot_codigo_medida(l.alto, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
             else ''
           end
  ) then
    raise exception 'Quedaron códigos superiores con el formato anterior';
  end if;
end;
$$;
