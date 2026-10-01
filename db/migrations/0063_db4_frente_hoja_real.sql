-- Hoja DB33-4: los cuatro frentes miden 187.7mm de alto (no 187.3mm).
-- DB-2, DB-3 y la variante con gola conservan el reveal estándar existente.
update public.cot_piezas_plantilla p
set formula_ancho = 'n_cajones == 4 && !gola ? (A-0.440945)/4 : (A-n_cajones*RV-gola*2.11024)/n_cajones'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'DB'
  and p.nombre = 'frente';
