-- El tipo parametrico DB debe exponer unicamente los nombres que describen
-- la altura real del trasero. La fila generica era un remanente para las
-- variantes uniformes y duplicaba conceptualmente las plantillas pequena y
-- grande usadas por DB-1S/DB-2S.

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB'
  and p.nombre = 'trasero_gaveta';

-- DB-4 tiene cuatro traseros pequenos de 68 mm. En DB-1S/DB-2S conserva la
-- cantidad de gavetas pequenas definida por la configuracion seleccionada.
update public.cot_piezas_plantilla p
set formula_cantidad = 'n_cajones_pequenos>0?n_cajones_pequenos:(n_cajones==4?n_cajones:0)',
    formula_ancho = '68/25.4',
    notas = 'Trasero pequeno de 68 mm: gavetas pequenas de DB-1S/DB-2S y todas las gavetas de DB-4.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB'
  and p.nombre = 'trasero_gaveta_pequena';

-- DB-2 y DB-3 tienen respectivamente dos y tres traseros grandes de 183 mm.
-- En DB-1S/DB-2S conserva el complemento de las gavetas pequenas.
update public.cot_piezas_plantilla p
set formula_cantidad = 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:(n_cajones==4?0:n_cajones)',
    formula_ancho = '183/25.4',
    notas = 'Trasero grande de 183 mm: gavetas grandes de DB-1S/DB-2S y todas las gavetas de DB-2/DB-3.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB'
  and p.nombre = 'trasero_gaveta_grande';

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'DB' and p.nombre = 'trasero_gaveta'
  ) then
    raise exception 'DB aun contiene la plantilla generica trasero_gaveta';
  end if;

  if (select count(*)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
      where t.pref = 'DB'
        and p.nombre in ('trasero_gaveta_pequena', 'trasero_gaveta_grande')) <> 2 then
    raise exception 'DB debe contener exactamente los traseros pequeno y grande';
  end if;
end $$;
