-- Garantiza que todas las tipologías de la familia DB/IC ya creadas estén
-- activas. Las configuraciones DB-1S/2S/2/3/4/2-1OP viven en el selector y no
-- son filas independientes; el frontend vuelve a ofrecerlas todas.
update public.cot_tipos_mueble
set activo = true,
    updated_at = now()
where pref = 'DB'
   or pref like 'DB-%'
   or pref = 'IC'
   or pref like 'IC-%'
   or pref_imperial = 'DB'
   or pref_imperial like 'DB-%'
   or pref_metrico = 'IC'
   or pref_metrico like 'IC-%';

do $$
begin
  if exists (
    select 1 from public.cot_tipos_mueble
    where (pref = 'DB' or pref like 'DB-%'
       or pref = 'IC' or pref like 'IC-%'
       or pref_imperial = 'DB' or pref_imperial like 'DB-%'
       or pref_metrico = 'IC' or pref_metrico like 'IC-%')
      and not activo
  ) then
    raise exception 'Quedaron tipologías DB/IC inactivas';
  end if;
end $$;
