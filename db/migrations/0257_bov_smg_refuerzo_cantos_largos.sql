-- Ordena el corte vertical con su eje largo real en formula_largo.
-- Esto hace que cantos.largos=2 procese los dos cantos de altura completa.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

update public.cot_piezas_plantilla p
set formula_largo='A-2*TC',
    formula_ancho='80/25.4',
    tarugos=4,
    cantos=jsonb_set(
      coalesce(p.cantos,'{}'::jsonb) || '{"largos":2,"anchos":0}'::jsonb,
      '{calibre}',to_jsonb(coalesce(p.cantos->>'calibre','19x0,45')),true
    ),
    visualizacion=coalesce(p.visualizacion,'{}'::jsonb) ||
      '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":true,"x":"(L-80/25.4)/2","y":"27","z":"TC","confirmado":true,"nota":"Refuerzo vertical a 27 mm del borde delantero del lateral."}'::jsonb,
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref in ('BOV-SMG','BOV-SMG-SF')
  and p.nombre='refuerzo_delantero';
commit;
