# Ordenar secciones completas de una cotización

## Interacción

Cada cabecera de sección (cocina, closet, baño o cualquier nombre) tiene un asa `⋮⋮` y flechas arriba/abajo, siguiendo el patrón de los muebles dentro de una sección. El asa inicia el arrastre; al pasar por otra sección se resalta su contenedor y al soltar se mueve el bloque completo a esa posición. Las flechas sirven también con teclado y en pantallas táctiles. Los extremos y las cotizaciones con una sola sección deshabilitan los movimientos imposibles.

El orden se refleja inmediatamente y se guarda automáticamente. Durante la petición se bloquean nuevos movimientos de secciones y se muestra el estado. Ante un fallo se restaura el último orden visible, se comunica el error y se refrescan los datos; no se confirma un guardado fallido. Se conserva el estado de los editores porque las tarjetas mantienen su ID como clave. El arrastre de muebles internos sigue independiente, usando un tipo DataTransfer diferente al de secciones (`application/x-cotizador-seccion`).

## Persistencia y permisos

- `CotizacionDetalleClient.tsx` gestiona orden optimista, arrastre, flechas, reversión y estado de guardado; `CocinaCard.tsx` coloca los controles junto al nombre mediante `controlesOrden`.
- `reordenarCocinasAction` invalida detalle e impresión tras guardar. `reordenarCocinas` realiza una sola RPC y rechaza IDs repetidos antes de consultar.
- La migración `0235_reordenar_secciones_cotizacion.sql` añade `cot_reordenar_cocinas`: SECURITY INVOKER, RLS y comprobación explícita de propietario/admin (o service_role de scripts). Bloquea la cotización y sus secciones durante la operación; exige la permutación completa de los IDs actuales, sin ausentes, duplicados, nulos ni secciones de otro proyecto. Una lista obsoleta se rechaza antes de escribir.
- Una sola sentencia actualiza exclusivamente `cot_cocinas.orden` a posiciones contiguas desde cero. No recalcula módulos ni totales. Los registros cuyo orden ya coincide no se actualizan: la segunda pasada es idempotente.
- `getCotizacion` ya ordena las secciones por `orden`: detalle, listas de selección, resumen PDF y exportación Excel consumen ese orden persistido. El schedule agregado por SKU conserva su agrupación propia. Los snapshots de versiones conservan el orden de sus secciones y las copias siguen insertándose después del origen.

## Verificación 2026-11-04

- Migración aplicada. `db/tests/reordenar_secciones.sql` ejecutado con fixtures transaccionales y RLS: normalización, orden inverso, idempotencia, rechazo de listas incompletas/repetidas/nulas/ajenas, usuario no autorizado y conservación íntegra de líneas/importes. Finaliza con ROLLBACK y no usa secciones reales como fixtures.
- `tests/cotizaciones.test.ts`: una RPC, parámetros correctos, rechazo previo de duplicados, propagación de errores y ausencia de llamadas al motor. Gate final: 92 suites, exit 0, sin deuda nueva. `quality:learn -- --strict`: cero HIGH. Los avisos MED de cobertura por nombre de archivo pertenecen a cambios anteriores de CEMA/cotizar, cubiertos por sus pruebas reales; el resto son avisos de latencia del optimizador.
- Chrome local con Playwright (Browser plugin no disponible), escritorio 1440 × 1000 y vista móvil 390 × 844: nueve secciones de Casa A; flechas, teclado, arrastre nativo entre secciones largas, persistencia en recarga y fallo de red provocado con reversión al orden anterior. El gesto nativo debe iniciar el movimiento antes de desplazar el viewport al destino; se verificaron eventos dragstart/drop reales.
- Las 67 líneas completas de la cotización, sus materiales y sus precios, y los totales COP/USD se compararon antes/después sin diferencias. Respaldo de prueba: `cotizador-orden-secciones-respaldo.json` en el directorio temporal. Se restauraron el orden y la plantilla originales al finalizar.
- Dos generaciones de Guardar e imprimir desde cargas independientes: resumen con el orden elegido, texto idéntico y siete páginas en cada PDF. Se extrajo texto con pypdf y se renderizaron todas las páginas con PDFium para revisión. La exportación Excel conserva el orden por su recorrido de `getCotizacion`, verificado en código. Alcance visual: entorno local, sin despliegue remoto ni impresión física.

Relacionados: [copiar secciones](copiar_seccion_cotizacion.md), [agrupación de módulos](plan_agrupacion_modulos.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).


## Registro de Supabase para publicación (2026-11-04)

La migración 0235 se aplicó y registró con `scripts/apply-migration.mjs` en el proyecto configurado; se repitió la prueba SQL transaccional de ordenación con resultado correcto. Suite de release `quality:gate:full`: 92 suites, exit 0.
