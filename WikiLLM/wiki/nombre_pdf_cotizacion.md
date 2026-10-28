# Nombre del PDF de cotización

La ruta `/cotizaciones/[id]/imprimir` sugiere `Cotización Nombre del proyecto AAAA-MM-DD.pdf` al guardar como PDF desde el navegador, en las plantillas general, [CEMA](plantilla_propuesta_cema.md) y [FIRPLAK](plantilla_propuesta_firplak.md).

El componente cliente `PrintDocumentTitle` establece `document.title` y actualiza la fecha en `beforeprint`, tanto para el botón de impresión como para Ctrl+P. Usa el día local de generación, no la fecha de creación de la cotización ni la fecha editable de la propuesta. Sustituye caracteres no válidos para archivos por espacios y utiliza «Proyecto sin nombre» si falta el nombre. El navegador añade la extensión PDF. Al desmontarse, restaura el título anterior y retira el evento.
