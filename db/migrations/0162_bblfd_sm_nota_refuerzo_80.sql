-- Corrige la descripción heredada del montante de la variante SM.
update public.cot_piezas_plantilla p
set visualizacion=p.visualizacion || '{"nota":"Montante vertical de 80 mm centrado bajo la junta entre frentes."}'::jsonb,
    updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id
  and t.pref='BBLFD-D-L/R-SM'
  and p.nombre='refuerzo_vertical';
