-- El TK se guarda en pulgadas con seis decimales. Al presentarlo de nuevo en
-- centimetros se redondea a la misma precision del formulario para no exponer
-- residuos de conversion como TK10.00000032.

with codigos as (
  select
    l.id,
    regexp_replace(l.codigo_modulo, ' TK[^ ]+( [0-9]+/[0-9]+)?$', '') as base,
    trim(trailing '.' from trim(trailing '0' from to_char(
      round(((l.config->'overrides'->>'zocalo')::numeric * 2.54), 6),
      'FM999999999999990.999999'
    ))) as tk
  from public.cot_cotizacion_lineas l
  join public.cot_tipos_mueble t on t.id = l.tipo_mueble_id
  join public.cot_cotizaciones c on c.id = l.cotizacion_id
  where upper(t.pref) in ('PC', 'PCFD', 'PCFD-MO', 'VPC', 'OVPC')
    and coalesce(c.sistema_medida, 'imperial') = 'metrico'
    and l.codigo_modulo ~ ' TK'
    and l.config->'overrides'->>'zocalo' is not null
)
update public.cot_cotizacion_lineas l
set codigo_modulo = c.base || ' TK' || c.tk,
    updated_at = now()
from codigos c
where l.id = c.id
  and c.tk <> ''
  and l.codigo_modulo is distinct from c.base || ' TK' || c.tk;

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
