-- El ancho de la puerta fija completa el largo disponible junto con Door,
-- dejando una holgura total de 3,2 mm entre ambos frentes.

update public.cot_piezas_plantilla p
set formula_largo = 'A',
    formula_ancho = 'L-door-RV',
    notas = 'Puerta fija BLIND DOOR C; ancho = L - Door - 3,2 mm.',
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'BBLFD'
  and p.nombre = 'blind door';
