-- TW/W-SM-HOOD: extiende el frente falso hasta 30 mm bajo las puertas.
-- Puertas arrancan a 175,95 mm: borde superior del falso=145,95 mm.
-- Se conserva borde inferior -(HOOD-FREE), sumando el tramo sobre la base.
begin;
update public.cot_piezas_plantilla p
set formula_cantidad='1',
    formula_ancho='HOOD-FREE+145.95/25.4',
    visualizacion=jsonb_set(jsonb_set(p.visualizacion,'{z}','"145.95-H"'::jsonb),
      '{nota}',to_jsonb('Borde superior 30 mm bajo las puertas; borde inferior conserva HOOD-FREE.'::text)),
    notas='Alto total: HOOD-FREE+145,95 mm. Separación respecto a puertas: 30 mm.',
    updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref in ('TW-SM-HOOD','W-SM-HOOD')
  and p.nombre='frente_falso';
commit;
