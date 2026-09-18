# Versiones de cotizaciones

## Propósito

El historial de versiones permite conservar puntos de retorno manuales de una cotización y restaurarlos sin perder definitivamente el estado que se reemplaza. Las versiones son inmutables y se numeran de forma consecutiva por cotización.

## Modelo de datos

La migración `0024_versiones_cotizacion.sql` crea `cot_cotizacion_versiones` con:

- `cotizacion_id` y `numero` como identidad lógica única de la versión.
- `nombre` opcional para describir el hito guardado.
- `snapshot` JSONB con `schema_version`, cabecera, cocinas, grupos y líneas.
- `creada_por` y `created_at` para auditoría.

La tabla se elimina en cascada con su cotización. RLS permite lectura a usuarios autenticados y creación únicamente al propietario del proyecto o a un administrador.

## Operaciones transaccionales

- `cot_guardar_version`: bloquea la cabecera de la cotización, asigna el siguiente número y captura el agregado persistido completo.
- `cot_restaurar_version`: valida propiedad y formato, guarda automáticamente el estado actual y sustituye cabecera, cocinas, grupos y líneas dentro de la misma transacción. Conserva el ID, propietario y fecha original de creación de la cotización.

El respaldo automático se nombra `Respaldo automático antes de restaurar vN`, por lo que cualquier restauración puede revertirse desde el mismo historial.

## Integración de aplicación

`src/lib/cotizaciones.ts` expone listado, guardado y restauración. Las Server Actions revalidan el detalle y la lista de cotizaciones. `VersionesCotizacion.tsx`, disponible junto a las opciones de exportación, permite crear una versión con nota opcional, consultar el historial y restaurar con confirmación explícita.
