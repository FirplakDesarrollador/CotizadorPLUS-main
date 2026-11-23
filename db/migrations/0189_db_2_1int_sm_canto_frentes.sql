-- Activa el consumo de canto en los dos tipos de frente de DB-2-1INT-SM.
-- Las aristas ya estaban declaradas (2 largos + 2 anchos), pero el motor omite
-- el canto si el JSON no contiene `calibre`. El valor base habilita el cálculo;
-- luego el motor lo resuelve por espesor/rol o por el Canto frentes del proyecto.

update public.cot_piezas_plantilla p
set cantos = coalesce(p.cantos, '{}'::jsonb) || '{"calibre":"22x1"}'::jsonb,
    notas = concat_ws(' | ', nullif(p.notas, ''), 'Canto visible habilitado en cuatro aristas.'),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-1INT-SM'
  and p.nombre in ('frente_gaveta_exterior', 'frente_gaveta_interior');

do $$
declare
  v_actualizados integer;
begin
  select count(*) into v_actualizados
  from public.cot_piezas_plantilla p
  join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
  where t.pref = 'DB-2-1INT-SM'
    and p.nombre in ('frente_gaveta_exterior', 'frente_gaveta_interior')
    and p.cantos->>'calibre' = '22x1'
    and (p.cantos->>'largos')::integer = 2
    and (p.cantos->>'anchos')::integer = 2;

  if v_actualizados <> 2 then
    raise exception 'DB-2-1INT-SM debe tener canto habilitado en sus dos plantillas de frente';
  end if;
end $$;
