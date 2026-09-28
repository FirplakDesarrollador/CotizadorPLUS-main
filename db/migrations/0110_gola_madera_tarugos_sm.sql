-- Homologa todas las piezas `gola_madera` de las tipologias SM:
-- dos tarugos en el extremo derecho y dos en el izquierdo (4 por pieza).
-- Re-ejecutable: solo modifica las filas que aun no tienen el valor correcto.

update public.cot_piezas_plantilla p
set tarugos = 4,
    notas = concat_ws(' | ', nullif(p.notas, ''),
      'Cuatro tarugos: dos al lado derecho y dos al izquierdo.'),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and p.nombre = 'gola_madera'
  and t.pref like '%SM%'
  and coalesce(p.tarugos, 0) <> 4;
