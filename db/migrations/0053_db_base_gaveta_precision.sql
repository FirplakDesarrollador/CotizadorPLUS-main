-- `DB`: la base de gaveta usaba `L-4.13`, 0.1 mm larga.
--
-- Fuente: hoja "HRJ DB18-1S · MUEBLE INF COC 3 GAVETAS 1 PEQUEÑA CARB2"
-- (L=18", A=30", P=24"). La hoja pide FONDO GAVETA de 352.2 mm:
--
--   L-4.13     -> 352.298 mm   (0.098 mm largo)
--   L-4.13386  -> 352.200 mm   exacto
--
-- `4.13386"` = 105 mm. `DB` era el único tipo del catálogo que conservaba el valor
-- truncado: `B` (corregido en 0052), `POD`, `UDB` y `UV` ya usan `L-4.13386`.
--
-- El resto del despiece de `DB18-1S` reproduce la hoja sin tocar nada: base,
-- laterales, los tres rieles delanteros, los dos traseros, los tres fondos de
-- gaveta, los traseros pequeño y grandes, los frentes y el backing.
update public.cot_piezas_plantilla p
set formula_largo = 'L-4.13386',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0053: base de gaveta a L-105mm exactos segun hoja DB18-1S (antes L-4.13)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'DB'
  and p.nombre = 'base_gaveta'
  and p.formula_largo = 'L-4.13';
