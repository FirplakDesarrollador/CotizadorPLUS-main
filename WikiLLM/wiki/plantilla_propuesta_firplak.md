# Plantilla de propuesta FIRPLAK

La ruta `/cotizaciones/[id]/imprimir` selecciona automáticamente esta plantilla cuando `cot_cotizaciones.cotizador_por = 'FIRPLAK'`. El documento se reconstruyó a partir de `FPK cotizacion.xlsx`, principalmente de las hojas `Resumen`, `Muebles` y `Tabla`.

## Datos automáticos

Se cargan desde la cabecera: proyecto, constructora, comprador, referencia y fecha. Desde las cocinas y líneas se calculan tipología, cantidad, valor unitario y total con herrajes, y se consolida la programación por SKU. Solo los módulos entran en muebles y programación; los artículos de **Agregar herrajes/otros** se detallan con cantidades y valores en su sección propia. El total reúne ambos conceptos una sola vez.

## Datos editables y persistencia

El panel permite completar dirección, vigencia, pagos, plazo, alcance, embalaje, exclusiones y condiciones adicionales. Se guardan en `cot_cotizaciones.plantilla_firplak` (migración `0178_cotizaciones_plantilla_firplak.sql`). Los materiales y cantos se obtienen exclusivamente de **Características del proyecto** y del catálogo: referencia, sustrato, espesor, color y proveedor. Los antiguos textos editables de construcción no determinan las especificaciones impresas. “Guardar e imprimir / PDF” persiste primero y después abre el diálogo de impresión.

## Composición

Incluye resumen comercial, especificaciones de materiales reales por familia, herrajes incorporados, herrajes/otros adicionales, términos y programación de módulos. Los recursos originales reutilizados viven en `public/firplak-template/`. “Volver” retorna al detalle en la misma pestaña y usa la ruta directa como respaldo. La palabra **closet** en el nombre del área da prioridad a los materiales de Closet/Walk-in closet para todos sus módulos. Consultar el [protocolo de verificación y reparación histórica](protocolo_pdf_cotizaciones.md).

La barra superior conserva las mismas tres acciones de CEMA: **Volver**, **Guardar** y **Guardar e imprimir / PDF**. Los controles permiten salto de línea para que ninguno quede recortado en ventanas angostas.


## Programación opcional (2026-11-04)

El interruptor situado antes del listado guarda `showModuleSchedule` en la plantilla. Predeterminado ON; OFF elimina por completo la página de programación al imprimir, sin afectar importes ni resumen. Ver [reglas y evidencia](inferiores_b_ow_mo_programacion_pdf.md).

## Pie del resumen comercial (2026-11-13)

El pie de la tabla **Resumen de la cotización** muestra solo **Subtotal muebles con herrajes incorporados** y el total (con IVA cuando aplica). Se retiró la fila intermedia “Herrajes / otros adicionales (ver detalle)”. Los artículos de **Agregar herrajes/otros** siguen con cantidades y valores en su sección propia, y el total los sigue incluyendo una sola vez.

## Versión en inglés (2026-11-13)

Con `lang=en` (botón **Print / PDF (English)**) la plantilla imprime todos sus textos en inglés y usa los campos `*En` de la plantilla para embalaje, exclusiones, alcance y condiciones adicionales. Ver [propuesta en inglés](propuesta_ingles.md).
