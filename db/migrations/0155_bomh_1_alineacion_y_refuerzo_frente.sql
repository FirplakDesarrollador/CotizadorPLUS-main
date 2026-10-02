-- BOMH-1: frentes laterales alineados con el borde frontal de los laterales.
update public.cot_piezas_plantilla p
set visualizacion=jsonb_set(
      jsonb_set(coalesce(p.visualizacion, '{}'::jsonb), '{y}', '"0"'::jsonb, true),
      '{nota}', '"Frente lateral contenido entre los laterales y alineado exactamente con su borde frontal."'::jsonb,
      true
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='BOMH-1'
  and p.nombre in ('frente_izq','frente_der');

-- El refuerzo delantero se fabrica con el mismo tablero de los frentes.
-- El espesor efectivo lo aporta el material seleccionado para el rol frente.
update public.cot_piezas_plantilla p
set rol_tablero='frente',
    notas='RAIL DEL VERTICAL C; L-30mm por 80mm; material de frente de 18mm, montado de canto en la esquina frontal superior.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='BOMH-1'
  and p.nombre='refuerzo_delantero';

do $$
begin
  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BOMH-1'
        and p.nombre in ('frente_izq','frente_der')
        and p.visualizacion->>'y'='0') <> 2 then
    raise exception 'Los frentes laterales BOMH-1 no quedaron alineados al borde';
  end if;

  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='BOMH-1' and p.nombre='refuerzo_delantero'
      and p.rol_tablero='frente'
      and p.cantos->>'calibre'='22x1'
  ) then
    raise exception 'El refuerzo delantero BOMH-1 no usa material de frente';
  end if;
end $$;
