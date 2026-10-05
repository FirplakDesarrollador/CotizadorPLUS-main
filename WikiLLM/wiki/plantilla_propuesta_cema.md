# Plantilla de propuesta CEMA

## Fuente y estructura

La referencia `CEMA cotizacion.pdf` contiene ocho páginas: portada, resumen de
alcance e hitos comerciales, estándar de gabinetes, schedule de SKU,
especificaciones técnicas, mesones y dos páginas de términos. La implementación
web conserva esa jerarquía en seis hojas imprimibles, combinando las secciones
técnicas y los términos para evitar páginas con contenido residual.

## Selección automática

`/cotizaciones/[id]/imprimir` consulta `cot_cotizaciones.cotizador_por`. Para
`CEMA` renderiza `CemaPrintEditor`; para `FIRPLAK` conserva el informe tabular
existente. El botón “Imprimir / PDF” no necesita parámetros de plantilla.

## Datos automáticos

- Proyecto, constructora (`Prepared for`) y comprador/contacto provienen de la cabecera.
- Fecha inicial proviene de `created_at`; código de cotización o UUID corto alimenta la referencia.
- Cantidad de cocinas suma `cot_cocinas.cantidad`.
- Schedule consolida `codigo_modulo`, descripción y cantidad, incluyendo el multiplicador de cocina.
- Total contractual usa `total_usd`; gabinetes es total menos el valor editable de mesones.

## Datos editables y persistencia

La migración `0177_cotizaciones_plantilla_cema.sql` añade `plantilla_cema jsonb
not null default '{}'`. El editor permite completar dirección, referencia,
fecha, base y vigencia; baños, valor de mesones e hitos de pago/plazo; acabados
de puertas; especificación de mesones; aviso arancelario y términos adicionales.
“Guardar” persiste sin imprimir y “Guardar e imprimir / PDF” persiste antes de
invocar el diálogo nativo. La Server Action usa el cliente autenticado y las
políticas RLS existentes de `cot_cotizaciones`.
“Imprimir / PDF” abre la plantilla en la misma pestaña. El botón “Volver” usa el
historial para regresar al detalle y conservar la posición previa; si la
plantilla fue abierta directamente, navega a `/cotizaciones/[id]` como respaldo.

## Archivos principales

- `src/lib/cema-template.ts`: contrato, valores predeterminados y normalización.
- `src/app/cotizaciones/[id]/imprimir/CemaPrintEditor.tsx`: editor y documento.
- `src/app/cotizaciones/[id]/imprimir/page.tsx`: selección automática y datos derivados.
- `src/app/cotizaciones/actions.ts`: guardado autenticado.

La migración 0177 fue aplicada al Supabase conectado el 2026-10-04 y se verificó
la columna obligatoria con default `{}`.
