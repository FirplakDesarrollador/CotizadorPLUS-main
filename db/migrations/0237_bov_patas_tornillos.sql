-- BOV, con o sin fondo: herrajes estructurales estándar, sujetos a exclusión por módulo.
begin;
insert into public.cot_herrajes_plantilla
  (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden)
select t.id, h.rol, h.codigo, h.rol, h.formula, h.orden
from public.cot_tipos_mueble t
cross join (values
  ('pata', 'PATA10AJUST', 'n_patas', 10),
  ('tornillo', 'TORNILLO858', 'n_patas*4', 20)
) as h(rol, codigo, formula, orden)
where t.pref in ('BOV', 'BOV-SF')
  and not exists (select 1 from public.cot_herrajes_plantilla p
    where p.tipo_mueble_id = t.id and p.rol = h.rol);
commit;
