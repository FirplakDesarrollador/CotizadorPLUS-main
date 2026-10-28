-- Agrega las medidas de alto y profundidad en el código comercial de las
-- tipologías DFE (gavetero de clóset).
-- Formato resultante: DFE + largo + alto + profundidad (+ sufijos si hubiera).
--
-- Esta migración pone al día los registros históricos existentes en
-- cot_cotizacion_lineas y sincroniza sus respectivos grupos en cot_grupos_modulos.

create or replace function pg_temp.cot_codigo_medida_dfe(
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
    l.codigo_modulo,
    split_part(t.pref, '-', 1)
      || pg_temp.cot_codigo_medida_dfe(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial')) as base_anterior,
    split_part(t.pref, '-', 1)
      || pg_temp.cot_codigo_medida_dfe(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
      || pg_temp.cot_codigo_medida_dfe(l.alto, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
      || pg_temp.cot_codigo_medida_dfe(l.prof, l.unidad_dim, coalesce(c.sistema_medida, 'imperial')) as base_nueva
  from public.cot_cotizacion_lineas l
  join public.cot_tipos_mueble t on t.id = l.tipo_mueble_id
  join public.cot_cotizaciones c on c.id = l.cotizacion_id
  where upper(t.pref) = 'DFE'
    and l.codigo_modulo is not null
), normalizados as (
  select
    id,
    case
      when codigo_modulo like base_nueva || '%'
        then codigo_modulo
      when codigo_modulo like base_anterior || '%'
        then base_nueva || substring(codigo_modulo from length(base_anterior) + 1)
      else null
    end as codigo_nuevo
  from codigos
)
update public.cot_cotizacion_lineas l
set codigo_modulo = n.codigo_nuevo,
    updated_at = now()
from normalizados n
where l.id = n.id
  and n.codigo_nuevo is not null
  and l.codigo_modulo is distinct from n.codigo_nuevo;

update public.cot_grupos_modulos g
set codigo_grupo = x.codigo_grupo,
    updated_at = now()
from (
  select l.grupo_id,
         string_agg(l.codigo_modulo, '.' order by l.posicion_grupo, l.orden, l.created_at) as codigo_grupo
  from public.cot_cotizacion_lineas l
  where l.grupo_id is not null
    and l.codigo_modulo is not null
  group by l.grupo_id
) x
where g.id = x.grupo_id
  and g.codigo_grupo is distinct from x.codigo_grupo;

do $$
begin
  if exists (
    select 1
    from public.cot_cotizacion_lineas l
    join public.cot_tipos_mueble t on t.id = l.tipo_mueble_id
    join public.cot_cotizaciones c on c.id = l.cotizacion_id
    where upper(t.pref) = 'DFE'
      and l.codigo_modulo is not null
      and l.alto is not null
      and l.prof is not null
      and l.codigo_modulo = (
        split_part(t.pref, '-', 1)
        || pg_temp.cot_codigo_medida_dfe(l.largo, l.unidad_dim, coalesce(c.sistema_medida, 'imperial'))
      )
  ) then
    raise exception 'Quedaron códigos DFE sin actualizar con alto y profundidad';
  end if;
end;
$$;
