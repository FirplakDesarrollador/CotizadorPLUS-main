-- Piezas que no estaban cobrando tablero.
--
-- `engine.ts` solo suma area cuando la pieza tiene rol_tablero:
--     if (pz.rol_tablero) areaPorRol[pz.rol_tablero] += area;
-- Una pieza con rol_tablero NULL (o con una dimension en 0) sale en el despiece pero
-- no cuesta un peso de madera. Auditando el catalogo completo aparecieron 7 piezas
-- reales en esa situacion; se corrigen aqui.
--
-- NO se tocan las que son "solo canto" a proposito, que tambien tienen rol NULL:
--   PCFD.frente_canto_puertas_op / frente_canto_gavetas_op -> el area de los frentes ya
--     la carga entera `frente_area_op` (rol='frente', ancho=(A-5.25)*1.25); darles rol
--     duplicaria el costo del frente.
--   PCFD.frente_delgado_informativo_op -> fila documental, sin canto ni area.
--   SV.canto_lavamanos y UW.gola_canto -> codifican una LONGITUD de canto en el largo y
--     llevan ancho 0 a proposito; no son tableros.

-- ---------------------------------------------------------------------------
-- 1) Refuerzos inertes: dimensiones reales (80mm de ancho, como todo refuerzo del
--    catalogo) pero sin rol y sin canto, o sea costo cero. Solo les falta el rol.
-- ---------------------------------------------------------------------------
update cot_piezas_plantilla p
set rol_tablero = 'refuerzo'
from cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and p.rol_tablero is null
  and ((t.pref in ('BBL', 'BBLFD') and p.nombre = 'refuerzo_vert_bisagras')
    or (t.pref = 'BBL' and p.nombre = 'refuerzo_profundidad'));

-- ---------------------------------------------------------------------------
-- 2) Frente de gaveta (`frente_cajon`) de B / UB / V / BBL: estaba con
--    rol_tablero NULL y formula_ancho '0', es decir area cero -- el tablero del
--    frente de la gaveta no se cobraba, solo su canto.
--
--    El alto sale de la regla `alto_frente_gaveta` que se crea abajo. El ancho pasa
--    de `L` a `L-RV`: es la convencion de reveal que usan todos los frentes del
--    catalogo, y coincide con la hoja real B12-FE (frente de gaveta y puerta salen
--    ambos a 301.6mm con L=12"). BBL conserva su `L-27.75` (geometria de esquinero
--    ciego, sin evidencia para cambiarla).
--
--    El canto pasa de {largos:2, anchos:0, despEdges:4} a los 4 lados: la hoja real
--    muestra el FRENTE GAVETA con canto en largo Y en ancho (2 y 2), igual que la
--    puerta. Con largos=2+anchos=2 el `despEdges` por defecto ya da 4, asi que se
--    quita el override.
-- ---------------------------------------------------------------------------
update cot_piezas_plantilla p
set rol_tablero = 'frente',
    formula_largo = case when t.pref = 'BBL' then p.formula_largo else 'L-RV' end,
    formula_ancho = 'alto_frente_gaveta',
    cantos = '{"largos":2,"anchos":2,"calibre":"22x1"}'::jsonb
from cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and p.nombre = 'frente_cajon'
  and t.pref in ('B', 'UB', 'V', 'BBL');

-- ---------------------------------------------------------------------------
-- 3) Consecuencia obligada: si el frente de gaveta ahora ocupa alto real, la puerta
--    ya no puede ser del alto completo o la fachada se pasaria del alto del mueble.
--    Estos 4 tipos llevan cajon + puerta (`n_cajones=1`), asi que el alto se reparte:
--        puerta + RV + frente_gaveta + RV = A
--    Es la misma formula que quedo en B-FE/UB-FE/V-FE contra la hoja real, y corrige
--    de paso la migracion 0036, que habia dejado `A-RV` (alto completo menos un
--    reveal) tomando la regla de los Full Door -- que no aplica cuando hay gaveta.
-- ---------------------------------------------------------------------------
update cot_piezas_plantilla p
set formula_ancho = 'A-n_cajones*alto_frente_gaveta-(n_cajones+1)*RV'
from cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and p.nombre = 'frente'
  and t.pref in ('B', 'UB', 'V', 'BBL');

-- ---------------------------------------------------------------------------
-- 4) Regla `alto_frente_gaveta` por tipo. Valores dados por el usuario para la
--    familia: 6" (152.4mm) en B y V, 5.5" (139.7mm) en la linea U. BBL no tiene hoja
--    de ruta propia; se le deja 6" por consistencia con su familia (B, base de cocina
--    de 30") -- queda anotado como inferencia, no como dato confirmado.
-- ---------------------------------------------------------------------------
delete from cot_reglas_config r using cot_tipos_mueble t
where r.tipo_mueble_id = t.id and r.variable = 'alto_frente_gaveta'
  and t.pref in ('B', 'UB', 'V', 'BBL');

insert into cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, activo)
select t.id, 'alto_frente_gaveta', 'true', v.valor, 5, true
from cot_tipos_mueble t, (values
  ('B',   '6'),
  ('V',   '6'),
  ('BBL', '6'),
  ('UB',  '5.5')
) as v(pref, valor)
where t.pref = v.pref;
