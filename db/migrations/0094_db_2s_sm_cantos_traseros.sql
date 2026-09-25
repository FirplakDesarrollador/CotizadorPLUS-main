-- DB26-2S-SM: los traseros de gaveta usan el patrón de canto de la hoja.
-- Pequeños (68 mm): 1 canto largo blanco.
-- Grande (183 mm): 1 canto largo + 2 cantos anchos blancos.
-- No modifica DB ni otras tipologías.

update public.cot_piezas_plantilla p
set cantos = '{"calibre":"19x0,45","largos":1,"anchos":0,"despEdges":0}'::jsonb,
    notas = 'Trasero de gaveta pequeña: 1 canto largo blanco según DB26-2S-SM.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'trasero_gaveta_pequena';

update public.cot_piezas_plantilla p
set cantos = '{"calibre":"19x0,45","largos":1,"anchos":2,"despEdges":0}'::jsonb,
    notas = 'Trasero de gaveta grande: 1 canto largo y 2 anchos blancos según DB26-2S-SM.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'trasero_gaveta_grande';
