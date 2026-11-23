# Entrepaños, cantos de abiertos y edición individual

Reglas confirmadas el 2026-11-06. Complementa [materiales de abiertos](materiales_tipologias_abiertas.md), [códigos comerciales](inferiores_b_ow_mo_programacion_pdf.md) y [protocolo de cotizaciones/PDF](protocolo_pdf_cotizaciones.md).

## Profundidad de entrepaños

`P` es la profundidad exterior, no el largo del módulo. Se conserva largo, cantidad y rol de tablero de la pieza. Incluye `entrepano` y `entrepano_fijo`:

| Tipología | Profundidad de fabricación |
| --- | --- |
| B y B-FE, incluida B-FE-SF | 300 mm |
| B-SF | 350 mm |
| Resto, P ≤ 23 pulgadas / 584,2 mm | P − 38,1 mm |
| Resto, P > 23 pulgadas | P − 50,8 mm |

El usuario confirmó expresamente que el intervalo mayor de 23 y hasta 24 pulgadas también descuenta 50,8 mm. Ejemplos: P=584,2 → 546,1; P=590 → 539,2; P=609,6 → 558,8; P=635 → 584,2 mm. El umbral de la expresión incorpora una tolerancia numérica de 0,000000001 pulgadas para que 584,2/25,4 no cruce accidentalmente el límite por coma flotante.

La migración idempotente `0245_entrepanos_profundidad.sql` actualiza las plantillas. `ajustarEntrepanos` en `src/lib/reglas-fabricacion.ts`, llamado por `prepararCotizacion`, aplica la misma regla a catálogos precargados. `resta_ancho=0` evita descontar dos veces una resta histórica. Se calcula antes de consumos, costos, agrupación, HDR y optimización, sin maquillar las medidas en la tabla.

## Canto en abiertos

OW, OW-MO, OBFD, OBFD-SM y OSBFD-SM, incluidas variantes SF, usan el canto seleccionado de frente en todas las aristas que sus plantillas ya declaran. No se agregan cantos a lados sin enchape ni a fondos sin canto. `cantoFrentesEnTodasLasPiezas` hace prevalecer esa regla incluso sobre calibres fijos históricos. Sin selección explícita, se usa el calibre de frente de 15/18 mm. Los formularios de simulador y cotización muestran el canto de caja dependiente del de frente, deshabilitado y con explicación.

## Preferencias individuales persistidas

La causa de pérdida era aplicar los materiales de Características por encima del input individual al guardar y al recalcular. Cada alta/edición calcula ahora `config.personalizacionMateriales`: diferencias por rol de tablero y por canto frente/caja respecto a la familia global correspondiente al área. El proyecto y sus perfiles/herrajes globales no se modifican al editar una línea.

`aplicarMaterialesProyecto` resuelve globales → excepciones individuales → invariantes de abiertos. Los campos no personalizados siguen los cambios globales; los personalizados permanecen al recargar, sincronizar, recalcular, cambiar TRM o copiar la línea. Volver a elegir el valor global al editar elimina su excepción. `inputDesdeLinea` y `construirFilaLinea` conservan el marcador. Activación, exclusiones y referencias de herrajes continúan en la configuración de cada línea. La excepción DB-FE de riel fijo y ausencia de barras permanece vigente. No se reconstruyen elecciones históricas que ya se hubieran perdido.

### Edición y separación de estructuras físicamente agrupadas

El usuario decidió conservar inicialmente la agrupación y separar el mueble cuando una edición individual ya no sea compatible. `editarLineaConDetalle` valida primero la corrida independiente y la estructura restante, crea un grupo exclusivo para el mueble editado y guarda su nueva selección. Se separa al cambiar caja/refuerzos/fondo, canto de caja, dimensiones o cantidad; también ante una incompatibilidad explícita de agrupación del motor, como distinto espesor de frente. Se recalculan el grupo original y el nuevo, se normalizan etiquetas y se concilian totales. Los demás miembros conservan sus elecciones y no se modifica Características del proyecto.

Un cambio compatible de frente o de herrajes sigue siendo individual dentro del grupo. La regla del motor que usa A1 para estructuras compartidas se conserva para los grupos que no se separan. La acción devuelve `desagrupado` y el editor muestra un aviso de separación y guardado; no anuncia éxito antes de terminar. Inputs inválidos se rechazan antes de crear grupos o actualizar líneas. `editarLinea` conserva su contrato anterior para otros consumidores.

## Código de DB

`codigoComercial` añade después del largo cada eje que difiera de su estándar: alto 30 pulgadas / 762 mm, profundidad 24 pulgadas / 609,6 mm. Se comparan medidas convertidas, independientemente; incluye todas las variantes DB del catálogo. En DB, 609 mm no se considera equivalente a 609,6 mm. El nombre conserva el sistema comercial métrico o imperial del proyecto aunque se capturen cm o mm. Ejemplo: `DB6578.7463.5-2S-SMG`. Las llamadas históricas incompletas sin profundidad conservan su etiqueta; los formularios y líneas persistidas siempre proporcionan los tres ejes.

## Comparación inicial de HDR y límites

Las dos imágenes iniciales corresponden a tipologías distintas: se conservan las reglas de gola. No se aprobó modificar base ni respaldo; siguen pendientes su holgura y alcance. Tampoco se inventa el mecanizado R19L ni la apertura de una puerta única. Las diferencias B/P y blanco/color de aquella comparación no autorizan cambiar globalmente la asignación de materiales.

## Identificación de filas HDR mayores de 26 piezas

Corregido el 2026-11-06: `HdrTabla` reiniciaba la letra después de Z mediante módulo 26. La letra se usa tanto como clave React de la fila como clave de su color editable; A y la antigua fila 27 compartían identidad y color, con errores de consola y riesgo de duplicación/omisión visual. Ahora reutiliza `indiceALetras`: A…Z, AA…AZ, BA…ZZ, AAA…; conserva las letras de las primeras 26 filas. No se cambia la geometría, el precio ni datos persistidos de cotizaciones.

`tests/hdr-identificadores.test.ts` renderiza el componente real con 703 piezas y comprueba cantidad, unicidad, límites Z/AA, AZ/BA y ZZ/AAA, y un campo de color por fila. Prueba en Chrome local con DB-FE/DB-4 de 34 filas: A y AA conservan colores independientes después de editar y rerenderizar; cero errores de consola o ejecución. Se descargó el PDF, se abrió con pypdf y se renderizó con PDFium. Browser plugin no disponible; se usó Playwright. No requirió migración ni escrituras de cotizaciones.

## Orden uniforme de presentación HDR

Confirmado con la imagen de referencia el 2026-11-06: base → tapa → laterales R/L → refuerzos delanteros y traseros → gola cuando corresponde → entrepaños → puertas → respaldo. `ordenarPiezasHdr` (`src/app/hdr/ordenPiezas.ts`) ordena una copia estable de las piezas antes de expandir cantidades y asignar letras; no modifica la plantilla, el motor, consumos, medidas ni precios. `base_tapa` conserva su expansión BASE/TAPA; los laterales y puertas pares conservan R/L. Piezas no clasificadas mantienen su orden relativo antes del respaldo.

Las piezas de gaveta/cajón forman un bloque estable entre entrepaños y puertas/respaldo. Mantienen entre sí exactamente la secuencia que entrega la plantilla, incluidos laterales, frentes, traseros, contraparche y fondos de gaveta. `frente` de una cajonera sin puertas pertenece a ese bloque; la puerta de un B mixto permanece aparte. La regla se aplica a todas las HDR, tanto por búsqueda como por cotización, y a su exportación PDF. La secuencia del despiece del simulador no se modifica.

`tests/hdr-orden.test.ts` verifica entrada desordenada e inmutabilidad, secuencia de gavetas, B mixto y base/tapa combinada con refuerzos/gola. Browser plugin no disponible: verificación en Chrome/Playwright de W-SM-PUSH, BFD (cuya plantilla empezaba por lateral) y DB-FE con cuatro gavetas. Las pruebas de orden no cambian las cantidades calculadas de cada mueble.

Cierre del cambio de orden: `quality:gate` exit 0, 118 archivos / 722 pruebas, cero fallidas; `quality:learn -- --strict` sin HIGH. Dos cargas y exportaciones independientes de la HDR DB-FE produjeron páginas PDF renderizadas idénticas, revisadas con PDFium. Los dos PDF mantienen la secuencia de gavetas y el respaldo al final. Sin errores de consola ni escrituras de cotizaciones.

## Verificación y aplicación

- Regresiones de límites, excepciones B/B-FE/B-SF, cantos de abiertos y prioridad sobre `forceCalibre`; nombres DB en pulgadas/cm/mm y sistemas comerciales; persistencia, sincronización y no modificación de globales. Se conservaron las aserciones históricas.
- Browser plugin no disponible: Chrome mediante Playwright. Sobre copia temporal de Condominio V se eligieron otro frente, canto 19x1 y exclusiones de riel/barra, se cambiaron dimensiones, se guardó y se volvió a cargar. Código `DB6578.7463.5-2S-SMG`, valores persistidos y globales idénticos; cero errores de aplicación. Copia eliminada al finalizar.
- Migración 0245 aplicada y registrada. Plantillas originales respaldadas en `.tmp/hdr-entrepanos-respaldo.txt`.
- 29 códigos de línea/grupo actualizados con comparación optimista y transacción, sin alterar precios: respaldo temporal `cotizador-respaldo-codigos-1794003146755.json`.
- Actualización de despieces: preflight de 116 grupos / 133 módulos en ocho proyectos. Respaldo temporal `cotizador-reglas-fabricacion-1794003253209.json`, que conserva cabeceras, áreas, grupos y líneas anteriores. El recálculo conserva las elecciones guardadas mediante diferencias individuales y comprueba que los globales no cambian. Los snapshots de optimizaciones guardadas conservan su corrida original.
- Aplicación finalizada: segunda pasada con cero grupos/módulos pendientes. Se corrigieron además dos referencias históricas de gaveta en Prueba Optimizador (`CHIRHCARB15BLANCO AMERICANO 124` → `CHIRHCARB15BLANCO AMERICANO`), conforme a la equivalencia elegida previamente por el usuario. Auditoría estricta de 12 cotizaciones: cero diferencias y cero errores; conciliación final de códigos: cero pendientes. Los códigos se conciliaron después del recálculo, con segundo respaldo `cotizador-respaldo-codigos-1794003699507.json`.
- HDR en navegador a P=635 mm: BFD muestra entrepaño de 584,2 mm; B y B-FE, 300 mm; B-SF, 350 mm. Sin errores de aplicación.
- Copia temporal de un grupo BFD-SMG de dos muebles: cambiar la caja de A2 a ECOCARB15COLOR lo separa automáticamente y conserva la elección tras recargar. A1, sus herrajes y los globales permanecen iguales; aviso visible y cero errores. La copia se eliminó. `tests/edicion-desagrupar.test.ts` comprueba persistencia, ambos grupos, totales, cambio compatible de frente e input inválido sin escrituras.
- Dos cargas independientes y dos ejecuciones de Guardar e imprimir / PDF en KUNDARA (10 páginas cada una) y Milán Closet (5 páginas). Texto extraído idéntico por par; páginas renderizadas con PDFium y mosaicos revisados. Alcance: Chrome local, sin impresión física ni despliegue remoto.
- `quality:gate`: exit 0, 116 archivos / 717 pruebas, cero fallidas; TypeScript y ESLint dentro del ratchet. `quality:learn -- --strict`: cero HIGH; quedan dos MED y dos LOW. El MED de nombre dedicado `engine.test.ts` es consultivo: la regla nueva del motor se ejerce directamente en `reglas-fabricacion.test.ts` y su conexión con las cinco tipologías se comprueba en `cotizar-materiales-abiertos.test.ts`. Los demás avisos son latencia de suites del optimizador. Cierre: cero códigos pendientes y cero cotizaciones temporales de QA restantes.
