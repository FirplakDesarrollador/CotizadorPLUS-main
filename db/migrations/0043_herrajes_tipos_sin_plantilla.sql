-- Siete tipos activos cotizaban con $0 de herrajes. Se corrigen con la evidencia del
-- Excel CEMA (`Simulación muebles CEMA (10-09-2026).xlsx`, hoja 'Costos Muebles',
-- columna "Costo hardware"), no por analogía.
--
-- Precios unitarios del catálogo con los que se descompone cada monto:
--   PATA10AJUST 1.987  TORNILLO858 23  ->  base "carcasa de piso" = 4*1987 + 16*23 = 8.316
--   BISAGRAPAR 5.800   MANIJA415 7.450 ->  puerta completa = 13.250
--   RIELFE500 31.064   RIELTANDEM 49.706,8   BARRAEST 9.800
-- Contraste de control: BFD9 del Excel = 21.566 = 8.316 + 1 puerta. Exacto.
--
-- Descomposición por tipo (todas cierran al peso):
--   UVFD828 3/4    21.566 = base + 1bis + 1man          (1 puerta)
--   UVFD2628 3/49  34.816 = base + 2bis + 2man          (2 puertas)
--   USBFD2428 3/4  34.816 = base + 2bis + 2man          (2 puertas; ver nota USVFD)
--   UV1028 3/4-FE  60.080 = base + 1bis + 2man + 1 rielFE
--   UV11           78.723 = base + 1bis + 2man + 1 rielTANDEM
--   UV2428 3/4     91.973 = base + 2bis + 3man + 1 rielTANDEM
--   UDB24-1        75.273 = base + 1man + 1 rielTANDEM + 1 barra
--   UDB1528 3/4-3 179.786 = base + 3man + 3 rielTANDEM  (0 barras)
--   UDB1228 3/4-1s 199.386 = base + 3man + 3 rielTANDEM + 2 barras
--   UDB12-2s      189.586 = base + 3man + 3 rielTANDEM + 1 barra
--   POD24-FE       31.064 = 1 rielFE, sin patas ni manija
--   POD23          49.707 = 1 rielTANDEM, idem
--   DD26-FE        31.064 = 1 rielFE, idem
--   WER2430        26.500 = 2bis + 2man, sin patas (es superior)
--
-- El reparto de barras de UDB coincide exactamente con `DB_TIPOLOGIAS` de
-- src/lib/muebles.ts: 1 gaveta -> 1 barra, 3 iguales -> 0, `-1s` -> 2, `-2s` -> 1. Es
-- decir UDB es la cajonera DB de la línea U y usa la misma fórmula de barra.
--
-- `DF` (frente de gaveta suelto) se deja como está: el Excel le asigna 0 de hardware,
-- así que su plantilla vacía es CORRECTA, no un defecto.
--
-- NO se tocan los otros 12 tipos sin herrajes (SLOC, WLD, SBAS, KF, KD, CLV, DFE, CC,
-- BLS, BMW, WPC, SDB): o no aparecen en el Excel, o solo aparecen en variantes gola /
-- push / con accesorio que no descomponen contra una base estable. Requieren criterio
-- de producto y quedan pendientes a propósito.

-- ---------------------------------------------------------------------------
-- 1) Plantillas de herrajes, copiadas del tipo hermano ya validado.
--    Copiar en vez de reescribir garantiza que la fórmula sea idéntica a la que ya
--    está probada contra el Excel para esa familia.
-- ---------------------------------------------------------------------------
insert into cot_herrajes_plantilla (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas)
select dst.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
       'Copiado de ' || src.pref || ' (0043); validado contra Costo hardware del Excel CEMA'
from (values
  -- destino, origen
  ('UVFD',  'VFD'),   -- puertas, vanity: 21.566 / 34.816 exacto
  ('USVFD', 'SVFD'),  -- USVFD no está en el Excel; su gemelo USBFD sí, con 34.816 = mismo patrón
  ('UV',    'V'),     -- 1 cajón + puertas: 60.080 / 78.723 / 91.973 exacto
  ('UDB',   'DB'),    -- cajonera línea U: 7 SKUs exactos, barras incluidas
  ('WER',   'W')      -- superior esquinero: 26.500 exacto, sin patas
) as m(destino, origen)
join cot_tipos_mueble dst on dst.pref = m.destino
join cot_tipos_mueble src on src.pref = m.origen
join cot_herrajes_plantilla h on h.tipo_mueble_id = src.id
where not exists (select 1 from cot_herrajes_plantilla x where x.tipo_mueble_id = dst.id);

-- POD y DD son módulos de gaveta que se insertan dentro de otro mueble: el Excel les
-- asigna exactamente un riel y nada más (ni patas, ni manija, ni bisagra).
insert into cot_herrajes_plantilla (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas)
select t.id, 'riel', 'RIELTANDEM', 'riel', 'n_cajones', 10,
       'Solo riel (0043): POD24-FE=31.064 y POD23=49.707 en el Excel son 1 riel exacto'
from cot_tipos_mueble t
where t.pref in ('POD', 'DD')
  and not exists (select 1 from cot_herrajes_plantilla x where x.tipo_mueble_id = t.id);

-- ---------------------------------------------------------------------------
-- 2) Reglas que esas fórmulas necesitan.
--    Estos tipos fueron generados por scripts/generar_tipologias.py y codifican las
--    cantidades en la pieza (`cant` literal), no en reglas, así que `n_cajones` caía en
--    el global 0 y `riel = n_cajones` habría dado CERO rieles.
--
--    Se verificó que NINGUNA pieza de UV, UDB, POD, DD ni WER referencia n_cajones o
--    n_puertas en sus fórmulas, así que estas reglas son geometría-neutra: cambian solo
--    el conteo de herrajes, no una sola medida de corte. (USVFD y UVFD sí usan
--    n_puertas, y por eso a ellos no se les toca ninguna regla: siguen con el global.)
-- ---------------------------------------------------------------------------
delete from cot_reglas_config r using cot_tipos_mueble t
where r.tipo_mueble_id = t.id
  and t.pref in ('UV', 'UDB', 'POD', 'DD')
  and r.variable in ('n_cajones', 'n_puertas');

insert into cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, activo, notas)
select t.id, v.variable, 'true', v.valor, 5, true, v.nota
from cot_tipos_mueble t
join (values
  -- UV: 1 gaveta. Las puertas siguen el global por L (1 hasta 21", 2 desde 24"),
  -- que es justo lo que muestran UV10 (1 puerta) y UV24 (2 puertas) en el Excel.
  ('UV',  'n_cajones', '1', 'UV lleva 1 gaveta (Excel: "1 gaveta 1 puerta" / "1 gaveta 2 puertas")'),
  -- UDB: banco de gavetas, sin puertas. Sus piezas traen 3 frentes de gaveta (cant 2+1).
  ('UDB', 'n_cajones', '3', 'UDB: la plantilla tiene 3 frentes de gaveta; el Excel UDB-3 da 3 manijas + 3 rieles'),
  ('UDB', 'n_puertas', '0', 'UDB no tiene pieza de puerta; sin esto el global daría 2 e inflaría las manijas'),
  ('POD', 'n_cajones', '1', 'POD es 1 gaveta modular (Excel: "1 gaveta modular")'),
  ('DD',  'n_cajones', '1', 'DD es 1 gaveta modular (Excel: "1 gaveta modular")')
) as v(pref, variable, valor, nota) on t.pref = v.pref;
