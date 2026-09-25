-- `B`: trasero de gaveta y orden del despiece, contra la hoja real de `B12`.
--
-- (Se escribió como 0056 y se renumeró a 0081: la rama DEV ya había usado ese
-- número. La migración ya estaba aplicada en Supabase cuando se renumeró; es
-- idempotente, así que volver a ejecutarla no toca ninguna fila.)
--
-- Fuente: hoja "B12 · MUEBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO CARB2".
-- Complementa a `0052`, que corrigió tres medidas. Este cruce revisó además las
-- cantidades, el orden del listado y los cantos, que no se habían mirado.
--
-- Las cantidades ya eran correctas (13 filas: 1 base, 2 laterales, 2 rieles
-- delanteros, 2 traseros, 1 entrepaño, 1 base de gaveta, 1 trasero de gaveta,
-- 1 puerta, 1 frente de gaveta, 1 backing). El reparto Color/Blanco también:
-- la inferencia por nombre de `HdrTabla` reproduce la hoja fila por fila.

-- 1. Ancho del trasero de gaveta: 68 mm exactos, no 68.26.
--
--    `2.6875"` = 68.26 mm; la hoja pide 68. `2.67717"` = 68.00 mm exactos, que es
--    lo que ya usan `BMW`, `POD`, `SDB`, `UDB` y `UV` (y `DB` con `68/25.4`).
--    Mismo caso que el `L-4.13` de 0053: un valor truncado que sobrevivió en unos
--    tipos mientras otros ya tenían el exacto.
update public.cot_piezas_plantilla p
set formula_ancho = '2.67717',
    notas = concat_ws(' | ', nullif(p.notas, ''), '0081: trasero de gaveta a 68mm exactos segun hoja B12 (antes 2.6875 = 68.26)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'B'
  and p.nombre = 'trasero_gaveta'
  and p.formula_ancho = '2.6875';

-- 2. Canto del trasero de gaveta: un solo largo, no dos.
--    La hoja lista `TRASERO CAJON P` con 1 canto largo en blanco. Es la cara
--    superior del trasero; la inferior queda oculta contra la base de la gaveta.
update public.cot_piezas_plantilla p
set cantos = jsonb_set(p.cantos, '{largos}', '1'::jsonb),
    notas = concat_ws(' | ', nullif(p.notas, ''), '0081: trasero de gaveta con 1 canto largo segun hoja B12 (antes 2)')
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'B'
  and p.nombre = 'trasero_gaveta'
  and p.cantos->>'largos' = '2';

-- 3. Orden del listado: el de la hoja.
--
--    La hoja va BASE, SIDE R/L, RAIL DELANTERO, RAIL TRASERO, ... y la plantilla
--    tenía invertidos los dos primeros pares. Solo afecta la letra que la HDR
--    asigna a cada fila (A, B, C…), pero producción lee por esa letra.
update public.cot_piezas_plantilla p
set orden = case p.nombre
      when 'base' then 10
      when 'lateral' then 20
      when 'refuerzo_horizontal' then 30
      when 'refuerzo_trasero' then 40
      else p.orden
    end
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'B'
  and p.nombre in ('base', 'lateral', 'refuerzo_horizontal', 'refuerzo_trasero');
