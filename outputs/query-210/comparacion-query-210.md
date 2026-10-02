# Comparación Query App 2-10 frente a Cotizador Plus

Consulta del catálogo activo: 2026-10-02T16:02:20.384Z. Fuente: `Query App 2-10.csv`, 5.000 filas, 562 descripciones y 510 códigos distintos después de quitar HRJ/HJR y unificar descripciones del mismo código. Plus tiene 81 tipos activos y uno inactivo.

## Alcance y criterio

Se seleccionaron **252 referencias en 110 agrupaciones de código**. En 21 agrupaciones había al menos cinco referencias: se revisaron cinco. En las restantes se tomaron todas las disponibles; no se inventaron muestras. Dos agrupaciones (`TABLERO` y `ACCESORIOS`) son descripciones sin SKU homologable, conservadas como pendientes.

Las letras iniciales y variantes FE, SM, SMG, PUSH, SHK, MBB, MO, etc. distinguen grupos; los nombres comerciales no determinan la tipología. En DB se conserva el número posterior a la medida y la S: DB-1S, DB-2, DB-2S. Las manos L/R se contrastan con la opción de apertura de la misma plantilla. Espesores 15MM/18MM, ubicaciones de proyecto y medidas no crean tipos. Los sufijos de configuración de puertas/entrepaños se conservan en el SKU de cada muestra, pero no se convierten automáticamente en nuevas plantillas. SMG se conserva separado en Query y se compara explícitamente con SM en Plus, siguiendo la equivalencia documentada de la app; no existe un prefijo activo SMG independiente.

La comparación usa el motor real `src/lib/engine.ts` y una captura de las tablas activas, no solo las migraciones locales. Es una auditoría de plantillas y configuración predeterminada, no de una cotización guardada. Las dimensiones se recuperan por consenso de las fórmulas de producción y, cuando falta un eje, de las piezas; esas inferencias quedan registradas. Se usan los espesores de Query. No se fuerza la cantidad de entrepaños de Query sobre Plus. Las diferencias en configuraciones especiales pueden necesitar un ajuste de parámetros, no necesariamente otra plantilla.

**Conteo:** CANTIDAD está vacía en las 5.000 filas. Cada fila se toma como una pieza; las cantidades de las plantillas se expanden. Se excluyen líneas virtuales de canto sin tablero y piezas de dimensión cero. Se retiraron 12 repeticiones exactas de una misma letra/pieza/medidas/cantos dentro de una descripción; letras diferentes siguen siendo piezas diferentes. Para un mismo código con varias descripciones se conserva la primera del CSV (orden más reciente).

**Cantos:** se suman aristas de color y blancas; se comparan los lados geométricos y el calibre, reorientando largo/ancho cuando la pieza está girada. L×A significa cantidad de aristas sobre el largo y el ancho, no las medidas del tablero. Emparejar piezas con dimensiones diferentes permite localizar diferencias de patrón, pero no certifica identidad geométrica: se marca expresamente. **El color blanco/color no puede certificarse** con `cot_piezas_plantilla.cantos`, porque almacena calibre y número de lados, no una asignación explícita de color por arista. Tampoco se comparan metros facturados ni merma.

## Resultado global

- 201 referencias calculadas con plantilla o configuración equivalente.
- 120 tienen el mismo total de piezas; 81 tienen un total diferente.
- 103 presentan diferencias de patrón o calibre en al menos una pieza emparejada. No son todas correcciones confirmadas: incluye datos anómalos del CSV y emparejamientos con geometría distinta.
- 73 coinciden en total y en los patrones/calibres de todas las piezas emparejadas, sin piezas pendientes de emparejar; esto no certifica el color por arista.
- 50 referencias quedaron sin equivalente verificado y 1 sin dimensiones suficientes.

## Diferencias principales de piezas y cantos

| Tipología / referencia | Query → Plus | Detalle |
| --- | --- | --- |
| B-FE (5 muestras) | 16 → 16 piezas | Trasero de gaveta: 2L×0A → 1L×0A, 0,45 mm. |
| UVFD (5 muestras) | Mismo total | Entrepaño SHLEF: 2L×2A → 0L×0A. |
| DB-1S (2 muestras) | 18 → 18 piezas | Traseros de gavetas grandes: 1L×0A → 1L×2A. |
| DB-2-SMG (3 muestras) | 13 → 16 piezas | La plantilla DB-2-SM agrega dos golas de madera y un refuerzo delantero. |
| DB22-2S-SMG | 16 → 18 piezas | Plus agrega dos refuerzos delanteros. |
| DB30/32-2S SM-15MM | 19 → 18 piezas | Query contiene golas adicionales frente a la composición vigente; revisar la distribución, no solo el total. |
| DB12-2S-SM-FE | 28 → 28 piezas | Trasero inferior: 2L×0A → 2L×2A. |
| BBLFD45 D19-L/R SM | 14 → 13 piezas | Diferencias de refuerzos, gola y orientación de cantos; ver detalle por pieza. |
| BBLFD-D-L/R-SMG | 11–12 → 13 piezas | Las referencias SMG tienen otra composición frente a la plantilla SM. |
| BOMH36-1 | 12 → 13 piezas | Composición de frentes y orientación de cantos diferente; Plus requiere dimensiones de hueco de horno para reproducir una configuración específica. |
| BOV26-15MM; BOV32 | 6 → 7; 8 → 7 piezas | Los despieces no coinciden con la plantilla activa de siete piezas. |
| BOV24/30/36-SMG | 6/6/5 → 7 piezas | Comparación con BOV mediante opción gola; faltan/sobran componentes frente a ese patrón. |
| OW1636, OW2436, OW33 7/836 | 9 → 9 piezas | Query usa 0,45 mm; la plantilla OW fuerza 1 mm. La base además pasa de 2L×0A a 2L×2A. |
| TW-PUSH y TW-SM | Calibre de caja: 1 → 0,45 mm | El patrón de aristas puede coincidir, pero no el calibre. Las TW-SM compuestas tienen además más puertas/divisiones que TW básica. |
| W3128-SM-15MM | 11 → 11 piezas | Canto de puertas: Query 2 mm, Plus predeterminado 1 mm; puede depender del canto de frente elegido en la cotización. |

En las cinco muestras de B, BFD, USVFD-NR, UW y WLD coinciden total de piezas y patrones/calibres. Esto describe la muestra, no certifica todas las medidas o variantes de la familia.

## Entrepaños de superiores

Se cuentan móviles y fijos. UW incluye SHELF 0 y los dos móviles. Además de la muestra principal se revisaron todas las referencias superiores calculables para detectar cambios por altura.

| SKU | Tipología | Entrepaños Query | Entrepaños Plus | Piezas Query / Plus |
| --- | --- | --- | --- | --- |
| WPC24 3/44924-PUSH-2S | WPC-PUSH | 2 | 6 | 11 / 20 |
| OW29 3/449 1/217 1/4 | OW | 2 | 3 | 9 / 10 |
| WSM92514-18MM | WSM | 2 | 1 | 10 / 9 |
| WSM242514-1P-18MM | WSM | 2 | 1 | 10 / 10 |
| WSM302514-18MM | WSM | 2 | 1 | 11 / 10 |
| WSM182514-18MM | WSM | 2 | 1 | 10 / 9 |
| WSM152514-18MM | WSM | 2 | 1 | 10 / 9 |
| WSM122514-18MM | WSM | 2 | 1 | 10 / 9 |
| WSM212514-18MM | WSM | 2 | 1 | 10 / 9 |
| WPC2461 1/2-18MM | WPC | 4 | 6 | 16 / 20 |
| WBL3840 D22 7/8L-SM | WBL-D-L/R-SM | 3 | 2 | 12 / 11 |
| W3440-SM | W-SM | 3 | 2 | 12 / 11 |
| W1240-L-SM | W-SM | 3 | 2 | 11 / 10 |
| TW3334 1/4-PUSH-SM | TW-SM-PUSH | 1 | 2 | 10 / 10 |
| W12 1/240-R-SM | W-SM | 3 | 2 | 11 / 10 |
| W332424-PUSH | W-PUSH | 2 | 1 | 11 / 10 |

**Coincidencias:** UW: 3 → 3 en las cinco muestras; WLD: 0 → 0 en bajos y 2 → 2 en altos; W estándar: las cinco muestras coinciden. W-SM de 36 pulgadas coincide con dos entrepaños, pero los de 40 pulgadas de Query tienen tres y la plantilla devuelve dos. En TW3334 1/4-PUSH-SM el total de 10 piezas oculta una diferencia: Query tiene una puerta más y un entrepaño menos.

## Tipologías presentes en Query sin equivalente verificado

No se declara una familia inexistente solo por el nombre comercial. Esta lista distingue códigos sin plantilla exacta, variantes pendientes y alias métricos. Para IC/IP hay equivalencia nominal configurada, pero no se fuerza una configuración de cajones a partir del texto descriptivo.

| Grupo Query | Referencias disponibles | Observación |
| --- | --- | --- |
| BFD-GC-SMG | 2 | No hay plantilla/configuración equivalente verificada |
| DB-2-INT-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| W-ZR | 1 | No hay plantilla/configuración equivalente verificada |
| OW-ZR | 1 | No hay plantilla/configuración equivalente verificada |
| BASE-ZR | 1 | No hay plantilla/configuración equivalente verificada |
| TW-HOOD-SM | 1 | No hay plantilla/configuración equivalente verificada |
| WBL-D-L/R-HOOD-SM | 1 | No hay plantilla/configuración equivalente verificada |
| SDB-POD-SK-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| BBLDBFD-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| TWBL-SM | 1 | No hay plantilla/configuración equivalente verificada |
| WD | 1 | No hay plantilla/configuración equivalente verificada |
| SDB-SK-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| SBFD-POD-SMG | 2 | No hay plantilla/configuración equivalente verificada |
| BK-PC | 1 | No hay plantilla/configuración equivalente verificada |
| BMW-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| FL | 1 | No hay plantilla/configuración equivalente verificada |
| USBFDR | 2 | No hay plantilla/configuración equivalente verificada |
| B-MBB-SHK | 3 | No hay plantilla/configuración equivalente verificada |
| DV-MBB-SHK | 4 | No hay plantilla/configuración equivalente verificada |
| SB-SHK | 1 | No hay plantilla/configuración equivalente verificada |
| SV-SHK | 3 | No hay plantilla/configuración equivalente verificada |
| W-SHK | 2 | No hay plantilla/configuración equivalente verificada |
| TABLERO | 1 | Descripción sin SKU homologable |
| CLCOR | 1 | No hay plantilla/configuración equivalente verificada |
| IP | 1 | Alias métrico de BFD en Plus; requiere validar configuración/despiece |
| DB-2-RNG-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| WSMMD | 1 | No hay plantilla/configuración equivalente verificada |
| ALA | 1 | No hay plantilla/configuración equivalente verificada |
| IHFC | 1 | No hay plantilla/configuración equivalente verificada |
| BFD-B-SMG | 1 | No hay plantilla/configuración equivalente verificada |
| PL | 1 | No hay plantilla/configuración equivalente verificada |
| ACCESORIOS | 1 | Descripción sin SKU homologable |
| ALTH | 2 | No hay plantilla/configuración equivalente verificada |
| IC | 5 | Alias métrico de DB en Plus; requiere validar configuración/despiece |

**Equivalencias configurables, no ausencias:** USVFDR → USVFD removible; UBFDR → UBFD removible; UBR → UB removible. KF-W/KF-WSM → solo frentes del tipo base; OUVFD → UVFD sin frentes; ODB → DB sin frentes. En OUVFD el valor predeterminado de Plus produce un entrepaño y Query tiene tres: la cantidad debe configurarse. USBFDR no se dio por equivalente a USVFD porque sus letras identifican otra familia y no existe USBFD activo.

## Plantillas activas de Plus sin referencia equivalente en este CSV

La ausencia aplica a esta exportación, no demuestra que no existan en el sistema Query completo. Algunas tienen familias relacionadas, pero ninguna referencia equivalente fue vinculada a esa plantilla específica:

`BBL`, `BBLFD`, `BLS-RS-SM`, `BMW-1-FE`, `BOMH-1-FE`, `BT`, `D`, `DB-2-SM-FE`, `DB-3-SM`, `DB-3-SM-FE`, `DD`, `DF`, `DV`, `DVE`, `E`, `KD`, `KF`, `PCFD`, `SA`, `SBAS`, `SDB`, `SLOC`, `UB-FE`, `UV`, `V`, `V-FE`, `VFD`, `W-SM-LOC`, `WBL`, `WCC`.

KF sí aparece como concepto mediante kits de frentes, aunque no se usa su plantilla genérica. BBLFD/WBL básicos no equivalen a sus variantes D-L/R-SM. DB tiene además selectores virtuales DB-2, DB-3, DB-4 y DB2-1OP; los selectores no deben confundirse con filas independientes del catálogo. La presencia de DB-2-SMG no es evidencia de DB-2 estándar sin gola. VDF está inactivo y se excluye.

## Anomalías y límites de la fuente

- El CSV tiene exactamente 5.000 filas. La última referencia, IC40-2P, solo tiene seis filas: no puede certificarse la integridad de esa hoja ni que la exportación incluya todo Query.
- DB19-2S-FE-SM-15MM registra 6 cantos largos en FONDO MUEBLE con calibre 0. Ese valor excede las dos aristas posibles: es una anomalía de origen, no una orden para corregir Plus a seis lados.
- Algunas descripciones contradicen el SKU (p. ej., DB22-2 SMG describe tres gavetas). Se respetó el código, no la descripción.
- Filas con el mismo SKU y distintas composiciones históricas necesitan confirmar qué versión se fabrica hoy antes de modificar plantillas.
- Los colores por arista y configuraciones particulares guardadas por proyecto no están certificados por esta revisión.

## Cobertura y muestra completa

| Tipología Query | Disponibles | Revisadas | Plantilla(s) Plus |
| --- | --- | --- | --- |
| BBLFD-D-L/R-SM | 2 | 2 | BBLFD-D-L/R-SM |
| BOMH | 1 | 1 | BOMH-1 |
| DB-2S-SM-FE | 2 | 2 | DB-2S-SM-FE |
| B-FE | 9 | 5 | B-FE |
| BMW | 1 | 1 | BMW-1 |
| KF-W | 3 | 3 | W |
| SB-SM | 1 | 1 | SB-SM |
| KF-UDV | 1 | 1 | UDV |
| BFD | 17 | 5 | BFD |
| USVFD-NR | 9 | 5 | USVFD |
| OW | 7 | 5 | OW |
| VPC | 2 | 2 | VPC |
| OUVFD | 4 | 4 | UVFD |
| W-SM | 33 | 5 | W-SM |
| UBFD-F9 | 1 | 1 | UBFD |
| UB | 3 | 3 | UB |
| B | 10 | 5 | B |
| WLD | 6 | 5 | WLD |
| UVFD | 8 | 5 | UVFD |
| PN | 109 | 5 | PN |
| F | 28 | 5 | F |
| W-SM-PUSH | 10 | 5 | W-SM-PUSH |
| SBFD | 4 | 4 | SBFD |
| W | 36 | 5 | W |
| USVFDR | 3 | 3 | USVFD |
| BOV-SMG | 3 | 3 | BOV |
| BFD-GC-SMG | 2 | 2 | Sin equivalente verificado |
| DB-2-INT-SMG | 1 | 1 | Sin equivalente verificado |
| TK | 5 | 5 | TK |
| PC-SMG | 2 | 2 | PC |
| DB-1S | 2 | 2 | DB |
| SVFD | 5 | 5 | SVFD |
| UDV | 3 | 3 | UDV |
| CLV | 6 | 5 | CLV |
| W-ZR | 1 | 1 | Sin equivalente verificado |
| OW-ZR | 1 | 1 | Sin equivalente verificado |
| BASE-ZR | 1 | 1 | Sin equivalente verificado |
| WSM-PUSH | 4 | 4 | WSM |
| SV-SM | 1 | 1 | SV |
| WSM | 19 | 5 | WSM |
| TW-HOOD-SM | 1 | 1 | Sin equivalente verificado |
| WBL-D-L/R-HOOD-SM | 1 | 1 | Sin equivalente verificado |
| POD | 4 | 4 | POD |
| SDB-POD-SK-SMG | 1 | 1 | Sin equivalente verificado |
| BBLDBFD-SMG | 1 | 1 | Sin equivalente verificado |
| TW-SM | 3 | 3 | TW |
| TWBL-SM | 1 | 1 | Sin equivalente verificado |
| WPC-PUSH | 1 | 1 | WPC |
| ODB-SMG | 1 | 1 | DB |
| CC | 23 | 5 | CC |
| WD | 1 | 1 | Sin equivalente verificado |
| SDB-SK-SMG | 1 | 1 | Sin equivalente verificado |
| TW-PUSH | 1 | 1 | TW |
| PC-PUSH | 1 | 1 | PC |
| SBFD-POD-SMG | 2 | 2 | Sin equivalente verificado |
| SBFD-SMG | 2 | 2 | SBFD-SM |
| DB-2S-SMG | 1 | 1 | DB-2S-SM |
| BFD-SMG | 3 | 3 | BFD-SM |
| DB-2-SMG | 3 | 3 | DB-2-SM |
| BK-PC | 1 | 1 | Sin equivalente verificado |
| WPC | 1 | 1 | WPC |
| DFE | 6 | 5 | DFE |
| BMW-SMG | 1 | 1 | Sin equivalente verificado |
| UW | 6 | 5 | UW |
| FL | 1 | 1 | Sin equivalente verificado |
| BFD-SM | 2 | 2 | BFD-SM |
| SBFD-SM | 2 | 2 | SBFD-SM |
| OW-MO | 2 | 2 | OW-MO |
| VPC-SM | 1 | 1 | VPC |
| BOV | 2 | 2 | BOV |
| KF-WSM | 2 | 2 | WSM |
| USVFDR-F9 | 1 | 1 | USVFD |
| USVFD-NR-F9 | 1 | 1 | USVFD |
| USBFDR | 2 | 2 | Sin equivalente verificado |
| UDV-F9 | 1 | 1 | UDV |
| UDB | 1 | 1 | UDB |
| UBFDR | 1 | 1 | UBFD |
| UBFD | 1 | 1 | UBFD |
| B-MBB-SHK | 3 | 3 | Sin equivalente verificado |
| DV-MBB-SHK | 4 | 4 | Sin equivalente verificado |
| SB-SHK | 1 | 1 | Sin equivalente verificado |
| SV-SHK | 3 | 3 | Sin equivalente verificado |
| W-SHK | 2 | 2 | Sin equivalente verificado |
| TABLERO | 1 | 1 | Sin equivalente verificado |
| CLCOR | 1 | 1 | Sin equivalente verificado |
| WER-SM | 1 | 1 | WER |
| W-PUSH | 3 | 3 | W |
| BLS-SMG | 1 | 1 | BLS |
| BBLFD-D-L/R-SMG | 3 | 3 | BBLFD-D-L/R-SM |
| WBL-D-L/R-SM | 1 | 1 | WBL-D-L/R-SM |
| TW-SM-PUSH | 1 | 1 | TW-SM-PUSH |
| IP | 1 | 1 | Sin equivalente verificado |
| DB-2-RNG-SMG | 1 | 1 | Sin equivalente verificado |
| WSMMD | 1 | 1 | Sin equivalente verificado |
| ALA | 1 | 1 | Sin equivalente verificado |
| IHFC | 1 | 1 | Sin equivalente verificado |
| DB-2S-SM | 2 | 2 | DB-2S-SM |
| OVPC-SMG | 1 | 1 | OVPC |
| DB-2S | 1 | 1 | DB |
| BFD-B-SMG | 1 | 1 | Sin equivalente verificado |
| PL | 1 | 1 | Sin equivalente verificado |
| AL | 6 | 5 | AL |
| R | 1 | 1 | R |
| ACCESORIOS | 1 | 1 | Sin equivalente verificado |
| PC | 2 | 2 | PC |
| UBR | 1 | 1 | UB |
| SMO | 2 | 2 | SMO |
| S | 1 | 1 | S |
| ALTH | 2 | 2 | Sin equivalente verificado |
| IC | 5 | 5 | Sin equivalente verificado |

## Detalle por referencia

En cada tabla, Q/P significa Query/Plus. Las filas de origen corresponden a números de línea del CSV (cabecera = 1). El detalle de cantos enumera las discrepancias, no todos los lados coincidentes.

### BBLFD-D-L/R-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BBLFD45 D19-R SM | 14 / 13 | No aplica | 5 diferencias | evaluado |
| BBLFD45 D19-L SM | 14 / 13 | No aplica | 5 diferencias | evaluado |

**BBLFD45 D19-R SM**. Filas: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15. Plantilla: BBLFD-D-L/R-SM. .

Sin pareja Query: RAIL DEL. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| GOLA → gola_madera | 2×2 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (7.2 mm acumulados) |
| REF SM → refuerzo_delantero | 2×2 → 0×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (7.2 mm acumulados) |
| REF DEL INF → refuerzo_vertical | 1×1 → 2×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF DEL CENTRAL → refuerzo_delantero | 1×1 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (109.9 mm acumulados) |
| BASE → base | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**BBLFD45 D19-L SM**. Filas: 3676, 3677, 3678, 3679, 3680, 3681, 3682, 3683, 3684, 3685, 3686, 3687, 3688, 3689. Plantilla: BBLFD-D-L/R-SM. .

Sin pareja Query: RAIL DEL. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| GOLA → gola_madera | 2×2 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (7.2 mm acumulados) |
| REF SM → refuerzo_delantero | 2×2 → 0×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (7.2 mm acumulados) |
| REF DEL CENTRAL → refuerzo_vertical | 1×1 → 2×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF DEL INF → refuerzo_delantero | 1×1 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (109.9 mm acumulados) |
| BASE → base | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### BOMH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BOMH36-1 | 12 / 13 | No aplica | 5 diferencias | evaluado |

**BOMH36-1**. Filas: 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28. Plantilla: BOMH-1. .

Sin pareja Query: ninguna. Sin pareja Plus: frente_der.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE DER → frente_izq | 2×0 → 0×2 | 1 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO CAJON INF → trasero_gaveta | 1×0 → 0×1 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (115.0 mm acumulados) |
| FONDO GAVETA INF → base_gaveta | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### DB-2S-SM-FE

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB12-2S-SM-FE | 28 / 28 | No aplica | 1 diferencias | evaluado |
| DB19-2S-FE-SM-15MM | 28 / 28 | No aplica | 5 diferencias | evaluado |

**DB12-2S-SM-FE**. Filas: 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56. Plantilla: DB-2S-SM-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRAS GAV INF → trasero_gaveta_grande | 2×0 → 2×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**DB19-2S-FE-SM-15MM**. Filas: 2315, 2316, 2317, 2318, 2319, 2320, 2321, 2322, 2323, 2324, 2325, 2326, 2327, 2328, 2329, 2330, 2331, 2332, 2333, 2334, 2335, 2336, 2337, 2338, 2339, 2340, 2341, 2342. Plantilla: DB-2S-SM-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FONDO MUEBLE → fondo | 6×0 → 0×0 | 0 → 0 | Dimensiones próximas (≤2 mm acumulados) |
| FRENTE GAV INF → frente_gaveta_grande | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (53.6 mm acumulados) |
| FRENTE GAV SUP → frente_gaveta_pequena | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| FRENTE GAV CENTRAL → frente_gaveta_pequena | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| TRAS GAV INF → trasero_gaveta_grande | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (19.0 mm acumulados) |

### B-FE

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| B10-FE | 16 / 16 | No aplica | 1 diferencias | evaluado |
| B12-FE | 16 / 16 | No aplica | 1 diferencias | evaluado |
| B18-FE | 16 / 16 | No aplica | 1 diferencias | evaluado |
| B17-FE | 16 / 16 | No aplica | 1 diferencias | evaluado |
| B16-FE | 16 / 16 | No aplica | 1 diferencias | evaluado |

**B10-FE**. Filas: 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72. Plantilla: B-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRAS GAV → trasero_gaveta | 2×0 → 1×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**B12-FE**. Filas: 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362. Plantilla: B-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRAS GAV → trasero_gaveta | 2×0 → 1×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**B18-FE**. Filas: 740, 741, 742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755. Plantilla: B-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRAS GAV → trasero_gaveta | 2×0 → 1×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**B17-FE**. Filas: 756, 757, 758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771. Plantilla: B-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRAS GAV → trasero_gaveta | 2×0 → 1×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**B16-FE**. Filas: 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787. Plantilla: B-FE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRAS GAV → trasero_gaveta | 2×0 → 1×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### BMW

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BMW36-1 | 12 / 12 | No aplica | 0 diferencias | evaluado |

**BMW36-1**. Filas: 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84. Plantilla: BMW-1. .

### KF-W

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| KF-W3634 | 2 / 2 | No aplica | 0 diferencias | evaluado |
| KF-W2836-L | 1 / 2 | No aplica | 0 diferencias | evaluado |
| KF-W2836-R | 1 / 2 | No aplica | 0 diferencias | evaluado |

**KF-W3634**. Filas: 85, 86. Plantilla: W. Kit de frentes mediante modo solo_frentes de W.

Dimensiones inferidas: P auxiliar: no interviene en los frentes, P: pieza.

**KF-W2836-L**. Filas: 1687. Plantilla: W. Kit de frentes mediante modo solo_frentes de W.

Dimensiones inferidas: P auxiliar: no interviene en los frentes, P: pieza.

Sin pareja Query: ninguna. Sin pareja Plus: frente.

**KF-W2836-R**. Filas: 1689. Plantilla: W. Kit de frentes mediante modo solo_frentes de W.

Dimensiones inferidas: P auxiliar: no interviene en los frentes, P: pieza.

Sin pareja Query: ninguna. Sin pareja Plus: frente.

### SB-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SB30-SM | 12 / 12 | No aplica | 0 diferencias | evaluado |

**SB30-SM**. Filas: 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98. Plantilla: SB-SM. .

### KF-UDV

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| KF-UDV1228 3/4-1S | 1 / — | No aplica | No verificado | dimensiones_incompletas |

**KF-UDV1228 3/4-1S**. Filas: 99. Plantilla: UDV. Kit de frentes mediante modo solo_frentes de UDV.

Dimensiones inferidas: P auxiliar: no interviene en los frentes, P: pieza.

### BFD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BFD17 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| BFD24 | 10 / 10 | No aplica | 0 diferencias | evaluado |
| BFD22 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| BFD21 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| BFD20 | 9 / 9 | No aplica | 0 diferencias | evaluado |

**BFD17**. Filas: 100, 101, 102, 103, 104, 105, 106, 107, 108. Plantilla: BFD. .

**BFD24**. Filas: 1107, 1108, 1109, 1110, 1111, 1112, 1113, 1114, 1115, 1116. Plantilla: BFD. .

**BFD22**. Filas: 213, 214, 215, 216, 217, 218, 219, 220, 221. Plantilla: BFD. .

**BFD21**. Filas: 222, 223, 224, 225, 226, 227, 228, 229, 230. Plantilla: BFD. .

**BFD20**. Filas: 231, 232, 233, 234, 235, 236, 237, 238, 239. Plantilla: BFD. .

### USVFD-NR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| USVFD NR5028 3/4 3B | 9 / 9 | No aplica | 0 diferencias | evaluado |
| USVFD NR2728 1/2 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| USVFD NR5028 3/4 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| USVFD NR4028 3/4 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| USVFD NR3428 3/4 | 9 / 9 | No aplica | 0 diferencias | evaluado |

**USVFD NR5028 3/4 3B**. Filas: 109, 110, 111, 112, 113, 114, 115, 116, 117. Plantilla: USVFD. .

**USVFD NR2728 1/2**. Filas: 4460, 4461, 4462, 4463, 4464, 4465, 4466, 4467, 4468. Plantilla: USVFD. .

**USVFD NR5028 3/4**. Filas: 430, 431, 432, 433, 434, 435, 436, 437, 438. Plantilla: USVFD. .

**USVFD NR4028 3/4**. Filas: 439, 440, 441, 442, 443, 444, 445, 446, 447. Plantilla: USVFD. .

**USVFD NR3428 3/4**. Filas: 448, 449, 450, 451, 452, 453, 454, 455, 456. Plantilla: USVFD. .

### OW

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| OW3018 | 8 / 8 | 1 / 1 | 0 diferencias | evaluado |
| OW1636 | 9 / 9 | 2 / 2 | 8 diferencias | evaluado |
| OW29 3/449 1/217 1/4 | 9 / 10 | 2 / 3 | 1 diferencias | evaluado |
| OW2436 | 9 / 9 | 2 / 2 | 8 diferencias | evaluado |
| OW33 7/836 | 9 / 9 | 2 / 2 | 8 diferencias | evaluado |

**OW3018**. Filas: 118, 119, 120, 121, 122, 123, 124, 125. Plantilla: OW. .

**OW1636**. Filas: 1171, 1172, 1173, 1174, 1175, 1176, 1177, 1178, 1179. Plantilla: OW. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF 2 → entrepano | 2×2 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (5.1 mm acumulados) |
| SHELF 1 → entrepano | 2×2 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (5.1 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| SIDE L - R16L → lateral | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R16L → lateral | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R16L → tapa | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| BASE - R16L → base | 2×0 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |

**OW29 3/449 1/217 1/4**. Filas: 1459, 1460, 1461, 1462, 1463, 1464, 1465, 1466, 1467. Plantilla: OW. .

Sin pareja Query: ninguna. Sin pareja Plus: entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| BASE - R20L → base | 2×0 → 2×2 | 1 → 1 | Dimensiones próximas (≤2 mm acumulados) |

**OW2436**. Filas: 3944, 3945, 3946, 3947, 3948, 3949, 3950, 3951, 3952. Plantilla: OW. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF 2 → entrepano | 2×2 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (5.0 mm acumulados) |
| SHELF 1 → entrepano | 2×2 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (5.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| SIDE L - R16L → lateral | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R16L → lateral | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R16L → tapa | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| BASE - R16L → base | 2×0 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |

**OW33 7/836**. Filas: 3953, 3954, 3955, 3956, 3957, 3958, 3959, 3960, 3961. Plantilla: OW. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF 2 → entrepano | 2×2 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (5.0 mm acumulados) |
| SHELF 1 → entrepano | 2×2 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (5.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| SIDE L - R16L → lateral | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R16L → lateral | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R16L → tapa | 2×0 → 2×0 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |
| BASE - R16L → base | 2×0 → 2×2 | 0.45 → 1 | Geometría distinta; revisar correspondencia (6.0 mm acumulados) |

### VPC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| VPC1886 TK4 1/2 | 15 / 16 | No aplica | 1 diferencias | evaluado |
| VPC1786 TK4 1/2 | 15 / 16 | No aplica | 1 diferencias | evaluado |

**VPC1886 TK4 1/2**. Filas: 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140. Plantilla: VPC. .

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

**VPC1786 TK4 1/2**. Filas: 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155. Plantilla: VPC. .

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

### OUVFD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| OUVFD7 1/228 3/4-3S-18MM | 10 / 8 | No aplica | 7 diferencias | evaluado |
| OUVFD7 28 3/4-3S-18MM | 10 / 8 | No aplica | 7 diferencias | evaluado |
| OUVFD8 1/428 3/4-3S-18MM | 10 / 8 | No aplica | 7 diferencias | evaluado |
| OUVFD8 1/228 3/4-3S-18MM | 10 / 8 | No aplica | 7 diferencias | evaluado |

**OUVFD7 1/228 3/4-3S-18MM**. Filas: 156, 157, 158, 159, 341, 342, 343, 344, 345, 346. Plantilla: UVFD. Carcasa UVFD mediante modo sin_frentes; sin imponer los entrepaños de Query.

Sin pareja Query: SHELF, SHELF. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF → shlef | 2×0 → 0×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (29.8 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (2.0 mm acumulados) |

**OUVFD7 28 3/4-3S-18MM**. Filas: 160, 161, 162, 163, 164, 165, 166, 167, 168, 169. Plantilla: UVFD. Carcasa UVFD mediante modo sin_frentes; sin imponer los entrepaños de Query.

Sin pareja Query: SHELF, SHELF. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF → shlef | 2×0 → 0×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (29.8 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (2.0 mm acumulados) |

**OUVFD8 1/428 3/4-3S-18MM**. Filas: 317, 318, 319, 320, 321, 322, 323, 324, 325, 326. Plantilla: UVFD. Carcasa UVFD mediante modo sin_frentes; sin imponer los entrepaños de Query.

Sin pareja Query: SHELF, SHELF. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF → shlef | 2×0 → 0×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (29.8 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (2.0 mm acumulados) |

**OUVFD8 1/228 3/4-3S-18MM**. Filas: 327, 328, 329, 330, 331, 332, 333, 334, 335, 336. Plantilla: UVFD. Carcasa UVFD mediante modo sin_frentes; sin imponer los entrepaños de Query.

Sin pareja Query: SHELF, SHELF. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF → shlef | 2×0 → 0×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (29.8 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (2.0 mm acumulados) |

### W-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| W3436-SM | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |
| W2036-SM | 10 / 10 | 2 / 2 | 0 diferencias | evaluado |
| W3128-SM-15MM | 11 / 11 | 2 / 2 | 2 diferencias | evaluado |
| W3440-SM | 12 / 11 | 3 / 2 | 0 diferencias | evaluado |
| W1240-L-SM | 11 / 10 | 3 / 2 | 0 diferencias | evaluado |

**W3436-SM**. Filas: 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180. Plantilla: W-SM. .

**W2036-SM**. Filas: 203, 204, 205, 206, 207, 208, 209, 210, 211, 212. Plantilla: W-SM. .

**W3128-SM-15MM**. Filas: 2354, 2355, 2356, 2357, 2358, 2359, 2360, 2361, 2362, 2363, 2364. Plantilla: W-SM. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR L → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| DOOR R → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

**W3440-SM**. Filas: 3556, 3557, 3558, 3559, 3560, 3561, 3562, 3563, 3564, 3565, 3566, 3567. Plantilla: W-SM. .

Sin pareja Query: SHELF 1. Sin pareja Plus: ninguna.

**W1240-L-SM**. Filas: 3580, 3581, 3582, 3583, 3584, 3585, 3586, 3587, 3588, 3589, 3590. Plantilla: W-SM. .

Sin pareja Query: SHELF 1. Sin pareja Plus: ninguna.

### UBFD-F9

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UBFD1228 3/4-F9 | 9 / 9 | No aplica | 0 diferencias | evaluado |

**UBFD1228 3/4-F9**. Filas: 240, 241, 242, 243, 244, 245, 246, 247, 248. Plantilla: UBFD. .

### UB

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UB1228 3/4 | 13 / 13 | No aplica | 0 diferencias | evaluado |
| UB2828 3/4 | 14 / 14 | No aplica | 1 diferencias | evaluado |
| UB1028 3/4 | 13 / 13 | No aplica | 0 diferencias | evaluado |

**UB1228 3/4**. Filas: 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261. Plantilla: UB. .

**UB2828 3/4**. Filas: 2194, 2195, 2196, 2197, 2198, 2199, 2200, 2201, 2202, 2203, 2204, 2205, 2206, 2207. Plantilla: UB. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| BASE → base | 0×2 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**UB1028 3/4**. Filas: 1239, 1240, 1241, 1242, 1243, 1244, 1245, 1246, 1247, 1248, 1249, 1250, 1251. Plantilla: UB. .

### B

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| B30 | 14 / 14 | No aplica | 0 diferencias | evaluado |
| B12 | 13 / 13 | No aplica | 0 diferencias | evaluado |
| B18 | 13 / 13 | No aplica | 0 diferencias | evaluado |
| B27 | 14 / 14 | No aplica | 0 diferencias | evaluado |
| B39 | 14 / 14 | No aplica | 0 diferencias | evaluado |

**B30**. Filas: 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275. Plantilla: B. .

**B12**. Filas: 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288. Plantilla: B. .

**B18**. Filas: 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947. Plantilla: B. .

**B27**. Filas: 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961. Plantilla: B. .

**B39**. Filas: 1272, 1273, 1274, 1275, 1276, 1277, 1278, 1279, 1280, 1281, 1282, 1283, 1284, 1285. Plantilla: B. .

### WLD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WLD3614 | 9 / 9 | 0 / 0 | 0 diferencias | evaluado |
| WLD3013 | 9 / 9 | 0 / 0 | 0 diferencias | evaluado |
| WLD3330 | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |
| WLD1530 | 10 / 10 | 2 / 2 | 0 diferencias | evaluado |
| WLD2730 | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |

**WLD3614**. Filas: 289, 290, 291, 292, 293, 294, 295, 296, 297. Plantilla: WLD. .

**WLD3013**. Filas: 298, 299, 300, 301, 302, 303, 304, 305, 306. Plantilla: WLD. .

**WLD3330**. Filas: 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047. Plantilla: WLD. .

**WLD1530**. Filas: 1070, 1071, 1072, 1073, 1074, 1075, 1076, 1077, 1078, 1079. Plantilla: WLD. .

**WLD2730**. Filas: 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058. Plantilla: WLD. .

### UVFD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UVFD2628 3/412 | 10 / 10 | No aplica | 1 diferencias | evaluado |
| UVFD928 3/4 | 9 / 9 | No aplica | 1 diferencias | evaluado |
| UVFD2628 3/4 | 10 / 10 | No aplica | 1 diferencias | evaluado |
| UVFD828 3/4 | 9 / 9 | No aplica | 1 diferencias | evaluado |
| UVFD728 3/4 | 9 / 9 | No aplica | 1 diferencias | evaluado |

**UVFD2628 3/412**. Filas: 307, 308, 309, 310, 311, 312, 313, 314, 315, 316. Plantilla: UVFD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHLEF → shlef | 2×2 → 0×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (12.7 mm acumulados) |

**UVFD928 3/4**. Filas: 376, 377, 378, 379, 380, 381, 382, 383, 384. Plantilla: UVFD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHLEF → shlef | 2×2 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**UVFD2628 3/4**. Filas: 366, 367, 368, 369, 370, 371, 372, 373, 374, 375. Plantilla: UVFD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHLEF → shlef | 2×2 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**UVFD828 3/4**. Filas: 385, 386, 387, 388, 389, 390, 391, 392, 393. Plantilla: UVFD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHLEF → shlef | 2×2 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**UVFD728 3/4**. Filas: 394, 395, 396, 397, 398, 399, 400, 401, 402. Plantilla: UVFD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHLEF → shlef | 2×2 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### PN

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| PN22 1/285 1/2 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| PN21 7/828 3/4 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| PN25 1/289 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| PN24 7/830 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| PN12 7/836 | 1 / 1 | No aplica | 0 diferencias | evaluado |

**PN22 1/285 1/2**. Filas: 363. Plantilla: PN. .

Dimensiones inferidas: P: pieza.

**PN21 7/828 3/4**. Filas: 364. Plantilla: PN. .

Dimensiones inferidas: P: pieza.

**PN25 1/289**. Filas: 703. Plantilla: PN. .

Dimensiones inferidas: P: pieza.

**PN24 7/830**. Filas: 704. Plantilla: PN. .

Dimensiones inferidas: L: pieza.

**PN12 7/836**. Filas: 705. Plantilla: PN. .

Dimensiones inferidas: L: pieza.

### F

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| F685 1/2 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| F836 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| F621 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| F617 1/2 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| F634 | 1 / 1 | No aplica | 0 diferencias | evaluado |

**F685 1/2**. Filas: 365. Plantilla: F. .

Dimensiones inferidas: P: pieza.

**F836**. Filas: 706. Plantilla: F. .

Dimensiones inferidas: P: pieza.

**F621**. Filas: 708. Plantilla: F. .

Dimensiones inferidas: P: pieza.

**F617 1/2**. Filas: 709. Plantilla: F. .

Dimensiones inferidas: P: pieza.

**F634**. Filas: 989. Plantilla: F. .

Dimensiones inferidas: A: pieza, P: pieza.

### W-SM-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| W3817 1/224-SM-PUSH | 10 / 10 | 1 / 1 | 0 diferencias | evaluado |
| W332124-SM-PUSH | 10 / 10 | 1 / 1 | 0 diferencias | evaluado |
| W3315-PUSH-SM18 | 9 / 9 | 0 / 0 | 6 diferencias | evaluado |
| W3018-PUSH-SM18 | 10 / 10 | 1 / 1 | 7 diferencias | evaluado |
| W3617 1/224-SM-PUSH | 10 / 10 | 1 / 1 | 0 diferencias | evaluado |

**W3817 1/224-SM-PUSH**. Filas: 586, 587, 588, 589, 590, 591, 592, 593, 594, 595. Plantilla: W-SM-PUSH. .

**W332124-SM-PUSH**. Filas: 606, 607, 608, 609, 610, 611, 612, 613, 614, 615. Plantilla: W-SM-PUSH. .

**W3315-PUSH-SM18**. Filas: 3382, 3383, 3384, 3385, 3386, 3387, 3388, 3389, 3390. Plantilla: W-SM-PUSH. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**W3018-PUSH-SM18**. Filas: 3470, 3471, 3472, 3473, 3474, 3475, 3476, 3477, 3478, 3479. Plantilla: W-SM-PUSH. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF 1 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**W3617 1/224-SM-PUSH**. Filas: 596, 597, 598, 599, 600, 601, 602, 603, 604, 605. Plantilla: W-SM-PUSH. .

### SBFD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SBFD30 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| SBFD36 PRUEBA | 7 / 9 | No aplica | 0 diferencias | evaluado |
| SBFD36 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| SBFD33 | 9 / 9 | No aplica | 0 diferencias | evaluado |

**SBFD30**. Filas: 731, 732, 733, 734, 735, 736, 737, 738, 739. Plantilla: SBFD. .

**SBFD36 PRUEBA**. Filas: 3375, 3376, 3377, 3378, 3379, 3380, 3381. Plantilla: SBFD. .

Sin pareja Query: ninguna. Sin pareja Plus: frente, frente.

**SBFD36**. Filas: 915, 916, 917, 918, 919, 920, 921, 922, 923. Plantilla: SBFD. .

**SBFD33**. Filas: 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088. Plantilla: SBFD. .

### W

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| W3634 | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |
| W2134 | 10 / 10 | 2 / 2 | 0 diferencias | evaluado |
| W302024-18MM | 10 / 10 | 1 / 1 | 7 diferencias | evaluado |
| W3628 | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |
| W3336 | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |

**W3634**. Filas: 924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934. Plantilla: W. .

**W2134**. Filas: 1229, 1230, 1231, 1232, 1233, 1234, 1235, 1236, 1237, 1238. Plantilla: W. .

**W302024-18MM**. Filas: 2175, 2176, 2177, 2178, 2179, 2180, 2181, 2182, 2183, 2184. Plantilla: W. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF 1 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA-R19L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R19L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**W3628**. Filas: 2223, 2224, 2225, 2226, 2227, 2228, 2229, 2230, 2231, 2232, 2233. Plantilla: W. .

**W3336**. Filas: 2423, 2424, 2425, 2426, 2427, 2428, 2429, 2430, 2431, 2432, 2433. Plantilla: W. .

### USVFDR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| USVFDR3628 3/4 | 11 / 11 | No aplica | 0 diferencias | evaluado |
| USVFDR3628 1/219 1/2 | 11 / 11 | No aplica | 0 diferencias | evaluado |
| USVFDR3328 3/4 | 11 / 11 | No aplica | 0 diferencias | evaluado |

**USVFDR3628 3/4**. Filas: 962, 963, 964, 965, 966, 967, 968, 969, 970, 971, 972. Plantilla: USVFD. R corresponde a opción removible.

**USVFDR3628 1/219 1/2**. Filas: 4369, 4370, 4371, 4372, 4373, 4374, 4375, 4376, 4377, 4378, 4379. Plantilla: USVFD. R corresponde a opción removible.

**USVFDR3328 3/4**. Filas: 2622, 2623, 2624, 2625, 2626, 2627, 2628, 2629, 2630, 2631, 2632. Plantilla: USVFD. R corresponde a opción removible.

### BOV-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BOV24 SMG | 6 / 7 | No aplica | 0 diferencias | evaluado |
| BOV36-SMG18 | 5 / 7 | No aplica | 5 diferencias | evaluado |
| BOV30-SMG | 6 / 7 | No aplica | 0 diferencias | evaluado |

**BOV24 SMG**. Filas: 982, 983, 984, 986, 987, 988. Plantilla: BOV. Variante aplicada sobre plantilla BOV.

Sin pareja Query: ninguna. Sin pareja Plus: refuerzo_trasero.

**BOV36-SMG18**. Filas: 2134, 2135, 2137, 2138, 2139. Plantilla: BOV. Variante aplicada sobre plantilla BOV.

Sin pareja Query: ninguna. Sin pareja Plus: refuerzo_trasero, refuerzo_delantero.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRONT OVEN → frente | 0×2 → 2×2 | 1 → 1 | Geometría distinta; revisar correspondencia (36.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**BOV30-SMG**. Filas: 3633, 3634, 3635, 3637, 3638, 3639. Plantilla: BOV. Variante aplicada sobre plantilla BOV.

Sin pareja Query: ninguna. Sin pareja Plus: refuerzo_trasero.

### BFD-GC-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BFD16-GC SMG | 8 / — | No aplica | No verificado | sin_equivalencia |
| BFD14-GC SMG | 8 / — | No aplica | No verificado | sin_equivalencia |

**BFD16-GC SMG**. Filas: 990, 991, 992, 993, 994, 995, 996, 997. Plantilla: —. Sin plantilla equivalente verificada.

**BFD14-GC SMG**. Filas: 4214, 4215, 4216, 4217, 4218, 4219, 4220, 4221. Plantilla: —. Sin plantilla equivalente verificada.

### DB-2-INT-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB22-2+INT SMG | 16 / — | No aplica | No verificado | sin_equivalencia |

**DB22-2+INT SMG**. Filas: 998, 999, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013. Plantilla: —. Sin plantilla equivalente verificada.

### TK

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TK496 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| TK4 96-15MM | 1 / 1 | No aplica | 1 diferencias | evaluado |
| TK4 1/296-15MM | 1 / 1 | No aplica | 1 diferencias | evaluado |
| TK596 | 1 / 1 | No aplica | 0 diferencias | evaluado |
| TK4 1/496 | 1 / 1 | No aplica | 0 diferencias | evaluado |

**TK496**. Filas: 1014. Plantilla: TK. .

Dimensiones inferidas: A: pieza, P: pieza.

**TK4 96-15MM**. Filas: 2174. Plantilla: TK. .

Dimensiones inferidas: P: pieza.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Zócalo → panel | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

**TK4 1/296-15MM**. Filas: 2383. Plantilla: TK. .

Dimensiones inferidas: P: pieza.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Zócalo → panel | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

**TK596**. Filas: 4780. Plantilla: TK. .

Dimensiones inferidas: P: pieza.

**TK4 1/496**. Filas: 4781. Plantilla: TK. .

Dimensiones inferidas: P: pieza.

### PC-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| PC2296 TK4 SMG | 15 / 16 | No aplica | 2 diferencias | evaluado |
| PC1894 TK4-R SMG | 15 / 16 | No aplica | 1 diferencias | evaluado |

**PC2296 TK4 SMG**. Filas: 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031. Plantilla: PC. Variante aplicada sobre plantilla PC.

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR LOW → puerta | 2×0 → 2×2 | 1 → 1 | Geometría distinta; revisar correspondencia (423.7 mm acumulados) |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

**PC1894 TK4-R SMG**. Filas: 3964, 3965, 3966, 3967, 3968, 3969, 3970, 3971, 3972, 3973, 3974, 3975, 3976, 3977, 3978. Plantilla: PC. Variante aplicada sobre plantilla PC.

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

### DB-1S

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB15-1S | 18 / 18 | No aplica | 2 diferencias | evaluado |
| DB12-1S | 18 / 18 | No aplica | 2 diferencias | evaluado |

**DB15-1S**. Filas: 1089, 1090, 1091, 1092, 1093, 1094, 1095, 1096, 1097, 1098, 1099, 1100, 1101, 1102, 1103, 1104, 1105, 1106. Plantilla: DB. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRASERO CAJON INF → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO CAJON CENTRAL → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**DB12-1S**. Filas: 2823, 2824, 2825, 2826, 2827, 2828, 2829, 2830, 2831, 2832, 2833, 2834, 2835, 2836, 2837, 2838, 2839, 2840. Plantilla: DB. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRASERO CAJON INF → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO CAJON CENTRAL → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### SVFD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SVFD36 | 9 / 9 | No aplica | 0 diferencias | evaluado |
| SVFD42-S18MM-D DER | 14 / 9 | No aplica | 6 diferencias | evaluado |
| SVFD35-S18MM | 11 / 9 | No aplica | 6 diferencias | evaluado |
| SVFD30-S18MM | 10 / 9 | No aplica | 6 diferencias | evaluado |
| SVFD42-S18MM-L IZQ | 14 / 9 | No aplica | 6 diferencias | evaluado |

**SVFD36**. Filas: 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1125. Plantilla: SVFD. .

**SVFD42-S18MM-D DER**. Filas: 3112, 3113, 3114, 3115, 3116, 3117, 3118, 3119, 3120, 3121, 3122, 3123, 3124, 3125. Plantilla: SVFD. .

Sin pareja Query: FILLER, ENTREPAÑO, ENTREPAÑO, DIVISION, GOLA, RAIL DELANTERO. Sin pareja Plus: fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL H → refuerzo_delantero | 2×2 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (844.8 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (64.0 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**SVFD35-S18MM**. Filas: 3979, 3980, 3981, 3982, 3983, 3984, 3985, 3986, 3987, 3988, 3989. Plantilla: SVFD. .

Sin pareja Query: FILLER, FILLER, GOLA. Sin pareja Plus: fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| RAIL DELANTERO → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (56.0 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (64.0 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**SVFD30-S18MM**. Filas: 3990, 3991, 3992, 3993, 3994, 3995, 3996, 3997, 3998, 3999. Plantilla: SVFD. .

Sin pareja Query: FILLER, GOLA. Sin pareja Plus: fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| RAIL DELANTERO → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (56.0 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (64.0 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**SVFD42-S18MM-L IZQ**. Filas: 3126, 3127, 3128, 3129, 3130, 3131, 3132, 3133, 3134, 3135, 3136, 3137, 3138, 3139. Plantilla: SVFD. .

Sin pareja Query: FILLER, ENTREPAÑO, ENTREPAÑO, DIVISION, GOLA, RAIL DELANTERO. Sin pareja Plus: fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL H → refuerzo_delantero | 2×2 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (844.8 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (40.0 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (64.0 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### UDV

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UDV1228 3/4-2S | 18 / 18 | No aplica | 1 diferencias | evaluado |
| UDV1528 3/4-1S | 18 / 18 | No aplica | 2 diferencias | evaluado |
| UDV1228 3/4-1S | 18 / 18 | No aplica | 2 diferencias | evaluado |

**UDV1228 3/4-2S**. Filas: 1126, 1127, 1128, 1129, 1130, 1131, 1132, 1133, 1134, 1135, 1136, 1137, 1138, 1139, 1140, 1141, 1142, 1143. Plantilla: UDV. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRASERO CAJON INF → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**UDV1528 3/4-1S**. Filas: 2711, 2712, 2713, 2714, 2715, 2716, 2717, 2718, 2719, 2720, 2721, 2722, 2723, 2724, 2725, 2726, 2727, 2728. Plantilla: UDV. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRASERO CAJON INF → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO CAJON CENTRAL → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**UDV1228 3/4-1S**. Filas: 2747, 2748, 2749, 2750, 2751, 2752, 2753, 2754, 2755, 2756, 2757, 2758, 2759, 2760, 2761, 2762, 2763, 2764. Plantilla: UDV. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRASERO CAJON INF → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO CAJON CENTRAL → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### CLV

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| CLV12024050 DER 3E-1BC-2C | 27 / 14 | No aplica | 14 diferencias | evaluado |
| CLV7024050 3E-2C | 25 / 14 | No aplica | 14 diferencias | evaluado |
| CLV9024050 1E-2BC | 9 / 14 | No aplica | 9 diferencias | evaluado |
| CLV85 2E | 10 / 14 | No aplica | 10 diferencias | evaluado |
| CLV11624050 DER 3E-1BC-2C | 25 / 14 | No aplica | 14 diferencias | evaluado |

**CLV12024050 DER 3E-1BC-2C**. Filas: 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1155, 1156, 1157, 1158, 1159, 1160, 1161, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1169, 1170. Plantilla: CLV. .

Sin pareja Query: División, Parche Cajon Inf, Parche Cajon Sup, Fondo Cajon Inf, Fondo Cajon Sup, Contraparche Inf R13Largo, Contraparch Sup R13Largo, Trasero Cajón Inf, Trasero Cajón Sup, Entrepaño Base, Entrepaño, Entrepaño, Entrepaño Fijo. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Entrepaño Fijo 2 → entrepano | 2×0 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (590.0 mm acumulados) |
| Ref Inf → ref_sup | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (591.0 mm acumulados) |
| Lat Izq Cajon Sup R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq Cajon Inf R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der Cajon Inf R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der Cajon Sup R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Tapa → entrepano | 2×0 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (590.0 mm acumulados) |
| Lat Der → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Tra → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Front → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Tapa → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Base → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Ref Sup → ref_inf | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CLV7024050 3E-2C**. Filas: 4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010, 4011, 4012, 4013, 4014, 4015, 4016, 4017, 4018, 4019, 4020, 4021, 4022, 4023, 4024. Plantilla: CLV. .

Sin pareja Query: Parche Cajon Inf, Parche Cajon Sup, Fondo Cajon Inf, Fondo Cajon Sup, Contraparche Inf R13Largo, Contraparch Sup R13Largo, Trasero Cajón Inf, Trasero Cajón Sup, Entrepaño, Entrepaño, Entrepaño Fijo. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Ref Inf → ref_sup | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq Cajon Sup R13L → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq Cajon Inf R13L → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der Cajon Inf R13L → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der Cajon Sup R13L → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Tapa → entrepano | 2×0 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Base → entrepano | 2×0 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Tra → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Front → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Tapa → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Base → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Ref Sup → ref_inf | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CLV9024050 1E-2BC**. Filas: 4175, 4176, 4177, 4178, 4179, 4180, 4181, 4182, 4183. Plantilla: CLV. .

Sin pareja Query: ninguna. Sin pareja Plus: entrepano, lateral_gaveta, lateral_gaveta, lateral_gaveta, lateral_gaveta.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Ref Inf → ref_sup | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Ref Sup → ref_inf | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Tra → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Front → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Tapa → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Fijo → entrepano | 2×0 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Base → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CLV85 2E**. Filas: 4184, 4185, 4186, 4187, 4188, 4189, 4190, 4191, 4192, 4193. Plantilla: CLV. .

Sin pareja Query: ninguna. Sin pareja Plus: lateral_gaveta, lateral_gaveta, lateral_gaveta, lateral_gaveta.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Ref Inf → ref_sup | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Fijo 2 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der → lateral | 2×2 → 2×2 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Tra → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Front → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Tapa → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Fijo → entrepano | 2×0 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq → lateral | 2×2 → 2×2 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Base → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Ref Sup → ref_inf | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CLV11624050 DER 3E-1BC-2C**. Filas: 4125, 4126, 4127, 4128, 4129, 4130, 4131, 4132, 4133, 4134, 4135, 4136, 4137, 4138, 4139, 4140, 4141, 4142, 4143, 4144, 4145, 4146, 4147, 4148, 4149. Plantilla: CLV. .

Sin pareja Query: Parche Cajon Inf, Parche Cajon Sup, Fondo Cajon Inf, Fondo Cajon Sup, Contraparche Inf R13Largo, Contraparch Sup R13Largo, Trasero Cajón Inf, Trasero Cajón Sup, Entrepaño, Entrepaño, Entrepaño Fijo. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Ref Inf → ref_sup | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (571.0 mm acumulados) |
| Lat Izq Cajon Sup R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der Cajon Inf R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq Cajon Inf R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Der Cajon Sup R13L450 → lateral_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Entrepaño Tapa → entrepano | 2×0 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (570.0 mm acumulados) |
| Entrepaño Base → entrepano | 2×0 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (570.0 mm acumulados) |
| Lat Der → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Tra → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Zocalo Front → zocalo | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Tapa → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Lat Izq → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Base → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Ref Sup → ref_inf | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### W-ZR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| W ZR | 10 / — | 2 / — | No verificado | sin_equivalencia |

**W ZR**. Filas: 1180, 1181, 1182, 1183, 1184, 1185, 1186, 1187, 1188, 1189. Plantilla: —. Sin plantilla equivalente verificada.

### OW-ZR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| OW ZR | 9 / — | 2 / — | No verificado | sin_equivalencia |

**OW ZR**. Filas: 1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1198. Plantilla: —. Sin plantilla equivalente verificada.

### BASE-ZR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BASE ZR | 22 / — | No aplica | No verificado | sin_equivalencia |

**BASE ZR**. Filas: 1199, 1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1218, 1219, 1220. Plantilla: —. Sin plantilla equivalente verificada.

### WSM-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WSM32 7/8 1324-PUSH-18MM | 8 / 9 | 0 / 0 | 0 diferencias | evaluado |
| WSM32 7/82424-PUSH-18MM | 10 / 10 | 1 / 1 | 0 diferencias | evaluado |
| WSM3019 1/214-PUSH-18MM | 10 / 10 | 1 / 1 | 0 diferencias | evaluado |
| WSM308 1/214-PUSH-18MM | 8 / 9 | 0 / 0 | 0 diferencias | evaluado |

**WSM32 7/8 1324-PUSH-18MM**. Filas: 1221, 1222, 1223, 1224, 1225, 1226, 1227, 1228. Plantilla: WSM. Variante aplicada sobre plantilla WSM.

Sin pareja Query: ninguna. Sin pareja Plus: frente.

**WSM32 7/82424-PUSH-18MM**. Filas: 1720, 1721, 1722, 1723, 1724, 1725, 1726, 1727, 1728, 1729. Plantilla: WSM. Variante aplicada sobre plantilla WSM.

**WSM3019 1/214-PUSH-18MM**. Filas: 1741, 1742, 1743, 1744, 1745, 1746, 1747, 1748, 1749, 1750. Plantilla: WSM. Variante aplicada sobre plantilla WSM.

**WSM308 1/214-PUSH-18MM**. Filas: 1751, 1752, 1753, 1754, 1755, 1756, 1757, 1758. Plantilla: WSM. Variante aplicada sobre plantilla WSM.

Sin pareja Query: ninguna. Sin pareja Plus: frente.

### SV-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SV30-SM | 11 / 10 | No aplica | 7 diferencias | evaluado |

**SV30-SM**. Filas: 1299, 1300, 1301, 1302, 1303, 1304, 1305, 1306, 1307, 1308, 1309. Plantilla: SV. Variante aplicada sobre plantilla SV.

Sin pareja Query: RAIL DEL. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL DEL → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (97.8 mm acumulados) |
| DOOR R → puerta | 2×0 → 2×2 | 1 → 1 | Geometría distinta; revisar correspondencia (30.0 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (5.0 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### WSM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WSM243614-1P-18MM | 10 / 11 | 2 / 2 | 0 diferencias | evaluado |
| WSM92514-18MM | 10 / 9 | 2 / 1 | 0 diferencias | evaluado |
| WSM303614-18MM | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |
| WSM302514-18MM | 11 / 10 | 2 / 1 | 0 diferencias | evaluado |
| WSM93614-18MM | 10 / 10 | 2 / 2 | 0 diferencias | evaluado |

**WSM243614-1P-18MM**. Filas: 1310, 1311, 1312, 1313, 1314, 1315, 1316, 1317, 1318, 1319. Plantilla: WSM. .

Sin pareja Query: ninguna. Sin pareja Plus: frente.

**WSM92514-18MM**. Filas: 1690, 1691, 1692, 1693, 1694, 1695, 1696, 1697, 1698, 1699. Plantilla: WSM. .

Sin pareja Query: SHELF 1. Sin pareja Plus: ninguna.

**WSM303614-18MM**. Filas: 1730, 1731, 1732, 1733, 1734, 1735, 1736, 1737, 1738, 1739, 1740. Plantilla: WSM. .

**WSM302514-18MM**. Filas: 1759, 1760, 1761, 1762, 1763, 1764, 1765, 1766, 1767, 1768, 1769. Plantilla: WSM. .

Sin pareja Query: SHELF 1. Sin pareja Plus: ninguna.

**WSM93614-18MM**. Filas: 1700, 1701, 1702, 1703, 1704, 1705, 1706, 1707, 1708, 1709. Plantilla: WSM. .

### TW-HOOD-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TW2212 3/415-TW248-HOOD-SM | 13 / — | 0 / — | No verificado | sin_equivalencia |

**TW2212 3/415-TW248-HOOD-SM**. Filas: 1320, 1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329, 1330, 1331, 1332. Plantilla: —. Sin plantilla equivalente verificada.

### WBL-D-L/R-HOOD-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WBL2212 3/415 D18 5/8-TW248-HOOD-W9 5/8-SM | 18 / — | 0 / — | No verificado | sin_equivalencia |

**WBL2212 3/415 D18 5/8-TW248-HOOD-W9 5/8-SM**. Filas: 1333, 1334, 1335, 1336, 1337, 1338, 1339, 1340, 1341, 1342, 1343, 1344, 1345, 1346, 1347, 1348, 1349, 1350. Plantilla: —. Sin plantilla equivalente verificada.

### POD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| POD29 3/414 3/814 | 3 / 8 | No aplica | 3 diferencias | evaluado |
| POD23 | 8 / 8 | No aplica | 2 diferencias | evaluado |
| POD26 | 8 / 8 | No aplica | 2 diferencias | evaluado |
| POD32615 3/4 | 8 / 8 | No aplica | 2 diferencias | evaluado |

**POD29 3/414 3/814**. Filas: 1351, 1352, 1353. Plantilla: POD. .

Dimensiones inferidas: P=14 pulgadas del SKU, P: pieza.

Sin pareja Query: ninguna. Sin pareja Plus: refuerzo_trasero, refuerzo_trasero, refuerzo_trasero, lateral, lateral.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE GAVETA → frente_gaveta | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO GAVETA → trasero_gaveta | 1×2 → 1×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (121.0 mm acumulados) |
| FONDO GAVETA → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (94.7 mm acumulados) |

**POD23**. Filas: 4452, 4453, 4454, 4455, 4456, 4457, 4458, 4459. Plantilla: POD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE GAVETA → frente_gaveta | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| FONDO GAVETA → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (76.0 mm acumulados) |

**POD26**. Filas: 4478, 4479, 4480, 4481, 4482, 4483, 4484, 4485. Plantilla: POD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE GAVETA → frente_gaveta | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| FONDO GAVETA → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**POD32615 3/4**. Filas: 4515, 4516, 4517, 4518, 4519, 4520, 4521, 4522. Plantilla: POD. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE GAVETA → frente_gaveta | 2×2 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| FONDO GAVETA → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### SDB-POD-SK-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SDB45-1SK-2-POD21-SMG | 21 / — | No aplica | No verificado | sin_equivalencia |

**SDB45-1SK-2-POD21-SMG**. Filas: 1354, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1362, 1363, 1364, 1365, 1366, 1367, 1368, 1369, 1370, 1371, 1372, 1373, 1374. Plantilla: —. Sin plantilla equivalente verificada.

### BBLDBFD-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BBLDBFD57 5/8-2D9 5/8-2-SMG | 22 / — | No aplica | No verificado | sin_equivalencia |

**BBLDBFD57 5/8-2D9 5/8-2-SMG**. Filas: 1375, 1376, 1377, 1378, 1379, 1380, 1381, 1382, 1383, 1384, 1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 1394, 1395, 1396. Plantilla: —. Sin plantilla equivalente verificada.

### TW-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TW5412 3/415-1D24-1D30-SM | 10 / 8 | 0 / 0 | 6 diferencias | evaluado |
| TW43 1/412 3/424-2D9 5/8-1D24TW-SM | 12 / 8 | 0 / 0 | 6 diferencias | evaluado |
| TW4612 3/424-1D22-1D24-SM | 10 / 8 | 0 / 0 | 6 diferencias | evaluado |

**TW5412 3/415-1D24-1D30-SM**. Filas: 1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404, 1405, 1406. Plantilla: TW. Variante aplicada sobre plantilla TW.

Sin pareja Query: DIVIDER, DOOR 24. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**TW43 1/412 3/424-2D9 5/8-1D24TW-SM**. Filas: 1417, 1418, 1419, 1420, 1421, 1422, 1423, 1424, 1425, 1426, 1427, 1428. Plantilla: TW. Variante aplicada sobre plantilla TW.

Sin pareja Query: DIVIDER R, DOOR 9 5/8, DIVIDER, DOOR 9 5/8. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**TW4612 3/424-1D22-1D24-SM**. Filas: 1407, 1408, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416. Plantilla: TW. Variante aplicada sobre plantilla TW.

Sin pareja Query: DIVIDER, DOOR 21. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### TWBL-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TWBL6112 3/424-1D24-1D21BL-SM | 12 / — | 0 / — | No verificado | sin_equivalencia |

**TWBL6112 3/424-1D24-1D21BL-SM**. Filas: 1429, 1430, 1431, 1432, 1433, 1434, 1435, 1436, 1437, 1438, 1439, 1440. Plantilla: —. Sin plantilla equivalente verificada.

### WPC-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WPC24 3/44924-PUSH-2S | 11 / 20 | 2 / 6 | 9 diferencias | evaluado |

**WPC24 3/44924-PUSH-2S**. Filas: 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451. Plantilla: WPC. Variante aplicada sobre plantilla WPC.

Sin pareja Query: ninguna. Sin pareja Plus: entrepano, entrepano, entrepano, entrepano, frente, frente, frente, frente, fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF 2 → entrepano | 2×2 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF 1 → entrepano | 2×2 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### ODB-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| ODB29 3/429 3/816 1/2-2-SMG | 7 / 13 | No aplica | 5 diferencias | evaluado |

**ODB29 3/429 3/816 1/2-2-SMG**. Filas: 1452, 1453, 1454, 1455, 1456, 1457, 1458. Plantilla: DB. DB sin frentes con opción gola; equivalencia configurable.

Sin pareja Query: ninguna. Sin pareja Plus: base_gaveta, base_gaveta, trasero_gaveta, trasero_gaveta, gola_perfil, gola_perfil.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DELANTERO → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (3.0 mm acumulados) |

### CC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| CC34 1/48420 5/8 TK4 1/2-2D-1S | 22 / 11 | No aplica | 10 diferencias | evaluado |
| CC249622 1/2 TK4 1/2 3S-R + DFE - C601 | 12 / 11 | No aplica | 10 diferencias | evaluado |
| CC249622 1/2 TK4 1/2 6S-L - C601 | 14 / 11 | No aplica | 10 diferencias | evaluado |
| CC249622 1/2 TK4 1/2 1H 1S-R - C601 | 9 / 11 | No aplica | 8 diferencias | evaluado |
| CC249622 1/2 TK4 1/2 2H 2S-L - C601 | 10 / 11 | No aplica | 9 diferencias | evaluado |

**CC34 1/48420 5/8 TK4 1/2-2D-1S**. Filas: 1468, 1469, 1470, 1471, 1472, 1473, 1474, 1475, 1476, 1477, 1478, 1479, 1480, 1481, 1482, 1483, 1484, 1485, 1486, 1487, 1488, 1489. Plantilla: CC. .

Sin pareja Query: FILLER GAV 10, FILLER GAV 10, FILLER GAV 6, FILLER GAV 6, TRAS GAV, FONDO GAV, FRONT 10", BACKING, DOOR R, TRAS GAV, FONDO GAV, FRONT 6". Sin pareja Plus: entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR L → frente | 2×0 → 2×2 | 1 → 1 | Geometría distinta; revisar correspondencia (552.5 mm acumulados) |
| SHELF1 → entrepano | 2×2 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (28.0 mm acumulados) |
| SHELF0 → entrepano | 2×0 → 0×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (28.0 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (27.0 mm acumulados) |
| BASE → tapa | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (27.0 mm acumulados) |

**CC249622 1/2 TK4 1/2 3S-R + DFE - C601**. Filas: 1909, 1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919, 1920. Plantilla: CC. .

Sin pareja Query: SHELF0. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF3 → entrepano | 2×2 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF2 → entrepano | 2×2 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF1 → entrepano | 2×2 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CC249622 1/2 TK4 1/2 6S-L - C601**. Filas: 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982. Plantilla: CC. .

Sin pareja Query: SHELF2, SHELF1, SHELF0. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF4 → entrepano | 2×2 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF5 → entrepano | 2×2 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF3 → entrepano | 2×2 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CC249622 1/2 TK4 1/2 1H 1S-R - C601**. Filas: 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019. Plantilla: CC. .

Sin pareja Query: ninguna. Sin pareja Plus: entrepano, entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF1 → entrepano | 2×2 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**CC249622 1/2 TK4 1/2 2H 2S-L - C601**. Filas: 2056, 2057, 2058, 2059, 2060, 2061, 2062, 2063, 2064, 2065. Plantilla: CC. .

Sin pareja Query: ninguna. Sin pareja Plus: entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF1 → entrepano | 2×2 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF0 → entrepano | 2×0 → 0×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### WD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WD24 3/435 | 1 / — | 0 / — | No verificado | sin_equivalencia |

**WD24 3/435**. Filas: 1505. Plantilla: —. Sin plantilla equivalente verificada.

### SDB-SK-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SDB46-1SK-2-SMG | 18 / — | No aplica | No verificado | sin_equivalencia |

**SDB46-1SK-2-SMG**. Filas: 1509, 1510, 1511, 1512, 1513, 1514, 1515, 1516, 1517, 1518, 1519, 1520, 1521, 1522, 1523, 1524, 1525, 1526. Plantilla: —. Sin plantilla equivalente verificada.

### TW-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TW24 1/213 1/224-PUSH | 8 / 8 | 0 / 0 | 6 diferencias | evaluado |

**TW24 1/213 1/224-PUSH**. Filas: 1590, 1591, 1592, 1593, 1594, 1595, 1596, 1597. Plantilla: TW. Variante aplicada sobre plantilla TW.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRAS → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### PC-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| PC2484 TK4 1/2-PUSH | 14 / 16 | No aplica | 11 diferencias | evaluado |

**PC2484 TK4 1/2-PUSH**. Filas: 1598, 1599, 1600, 1601, 1602, 1603, 1604, 1605, 1606, 1607, 1608, 1609, 1610, 1611. Plantilla: PC. Variante aplicada sobre plantilla PC.

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa, entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF3 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF2 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF1 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF0 → entrepano | 2×0 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (13.1 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (19.1 mm acumulados) |
| SIDE R R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (19.1 mm acumulados) |
| TAPA → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (3.0 mm acumulados) |
| BASE → base_tapa | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (3.0 mm acumulados) |

### SBFD-POD-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SBFD33-SMG-POD | 4 / — | No aplica | No verificado | sin_equivalencia |
| SBFD33-SMG-POD2 | 8 / — | No aplica | No verificado | sin_equivalencia |

**SBFD33-SMG-POD**. Filas: 1613, 1614, 1615, 1616. Plantilla: —. Sin plantilla equivalente verificada.

**SBFD33-SMG-POD2**. Filas: 3656, 3657, 3658, 3659, 3660, 3661, 3662, 3663. Plantilla: —. Sin plantilla equivalente verificada.

### SBFD-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SBFD33-SMG | 9 / 10 | No aplica | 0 diferencias | evaluado |
| SBFD38 SMG | 8 / 10 | No aplica | 0 diferencias | evaluado |

**SBFD33-SMG**. Filas: 1617, 1618, 1619, 1620, 1621, 1622, 1623, 1624, 1625. Plantilla: SBFD-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera.

**SBFD38 SMG**. Filas: 3856, 3857, 3858, 3859, 3860, 3861, 3862, 3863. Plantilla: SBFD-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera, fondo.

### DB-2S-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB22-2S-SMG | 16 / 18 | No aplica | 0 diferencias | evaluado |

**DB22-2S-SMG**. Filas: 1626, 1627, 1628, 1629, 1630, 1631, 1632, 1633, 1634, 1635, 1636, 1637, 1638, 1639, 1640, 1641. Plantilla: DB-2S-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: refuerzo_delantero, refuerzo_delantero.

### BFD-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BFD16 SMG | 9 / 10 | No aplica | 0 diferencias | evaluado |
| BFD24-SMG | 10 / 11 | No aplica | 1 diferencias | evaluado |
| BFD14-SMG | 9 / 10 | No aplica | 1 diferencias | evaluado |

**BFD16 SMG**. Filas: 1652, 1653, 1654, 1655, 1656, 1657, 1658, 1659, 1660. Plantilla: BFD-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera.

**BFD24-SMG**. Filas: 3623, 3624, 3625, 3626, 3627, 3628, 3629, 3630, 3631, 3632. Plantilla: BFD-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL → refuerzo_delantero | 2×2 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**BFD14-SMG**. Filas: 3664, 3665, 3666, 3667, 3668, 3669, 3670, 3671, 3672. Plantilla: BFD-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL → refuerzo_delantero | 2×2 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### DB-2-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB22-2 SMG | 13 / 16 | No aplica | 0 diferencias | evaluado |
| DB30-2 SMG | 13 / 16 | No aplica | 0 diferencias | evaluado |
| DB28-2 SMG | 13 / 16 | No aplica | 0 diferencias | evaluado |

**DB22-2 SMG**. Filas: 1661, 1662, 1663, 1664, 1665, 1666, 1667, 1668, 1669, 1670, 1671, 1672, 1673. Plantilla: DB-2-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera, gola_madera, refuerzo_delantero.

**DB30-2 SMG**. Filas: 3885, 3886, 3887, 3888, 3889, 3890, 3891, 3892, 3893, 3894, 3895, 3896, 3897. Plantilla: DB-2-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera, gola_madera, refuerzo_delantero.

**DB28-2 SMG**. Filas: 3898, 3899, 3900, 3901, 3902, 3903, 3904, 3905, 3906, 3907, 3908, 3909, 3910. Plantilla: DB-2-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera, gola_madera, refuerzo_delantero.

### BK-PC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BK-PC2196-L TK4 3/4-SMG18 | 1 / — | No aplica | No verificado | sin_equivalencia |

**BK-PC2196-L TK4 3/4-SMG18**. Filas: 1688. Plantilla: —. Sin plantilla equivalente verificada.

### WPC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WPC2461 1/2-18MM | 16 / 20 | 4 / 6 | 11 diferencias | evaluado |

**WPC2461 1/2-18MM**. Filas: 1850, 1851, 1852, 1853, 1854, 1855, 1856, 1857, 1858, 1859, 1860, 1861, 1862, 1863, 1864, 1865. Plantilla: WPC. .

Sin pareja Query: ninguna. Sin pareja Plus: entrepano, entrepano, fondo, frente.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| ENTREPAÑO3 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| ENTREPAÑO2 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| ENTREPAÑO1 → entrepano | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| ENTREPAÑO FIJO → entrepano | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| LAT IZQ R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| LAT DER R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA R19L → base | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE R19L → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### DFE

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DFE22 1/2618-R - C601 X4 | 7 / 7 | No aplica | 2 diferencias | evaluado |
| DFE22 1/2618-R - C501 X4 | 7 / 7 | No aplica | 2 diferencias | evaluado |
| DFE22 1/2618-R - C401 X4 | 7 / 7 | No aplica | 2 diferencias | evaluado |
| DFE22 1/2618-R - C301 X4 | 7 / 7 | No aplica | 2 diferencias | evaluado |
| DFE22 1/2618-R - C201 X4 | 7 / 7 | No aplica | 2 diferencias | evaluado |

**DFE22 1/2618-R - C601 X4**. Filas: 1866, 1867, 1868, 1869, 1870, 1871, 1872. Plantilla: DFE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Parche Gaveta → parche_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Trasero Gav → trasero_gav | 2×0 → 0×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**DFE22 1/2618-R - C501 X4**. Filas: 1873, 1874, 1875, 1876, 1877, 1878, 1879. Plantilla: DFE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Parche Gaveta → parche_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Trasero Gav → trasero_gav | 2×0 → 0×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**DFE22 1/2618-R - C401 X4**. Filas: 1880, 1881, 1882, 1883, 1884, 1885, 1886. Plantilla: DFE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Parche Gaveta → parche_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Trasero Gav → trasero_gav | 2×0 → 0×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**DFE22 1/2618-R - C301 X4**. Filas: 1887, 1888, 1889, 1890, 1891, 1892, 1893. Plantilla: DFE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Parche Gaveta → parche_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Trasero Gav → trasero_gav | 2×0 → 0×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**DFE22 1/2618-R - C201 X4**. Filas: 1894, 1895, 1896, 1897, 1898, 1899, 1900. Plantilla: DFE. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| Parche Gaveta → parche_gaveta | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| Trasero Gav → trasero_gav | 2×0 → 0×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### BMW-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BMW36-1-SMG18 | 12 / — | No aplica | No verificado | sin_equivalencia |

**BMW36-1-SMG18**. Filas: 2162, 2163, 2164, 2165, 2166, 2167, 2168, 2169, 2170, 2171, 2172, 2173. Plantilla: —. Sin plantilla equivalente verificada.

### UW

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UW1636 | 11 / 11 | 3 / 3 | 0 diferencias | evaluado |
| UW25 1/236 | 12 / 12 | 3 / 3 | 0 diferencias | evaluado |
| UW24 3/436 | 12 / 12 | 3 / 3 | 0 diferencias | evaluado |
| UW30 3/436 | 12 / 12 | 3 / 3 | 0 diferencias | evaluado |
| UW1336 | 11 / 11 | 3 / 3 | 0 diferencias | evaluado |

**UW1636**. Filas: 2208, 2209, 2210, 2211, 2212, 2213, 2214, 2215, 2216, 2217, 2218. Plantilla: UW. .

**UW25 1/236**. Filas: 2287, 2288, 2289, 2290, 2291, 2292, 2293, 2294, 2295, 2296, 2297, 2298. Plantilla: UW. .

**UW24 3/436**. Filas: 4253, 4254, 4255, 4256, 4257, 4258, 4259, 4260, 4261, 4262, 4263, 4264. Plantilla: UW. .

**UW30 3/436**. Filas: 4544, 4545, 4546, 4547, 4548, 4549, 4550, 4551, 4552, 4553, 4554, 4555. Plantilla: UW. .

**UW1336**. Filas: 4556, 4557, 4558, 4559, 4560, 4561, 4562, 4563, 4564, 4565, 4566. Plantilla: UW. .

### FL

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| FL61065 | 1 / — | No aplica | No verificado | sin_equivalencia |

**FL61065**. Filas: 2314. Plantilla: —. Sin plantilla equivalente verificada.

### BFD-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BFD16-SM-15MM | 10 / 10 | No aplica | 1 diferencias | evaluado |
| BFD24 SM-15MM | 11 / 11 | No aplica | 2 diferencias | evaluado |

**BFD16-SM-15MM**. Filas: 2343, 2344, 2345, 2346, 2347, 2348, 2349, 2350, 2351, 2352. Plantilla: BFD-SM. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR R → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

**BFD24 SM-15MM**. Filas: 4095, 4096, 4097, 4098, 4099, 4100, 4101, 4102, 4103, 4104, 4105. Plantilla: BFD-SM. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR L → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| DOOR R → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

### SBFD-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SBFD25-SM-15MM | 10 / 10 | No aplica | 2 diferencias | evaluado |
| SBFD40 SM-15MM | 9 / 10 | No aplica | 2 diferencias | evaluado |

**SBFD25-SM-15MM**. Filas: 2365, 2366, 2367, 2368, 2369, 2370, 2371, 2372, 2373, 2374. Plantilla: SBFD-SM. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR L → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| DOOR R → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

**SBFD40 SM-15MM**. Filas: 3736, 3737, 3738, 3739, 3740, 3741, 3742, 3743, 3744. Plantilla: SBFD-SM. .

Sin pareja Query: ninguna. Sin pareja Plus: fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR L → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |
| DOOR R → frente | 2×2 → 2×2 | 2 → 1 | Dimensiones próximas (≤2 mm acumulados) |

### OW-MO

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| OW2425-MO-15MM | 6 / 7 | 0 / 0 | 6 diferencias | evaluado |
| OW3018-MO18MM | 7 / 7 | 0 / 0 | 6 diferencias | evaluado |

**OW2425-MO-15MM**. Filas: 2375, 2376, 2377, 2378, 2379, 2380. Plantilla: OW-MO. .

Sin pareja Query: ninguna. Sin pareja Plus: fondo.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L → lateral | 2×2 → 2×2 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R → lateral | 2×2 → 2×2 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA → tapa | 2×0 → 2×0 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×2 → 2×2 | 2 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**OW3018-MO18MM**. Filas: 3409, 3410, 3411, 3412, 3413, 3414, 3415. Plantilla: OW-MO. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R20L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TAPA - R20L → tapa | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE - R20L → base | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### VPC-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| VPC188418 TK4-SM-15MM | 17 / 16 | No aplica | 3 diferencias | evaluado |

**VPC188418 TK4-SM-15MM**. Filas: 2388, 2389, 2390, 2391, 2392, 2393, 2394, 2395, 2396, 2397, 2398, 2399, 2400, 2401, 2402, 2403, 2404. Plantilla: VPC. Variante aplicada sobre plantilla VPC.

Sin pareja Query: GOLA, RIAL DEL. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR DOWN → puerta | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (19.8 mm acumulados) |
| DOOR UP → puerta | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (19.8 mm acumulados) |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (13.1 mm acumulados) |

### BOV

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BOV26-15MM | 6 / 7 | No aplica | 1 diferencias | evaluado |
| BOV32 | 8 / 7 | No aplica | 4 diferencias | evaluado |

**BOV26-15MM**. Filas: 2405, 2406, 2407, 2409, 2410, 2411. Plantilla: BOV. .

Sin pareja Query: ninguna. Sin pareja Plus: refuerzo_trasero.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRONT OVEN → frente | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (3.2 mm acumulados) |

**BOV32**. Filas: 3845, 3846, 3847, 3848, 3849, 3851, 3852, 3853. Plantilla: BOV. .

Sin pareja Query: H CENTER, SIDE L, SIDE R. Sin pareja Plus: refuerzo_trasero, refuerzo_delantero.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| H SIDE L → lateral | 0×0 → 2×2 | 0 → 0.45 | Geometría distinta; revisar correspondencia (726.5 mm acumulados) |
| H SIDE R → lateral | 0×0 → 2×2 | 0 → 0.45 | Geometría distinta; revisar correspondencia (726.5 mm acumulados) |
| FRONT OVEN → frente | 0×2 → 2×2 | 1 → 1 | Geometría distinta; revisar correspondencia (30 mm acumulados) |
| BASE → base | 0×2 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (3.0 mm acumulados) |

### KF-WSM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| KF-WSM32 7/81324-18MM | 1 / 2 | No aplica | 0 diferencias | evaluado |
| KF-WSM308 1/214-18MM | 1 / 2 | No aplica | 0 diferencias | evaluado |

**KF-WSM32 7/81324-18MM**. Filas: 2412. Plantilla: WSM. Kit de frentes mediante modo solo_frentes de WSM.

Dimensiones inferidas: P auxiliar: no interviene en los frentes, P: pieza.

Sin pareja Query: ninguna. Sin pareja Plus: frente.

**KF-WSM308 1/214-18MM**. Filas: 2413. Plantilla: WSM. Kit de frentes mediante modo solo_frentes de WSM.

Dimensiones inferidas: P auxiliar: no interviene en los frentes, P: pieza.

Sin pareja Query: ninguna. Sin pareja Plus: frente.

### USVFDR-F9

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| USVFDR3328 3/4-F9 | 11 / 11 | No aplica | 0 diferencias | evaluado |

**USVFDR3328 3/4-F9**. Filas: 2611, 2612, 2613, 2614, 2615, 2616, 2617, 2618, 2619, 2620, 2621. Plantilla: USVFD. R corresponde a opción removible.

### USVFD-NR-F9

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| USVFD NR3028 3/4-F9 | 9 / 9 | No aplica | 0 diferencias | evaluado |

**USVFD NR3028 3/4-F9**. Filas: 2644, 2645, 2646, 2647, 2648, 2649, 2650, 2651, 2652. Plantilla: USVFD. .

### USBFDR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| USBFDR3028 3/4 | 11 / — | No aplica | No verificado | sin_equivalencia |
| USBFDR3028 1/2 | 11 / — | No aplica | No verificado | sin_equivalencia |

**USBFDR3028 3/4**. Filas: 2671, 2672, 2673, 2674, 2675, 2676, 2677, 2678, 2679, 2680, 2681. Plantilla: —. Sin plantilla equivalente verificada.

**USBFDR3028 1/2**. Filas: 4441, 4442, 4443, 4444, 4445, 4446, 4447, 4448, 4449, 4450, 4451. Plantilla: —. Sin plantilla equivalente verificada.

### UDV-F9

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UDV1528 3/4-1S-F9 | 18 / 18 | No aplica | 2 diferencias | evaluado |

**UDV1528 3/4-1S-F9**. Filas: 2693, 2694, 2695, 2696, 2697, 2698, 2699, 2700, 2701, 2702, 2703, 2704, 2705, 2706, 2707, 2708, 2709, 2710. Plantilla: UDV. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| TRASERO CAJON INF → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| TRASERO CAJON CENTRAL → trasero_gaveta_grande | 1×0 → 1×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### UDB

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UDB1228 3/4-1S | 18 / 18 | No aplica | 3 diferencias | evaluado |

**UDB1228 3/4-1S**. Filas: 2783, 2784, 2785, 2786, 2787, 2788, 2789, 2790, 2791, 2792, 2793, 2794, 2795, 2796, 2797, 2798, 2799, 2800. Plantilla: UDB. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FONDO GAV INF → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| FONDO GAV CENTRAL → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| FONDO GAV SUP → base_gaveta | 2×0 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### UBFDR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UBFDR3028 3/4 | 12 / 12 | No aplica | 0 diferencias | evaluado |

**UBFDR3028 3/4**. Filas: 2801, 2802, 2803, 2804, 2805, 2806, 2807, 2808, 2809, 2810, 2811, 2812. Plantilla: UBFD. R corresponde a opción removible.

### UBFD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UBFD3028 3/4 | 10 / 10 | No aplica | 0 diferencias | evaluado |

**UBFD3028 3/4**. Filas: 2813, 2814, 2815, 2816, 2817, 2818, 2819, 2820, 2821, 2822. Plantilla: UBFD. .

### B-MBB-SHK

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| B12-MBB-SHK | 17 / — | No aplica | No verificado | sin_equivalencia |
| B30-MBB-SHK | 20 / — | No aplica | No verificado | sin_equivalencia |
| B15-MBB-SHK | 17 / — | No aplica | No verificado | sin_equivalencia |

**B12-MBB-SHK**. Filas: 2860, 2861, 2862, 2863, 2864, 2865, 2866, 2867, 2868, 2869, 2870, 2871, 2872, 2873, 2874, 2875, 2876. Plantilla: —. Sin plantilla equivalente verificada.

**B30-MBB-SHK**. Filas: 2894, 2895, 2896, 2897, 2898, 2899, 2900, 2901, 2902, 2903, 2904, 2905, 2906, 2907, 2908, 2909, 2910, 2911, 2912, 2913. Plantilla: —. Sin plantilla equivalente verificada.

**B15-MBB-SHK**. Filas: 2877, 2878, 2879, 2880, 2881, 2882, 2883, 2884, 2885, 2886, 2887, 2888, 2889, 2890, 2891, 2892, 2893. Plantilla: —. Sin plantilla equivalente verificada.

### DV-MBB-SHK

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DV12-1S-MBB-SHK | 24 / — | No aplica | No verificado | sin_equivalencia |
| DV14-1S-MBB-SHK | 24 / — | No aplica | No verificado | sin_equivalencia |
| DV18-1S-MBB-SHK | 24 / — | No aplica | No verificado | sin_equivalencia |
| DV24-1S-MBB-SHK | 24 / — | No aplica | No verificado | sin_equivalencia |

**DV12-1S-MBB-SHK**. Filas: 2914, 2915, 2916, 2917, 2918, 2919, 2920, 2921, 2922, 2923, 2924, 2925, 2926, 2927, 2928, 2929, 2930, 2931, 2932, 2933, 2934, 2935, 2936, 2937. Plantilla: —. Sin plantilla equivalente verificada.

**DV14-1S-MBB-SHK**. Filas: 2938, 2939, 2940, 2941, 2942, 2943, 2944, 2945, 2946, 2947, 2948, 2949, 2950, 2951, 2952, 2953, 2954, 2955, 2956, 2957, 2958, 2959, 2960, 2961. Plantilla: —. Sin plantilla equivalente verificada.

**DV18-1S-MBB-SHK**. Filas: 2962, 2963, 2964, 2965, 2966, 2967, 2968, 2969, 2970, 2971, 2972, 2973, 2974, 2975, 2976, 2977, 2978, 2979, 2980, 2981, 2982, 2983, 2984, 2985. Plantilla: —. Sin plantilla equivalente verificada.

**DV24-1S-MBB-SHK**. Filas: 2986, 2987, 2988, 2989, 2990, 2991, 2992, 2993, 2994, 2995, 2996, 2997, 2998, 2999, 3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009. Plantilla: —. Sin plantilla equivalente verificada.

### SB-SHK

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SB36-SHK | 16 / — | No aplica | No verificado | sin_equivalencia |

**SB36-SHK**. Filas: 3010, 3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020, 3021, 3022, 3023, 3024, 3025. Plantilla: —. Sin plantilla equivalente verificada.

### SV-SHK

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SV30-SHK | 16 / — | No aplica | No verificado | sin_equivalencia |
| SV33-SHK | 16 / — | No aplica | No verificado | sin_equivalencia |
| SV36-SHK | 16 / — | No aplica | No verificado | sin_equivalencia |

**SV30-SHK**. Filas: 3026, 3027, 3028, 3029, 3030, 3031, 3032, 3033, 3034, 3035, 3036, 3037, 3038, 3039, 3040, 3041. Plantilla: —. Sin plantilla equivalente verificada.

**SV33-SHK**. Filas: 3042, 3043, 3044, 3045, 3046, 3047, 3048, 3049, 3050, 3051, 3052, 3053, 3054, 3055, 3056, 3057. Plantilla: —. Sin plantilla equivalente verificada.

**SV36-SHK**. Filas: 3058, 3059, 3060, 3061, 3062, 3063, 3064, 3065, 3066, 3067, 3068, 3069, 3070, 3071, 3072, 3073. Plantilla: —. Sin plantilla equivalente verificada.

### W-SHK

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| W3630-SHK | 14 / — | 1 / — | No verificado | sin_equivalencia |
| W3012-SHK | 13 / — | 0 / — | No verificado | sin_equivalencia |

**W3630-SHK**. Filas: 3084, 3086, 3087, 3088, 3089, 3090, 3091, 3092, 3093, 3094, 3095, 3096, 3097, 3098. Plantilla: —. Sin plantilla equivalente verificada.

**W3012-SHK**. Filas: 3099, 3100, 3101, 3102, 3103, 3104, 3105, 3106, 3107, 3108, 3109, 3110, 3111. Plantilla: —. Sin plantilla equivalente verificada.

### TABLERO

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TABLERO COMPUESTO - | 2 / — | No aplica | No verificado | sin_equivalencia |

**TABLERO COMPUESTO -**. Filas: 3142, 3143. Plantilla: —. Sin plantilla equivalente verificada.

### CLCOR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| CLCOR74 2H- 4SH-2DR CON DIVISIÓN Y CAJÓN ADICIONAL | 37 / — | No aplica | No verificado | sin_equivalencia |

**CLCOR74 2H- 4SH-2DR CON DIVISIÓN Y CAJÓN ADICIONAL**. Filas: 3417, 3418, 3419, 3420, 3421, 3422, 3423, 3424, 3425, 3426, 3427, 3428, 3429, 3430, 3431, 3432, 3433, 3434, 3435, 3436, 3437, 3438, 3439, 3440, 3441, 3442, 3443, 3444, 3445, 3446, 3447, 3448, 3449, 3450, 3451, 3452, 3453. Plantilla: —. Sin plantilla equivalente verificada.

### WER-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WER2440-SM | 11 / 11 | 2 / 2 | 3 diferencias | evaluado |

**WER2440-SM**. Filas: 3489, 3490, 3491, 3492, 3493, 3494, 3495, 3496, 3497, 3498, 3499. Plantilla: WER. Variante aplicada sobre plantilla WER.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF TRAS → refuerzo_trasero | 0×0 → 2×0 | 0 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF 2 → entrepano | 2×2 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SHELF 1 → entrepano | 2×2 → 0×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### W-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| W3023-PUSH | 10 / 10 | 1 / 1 | 0 diferencias | evaluado |
| W332424-PUSH | 11 / 10 | 2 / 1 | 0 diferencias | evaluado |
| W3030-PUSH | 11 / 11 | 2 / 2 | 0 diferencias | evaluado |

**W3023-PUSH**. Filas: 3501, 3502, 3503, 3504, 3505, 3506, 3507, 3508, 3509, 3510. Plantilla: W. Variante aplicada sobre plantilla W.

**W332424-PUSH**. Filas: 3612, 3613, 3614, 3615, 3616, 3617, 3618, 3619, 3620, 3621, 3622. Plantilla: W. Variante aplicada sobre plantilla W.

Sin pareja Query: SHELF. Sin pareja Plus: ninguna.

**W3030-PUSH**. Filas: 3757, 3758, 3759, 3760, 3761, 3762, 3763, 3764, 3765, 3766, 3767. Plantilla: W. Variante aplicada sobre plantilla W.

### BLS-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BLS36-SMG | 11 / 11 | No aplica | 1 diferencias | evaluado |

**BLS36-SMG**. Filas: 3520, 3521, 3522, 3523, 3524, 3525, 3526, 3527, 3528, 3529, 3530. Plantilla: BLS. Variante aplicada sobre plantilla BLS.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF TRAS CHAFLAN L → refuerzo_trasero | 0×1 → 2×1 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### BBLFD-D-L/R-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BBLFD45-D19 1/2-SMG | 12 / 13 | No aplica | 3 diferencias | evaluado |
| BBLFD45 D19-R SMG | 11 / 13 | No aplica | 6 diferencias | evaluado |
| BBLFD45 D19-L SMG | 11 / 13 | No aplica | 6 diferencias | evaluado |

**BBLFD45-D19 1/2-SMG**. Filas: 3531, 3532, 3533, 3534, 3535, 3536, 3537, 3538, 3539, 3540, 3541, 3542. Plantilla: BBLFD-D-L/R-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL INF → refuerzo_vertical | 1×1 → 2×1 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (35.0 mm acumulados) |
| REF DEL CENTRAL → refuerzo_delantero | 1×1 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (127.6 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 0×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (639.4 mm acumulados) |

**BBLFD45 D19-R SMG**. Filas: 3691, 3692, 3693, 3694, 3695, 3696, 3697, 3698, 3699, 3700, 3701. Plantilla: BBLFD-D-L/R-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera, entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL INF → refuerzo_vertical | 1×1 → 2×1 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (15.0 mm acumulados) |
| REF DEL CENTRAL → refuerzo_delantero | 1×1 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (94.9 mm acumulados) |
| DOOR → frente | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (15.0 mm acumulados) |
| BLIND DOOR → blind door | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (15.0 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 0×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (652.1 mm acumulados) |
| BASE → base | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**BBLFD45 D19-L SMG**. Filas: 3702, 3703, 3704, 3705, 3706, 3707, 3708, 3709, 3710, 3711, 3712. Plantilla: BBLFD-D-L/R-SM. SMG se contrasta con SM; no existe prefijo SMG independiente.

Sin pareja Query: ninguna. Sin pareja Plus: gola_madera, entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF DEL INF → refuerzo_vertical | 1×1 → 2×1 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (15.0 mm acumulados) |
| REF DEL CENTRAL → refuerzo_delantero | 1×1 → 2×0 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (94.9 mm acumulados) |
| DOOR → frente | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (15.0 mm acumulados) |
| BLIND DOOR → blind door | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (15.0 mm acumulados) |
| RAIL DEL → refuerzo_delantero | 2×0 → 0×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (652.1 mm acumulados) |
| BASE → base | 2×0 → 0×2 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### WBL-D-L/R-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WBL3840 D22 7/8L-SM | 12 / 11 | 3 / 2 | 0 diferencias | evaluado |

**WBL3840 D22 7/8L-SM**. Filas: 3544, 3545, 3546, 3547, 3548, 3549, 3550, 3551, 3552, 3553, 3554, 3555. Plantilla: WBL-D-L/R-SM. .

Sin pareja Query: SHELF 1. Sin pareja Plus: ninguna.

### TW-SM-PUSH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| TW3334 1/4-PUSH-SM | 10 / 10 | 1 / 2 | 1 diferencias | evaluado |

**TW3334 1/4-PUSH-SM**. Filas: 3591, 3592, 3593, 3594, 3595, 3596, 3597, 3598, 3599, 3600. Plantilla: TW-SM-PUSH. .

Sin pareja Query: DOOR PUSH. Sin pareja Plus: entrepano.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF → entrepano | 2×0 → 2×2 | 1 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

### IP

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| IP75 | 10 / — | No aplica | No verificado | sin_equivalencia |

**IP75**. Filas: 3713, 3714, 3715, 3716, 3717, 3718, 3719, 3720, 3721, 3722. Plantilla: —. Sin plantilla equivalente verificada.

### DB-2-RNG-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB38-2 RNG SMG | 13 / — | No aplica | No verificado | sin_equivalencia |

**DB38-2 RNG SMG**. Filas: 3723, 3724, 3725, 3726, 3727, 3728, 3729, 3730, 3731, 3732, 3733, 3734, 3735. Plantilla: —. Sin plantilla equivalente verificada.

### WSMMD

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| WSMMD18285 1/2-18MM | 11 / — | 2 / — | No verificado | sin_equivalencia |

**WSMMD18285 1/2-18MM**. Filas: 3779, 3780, 3781, 3782, 3783, 3784, 3785, 3786, 3787, 3788, 3789. Plantilla: —. Sin plantilla equivalente verificada.

### ALA

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| ALA70240-1 Z10 | 18 / — | No aplica | No verificado | sin_equivalencia |

**ALA70240-1 Z10**. Filas: 3790, 3791, 3792, 3793, 3794, 3795, 3796, 3797, 3798, 3799, 3800, 3801, 3802, 3803, 3804, 3805, 3806, 3807. Plantilla: —. Sin plantilla equivalente verificada.

### IHFC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| IHFC80 | 5 / — | No aplica | No verificado | sin_equivalencia |

**IHFC80**. Filas: 3808, 3809, 3811, 3812, 3813. Plantilla: —. Sin plantilla equivalente verificada.

### DB-2S-SM

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB30-2S SM-15MM | 19 / 18 | No aplica | 3 diferencias | evaluado |
| DB32-2S SM-15MM | 19 / 18 | No aplica | 3 diferencias | evaluado |

**DB30-2S SM-15MM**. Filas: 3817, 3818, 3819, 3820, 3821, 3822, 3823, 3824, 3825, 3826, 3827, 3828, 3829, 3830, 3831, 3832, 3833, 3834, 3835. Plantilla: DB-2S-SM. .

Sin pareja Query: GOLA, GOLA. Sin pareja Plus: refuerzo_delantero.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE GAVETA INF → frente_gaveta_grande | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (26.8 mm acumulados) |
| FRENTE GAVETA CENTRAL → frente_gaveta_pequena | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (13.4 mm acumulados) |
| FRENTE GAVETA SUP → frente_gaveta_pequena | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (13.4 mm acumulados) |

**DB32-2S SM-15MM**. Filas: 4106, 4107, 4108, 4109, 4110, 4111, 4112, 4113, 4114, 4115, 4116, 4117, 4118, 4119, 4120, 4121, 4122, 4123, 4124. Plantilla: DB-2S-SM. .

Sin pareja Query: GOLA, GOLA. Sin pareja Plus: refuerzo_delantero.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| FRENTE GAVETA INF → frente_gaveta_grande | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (26.8 mm acumulados) |
| FRENTE GAVETA CENTRAL → frente_gaveta_pequena | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (13.4 mm acumulados) |
| FRENTE GAVETA SUP → frente_gaveta_pequena | 2×2 → 2×2 | 2 → 1 | Geometría distinta; revisar correspondencia (13.4 mm acumulados) |

### OVPC-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| OVPC3494-1 TK4 SMG | 20 / 14 | No aplica | 3 diferencias | evaluado |

**OVPC3494-1 TK4 SMG**. Filas: 3911, 3912, 3913, 3914, 3915, 3916, 3917, 3918, 3919, 3920, 3921, 3922, 3923, 3924, 3925, 3926, 3927, 3928, 3929, 3930. Plantilla: OVPC. Variante aplicada sobre plantilla OVPC.

Sin pareja Query: H IZQ, H CENTRAL, H DER, DOOR L, FRENTE HORNO, FRENTE GAV, FONDO GAV, DOOR R, TRAS GAV. Sin pareja Plus: entrepano, fondo, base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| ENTREPAÑO FIJO → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (3.9 mm acumulados) |
| ENTREPAÑO FIJO → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (3.9 mm acumulados) |
| ENTREPAÑO FIJO → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

### DB-2S

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| DB18-2S-S18MM | 18 / 18 | No aplica | 8 diferencias | evaluado |

**DB18-2S-S18MM**. Filas: 4025, 4026, 4027, 4028, 4029, 4030, 4031, 4032, 4033, 4034, 4035, 4036, 4037, 4038, 4039, 4040, 4041, 4042. Plantilla: DB. .

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| RAIL DELANTERO → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DELANTERO → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL TRASERO → refuerzo_trasero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| RAIL DELANTERO → refuerzo_delantero | 2×0 → 2×0 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE L - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| SIDE R - R19L → lateral | 2×2 → 2×2 | 1 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| BASE → base | 2×0 → 2×0 | 1 → 0.45 | Geometría distinta; revisar correspondencia (2.0 mm acumulados) |

### BFD-B-SMG

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| BFD14-B SMG | 8 / — | No aplica | No verificado | sin_equivalencia |

**BFD14-B SMG**. Filas: 4206, 4207, 4208, 4209, 4210, 4211, 4212, 4213. Plantilla: —. Sin plantilla equivalente verificada.

### PL

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| PL441065PANEL | 1 / — | No aplica | No verificado | sin_equivalencia |

**PL441065PANEL**. Filas: 4222. Plantilla: —. Sin plantilla equivalente verificada.

### AL

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| AL100240 Z10 | 18 / 13 | No aplica | 2 diferencias | evaluado |
| AL53183 Z10 | 16 / 13 | No aplica | 1 diferencias | evaluado |
| AL120240 Z10 | 18 / 13 | No aplica | 2 diferencias | evaluado |
| AL61240 Z10 | 18 / 13 | No aplica | 2 diferencias | evaluado |
| AL75240 Z10 | 18 / 13 | No aplica | 2 diferencias | evaluado |

**AL100240 Z10**. Filas: 4223, 4224, 4225, 4226, 4227, 4228, 4229, 4230, 4231, 4232, 4233, 4234, 4235, 4236, 4237, 4238, 4239, 4240. Plantilla: AL. .

Sin pareja Query: GOLA, PUERTA INF IZQ, PUERTA SUP IZQ, PUERTA INF DER, PUERTA SUP DER. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| ENTREPAÑO4 → entrepano | 2×2 → 2×2 | 10.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 4×0 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**AL53183 Z10**. Filas: 4265, 4266, 4267, 4268, 4269, 4270, 4271, 4272, 4273, 4274, 4275, 4276, 4277, 4278, 4279, 4280. Plantilla: AL. .

Sin pareja Query: GOLA VERTICAL, PUERTA IZQ, PUERTA DER. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REF TRASERO → refuerzo_trasero | 4×0 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**AL120240 Z10**. Filas: 4283, 4284, 4285, 4286, 4287, 4288, 4289, 4290, 4291, 4292, 4293, 4294, 4295, 4296, 4297, 4298, 4299, 4300. Plantilla: AL. .

Sin pareja Query: GOLA, PUERTA INF IZQ, PUERTA SUP IZQ, PUERTA INF DER, PUERTA SUP DER. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| ENTREPAÑO4 → entrepano | 2×2 → 2×2 | 10.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 4×0 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**AL61240 Z10**. Filas: 4301, 4302, 4303, 4304, 4305, 4306, 4307, 4308, 4309, 4310, 4311, 4312, 4313, 4314, 4315, 4316, 4317, 4318. Plantilla: AL. .

Sin pareja Query: GOLA, PUERTA SUP IZQ, PUERTA INF IZQ, PUERTA INF DER, PUERTA SUP DER. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| ENTREPAÑO4 → entrepano | 2×2 → 2×2 | 10.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 4×0 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

**AL75240 Z10**. Filas: 4319, 4320, 4321, 4322, 4323, 4324, 4325, 4326, 4327, 4328, 4329, 4330, 4331, 4332, 4333, 4334, 4335, 4336. Plantilla: AL. .

Sin pareja Query: GOLA, PUERTA INF IZQ, PUERTA SUP IZQ, PUERTA INF DER, PUERTA SUP DER. Sin pareja Plus: ninguna.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| ENTREPAÑO4 → entrepano | 2×2 → 2×2 | 10.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |
| REF TRASERO → refuerzo_trasero | 4×0 → 2×0 | 0.45 → 0.45 | Dimensiones próximas (≤2 mm acumulados) |

### R

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| R30 3 1/8 | 1 / 1 | No aplica | 1 diferencias | evaluado |

**R30 3 1/8**. Filas: 4250. Plantilla: R. .

Dimensiones inferidas: P: pieza.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| REFUERZO → panel | 2×0 → 2×2 | 0.45 → 1 | Dimensiones próximas (≤2 mm acumulados) |

### ACCESORIOS

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| ACCESORIOS PN-FILLER DISWASHER 35 1/2 | 2 / — | No aplica | No verificado | sin_equivalencia |

**ACCESORIOS PN-FILLER DISWASHER 35 1/2**. Filas: 4251, 4252. Plantilla: —. Sin plantilla equivalente verificada.

### PC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| PC188425 1/2 TK5 1/4 | 15 / 16 | No aplica | 1 diferencias | evaluado |
| PC128425 1/2 TK4 1/2 | 15 / 16 | No aplica | 2 diferencias | evaluado |

**PC188425 1/2 TK5 1/4**. Filas: 4402, 4403, 4404, 4405, 4406, 4407, 4408, 4409, 4410, 4411, 4412, 4413, 4414, 4415, 4416. Plantilla: PC. .

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

**PC128425 1/2 TK4 1/2**. Filas: 4417, 4418, 4419, 4420, 4421, 4422, 4423, 4424, 4425, 4426, 4427, 4428, 4429, 4430, 4431. Plantilla: PC. .

Sin pareja Query: ninguna. Sin pareja Plus: base_tapa.

| Pieza Query → Plus | Aristas L×A Q → P | Calibre mm Q → P | Emparejamiento |
| --- | --- | --- | --- |
| DOOR LOW → puerta | 2×0 → 2×2 | 1 → 1 | Geometría distinta; revisar correspondencia (104.8 mm acumulados) |
| SHELF0 → entrepano | 2×0 → 2×2 | 0.45 → 0.45 | Geometría distinta; revisar correspondencia (16.1 mm acumulados) |

### UBR

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| UBR3028 1/2 | 18 / 16 | No aplica | 0 diferencias | evaluado |

**UBR3028 1/2**. Filas: 4578, 4579, 4580, 4581, 4582, 4583, 4584, 4585, 4586, 4587, 4588, 4589, 4590, 4591, 4592, 4593, 4594, 4595. Plantilla: UB. R corresponde a opción removible.

Sin pareja Query: SIDE L INF - R17L587, SIDE R INF - R17L587. Sin pareja Plus: ninguna.

### SMO

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| SMO60,571,533 | 8 / 8 | No aplica | 0 diferencias | evaluado |
| SMO709033 | 8 / 8 | No aplica | 0 diferencias | evaluado |

**SMO60,571,533**. Filas: 4652, 4653, 4654, 4655, 4656, 4657, 4658, 4659. Plantilla: SMO. .

**SMO709033**. Filas: 4660, 4661, 4662, 4663, 4664, 4665, 4666, 4667. Plantilla: SMO. .

### S

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| S909033 | 11 / 9 | No aplica | 0 diferencias | evaluado |

**S909033**. Filas: 4868, 4869, 4870, 4871, 4872, 4873, 4874, 4875, 4876, 4877, 4878. Plantilla: S. .

Sin pareja Query: PUERTA IZQ, PUERTA DER. Sin pareja Plus: ninguna.

### ALTH

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| ALTH67240-1P-2C Z10 | 23 / — | No aplica | No verificado | sin_equivalencia |
| ALTH53240-1P-2C Z10 | 22 / — | No aplica | No verificado | sin_equivalencia |

**ALTH67240-1P-2C Z10**. Filas: 4879, 4880, 4881, 4882, 4883, 4884, 4885, 4886, 4887, 4888, 4889, 4890, 4891, 4892, 4893, 4894, 4895, 4896, 4897, 4898, 4899, 4900, 4901. Plantilla: —. Sin plantilla equivalente verificada.

**ALTH53240-1P-2C Z10**. Filas: 4902, 4903, 4904, 4905, 4906, 4907, 4908, 4909, 4910, 4911, 4912, 4913, 4914, 4915, 4916, 4917, 4918, 4919, 4920, 4921, 4922, 4923. Plantilla: —. Sin plantilla equivalente verificada.

### IC

| SKU | Piezas Q/P | Entrepaños Q/P | Cantos | Estado |
| --- | --- | --- | --- | --- |
| IC53-2P | 18 / — | No aplica | No verificado | sin_equivalencia |
| IC40-2P | 6 / — | No aplica | No verificado | sin_equivalencia |
| IC45-2P | 18 / — | No aplica | No verificado | sin_equivalencia |
| IC60-2P | 18 / — | No aplica | No verificado | sin_equivalencia |
| IC61-2P | 18 / — | No aplica | No verificado | sin_equivalencia |

**IC53-2P**. Filas: 4924, 4925, 4926, 4927, 4928, 4929, 4930, 4931, 4932, 4933, 4934, 4935, 4936, 4937, 4938, 4939, 4940, 4941. Plantilla: —. Sin plantilla equivalente verificada.

**IC40-2P**. Filas: 4996, 4997, 4998, 4999, 5000, 5001. Plantilla: —. Sin plantilla equivalente verificada.

**IC45-2P**. Filas: 4942, 4943, 4944, 4945, 4946, 4947, 4948, 4949, 4950, 4951, 4952, 4953, 4954, 4955, 4956, 4957, 4958, 4959. Plantilla: —. Sin plantilla equivalente verificada.

**IC60-2P**. Filas: 4960, 4961, 4962, 4963, 4964, 4965, 4966, 4967, 4968, 4969, 4970, 4971, 4972, 4973, 4974, 4975, 4976, 4977. Plantilla: —. Sin plantilla equivalente verificada.

**IC61-2P**. Filas: 4978, 4979, 4980, 4981, 4982, 4983, 4984, 4985, 4986, 4987, 4988, 4989, 4990, 4991, 4992, 4993, 4994, 4995. Plantilla: —. Sin plantilla equivalente verificada.
