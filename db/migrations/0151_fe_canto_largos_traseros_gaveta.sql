-- Tipologias con riel Full Extension: los traseros de gaveta pequenos y
-- grandes llevan enchape en ambos lados largos. Se preservan calibre,
-- cantos anchos y cualquier otra propiedad existente del JSON.
update public.cot_piezas_plantilla p
set cantos=jsonb_set(coalesce(p.cantos, '{}'::jsonb), '{largos}', '2'::jsonb, true),
    notas=concat_ws(' | ', nullif(p.notas, ''),
      '0151: riel FE; enchape en ambos lados largos.'),
    updated_at=now()
where p.nombre in ('trasero_gaveta_pequena','trasero_gaveta_grande')
  and exists (
    select 1
    from public.cot_herrajes_plantilla h
    where h.tipo_mueble_id=p.tipo_mueble_id
      and h.rol='riel'
      and h.herraje_codigo='RIELFE500'
  );

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    where p.nombre in ('trasero_gaveta_pequena','trasero_gaveta_grande')
      and exists (
        select 1 from public.cot_herrajes_plantilla h
        where h.tipo_mueble_id=p.tipo_mueble_id
          and h.rol='riel' and h.herraje_codigo='RIELFE500'
      )
      and coalesce((p.cantos->>'largos')::int,0) <> 2
  ) then
    raise exception 'Quedaron traseros de gaveta FE sin dos cantos largos';
  end if;
end $$;
