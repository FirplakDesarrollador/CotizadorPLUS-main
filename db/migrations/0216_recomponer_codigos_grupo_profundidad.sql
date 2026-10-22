-- 0215 actualizó correctamente codigo_modulo, pero su UPDATE de grupos estaba
-- en la misma sentencia con CTE mutador y leyó la instantánea previa de líneas.
-- Esta migración separada recompone cada código de grupo desde el estado ya
-- confirmado de cot_cotizacion_lineas.

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
    from public.cot_grupos_modulos g
    join (
      select l.grupo_id,
             string_agg(l.codigo_modulo, '.' order by l.posicion_grupo, l.orden, l.created_at) as codigo_grupo
      from public.cot_cotizacion_lineas l
      where l.grupo_id is not null and l.codigo_modulo is not null
      group by l.grupo_id
    ) x on x.grupo_id = g.id
    where g.codigo_grupo is distinct from x.codigo_grupo
  ) then
    raise exception 'Quedaron códigos de grupo desincronizados';
  end if;
end;
$$;
