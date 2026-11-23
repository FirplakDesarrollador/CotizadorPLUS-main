-- Orden de secciones atómico; no recalcula ni modifica muebles o importes.
create or replace function public.cot_reordenar_cocinas(p_cotizacion_id uuid, p_cocina_ids uuid[])
returns uuid language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
  perform id from public.cot_cotizaciones
  where id=p_cotizacion_id and (creado_por=auth.uid() or public.cot_is_admin() or auth.role()='service_role')
  for update;
  if not found then raise exception 'No tienes permiso para ordenar esta cotización' using errcode='42501'; end if;
  perform id from public.cot_cocinas where cotizacion_id=p_cotizacion_id for update;
  select count(*) into n from public.cot_cocinas where cotizacion_id=p_cotizacion_id;
  if p_cocina_ids is null or cardinality(p_cocina_ids)<>n
    or (select count(distinct id) from unnest(p_cocina_ids) as x(id))<>n
    or exists(select 1 from unnest(p_cocina_ids) as x(id)
      where not exists(select 1 from public.cot_cocinas c where c.id=x.id and c.cotizacion_id=p_cotizacion_id))
  then raise exception 'Las secciones cambiaron. Recarga la cotización y vuelve a ordenar.' using errcode='22023'; end if;

  update public.cot_cocinas c set orden=(x.pos-1)::integer
  from unnest(p_cocina_ids) with ordinality as x(id,pos)
  where c.id=x.id and c.cotizacion_id=p_cotizacion_id and c.orden is distinct from (x.pos-1)::integer;
  return p_cotizacion_id;
end $$;
revoke all on function public.cot_reordenar_cocinas(uuid,uuid[]) from public,anon;
grant execute on function public.cot_reordenar_cocinas(uuid,uuid[]) to authenticated,service_role;
