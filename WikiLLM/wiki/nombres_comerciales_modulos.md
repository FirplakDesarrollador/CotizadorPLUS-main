# Nombres comerciales, dimensiones y paneles PN

Reglas confirmadas el 2026-11-06. Código comercial y nombre descriptivo son campos separados: el código conserva medidas/material; las notas se incorporan al nombre del panel, no al identificador usado para agrupar.

## Dimensiones en el código

`codigoComercial` (`src/lib/module-groups.ts`) es la fuente compartida:

- Siempre incluye el largo.
- Completa alto y profundidad no estándar en todas las familias que antes los omitían. Referencia general de los formularios: 30 pulgadas de alto y 24 de profundidad. La línea U y Sink Vanity usan 28,75 pulgadas de alto. Torres sin altura fija incluyen la altura.
- Por decisión explícita del usuario se conservan las convenciones existentes de superiores W, torres y DFE, que ya muestran dimensiones incluso estándar. Tampoco se elimina el alto que ya forma parte del código TK.
- PN y F incluyen largo y alto; no incluyen profundidad. Para las variantes B se conserva la equivalencia histórica 60,9/60,96 cm de profundidad; DB distingue 60,9 de 60,96 cm.
- Las comparaciones se realizan convirtiendo medidas, con tolerancia de 0,001 cm. El formato final respeta el sistema comercial del proyecto; en el simulador y HDR por búsqueda respeta la unidad elegida: pulgadas → imperial, cm/mm → métrico. Se conservan las fracciones imperiales existentes.
- Alto/profundidad van después del largo y antes de variantes y espesores, sin duplicarlos. Ejemplo: DB de 65 × 78,5 × 61 cm → `DB6578.561-2S-SMG`.

Las llamadas históricas incompletas sin profundidad conservan sus formatos; los formularios y las líneas guardadas envían los tres ejes. No se cambia la geometría para construir un nombre.

## PN: material y descripción

- El código es PN + largo + alto. Solo añade **`-15MM` si el material de frente es de 15 mm**, independientemente del espesor elegido para caja. Nunca añade `-18MM`. Los segmentos heredados de gola/cajonera no tienen significado en una pieza PN y no se incorporan al código.
- La etiqueta de tipología es **`PN - Panel`**. Con una nota «lateral», el nombre descriptivo es **`PN - Panel lateral`**, manteniendo el código separado. Se elimina la descripción técnica anterior del nombre del panel; las medidas siguen en el código.
- `nombrePanel` normaliza espacios para mostrar el nombre y evita duplicar «PN - Panel» si la nota ya lo contiene. El texto original de `anotaciones` no se modifica ni corrige por inferencia.
- `descripcionConNotas` se usa en la tabla de cotización y Excel; el PDF no vuelve a añadir la misma nota. Los selectores de simulador, cotización y HDR comparten `etiquetaTipoModulo`.
- El simulador incorpora notas del panel, conservadas al copiar/editar y recargar. Los nombres individuales se muestran en sus tarjetas y resultado. HDR incorpora la descripción del panel y sus notas en el título y el PDF.
- La migración idempotente `0247_nombre_panel.sql` cambia únicamente el nombre de catálogo «Panel (Panel)» a «Panel».

## Evitar reaparición de nombres históricos

El problema original de HDR era usar el código almacenado aunque recalculara el despiece con dimensiones actuales. `getCotizacion` reconstruye los nombres en lectura desde medidas, tipología y espesor real del frente; también recompone los códigos de grupo. No modifica la BD, precios ni selecciones. Se pagan únicamente dos consultas ligeras de catálogo, paginadas para no truncar referencias.

Esta proyección alimenta cotizaciones, HDR desde proyecto, PDF, Excel y la extracción actual del optimizador. Permite leer una copia o versión restaurada que contenga códigos antiguos sin volver a mostrarlos incompletos. Los snapshots históricos inmutables de versiones/optimizaciones conservan su registro original; no se reescribe su JSON.

`prepararCotizacion` usa el mismo código con los indicadores reales de gola y cajones PCFD, para que el origen de las piezas del despiece tampoco omita variantes. El simulador pasa a almacenamiento v11: conserva módulos, medidas, materiales y notas, pero descarta resultados calculados antiguos para solicitar recalcular, en vez de recuperar etiquetas antiguas desde caché.

## Selecciones individuales en PDF

Si un PN usa frente de 15 mm y el frente global del proyecto es de 18 mm, la especificación impresa incluye un bloque **Selección individual · código · área** con la referencia y cantos elegidos para ese mueble. Los valores generales permanecen como selección del proyecto. Así el código `-15MM` y la referencia de material impresa no se contradicen.

## Aplicación y revisión extensiva

- Auditoría de doce cotizaciones. Primera pasada: 131 códigos de línea/grupo y 311 descripciones PN corregidos. Segunda pasada: 18 segmentos heredados de gola de PN eliminados. Las cifras son operaciones por pasada, no un conteo de filas distintas.
- `scripts/actualizar-codigos-cotizaciones.ts --apply` respalda y actualiza códigos, descripciones y grupos en una transacción con comparación optimista. No recalcula importes ni cambia notas/selecciones. Respaldos temporales `cotizador-respaldo-codigos-1794008250165.json` y `cotizador-respaldo-codigos-1794008376528.json`.
- Comparación de las 1.042 líneas previas al cambio: cero diferencias en medidas, cantidades, notas originales, configuración/materiales/cantos/herrajes y campos de costo/precio. Auditoría posterior: cero códigos, grupos o descripciones pendientes.
- Matriz con las 126 tipologías del catálogo, tres unidades y dos sistemas comerciales: 756 combinaciones sin errores de inclusión de dimensiones.
- Regresiones en `tests/nombres-modulos.test.ts`, prueba de lectura real y no mutación en `tests/cotizaciones.test.ts`, y migración del caché/notas en `tests/simuladorStore.test.ts`. Las aserciones anteriores no se debilitaron.

Relacionados: [reglas de fabricación y edición individual](reglas_fabricacion_y_edicion_individual.md), [descripción y despiece](descripcion_linea_vs_despiece.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).

### Cierre de verificación

Prueba autenticada completa aprobada en simulador, edición/recarga de cotización, HDR, Excel y dos generaciones independientes de PDF (cinco páginas cada una, texto idéntico y revisión renderizada). Se verificaron notas persistentes, sufijo según frente, bloque de selección individual y configuración global intacta; cero errores de consola. La cotización temporal de prueba se eliminó. Auditoría final de doce cotizaciones: cero nombres pendientes. `quality:gate` aprobó 120 suites con exit 0; `quality:learn -- --strict` reportó cero hallazgos HIGH. Evidencias locales en `.tmp/nombres-modulos-navegador.json`, `.tmp/nombres-modulos-gate-final.txt` y `.tmp/nombres-modulos-learn-final.txt`.
