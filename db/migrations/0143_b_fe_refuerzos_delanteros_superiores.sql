-- B-FE exclusivamente: distribuye sus dos rails delanteros en la zona superior.
-- I=0 queda al ras superior; I=1 queda bajo la gaveta de 152,4mm + reveal 3,2mm.
update public.cot_piezas_plantilla p
set visualizacion='{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"I==0?A-H:A-155.6-H","confirmado":true,"nota":"Dos refuerzos delanteros: uno superior y otro inmediatamente bajo la gaveta."}'::jsonb,
    notas=concat_ws(' | ',nullif(p.notas,''),
      'B-FE: rails delanteros superior y bajo la gaveta.')
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='B-FE'
  and p.nombre='refuerzo_delantero';
