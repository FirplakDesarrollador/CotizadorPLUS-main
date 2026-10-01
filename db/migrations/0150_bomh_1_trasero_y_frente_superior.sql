-- BOMH-1: trasero de gaveta a 183mm y conjunto frontal superior de canto.
update public.cot_piezas_plantilla p
set formula_ancho='183/25.4',
    notas='TRASERO CAJON INF B; L-117mm por 183mm.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='BOMH-1' and p.nombre='trasero_gaveta';

update public.cot_piezas_plantilla p
set visualizacion='{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"x":"TC","y":"0","z":"A-H","confirmado":true,"nota":"Refuerzo delantero montado de canto en el plano frontal, entre los laterales y contra la esquina superior."}'::jsonb,
    notas='RAIL DEL VERTICAL C; L-30mm por 80mm; montado de canto en la esquina frontal superior.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='BOMH-1' and p.nombre='refuerzo_delantero';

update public.cot_piezas_plantilla p
set visualizacion=jsonb_set(
      jsonb_set(coalesce(p.visualizacion, '{}'::jsonb), '{z}', '"A-80-H"'::jsonb, true),
      '{nota}', '"Frente lateral del horno inmediatamente debajo del refuerzo delantero de 80mm."'::jsonb, true
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='BOMH-1'
  and p.nombre in ('frente_izq','frente_der');

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='BOMH-1' and p.nombre='trasero_gaveta'
      and p.formula_ancho='183/25.4'
  ) then raise exception 'No se actualizo BOMH-1.trasero_gaveta'; end if;

  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BOMH-1' and p.nombre in ('frente_izq','frente_der')
        and p.visualizacion->>'z'='A-80-H') <> 2 then
    raise exception 'Los frentes laterales no quedaron bajo el refuerzo';
  end if;
end $$;
