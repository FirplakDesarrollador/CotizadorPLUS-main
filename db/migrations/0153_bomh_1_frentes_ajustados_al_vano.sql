-- BOMH-1: el alto de los frentes laterales conserva horno_alto mientras cabe.
-- Si excede el vano, se limita al espacio exacto entre z=339,2mm y la cara
-- inferior del refuerzo delantero (A-80mm), evitando solapes y desbordes.
update public.cot_piezas_plantilla p
set formula_largo='horno_alto <= A-(419.2/25.4) ? horno_alto : A-(419.2/25.4)',
    notas=concat_ws(' | ', nullif(p.notas, ''),
      '0153: alto limitado al vano entre frente_gaveta y refuerzo delantero.'),
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
        and p.formula_largo='horno_alto <= A-(419.2/25.4) ? horno_alto : A-(419.2/25.4)'
        and p.visualizacion->>'z'='339.2') <> 2 then
    raise exception 'Los frentes laterales BOMH-1 no quedaron ajustados al vano';
  end if;
end $$;
