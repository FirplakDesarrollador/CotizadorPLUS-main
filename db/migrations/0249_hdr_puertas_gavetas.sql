-- 2026-11-07: cantidad física de puertas y reglas de gavetas confirmadas.
begin;
update public.cot_piezas_plantilla p
set formula_cantidad='n_puertas', formula_largo='(L-n_puertas*RV)/n_puertas'
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref in ('BFD-SMG','BFD-SMG-SF','SBFD-SMG','SBFD-SMG-SF') and p.nombre='frente'
  and (p.formula_cantidad is distinct from 'n_puertas' or p.formula_largo is distinct from '(L-n_puertas*RV)/n_puertas');

update public.cot_piezas_plantilla p
set cantos=jsonb_set(jsonb_set(coalesce(p.cantos,'{}'::jsonb),'{largos}','2'::jsonb),'{anchos}','0'::jsonb)
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref ~ '^DB(-|$)' and t.pref !~ '-FE(-|$)' and p.nombre='base_gaveta'
  and (p.cantos->>'largos' is distinct from '2' or p.cantos->>'anchos' is distinct from '0');

update public.cot_piezas_plantilla p
set rol_tablero='caja'
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref in ('DB-FE','DB-FE-SF')
  and p.nombre ~ '^(base_gaveta|fondo_gaveta|contraparche|lateral_gaveta|trasero_gaveta)(_|$)'
  and p.rol_tablero is distinct from 'caja';
commit;
