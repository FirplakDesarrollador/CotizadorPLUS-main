# Materiales delgados sin canto

## Regla de fabricación

Las piezas cuyo **material real de catálogo** tenga espesor **4,5 / 5,5 / 6 / 9 mm** no llevan canto: cero aristas en ambos ejes, calibre nulo, sin longitud, merma, renglón de consumo ni costo de canto. La regla prevalece sobre `forceCalibre`, `despEdges`, canto de caja/frente y canto de frente en abiertos. No modifica geometría, área de madera, cantidades ni herrajes. Los espesores de 15 y 18 mm conservan sus reglas. El rol independiente de gaveta sigue exigiendo 15 mm: la regla no habilita un material delgado en ese rol.

La raíz del problema era que el motor aceptaba el calibre heredado de la plantilla sin excluir tableros delgados. Incluso con cero aristas reportaba el calibre, como el respaldo de 6 mm del WLD, y otras piezas podían sumar consumo/costo. `noLlevaCanto`, en `src/lib/cantos.ts`, comprueba el espesor antes de resolver cualquier calibre o acumular consumos en `calcularMueble`. El espesor depende del tablero efectivamente asignado al rol, no del nombre de la pieza ni del código del material. No se elimina el canto de una plantilla reutilizable que también puede fabricarse en 15/18 mm.

## Cobertura

- Simulador, cotizaciones, agrupaciones, HDR y proyecto actual del optimizador comparten el motor.
- HDR y Excel continuo limpian calibre/contadores al presentar un resultado histórico de material delgado, sin modificar el snapshot original.
- Las especificaciones impresas indican `Sin canto (tablero de … mm)` cuando una selección de calibre no aplica al material real, sin alterar la selección original guardada.
- `cumpleReglaCantosDelgados` permite a la sincronización detectar un breakdown antiguo aunque el preset no haya cambiado; restaurar una versión utiliza esa sincronización y recalcula el resultado vigente. Los archivos históricos de versiones no se reescriben.
- Caché de simulador v13: conserva medidas, notas y selecciones; descarta resultados calculados con reglas anteriores.

## Aplicación del 2026-11-07

Se recalcularon las doce cotizaciones existentes usando las funciones reales del proyecto, con preflight en memoria y aplicación transaccional protegida por `updated_at`. Respaldo previo en el temporal del sistema: `cotizador-fabricacion-1794051621019.json`. Se revisaron 805 grupos y 1.054 líneas. La comparación estricta confirmó configuraciones globales e individuales, geometría de piezas, madera y herrajes intactos; 217 adicionales sin cambios. Cambian únicamente cantos y sus importes derivados.

Auditoría posterior de piezas actuales por material real: 34 renglones de 4,5 mm y 222 de 6 mm, cero incumplimientos. No hay piezas actuales asignadas a 5,5/9 mm; se verifican mediante regresiones. Segunda corrida completa: cero actualizaciones pendientes. Auditoría de propuestas: cero diferencias de materiales, referencias, grupos o conciliación. El guardado existente del optimizador fue auditado y no contiene piezas delgadas con canto histórico; no se modificó.

Pruebas: `tests/cantos-espesores-delgados.test.ts` cubre espesores, roles, overrides forzados, ausencia de costos y conservación de 15/18 mm; `tests/cotizaciones.test.ts` comprueba sincronización idempotente de un respaldo antiguo; `tests/simuladorStore.test.ts` comprueba migración desde v12 sin pérdida de entradas.

Chrome local autenticado (Playwright existente; Browser plugin no disponible): WLD 43 × 120 × 40 cm sin calibre ni aristas en BACKING de 6 mm; Excel descargado/reabierto y PDF real exportado. Dos cargas/guardados/impresiones independientes de Edificio Santa Bárbara se comparan por texto y páginas renderizadas. Las verificaciones no implican despliegue remoto ni impresión física.

Cierre: los dos PDF tienen cuatro páginas y texto idéntico, con `Sin canto (tablero de 6 mm)` en sus especificaciones. `quality:gate` aprobó 124 archivos y 754 pruebas, exit 0. `quality:learn -- --strict` no dejó HIGH; la cobertura del helper está en `tests/cantos-espesores-delgados.test.ts` y la sincronización en `tests/cotizaciones.test.ts`, aunque el detector sugiera un nombre de test idéntico al módulo. No se modificó baseline ni WikiLLM/raw. Datos actuales recalculados en Supabase; cambios de código locales en LIz, pendientes de publicación.

Evidencias: `.tmp/cantos-delgados-browser.json`, `.tmp/cantos-delgados-integridad.json`, `.tmp/cantos-delgados-postflight.txt`, `.tmp/cantos-delgados-auditoria.txt`, `.tmp/cantos-delgados-wld.xlsx` y `.tmp/cantos-delgados-preflight-aplicar.txt`.

Relacionados: [HDR y Excel](hdr_excel_consolidado.md), [reglas de fabricación](reglas_fabricacion_y_edicion_individual.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).
