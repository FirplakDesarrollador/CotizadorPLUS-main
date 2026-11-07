-- Refuerzo delantero de 80 mm en ambas variantes SVFDH-SMG.
begin;
update public.cot_piezas_plantilla p
set formula_ancho='80/25.4'
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref in ('SVFDH-SMG','SVFDH-SMG-SF')
  and p.nombre='refuerzo_delantero'
  and p.formula_ancho is distinct from '80/25.4';
commit;
