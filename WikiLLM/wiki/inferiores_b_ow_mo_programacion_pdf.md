# Inferiores B, material OW-MO y programación opcional

## Código comercial de inferiores B

`codigoComercial` (`src/lib/module-groups.ts`) añade después del largo las dimensiones no estándar de los prefijos que empiezan por B, antes de los sufijos de tipología, sistema o espesor. El alto estándar es 30 pulgadas / 76.2 cm. Las profundidades 24 pulgadas / 60.96 cm y 60.9 cm se consideran estándar. Cada dimensión se compara independientemente, convertida a cm; se tolera únicamente 0.001 cm de error numérico. El formato final conserva el sistema métrico o las fracciones imperiales.

Ejemplos: BFD de 45 × 77 × 60 cm produce `BFD457760`; BFD de 24 × 31 1/2 × 25 pulgadas produce `BFD2431 1/225`. Con dimensiones estándar conserva solamente el largo. Los consumidores compartidos son simulador, formulario, recálculo persistido y HDR. Los códigos ya guardados se actualizan al recalcular sus líneas.

## Material OW-MO

`presetMaterialesTipologia` aplica el frente a caja y refuerzos de OW-MO, incluidas sus variantes sin fondo. El fondo usa la referencia del frente con el espesor sustituido por 6 mm, manteniendo proveedor, sustrato y color: `PRIRH15CONSTRUCTOR` → `PRIRH6CONSTRUCTOR`. Una variante sin fondo conserva la exclusión geométrica de esa pieza. La regla también se aplica al motor de cotización y a la selección por familia; un área closet conserva prioridad. Las especificaciones PDF explicitan el fondo de OW-MO como excepción al fondo general.

## Interruptor de programación FIRPLAK

En la vista imprimible, justo antes de la programación, **Mostrar programación de muebles en el PDF** controla `plantilla_firplak.showModuleSchedule`. Su valor predeterminado es true para compatibilidad histórica. Guardar y Guardar e imprimir persisten también false; al recargar se conserva la elección. OFF elimina del árbol la página completa con muebles, paneles y fillers de la programación: no quedan título, filas, aviso ni salto de página. El control es exclusivo de pantalla. El resumen económico y los totales siguen representando todos los muebles cotizados.

## Verificación inicial 2026-11-04

- Regresiones de dimensiones estándar/variables, sufijos y fracciones, selección OW-MO e integración con el motor real, normalización y serialización del interruptor. `quality:gate`: 92 suites, exit 0, sin incrementar deuda. `quality:learn -- --strict`: cero HIGH; tres avisos de latencia del optimizador (un MED y dos LOW).
- Browser plugin no disponible; verificación con Playwright y Chrome local, 1440 × 1000. Guardar e imprimir, recargar y comprobar persistencia ON/OFF en KUNDARA y Milán Closet; sin errores de ejecución. Se restauraron las plantillas originales al terminar.
- Ocho PDF: dos cargas y generaciones independientes por estado y proyecto. Texto idéntico por par, controles ausentes de impresión y título de programación presente únicamente en ON. KUNDARA: ON 10 páginas, OFF 5. Milán: ON 4, OFF 3. Texto extraído con pypdf y todas las páginas renderizadas con PDFium para revisión visual. Sin página residual al apagar. Alcance: Chrome local; no despliegue remoto ni impresión física.
- Auditoría de solo lectura: cero referencias faltantes, grupos inválidos o errores de conciliación; cuatro módulos históricos difieren de la nueva regla de materiales (Entrevillas 1, KUNDARA 2, Condominio V 1). No se migraron sus materiales, precios ni códigos persistidos. Adoptan las reglas al recalcular/sincronizar. Esta diferencia histórica impide afirmar una auditoría estricta global con cero pendientes.

Relacionados: [materiales abiertos](materiales_tipologias_abiertas.md), [plantilla FIRPLAK](plantilla_propuesta_firplak.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).


## Aplicación a cotizaciones existentes y pestañas (2026-11-04)

El usuario autorizó explícitamente aplicar con respaldo los cambios a los datos existentes, tras el rechazo inicial de la revisión automática. Se corrigieron cuatro OW-MO: Condominio V (1), KUNDARA (2) y Entrevillas (1), con recálculo limitado de sus grupos y totales. También se actualizaron 44 códigos de línea y 34 de grupo en cinco proyectos: MALECÓN 72 (33 líneas), Entrevillas (3), Condominio V (4), ELEVEN (2) y KUNDARA (2). La actualización de nombres usa `scripts/actualizar-codigos-cotizaciones.ts`; no recalcula precios.

Respaldos en el directorio temporal del sistema:

- Materiales: `cotizador-respaldo-abiertos-1793803561835.json`.
- Códigos: `cotizador-respaldo-codigos-1793803583940.json`.
- Condominio V recibió guardados posteriores incompatibles durante la comprobación, que alteraron el OW-MO y devolvieron cuatro nombres al formato anterior. El usuario confirmó que no lo estaba editando. No se atribuye una causa sin evidencia. Se reaplicaron solamente las reglas de ese OW-MO y sus nombres, preservando las demás selecciones actuales. Nuevos respaldos: `cotizador-respaldo-abiertos-1793804039140.json` y `cotizador-respaldo-codigos-1793804164771.json`. Las versiones históricas permanecen intactas.

La auditoría final estricta lee las 11 cotizaciones actuales y obtiene cero diferencias de materiales, referencias faltantes, grupos inválidos o errores de conciliación. Las simulaciones posteriores de materiales y nombres no proponen ninguna escritura (idempotencia). Comparación independiente con el último respaldo de códigos: importes de las 705 líneas conservados. Estos resultados sustituyen los cuatro pendientes de la verificación inicial.

### Pestañas y pruebas

- **Simulador**: selectores y precio usan el mismo preset efectivo; caja/refuerzo derivados quedan deshabilitados, se ofrece frente aunque el mueble no tenga puertas, y el fondo de OW-MO se deriva y deshabilita. Los títulos de un combinado resuelven el espesor del preset de cada miembro. Prueba real de cambiar frente de PRIRH15CONSTRUCTOR a PRIRH18CONSTRUCTOR: caja/refuerzo de 18 y fondo PRIRH6CONSTRUCTOR. BFD de 45 x 77 x 60 cm: código BFD457760.
- **Cotizaciones**: nombres persistidos corregidos; el editor también bloquea el fondo derivado de OW-MO. Guardar y sincronizar resuelven los materiales en servidor. Prueba de sincronización OW-MO y segunda pasada sin cambios en `tests/cotizaciones.test.ts`.
- **HDR**: el buscador calcula el sufijo de espesor con los materiales efectivos del tipo; las cotizaciones cargan sus nombres corregidos y se recalculan con el motor vigente.
- **Optimizador**: consume HDR; se cargó Entrevillas con 11 módulos, 105 piezas y fondo PRIRH6CONSTRUCTOR. No se alteraron parámetros de planta ni se ejecutó una nueva optimización de producción.
- **PDF**: interruptor persistente en FIRPLAK y ahora también CEMA (`plantilla_cema.showModuleSchedule`). CEMA renumera las secciones posteriores cuando se oculta el schedule para no dejar un hueco. Las plantillas antiguas continúan en ON.

Se abrieron detalle e impresión de las 11 cotizaciones en Chrome local sin errores de ejecución ni overlay de Next. Browser plugin no disponible: Playwright. Dos generaciones independientes por estado y proyecto, 12 PDF: KUNDARA 10/5 páginas ON/OFF, Milán 4/3 y CEMA BEACON HILL 7/6. Se verificó guardado, recarga, texto idéntico entre pares, ausencia del control impreso y ausencia del schedule en OFF; se renderizaron todas las páginas con PDFium y se revisaron los mosaicos. Las plantillas comerciales originales se restauraron al finalizar las pruebas.

Gate final: 92 suites, exit 0, sin nueva deuda de tipos o lint. La auditoría consultiva no tiene HIGH; el MED de CEMA por ausencia de un archivo `cema-template.test.ts` es una heurística de nombre, con regresión real en `tests/firplak-template.test.ts` y prueba de guardado/recarga en navegador. Los demás avisos son latencia preexistente del optimizador. Alcance visual: Chrome local de escritorio; no se verificó ni desplegó una URL remota.


## Extensión posterior de fondos

La selección de fondo del color del frente se extendió de OW-MO a todos los abiertos de la excepción. Consultar [regla y evidencia actualizadas](fondos_color_abiertos.md), incluidas las diferencias concurrentes de Condominio V que impiden considerar vigente la anterior auditoría global sin pendientes.
