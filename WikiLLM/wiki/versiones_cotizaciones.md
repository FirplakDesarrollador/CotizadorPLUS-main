# Versiones de cotizaciones

## Propósito

El sistema de versiones permite crear **manualmente** snapshots completos e inmutables de una cotización/proyecto y alternar libremente entre ellos. No existen autosaves ni respaldos automáticos: una versión únicamente se genera cuando el usuario presiona explícitamente "Guardar versión".

## Modelo de datos

La tabla `cot_cotizacion_versiones` almacena el historial persistente con:

- `id`: identificador único UUID de la versión.
- `cotizacion_id` y `numero`: identidad lógica única y numeración consecutiva por proyecto.
- `nombre`: texto obligatorio (hasta 120 caracteres) asignado manualmente por el usuario (ej. *Propuesta inicial*, *Alternativa 18 mm*).
- `snapshot`: objeto JSONB inmutable con `schema_version`, cabecera (incluyendo `config_default`, `sistema_medida`, totales, moneda, TRM y notas), cocinas (con cantidades), grupos de módulos (con etiquetas y códigos de grupo) y líneas (con despieces, descripciones, anotaciones particulares, configuraciones completas de herrajes/frentes/cantos y breakdowns monetarios).
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

## Anotaciones por mueble

La migración `0205_anotaciones_linea_cotizacion.sql` añade `anotaciones` a cada fila de `cot_cotizacion_lineas`. Es texto libre, limitado por la aplicación a 1000 caracteres, que no entra en `config`, no cambia la tipología y no participa en precios ni despieces. Se edita desde el formulario del mueble y aparece en la misma línea de la descripción, después de las medidas y separada por `·`; también se incluye así en impresión y Excel.

El guardado de versiones ya serializa la fila completa con `to_jsonb`, por lo que captura el campo automáticamente. La restauración enumera explícitamente `anotaciones`; snapshots anteriores a la migración son compatibles y restauran `NULL` al no contener la propiedad.

## Comentarios internos por versión

Los comentarios del proyecto se almacenan como un arreglo JSON append-only en `cot_cotizaciones.notas`. La función RPC `cot_agregar_comentario` (migración `0206_comentarios_versionados_cotizacion.sql`) valida autenticación, propiedad, texto no vacío y máximo de 2000 caracteres; agrega cada entrada de forma atómica con UUID, usuario y hora del servidor. La interfaz solo permite agregar: no expone edición ni eliminación.

Como `notas` pertenece a la cabecera serializada por `cot_guardar_version` y restaurada por `cot_restaurar_version`, cada snapshot conserva su propio historial. Los comentarios aparecen únicamente en “Características del proyecto” dentro de Cotizaciones y se excluyen de las vistas de impresión/PDF. En estados `enviada` y `aprobada`, la interfaz recuerda agregar el registro antes de guardar características, imprimir, guardar una versión o cargar otra.
