# Plantilla de propuesta FIRPLAK

La ruta `/cotizaciones/[id]/imprimir` selecciona automáticamente esta plantilla cuando `cot_cotizaciones.cotizador_por = 'FIRPLAK'`. El documento se reconstruyó a partir de `FPK cotizacion.xlsx`, principalmente de las hojas `Resumen`, `Muebles` y `Tabla`.

## Datos automáticos

Se cargan desde la cabecera: proyecto, constructora, comprador, referencia y fecha. Desde las cocinas y líneas se calculan tipología, cantidad, valor unitario y total con herrajes, y se consolida la programación por SKU. `config_default` se presenta como referencia de materiales configurados.

## Datos editables y persistencia

El panel permite completar dirección, vigencia, pagos, plazo, alcance, construcción de muebles, herrajes, embalaje, exclusiones y condiciones adicionales. Se guardan en `cot_cotizaciones.plantilla_firplak` (migración `0178_cotizaciones_plantilla_firplak.sql`). “Guardar e imprimir / PDF” persiste primero y después abre el diálogo de impresión.

## Composición

Incluye resumen comercial, especificaciones, herrajes con imágenes, embalaje con fotografías, términos y programación de módulos. Los recursos originales reutilizados viven en `public/firplak-template/`. “Volver” retorna al detalle en la misma pestaña y usa la ruta directa como respaldo.

La barra superior conserva las mismas tres acciones de CEMA: **Volver**, **Guardar** y **Guardar e imprimir / PDF**. Los controles permiten salto de línea para que ninguno quede recortado en ventanas angostas.
