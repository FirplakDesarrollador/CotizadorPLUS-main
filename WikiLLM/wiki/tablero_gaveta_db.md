# Tablero Gaveta de 15 mm en la familia DB

## Alcance y cálculo

Todas las tipologías cuyo prefijo sea DB o comience por DB-, incluidas SM,
SM-SF, SMG y subtipologías, asignan `base_gaveta`,
`trasero_gaveta_pequena` y `trasero_gaveta_grande` al rol `gaveta`.
La migración 0243 actualiza las plantillas y el preparador aplica la misma
regla como defensa ante cachés antiguos. No modifica las fórmulas geométricas.
El motor rechaza cualquier tablero de ese rol cuyo espesor real no sea 15 mm.
Su área, desperdicio, cantos y costo se suman mediante el mismo recorrido de
materiales; no se añaden otra vez como costo adicional.

## Selección y persistencia

Simulador y editor de módulo muestran **Tablero Gaveta (15 mm)**, con catálogo
filtrado por espesor. Características del proyecto y proyecto nuevo lo incluyen
en cada familia de materiales, respetando la prioridad de las áreas closet.
Se guarda en `preset.gaveta`, tanto del proyecto como de la línea.
Una selección individual se conserva al leer y recalcular; modificar los
materiales globales aplica el material global a sus módulos. Las especificaciones
PDF muestran la referencia real. El rol nuevo no genera cambios ficticios en
módulos ajenos a DB.

Rieles y barras se eligen en desplegables del catálogo activo por categoría,
incluidos Slim Box Alto/Bajo. Los formularios nuevos no preseleccionan referencia.
Cuando un herraje tiene cantidad positiva debe elegirse o excluirse.
Los códigos elegidos se guardan como `rielCodigo` y `barraCodigo`, y el cálculo
usa su código y precio reales; ya no sustituye solo la tarifa de RIELTANDEM.
Las exclusiones por rol se conservan. DB-FE y sus variantes mantienen RIELFE500
sin barras, por confirmación del usuario.

Los alias históricos de tablero se resuelven contra el catálogo antes de
calcular, evitando que el preset inicial del simulador falle por referencias
como CANDELARIA (POLAR) cuyo nombre vigente tiene otro formato.

## Aplicación y verificación: 2026-11-06

Se aplicó 0243 y se configuraron las 12 cotizaciones actuales, recalculando
39 módulos DB. Se conserva la caja si tiene 15 mm; para 18 mm se usa su
equivalente exacto. Excepciones indicadas explícitamente por el usuario:

- CHIRHCARB18BLANCO AMERICANO EXPO 124 → CHIRHCARB15BLANCO AMERICANO.
- PRIST18COLOR TENDENCIA → PRIST15TENDENCIA.
- PRIRH6CONSTRUCTOR → PRIRH15CONSTRUCTOR para el nuevo rol de gaveta.

El sincronizador hace preflight de todos los grupos, respalda proyectos,
líneas, áreas y grupos antes de escribir y acepta equivalencias explícitas.
Respaldo de esta aplicación: `cotizador-gavetas-1793984677574.json` en TEMP.
No cambia los materiales de caja, frentes o fondo por esas equivalencias.

`auditar-tablero-gaveta.ts` revisó 30 tipologías, 68 filas de plantilla y 80
filas efectivas de piezas en los 39 módulos: cero errores. Las auditorías de
precios/herrajes y propuestas no encontraron diferencias de costos, referencias,
materiales o totales. La prueba Playwright (Browser plugin no disponible)
creó un módulo en simulador, cambió material/riel/barra en una copia temporal
de cotización y verificó el guardado y la recarga; la copia se eliminó.
Se generaron dos PDF independientes por KUNDARA y Milán: texto idéntico entre
pasadas, revisión visual de todas las páginas; 10 y 5 páginas respectivamente.

Cierre: `quality:gate` aprobó 105 archivos de pruebas sin regresiones y
`quality:learn -- --strict` terminó con cero HIGH. Las pruebas directas del
preparador están en `tests/cotizar.test.ts`; incluyen rechazo de espesor inválido,
referencia y precio de riel/barra, exclusiones y la excepción FE.
La comparación contra el respaldo conserva las 12 cotizaciones y 1051 líneas,
sus cantidades, dimensiones y preferencias de herrajes: solo 39 breakdowns
cambiaron. La versión 10 del almacenamiento del simulador descarta resultados
anteriores y conserva módulos y borradores para recalcular con la regla nueva.

Relacionados: [DB-FE](db_fe.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).
