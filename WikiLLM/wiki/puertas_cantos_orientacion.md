# Puertas, orientación de frentes y cantos de carcasa

## Reglas y origen de las diferencias

Para las familias que distinguen una/dos puertas por ancho, el umbral es **24″ = 609,6 mm = 60,96 cm**. Las reglas antiguas `L <= 21` dejaban el intervalo 21–24 al fallback; se normalizan a `L < 24`. El motor convierte las tres unidades a pulgadas. Se conservan las cantidades fijas de otras familias y las elecciones explícitas.

Los ejes de montaje del frente son ancho en `formula_largo`, alto en `formula_ancho`. `orientarPieza` presenta **Largo = alto** en simulador y HDR, sin ordenar por tamaño. Algunas plantillas tenían altura en el primer eje y la presentación volvía a invertirlas: con alto de 120 cm y luz de 3,2 mm deben verse 119,68 cm en Largo.

La migración 0248 intercambia solo fórmulas realmente invertidas de las familias auditadas. El intercambio general previo de Antigravity había invertido también el frente de gaveta BOMH de alto constante (332,8 mm); la condición por ejes lo corrige sin deshacerlo al repetirse. No cambia descuentos geométricos ni reglas de gola.

Base, tapa, refuerzos y golas llevan canto solo en largos, con cero en anchos. Si solo existía canto en anchos, su cantidad pasa a largos. Se conservan calibre y propiedades. Laterales, entrepaños y gavetas mantienen sus reglas; `base_gaveta` no se confunde con base de carcasa.

`normalizarPlantillasFabricacion` y `normalizarReglasPuertas`, en `src/lib/reglas-fabricacion.ts`, aplican esas convenciones en `prepararCotizacion`, compartido por simulador, cotizaciones, HDR y optimizador. Son inmutables e idempotentes. El recálculo conserva metadatos históricos y no agrega selecciones nulas antes ausentes.

## Aplicación y evidencia del 2026-11-06

- Migración 0248 registrada en Supabase. Repetición dentro de una transacción revertida: cero cambios en plantillas y reglas.
- Se usaron las funciones reales `recalcularGrupo` y `recomputarTotales`, primero en memoria y luego en una transacción con bloqueo de filas y comparación de `updated_at`. Respaldo previo: `cotizador-fabricacion-1794023188229.json`, en el temporal del sistema. No se replicó el motor.
- Doce cotizaciones, 793 grupos y 1.045 líneas revisados. Comparación estricta contra el respaldo: 220 adicionales y configuraciones globales intactos. Dimensiones, cantidades, notas, agrupación, materiales, cantos elegidos y herrajes conservados. Los precios reflejan el consumo de cantos corregido.
- Única selección modificada, confirmada por el usuario: BFD de 43 cm de Casa A pasa de dos a **una puerta**. PC de 84 cm de Casa Poro conserva **cuatro**, dos superiores y dos inferiores.
- Segunda corrida completa del motor: cero actualizaciones pendientes. Auditoría de propuestas: cero diferencias de materiales, referencias, grupos o conciliación dentro de la tolerancia de moneda.
- Catálogo de 126 tipologías: 20 familias con umbral, 180 combinaciones de unidad/ancho alrededor de 609,6 mm y 372 plantillas de carcasa comprobadas, sin errores. Regresiones en `tests/fabricacion-puertas-cantos.test.ts` y `tests/cotizaciones.test.ts`; no se relajaron aserciones existentes.
- Chrome autenticado local: Casa A carga 39 líneas de módulos y excluye 17 adicionales en HDR y optimizador. Sin errores de consola/página. Browser plugin no disponible; se usó Playwright existente. Dos cargas y ejecuciones independientes de Guardar e imprimir generaron PDF de ocho páginas, texto idéntico y páginas renderizadas revisadas. No implica despliegue remoto ni impresión física.

Control final: `quality:gate` aprobado con 122 suites y exit 0, sin aumentar la deuda. `quality:learn -- --strict` sin hallazgos HIGH; los avisos restantes son latencias de pruebas del optimizador. Cambios de código locales en LIz, sin commit ni publicación en esta continuación.

Evidencias locales: `.tmp/antigravity-integridad.json`, `.tmp/antigravity-postflight.txt`, `.tmp/antigravity-matriz.json`, `.tmp/antigravity-browser.json`, `.tmp/antigravity-auditoria-propuestas.txt`, `.tmp/antigravity-quality-gate-final.txt`.

Relacionados: [material suelto](lineas_material_suelto.md), [reglas de fabricación](reglas_fabricacion_y_edicion_individual.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).
