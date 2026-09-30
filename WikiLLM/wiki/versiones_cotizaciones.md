# Versiones de cotizaciones

## Propósito

El sistema de versiones permite crear **manualmente** snapshots completos e inmutables de una cotización/proyecto y alternar libremente entre ellos. No existen autosaves ni respaldos automáticos: una versión únicamente se genera cuando el usuario presiona explícitamente "Guardar versión".

## Modelo de datos

La tabla `cot_cotizacion_versiones` almacena el historial persistente con:

- `id`: identificador único UUID de la versión.
- `cotizacion_id` y `numero`: identidad lógica única y numeración consecutiva por proyecto.
- `nombre`: texto obligatorio (hasta 120 caracteres) asignado manualmente por el usuario (ej. *Propuesta inicial*, *Alternativa 18 mm*).
- `snapshot`: objeto JSONB inmutable con `schema_version`, cabecera (incluyendo `config_default`, `sistema_medida`, totales, moneda, TRM y notas), cocinas (con cantidades), grupos de módulos (con etiquetas y códigos de grupo) y líneas (con despieces, descripciones, configuraciones completas de herrajes/frentes/cantos y breakdowns monetarios).
- `creada_por` y `created_at`: auditoría con marca temporal fidedigna del servidor.

RLS permite consulta a usuarios autenticados y creación únicamente al propietario del proyecto o administradores. No se permiten actualizaciones sobre versiones existentes, garantizando inmutabilidad histórica absoluta.

## Operaciones transaccionales

Las funciones RPC en PostgreSQL garantizan atomicidad (migración `0123_versiones_manuales_inmutables.sql`):

- `cot_guardar_version(p_cotizacion_id, p_nombre)`:
  - Valida que `p_nombre` no esté vacío tras `btrim` y no supere 120 caracteres.
  - Bloquea la fila del proyecto con `FOR UPDATE` para serializar la asignación del número consecutivo.
  - Serializa todo el árbol del proyecto (`cot_cotizaciones`, `cot_cocinas`, `cot_grupos_modulos`, `cot_cotizacion_lineas`) en un snapshot autocontenido.
  - Inserta el registro en `cot_cotizacion_versiones`.
- `cot_restaurar_version(p_cotizacion_id, p_version_id)`:
  - Valida permisos y compatibilidad de esquema (`schema_version = 1`).
  - **Sin respaldos automáticos**: no genera versiones espurias al restaurar o navegar.
  - Dentro de una sola transacción, actualiza `cot_cotizaciones` (restituyendo `config_default`, `config`, totales, TRM, moneda, etc.) y reemplaza las cocinas, grupos y líneas por los registros idénticos del snapshot.

## Integración en Frontend

- `src/lib/cotizaciones.ts`: funciones `listarVersionesCotizacion` (ordenadas por fecha más reciente primero), `guardarVersionCotizacion` y `restaurarVersionCotizacion`.
- `src/app/cotizaciones/actions.ts`: Server Actions con validación estricta de nombre no vacío y revalidación de rutas.
- `src/app/cotizaciones/[id]/VersionesCotizacion.tsx`: panel con campo obligatorio para el nombre de la versión, prevención de doble envío / estado deshabilitado durante el guardado, confirmación post-transacción, listado con fecha y hora local (`es-CO` / `America/Bogota`), y carga de versión con confirmación y refresco completo sin estados residuales.
