-- BMW historico conserva una plantilla aproximada que se confunde con BMW-1.
-- No tiene lineas de cotizacion asociadas al momento de esta migracion.
update public.cot_tipos_mueble
set activo=false,
    notas=concat_ws(' ',nullif(notas,''),
      'Tipologia historica retirada del selector; reemplazada por BMW-1 validada con BMW36-1.'),
    updated_at=now()
where pref='BMW';

update public.cot_tipos_mueble
set activo=true, updated_at=now()
where pref='BMW-1';
