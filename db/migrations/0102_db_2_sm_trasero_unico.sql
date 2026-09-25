-- DB-2-SM tiene dos gavetas iguales: una sola plantilla `trasero_gaveta`
-- evita duplicar el despiece como trasero genérico y trasero grande.

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-SM'
  and p.nombre like 'trasero_gaveta_%';

update public.cot_piezas_plantilla p
set cantos = '{"calibre":"19x0,45","largos":1,"anchos":2,"despEdges":0}'::jsonb,
    notas = 'DB-2-SM: dos traseros de gaveta iguales de 183 mm.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-SM'
  and p.nombre = 'trasero_gaveta';
