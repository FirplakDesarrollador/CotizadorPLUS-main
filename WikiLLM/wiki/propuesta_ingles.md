# Propuesta impresa en inglés

El detalle de la cotización tiene dos botones de impresión: **Imprimir / PDF** (español) y **Print / PDF (English)**. Los dos abren `/cotizaciones/[id]/imprimir` con las mismas columnas de precio; el inglés añade `lang=en`. La ruta elige la plantilla igual que siempre (FIRPLAK, CEMA o general) y le pasa `idioma`.

## Qué se traduce

- **Textos fijos de la plantilla.** En FIRPLAK, un diccionario `TEXTOS.es/en` dentro de `FirplakPrintEditor.tsx` cubre encabezados, resumen, términos, herrajes y programación. La versión en español no cambia. CEMA ya estaba escrita en inglés; con `lang=en` solo se traducen sus bloques compartidos. La plantilla general traduce encabezados, columnas y totales.
- **Descripciones y anotaciones** de líneas, programación de módulos, nombres de herrajes del catálogo y material suelto: `traducirTexto` de `src/lib/propuesta-ingles.ts`.
- **Especificaciones de materiales:** `traducirEspecificaciones` traduce títulos de familia, filas por rol y valores fijos ("No configurado", "Sin canto…", sustrato Estandar/RH). Códigos, colores y proveedores son referencias comerciales y se conservan.
- **Números y pago:** `inWordsAndDigits` ("ninety (90)") y `paymentTerms` ("50% deposit and 50% balance prior to shipment"). El IVA se rotula VAT; en COP los importes usan formato `en-US` ("COP 223,479,783").
- **Título del archivo:** `Quote <Proyecto> <fecha>.pdf`.

## Glosario

La traducción usa un glosario de ebanistería, no un servicio automático. Las frases largas se aplican antes que las palabras sueltas: "mueble inferior" → *base cabinet* antes que "mueble" → *cabinet*. Se respetan los límites de palabra y las mayúsculas, y los contadores generados se traducen con singular/plural ("1 puerta(s)" → *1 door*). Términos clave:

| Español | Inglés |
|---|---|
| Mueble superior / inferior | Wall cabinet / Base cabinet |
| Puerta, gaveta/cajón, entrepaño | Door, drawer, shelf |
| Zócalo, relleno/filler, panel | Toe kick, filler, panel |
| Caja, refuerzo, espaldar/fondo | Cabinet box, rail, back panel |
| Canto, tablero | Edge banding, board |
| Herrajes, bisagra, riel, pata | Hardware, hinge, drawer slide, leveling leg |
| Lavaplatos, lavavajillas, nevera, horno, extractor | Sink, dishwasher, refrigerator, oven, range hood |
| Constructora, comprador | General contractor, buyer |
| Anticipo, saldo, despacho | Deposit, balance, shipment |
| Programación de módulos | Cabinet schedule |

Las palabras que no están en el glosario (nombres de áreas, códigos, medidas) se dejan tal cual. El orden de las palabras sigue al original, así que anotaciones largas pueden quedar con sintaxis española ("Base cabinet Sink"). Para ampliar el glosario, se agrega la entrada en `GLOSARIO` con su caso en `tests/propuesta-ingles.test.ts`.

## Textos editables

`FirplakTemplate` guarda versiones en inglés de los textos libres: `deliveryScopeEn`, `packagingNotesEn`, `exclusionsEn` y `additionalTermsEn`, con valores por defecto en inglés. En la vista inglesa, "Editar información de la propuesta" edita esos campos; la española sigue editando los suyos. Van en el mismo JSON `plantilla_firplak` y no requieren migración: `normalizarFirplakTemplate` completa los valores por defecto en plantillas antiguas.

Ver [plantilla FIRPLAK](plantilla_propuesta_firplak.md) y el [protocolo de PDF](protocolo_pdf_cotizaciones.md).
