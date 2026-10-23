-- PC tiene cinco entrepaños funcionales en total. La tercera pieza de
-- base_tapa es el fijo, por lo que solo se cortan cuatro entrepaños ajustables.

update public.cot_piezas_plantilla p
set formula_cantidad = '4',
    -- Versiones previas de esta migración añadieron una nota con codificación
    -- dependiente del cliente SQL. La documentación vive en WikiLLM; aquí se
    -- retira ese sufijo para que la operación sea idempotente.
    notas = nullif(regexp_replace(coalesce(p.notas, ''),
      ' \| PC: cuatro ajustables.*$', ''), ''),
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and upper(t.pref) = 'PC'
  and p.nombre = 'entrepano';

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PC'
      and p.nombre = 'entrepano'
      and p.formula_cantidad = '4'
  ) then
    raise exception 'No se actualizó la cantidad de entrepaños de PC';
  end if;
end;
$$;
