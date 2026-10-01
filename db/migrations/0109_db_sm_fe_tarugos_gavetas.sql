-- DB-SM-FE: Golas, traseros y contraplacas se ensamblan con dos tarugos
-- por cada extremo (lado derecho e izquierdo), cuatro tarugos por pieza.
-- No modifica las familias DB-SM ni DB base.

update public.cot_piezas_plantilla p
set tarugos = 4,
    notas = concat_ws(' | ', nullif(p.notas, ''),
      'Cuatro tarugos: dos al lado derecho y dos al izquierdo.'),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in ('DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE')
  and (
    p.nombre = 'gola_madera'
    or p.nombre like 'trasero_gaveta%'
    or p.nombre like 'contraparche%'
  );
