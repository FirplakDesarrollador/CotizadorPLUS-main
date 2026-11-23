-- Normaliza los codigos historicos de torres que ya tienen TK asignado.
-- El formato es PREF + largo + alto + profundidad + sufijos + " TK" + medida.

create or replace function pg_temp.cot_codigo_medida_torre(
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

with codigos as (
  select
    l.id,
    regexp_replace(l.codigo_modulo, ' TK[^ ]+( [0-9]+/[0-9]+)?$', '') as codigo_sin_tk,
    split_part(t.pref, '-', 1)
      || pg_temp.cot_codigo_medida_torre(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial')) as base_anterior,
    split_part(t.pref, '-', 1)
      || pg_temp.cot_codigo_medida_torre(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
      || pg_temp.cot_codigo_medida_torre(l.alto, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
      || pg_temp.cot_codigo_medida_torre(l.prof, l.unidad_dim, coalesce(c.sistema_medida, 'imperial')) as base_nueva,
    pg_temp.cot_codigo_medida_torre(
      (l.config->'overrides'->>'zocalo')::numeric,
      'in',
      coalesce(c.sistema_medida, 'imperial')
    ) as tk
  from public.cot_cotizacion_lineas l
  join public.cot_tipos_mueble t on t.id = l.tipo_mueble_id
  join public.cot_cotizaciones c on c.id = l.cotizacion_id
  where upper(t.pref) in ('PC', 'PCFD', 'PCFD-MO', 'VPC', 'OVPC')
    and l.codigo_modulo is not null
    and l.config->'overrides'->>'zocalo' is not null
), normalizados as (
  select *, case
    when codigo_sin_tk like base_nueva || '%'
      then base_nueva || substring(codigo_sin_tk from length(base_nueva) + 1)
    when codigo_sin_tk like base_anterior || '%'
      then base_nueva || substring(codigo_sin_tk from length(base_anterior) + 1)
    else null
  end as codigo_dimensiones
  from codigos
)
update public.cot_cotizacion_lineas l
set codigo_modulo = n.codigo_dimensiones || ' TK' || n.tk,
    updated_at = now()
from normalizados n
where l.id = n.id
  and n.codigo_dimensiones is not null
  and n.tk <> ''
  and l.codigo_modulo is distinct from n.codigo_dimensiones || ' TK' || n.tk;

update public.cot_grupos_modulos g
set codigo_grupo = x.codigo_grupo,
    updated_at = now()
from (
  select l.grupo_id,
         string_agg(l.codigo_modulo, '.' order by l.posicion_grupo, l.orden, l.created_at) as codigo_grupo
  from public.cot_cotizacion_lineas l
  where l.grupo_id is not null
  group by l.grupo_id
) x
where g.id = x.grupo_id
  and g.codigo_grupo is distinct from x.codigo_grupo;
