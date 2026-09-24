# Sincronización de catálogo desde Mat_2309

El 2026-09-23 se tomó `Mat_2309.xlsx`, hoja `MATERIALES`, como fuente maestra
del catálogo de tableros `cot_tableros` en Supabase.

## Resultado

- 96 referencias válidas leídas; la fila marcadora `NA` se excluyó.
- 34 referencias ya coincidían antes de la carga.
- 6 referencias tenían precio, precio real, COP/m² o estado distinto.
- 56 referencias se incorporaron al catálogo.
- 8 referencias ausentes de la fuente se dejaron inactivas, no eliminadas, y
  no estaban usadas por un perfil de material activo.

La verificación posterior encontró 96 de 96 referencias fuente iguales en
`precio`, `precio_real`, `precio_m2` y `activo`; no quedaron referencias
externas activas.

## Operación reproducible

`scripts/sync-tableros.mjs [archivo.xlsx]` localiza los encabezados de la hoja
`Materiales`/`MATERIALES`, por lo que admite tablas que comiencen en la columna
A o B. Omite `NA`, hace upsert por `codigo` y desactiva lo que no aparece en el
archivo para preservar el histórico de cotizaciones.
