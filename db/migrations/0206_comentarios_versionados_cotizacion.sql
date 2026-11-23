-- Comentarios append-only guardados en cot_cotizaciones.notas.
-- `notas` ya forma parte de la cabecera serializada/restaurada por versiones.
create or replace function public.cot_agregar_comentario(
  p_cotizacion_id uuid,
  p_texto text
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_texto text;
  v_comentario jsonb;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  v_texto := btrim(coalesce(p_texto, ''));
  if v_texto = '' then
    raise exception 'El comentario no puede estar vacío';
  end if;
  if char_length(v_texto) > 2000 then
    raise exception 'El comentario no puede superar 2000 caracteres';
  end if;

  v_comentario := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'texto', v_texto,
    'creadoPor', auth.uid()::text,
    'creadoEn', to_jsonb(clock_timestamp())
  );

  update public.cot_cotizaciones
  set notas = (
    coalesce(nullif(btrim(notas), '')::jsonb, '[]'::jsonb)
    || jsonb_build_array(v_comentario)
  )::text
  where id = p_cotizacion_id
    and (creado_por = auth.uid() or public.cot_is_admin());

  if not found then
    raise exception 'Cotización no encontrada o sin permisos';
  end if;

  return v_comentario;
end;
$$;

revoke all on function public.cot_agregar_comentario(uuid, text) from public;
grant execute on function public.cot_agregar_comentario(uuid, text) to authenticated;
