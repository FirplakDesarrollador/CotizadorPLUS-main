-- Todos los refuerzos y piezas gola_madera llevan canto en sus dos lados largos.
-- jsonb_set preserva calibre, lados cortos, forceCalibre y cualquier otro metadato.

update public.cot_piezas_plantilla
set cantos = jsonb_set(coalesce(cantos, '{}'::jsonb), '{largos}', '2'::jsonb, true),
    updated_at = now()
where lower(nombre) like '%refuerzo%'
   or lower(nombre) in ('gola_madera', 'gola madera');

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla
    where (lower(nombre) like '%refuerzo%'
           or lower(nombre) in ('gola_madera', 'gola madera'))
      and coalesce((cantos->>'largos')::integer, 0) <> 2
  ) then
    raise exception 'Quedaron refuerzos o golas sin canto en ambos lados largos';
  end if;
end $$;

