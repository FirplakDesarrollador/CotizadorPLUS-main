-- Cambio exclusivamente descriptivo. No modifica prefijos, nombres ingleses,
-- categorias, piezas, reglas, herrajes ni configuracion de las tipologias.
update public.cot_tipos_mueble
set nombre_es = case pref
  when 'W-SM' then 'Mueble Superior Sin Manija'
  when 'W-SM-LOC' then 'Mueble Superior Locero Sin Manija'
  when 'W-SM-PUSH' then 'Mueble Superior Sin Manija con PUSH'
end
where pref in ('W-SM', 'W-SM-LOC', 'W-SM-PUSH');

do $$
begin
  if (select count(*) from public.cot_tipos_mueble where pref in ('W-SM', 'W-SM-LOC', 'W-SM-PUSH')) <> 3 then
    raise exception 'No se encontraron exactamente las tres tipologias W-SM esperadas';
  end if;
end $$;
