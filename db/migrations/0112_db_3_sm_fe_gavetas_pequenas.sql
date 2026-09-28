-- DB-3-SM-FE usa tres cajas de gaveta pequenas e iguales.
-- Sustituye las piezas grandes heredadas por piezas de 500 x 100/80 mm.

begin;

update public.cot_piezas_plantilla p
set nombre = case p.nombre
      when 'lateral_gaveta_grande' then 'lateral_gaveta_pequena'
      when 'trasero_gaveta_grande' then 'trasero_gaveta_pequena'
      when 'contraparche_grande' then 'contraparche_pequeno'
    end,
    formula_ancho = case p.nombre
      when 'lateral_gaveta_grande' then '3.93701'
      when 'trasero_gaveta_grande' then '3.14961'
      when 'contraparche_grande' then '3.93701'
    end,
    tarugos = case
      when p.nombre in ('trasero_gaveta_grande', 'contraparche_grande') then 4
      else p.tarugos
    end,
    notas = case p.nombre
      when 'lateral_gaveta_grande' then 'Laterales de tres gavetas pequenas iguales: 500 x 100 mm; canto blanco.'
      when 'trasero_gaveta_grande' then 'Traseros de tres gavetas pequenas iguales: L-86 mm x 80 mm; cuatro tarugos, dos por lado.'
      when 'contraparche_grande' then 'Contraparches de tres gavetas pequenas iguales: L-86 mm x 100 mm; cuatro tarugos, dos por lado.'
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'DB-3-SM-FE'
  and p.nombre in ('lateral_gaveta_grande', 'trasero_gaveta_grande', 'contraparche_grande');

update public.cot_reglas_config r
set valor = '3',
    notas = 'Las tres gavetas de DB-3-SM-FE usan caja pequena.',
    updated_at = now()
from public.cot_tipos_mueble t
where r.tipo_mueble_id = t.id
  and t.pref = 'DB-3-SM-FE'
  and r.variable = 'n_cajones_pequenos'
  and r.condicion = 'true';

commit;
