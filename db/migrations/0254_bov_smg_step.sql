-- STEP HRJ BOV8078.561-SMG: 800 x 785 x 610, caja 15, frente 18 mm.
-- Solo BOV-SMG; BOV y BOV-SF conservan su geometría anterior.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

delete from public.cot_piezas_plantilla p using public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='BOV-SMG' and p.nombre='refuerzo_delantero';

update public.cot_piezas_plantilla p set formula_ancho='P-TF',
 visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"x":"TC","y":"TF","z":"0","confirmado":true}'::jsonb,
 notas='STEP BOV-SMG: base entre laterales y detras del frente, profundidad P-TF.'
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref='BOV-SMG' and p.nombre='base';

update public.cot_piezas_plantilla p set formula_largo='L-2*TC',formula_ancho='A-73/25.4',tarugos=8,
 visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"x":"TC","y":"0","z":"0","confirmado":true}'::jsonb,
 notas='STEP BOV-SMG: frente entre laterales, al ras inferior, luz superior de 73 mm; 8 tarugos.'
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref='BOV-SMG' and p.nombre='frente';

-- El refuerzo inferior del STEP queda retirado 0,2 mm de la cara posterior.
update public.cot_piezas_plantilla p set
 visualizacion=coalesce(p.visualizacion,'{}'::jsonb)||'{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"y":"P-EP-(I===0 ? 0.2 : 0)","z":"I===0 ? TC : A-H","confirmado":true}'::jsonb
from public.cot_tipos_mueble t where t.id=p.tipo_mueble_id and t.pref='BOV-SMG' and p.nombre='refuerzo_trasero';
commit;
