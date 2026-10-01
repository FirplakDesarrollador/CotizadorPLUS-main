-- OW sigue la regla común: el número de shelves proviene de n_entrepanos.
-- La hoja OW3018 conserva el valor por defecto de 1 definido en 0078.
update public.cot_piezas_plantilla p
set formula_cantidad = 'n_entrepanos'
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='OW' and p.nombre='entrepano';
