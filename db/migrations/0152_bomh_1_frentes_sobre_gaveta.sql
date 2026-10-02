-- BOMH-1: los frentes laterales del horno comienzan 3,2mm sobre el borde
-- superior del frente de gaveta: 3,2 + 332,8 + 3,2 = 339,2mm.
update public.cot_piezas_plantilla p
set visualizacion=jsonb_set(
      jsonb_set(coalesce(p.visualizacion, '{}'::jsonb), '{z}', '"339.2"'::jsonb, true),
      '{nota}', '"Borde inferior a 3,2mm del borde superior del frente de gaveta; no lo sobrepasa."'::jsonb, true
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='BOMH-1'
  and p.nombre in ('frente_izq','frente_der');

do $$
begin
  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BOMH-1'
        and p.nombre in ('frente_izq','frente_der')
        and p.visualizacion->>'z'='339.2') <> 2 then
    raise exception 'Los frentes laterales de BOMH-1 no quedaron sobre la gaveta';
  end if;
end $$;
