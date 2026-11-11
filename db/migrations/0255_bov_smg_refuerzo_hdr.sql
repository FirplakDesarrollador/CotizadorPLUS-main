-- BOV-SMG y BOV-SMG-SF: restaura/normaliza refuerzo delantero vertical.
-- Los tarugos siguen en consumos, sin representación gráfica ni filas HDR.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

insert into public.cot_piezas_plantilla
select (jsonb_populate_record(
  null::public.cot_piezas_plantilla,
  to_jsonb(origen) || jsonb_build_object(
    'id', gen_random_uuid(),
    'tipo_mueble_id', destino.id,
    'tarugos', 4,
    'created_at', now(),
    'updated_at', now(),
    'visualizacion', coalesce(origen.visualizacion, '{}'::jsonb) ||
      '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"x":"(L-80/25.4)/2","y":"27","z":"TC","confirmado":true,"nota":"Refuerzo vertical paralelo al frente, a 27 mm del borde delantero del lateral."}'::jsonb
  )
)).*
from public.cot_tipos_mueble base
join public.cot_piezas_plantilla origen on origen.tipo_mueble_id = base.id
join public.cot_tipos_mueble destino on destino.pref in ('BOV-SMG','BOV-SMG-SF')
where base.pref = 'BOV'
  and origen.nombre = 'refuerzo_delantero'
  and not exists (
    select 1 from public.cot_piezas_plantilla existente
    where existente.tipo_mueble_id = destino.id
      and existente.nombre = origen.nombre
  );

update public.cot_piezas_plantilla p
set formula_largo='80/25.4',
    formula_ancho='A-2*TC',
    tarugos=4,
    cantos=jsonb_set(
      coalesce(p.cantos,'{}'::jsonb) || '{"largos":2,"anchos":0}'::jsonb,
      '{calibre}', to_jsonb(coalesce(p.cantos->>'calibre','19x0,45')), true
    ),
    visualizacion=coalesce(p.visualizacion,'{}'::jsonb) ||
      '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"x":"(L-80/25.4)/2","y":"27","z":"TC","confirmado":true,"nota":"Refuerzo vertical paralelo al frente, a 27 mm del borde delantero del lateral."}'::jsonb,
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref in ('BOV-SMG','BOV-SMG-SF')
  and p.nombre='refuerzo_delantero';
commit;
