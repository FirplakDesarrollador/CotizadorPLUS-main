-- El largo del refuerzo delantero se calcula desde Largo del mueble.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

update public.cot_piezas_plantilla p
set formula_largo='L-2*TC',
    formula_ancho='80/25.4',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref in ('BOV-SMG','BOV-SMG-SF')
  and p.nombre='refuerzo_delantero';
commit;
