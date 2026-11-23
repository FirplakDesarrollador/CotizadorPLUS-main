-- La geometría y el resto de materiales conservan sus reglas existentes.
update public.cot_piezas_plantilla p
set rol_tablero = 'gaveta'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id and (t.pref = 'DB' or t.pref like 'DB-%')
  and p.nombre in ('base_gaveta', 'trasero_gaveta_pequena', 'trasero_gaveta_grande')
  and p.rol_tablero is distinct from 'gaveta';
