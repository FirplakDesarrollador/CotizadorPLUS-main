-- DB26-2S-SM: los frentes se almacenan con el eje geométrico habitual
-- (ancho del módulo × alto del frente). La tabla del Simulador ya presenta
-- las piezas de rol frente como alto × ancho; invertirlos también aquí los
-- mostraba erróneamente como 657,2 × 187,3 / 377,8.
-- No modifica ninguna otra tipología.

update public.cot_piezas_plantilla p
set formula_largo = 'L-RV',
    formula_ancho = 'alto_frente_pequeno',
    visualizacion = '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"confirmado":true,"nota":"Frente pequeño DB-2S-SM: la tabla presenta alto × ancho según hoja."}'::jsonb,
    notas = 'Frente de gaveta pequeña DB-2S-SM: 173,9 mm × 657,2 mm para DB26.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'frente_gaveta_pequena';

update public.cot_piezas_plantilla p
set formula_largo = 'L-RV',
    formula_ancho = '(n_cajones-n_cajones_pequenos)>0 ? (A-n_cajones*RV-gola*2.11024-n_cajones_pequenos*alto_frente_pequeno)/(n_cajones-n_cajones_pequenos) : 0',
    visualizacion = '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"confirmado":true,"nota":"Frente grande DB-2S-SM: la tabla presenta alto × ancho según hoja."}'::jsonb,
    notas = 'Frente de gaveta grande DB-2S-SM: 351 mm × 657,2 mm para DB26.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'frente_gaveta_grande';
