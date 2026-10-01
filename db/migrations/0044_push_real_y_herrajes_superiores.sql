-- Segunda tanda del hueco de herrajes, con la lista de precios del propio Excel CEMA
-- (hoja 'costos unitarios', que trae el maestro de herrajes del simulador).
--
-- ---------------------------------------------------------------------------
-- 1) El dispositivo PUSH costaba 5.600 en el catálogo; el Excel lo tiene en 8.032.
--
--    'costos unitarios' fila 104: "DISPOSITIVO PUSH TO OPEN IMAN HBM237-02" = 8.032.
--    Es el mismo código HBM237-02 que ya tenía sembrado `cot_herrajes`, así que no es
--    otro herraje: es el mismo con el precio desactualizado, igual que pasó con el riel
--    full extension en 0040.
--
--    Confirmado con CUATRO filas reales, que cierran al peso solo con 8.032:
--      WPC24 3/44924-PUSH-2S     19.632 = 2 bisagras + 1 push
--      WPC2461 1/2-18MM          55.328 = 4 bisagras + 4 push
--      PCFD219525 1/2-4OP-PUSH  234.807 = 2 bis + patas/torn + 4 riel Tandem + 2 push
--      PCFD34 1/28416 1/2-2OP   146.994 = 4 bis + patas/torn + 2 riel Tandem + 2 push
--
--    Las dos filas de PCFD las reproduce EXACTO la plantilla de PCFD que ya existe, sin
--    tocarla — o sea que el único dato equivocado era el precio.
update cot_herrajes
set precio = 8032
where codigo = 'PUSHOPENHBM237';

-- ---------------------------------------------------------------------------
-- 2) SLOC, WLD y KF: superiores/kits con puertas y sin plantilla de herrajes.
--
--    Los tres se resuelven con la plantilla de `W` (bisagra = n_puertas,
--    manija = n_puertas + n_cajones, y NADA de patas, porque no van al piso):
--
--    · SLOC (superior locero) y WLD (superior con luz) tienen exactamente el mismo juego
--      de piezas que W —lateral, refuerzo_trasero, frente(×2), base, tapa, fondo— y su
--      propio ancho de frente ya se escribe como `(L-n_puertas*RV)/n_puertas`, es decir
--      la geometría YA asume n_puertas puertas. Poner bisagra/manija en n_puertas es
--      hacer que el herraje concuerde con la pieza que el mismo tipo declara.
--      Es el mismo caso de WER, que en 0043 se copió de W y validó exacto (26.500).
--
--    · KF (kit de frentes) sí está en el Excel, y con muchas filas: KF-B12 y KF-BFD9
--      (1 puerta) = 13.250; KF-B24, KF-B30, KF-BFD30, KF-W3030 (2 puertas) = 26.500.
--      13.250 = bisagra 5.800 + manija 7.450, sin patas. Reproduce todas esas filas.
--      (Los KF-* que aparecen en 0 en el Excel son huecos de la fuente, no una regla:
--      KF-SBFD30 está en 0 pero KF-SBFD36 en 26.500, y KF-W1230 en 13.250 pero KF-W1530
--      en 0. No se toman como evidencia de "sin herrajes".)
insert into cot_herrajes_plantilla (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas)
select dst.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
       'Copiado de W (0044); superior/kit con puertas, sin patas'
from (values ('SLOC'), ('WLD'), ('KF')) as m(destino)
join cot_tipos_mueble dst on dst.pref = m.destino
join cot_tipos_mueble src on src.pref = 'W'
join cot_herrajes_plantilla h on h.tipo_mueble_id = src.id
where not exists (select 1 from cot_herrajes_plantilla x where x.tipo_mueble_id = dst.id);

-- ---------------------------------------------------------------------------
-- 3) Lo que NO se toca y por qué (queda para criterio de producto):
--
--    SBAS  El Excel fija el herraje de puerta basculante en 63.000 ("Brazo AIR SE PUSH
--          NGR 500-1400", fila 63 de 'costos unitarios'), confirmado 3 veces:
--          TW321524-SM = 63.000 (1 puerta basculante), TW4612...-SM = 126.000 (2 puertas)
--          y KF-TW2512-SM = 63.000. Pero SBAS declara TRES piezas `frente` de cant=1,
--          y n_puertas daría 2: no hay forma de saber si son 2 o 3 brazos sin la hoja de
--          ruta. Además hay filas TW-WLM que llevan solo bisagras (8.700 / 11.600 /
--          17.400 = 1,5 / 2 / 3 pares), o sea que conviven dos variantes de basculante.
--    WPC   Sus dos filas dan conteos de bisagra incompatibles entre sí (2 bisagras +
--          1 push para "1 puerta"; 4 y 4 para "4 puertas"), y la plantilla declara 5
--          piezas de frente. El bisagrado depende del alto, que el catálogo no modela.
--    SDB   Sus filas del Excel dicen "1 gaveta 2 puertas", pero la plantilla tiene 22
--          piezas y 5 frentes de gaveta. La fuente y la plantilla describen muebles
--          distintos; hay que reconciliarlos antes de costear.
--    KD    Una sola fila (KD-DB26-2-SM = 127.330 = patas + 2 riel + 2 barra) y además
--          incluye patas, cosa rara en un kit. Un solo dato no alcanza.
--    BLS   Contradictorio en la fuente: BLS36 = 35.682 con observación "Sin herraje",
--          BLS36-RS-SMG = 0 y BLS40-RS-SM = 403.132 (lleva el torno esquinero de 372.000
--          y/o el condimentero de 161.000). No hay base estable.
--    BMW   Solo descompone la variante -SM-FE (39.380 = patas + 1 riel FE); las demás
--          incluyen accesorios de horno/microondas no identificables.
--    CC, CLV, DFE  No están en el Excel (CC solo con herraje de clóset: tubo 7.950 +
--          soporte 348, en combinaciones que no cierran contra sus 168.198 / 168.591).
--
-- ---------------------------------------------------------------------------
-- 4) Anotación aparte, NO corregida aquí: el `TW` del Excel es un mueble de PUERTA
--    BASCULANTE (todas sus filas lo dicen), mientras que el `TW` del catálogo es
--    "Mueble superior esquinero (Transition Wall)" con bisagra + manija. O el nombre del
--    catálogo está mal, o son dos cosas distintas que comparten prefijo. Cambiar la
--    semántica de un tipo que YA se usa es decisión de producto, no de esquema.
