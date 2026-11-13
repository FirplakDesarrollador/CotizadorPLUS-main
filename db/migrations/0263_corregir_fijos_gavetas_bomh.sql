-- Correcciones solicitadas: fijos iguales a base, refuerzos y cajas pequeñas.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

update public.cot_piezas_plantilla p
set formula_largo=b.formula_largo,formula_ancho=b.formula_ancho,
    resta_largo=b.resta_largo,resta_ancho=b.resta_ancho,
    visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||jsonb_build_object('y',coalesce(b.visualizacion->>'y','0')),
    updated_at=now()
from public.cot_tipos_mueble t, public.cot_piezas_plantilla b
where p.tipo_mueble_id=t.id and b.tipo_mueble_id=t.id
  and b.nombre in ('base','base_tapa') and p.nombre='entrepano_fijo'
  and t.pref ~ '^(PC-MO(-SMG?)?|(BMW|BOMH)-1(-FE)?-SMG?)(-SF)?$';

update public.cot_piezas_plantilla p
set formula_largo=b.formula_largo,resta_largo=b.resta_largo,
    formula_ancho='80/25.4',resta_ancho=0,updated_at=now()
from public.cot_tipos_mueble t, public.cot_piezas_plantilla b
where p.tipo_mueble_id=t.id and b.tipo_mueble_id=t.id
  and b.nombre in ('base','base_tapa') and p.nombre ~ '^refuerzo_delantero(_|$)'
  and t.pref ~ '^(PC(-MO)?-SMG?|(BMW|BOMH)-1(-FE)?-SMG?)(-SF)?$';

update public.cot_piezas_plantilla p
set formula_ancho='A-80/25.4-fijo_inferior_z-TR',resta_ancho=0,
    visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||
      '{"z":"FI+TR","intercambiar":false,"nota":"Frente superior desde la cara superior del fijo hasta debajo del refuerzo delantero superior."}'::jsonb,
    updated_at=now()
from public.cot_tipos_mueble t where p.tipo_mueble_id=t.id
  and t.pref ~ '^BOMH-1(-FE)?-SMG?(-SF)?$' and p.nombre in ('frente_izq','frente_der');

update public.cot_piezas_plantilla p
set formula_ancho='68/25.4',resta_ancho=0,updated_at=now()
from public.cot_tipos_mueble t where p.tipo_mueble_id=t.id
  and t.pref ~ '^BOMH-1-SMG?(-SF)?$' and p.nombre='trasero_gaveta';

update public.cot_piezas_plantilla p
set formula_largo='(P >= 24-0.000000001 ? 500 : P >= 21-0.000000001 ? 450 : 350)/25.4',
    formula_ancho='100/25.4',resta_largo=0,resta_ancho=0,
    visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"plano":"YZ","intercambiar":true}'::jsonb,updated_at=now()
from public.cot_tipos_mueble t where p.tipo_mueble_id=t.id
  and t.pref ~ '^(BMW|BOMH)-1-FE-SMG?(-SF)?$' and p.nombre ~ '^lateral_gaveta(_|$)';

update public.cot_piezas_plantilla p
set formula_largo='((P >= 24-0.000000001 ? 500 : P >= 21-0.000000001 ? 450 : 350)/25.4)-8/25.4',
    visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"plano":"XY","intercambiar":true}'::jsonb,updated_at=now()
from public.cot_tipos_mueble t where p.tipo_mueble_id=t.id
  and t.pref ~ '^(BMW|BOMH)-1-FE-SMG?(-SF)?$' and p.nombre in ('fondo_gaveta','base_gaveta');

update public.cot_piezas_plantilla p
set formula_ancho=case when p.nombre ~ '^trasero' then '80/25.4' else '100/25.4' end,
    resta_ancho=0,
    formula_largo=case when t.pref like 'BOMH-%' then 'L-2*TC-26/25.4-2*TR' else p.formula_largo end,
    updated_at=now()
from public.cot_tipos_mueble t where p.tipo_mueble_id=t.id
  and t.pref ~ '^(BMW|BOMH)-1-FE-SMG?(-SF)?$' and p.nombre ~ '^(trasero_gaveta|contraparche)(_|$)';

do $$ begin
  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    join public.cot_piezas_plantilla b on b.tipo_mueble_id=t.id and b.nombre in ('base','base_tapa')
    where t.pref ~ '^(PC-MO(-SMG?)?|(BMW|BOMH)-1(-FE)?-SMG?)(-SF)?$'
      and p.nombre='entrepano_fijo'
      and (p.formula_largo is distinct from b.formula_largo or p.formula_ancho is distinct from b.formula_ancho
        or p.resta_largo is distinct from b.resta_largo or p.resta_ancho is distinct from b.resta_ancho)
  ) then raise exception 'Los fijos deben conservar las dos medidas y descuentos de sus bases'; end if;
end $$;
commit;
