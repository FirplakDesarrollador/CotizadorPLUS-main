-- DB-2-SM tiene dos gavetas iguales: una sola plantilla `frente` con cantidad 2
-- evita duplicar el despiece como `frente` y `frente_gaveta_grande`.

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-SM'
  and p.nombre like 'frente_%';

update public.cot_piezas_plantilla p
set notas = 'DB-2-SM: dos frentes iguales.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2-SM'
  and p.nombre = 'frente';
