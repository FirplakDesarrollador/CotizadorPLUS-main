-- BOMH-1: frentes laterales del horno dentro de la carcasa.
-- X respeta ambos laterales; Y=TC los retrasa desde la cara exterior.
update public.cot_piezas_plantilla p
set visualizacion=jsonb_set(
      jsonb_set(
        jsonb_set(
          coalesce(p.visualizacion, '{}'::jsonb),
          '{x}',
          case when p.nombre='frente_izq' then '"TC"'::jsonb else '"L-TC-W"'::jsonb end,
          true
        ),
        '{y}', '"TC"'::jsonb, true
      ),
      '{nota}', '"Frente lateral del horno dentro de los laterales, retrasado un espesor de caja y debajo del refuerzo delantero."'::jsonb,
      true
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='BOMH-1'
  and p.nombre in ('frente_izq','frente_der');

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='BOMH-1' and p.nombre='frente_izq'
      and p.visualizacion->>'x'='TC' and p.visualizacion->>'y'='TC'
  ) or not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='BOMH-1' and p.nombre='frente_der'
      and p.visualizacion->>'x'='L-TC-W' and p.visualizacion->>'y'='TC'
  ) then
    raise exception 'Los frentes laterales BOMH-1 no quedaron dentro de los laterales';
  end if;
end $$;
