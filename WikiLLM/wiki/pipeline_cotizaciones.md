# Pipeline CEFI y cotizaciones

## Navegación y alcance

Un único espacio `/cotizaciones`: lista y creación de proyectos, `?vista=registro`,
`?vista=pipeline` y `?vista=dashboard`. Las vistas auxiliares ocupan todo el ancho;
Volver retorna a la lista. La lista conserva dos columnas y su tabla tiene
altura fija, scroll propio y cabecera sticky. A 1100 px la cuadrícula se apila.

La barra Registro/Pipeline/Dashboard se encuentra dentro de la columna derecha,
encima de la tarjeta del listado y separada de Guía/Tips. Cada botón aumenta
su tamaño visual un 0,5 % mediante `scale(1.005)`. En las vistas de ancho
completo la barra acompaña a Volver en su propia fila.

Registro reúne los 24 campos de Form CEFI más Asesor y Estimador. Ubicación se
divide en país y ciudad. Productos admite selección múltiple. El adjunto es
solo una URL: no hay subida de archivos. La acción de registro valida los
campos obligatorios, opciones, fechas reales, tarifa y enlaces HTTP(S) en
servidor, e inserta únicamente `cot_pipeline` con el creador de sesión.

Pipeline tiene búsqueda literal, filtros por estado/país/asesor/estimador,
orden por fecha, páginas de 25 y monitor de estados. El drawer muestra todos
los campos, permite editar solo columnas autorizadas y conserva la identidad
de importación, el origen y los metadatos. Los históricos incompletos muestran
Sin dato; no se inventan clientes ni fechas. Los registros vinculados cambian
su estado desde la cotización, no desde el drawer.

## Datos, estados y permisos

- `0238_pipeline_estados_unificados`: amplía el CHECK de cotizaciones sin
  actualizar filas. Catálogo: borrador, enviada, en_pausa, reproceso, aprobada,
  rechazada, descartada. El resumen agrupa pendientes=borrador;
  en curso=en_pausa+reproceso; cerradas=enviada+aprobada;
  perdidas=rechazada+descartada. `cerrada` no es un estado válido.
- `0239_pipeline_cefi`: tabla independiente con campos comerciales, moneda,
  configuración solicitada, fechas, importes separados USD/COP y enlaces.
  Incluye `tipo_origen`, `origen_excel` y `clave_importacion` para preservar
  el Excel. Cliente y fecha de ingreso solo pueden ser nulos con origen histórico,
  excepción autorizada por el usuario. La creación por formulario los exige.
- `0240_pipeline_vinculo`: columna opcional única `pipeline_origen_id` en
  cotizaciones, FK y trigger de sincronización. No modifica filas históricas.
- `0241_pipeline_consultas`: RPC `cot_pipeline_filtradas`,
  `cot_pipeline_resumen`, `cot_pipeline_opciones`. Son SECURITY INVOKER,
  `search_path=public,pg_temp`, sin SQL dinámico y con RLS.

RLS reproduce el patrón existente: lectura para autenticados; INSERT requiere
`creado_por=auth.uid()`; UPDATE/DELETE solo dueño o admin, con WITH CHECK.
Se revocan permisos de public/anon y se otorgan a authenticated/service_role.
El frontend utiliza sesión y cookies; nunca la clave de servicio. Los históricos
importados no reciben un propietario inventado (`creado_por` nulo): los edita
admin. Índices en estado, país, fechas, cotización y creador.

## Crear y vincular una cotización

Crear cotización guarda una preselección local con solo pipelineId, cliente,
país, ciudad y nombre. Viaja a `/cotizaciones?pipeline=<id>`; el formulario
comprueba el ID y recupera únicamente esos campos. Moneda, TRM, empresa,
familias y materiales siguen a cargo del cotizador. La preselección se borra
solo después del éxito; si el guardado falla se conserva.

La acción valida acceso al origen antes de llamar a la creación normal. El
INSERT incluye el origen opcional y su trigger enlaza la oportunidad dentro
de la misma transacción. La unicidad impide dos creaciones concurrentes;
si falla el enlace se revierte el INSERT completo. Reintentar un origen ya
vinculado abre su cotización. No se cambió el motor ni la configuración de
materiales.

El mismo trigger propaga cambios de estado hacia Pipeline bajo RLS. No hay
sincronización inversa. El FK `cot_pipeline.cotizacion_id` usa ON DELETE SET
NULL: borrar una cotización conserva la oportunidad y su último estado.

## Importación CEFI del 2026-11-05

El script `scripts/importar-pipeline-cefi.mjs` hace preflight sin flags;
`--apply` inserta. Requiere el Excel local y las credenciales administrativas
ya configuradas. Nunca actualiza registros importados.

La hoja tiene 444 filas después del encabezado, pero 439–445 están vacías:
el usuario autorizó importar **437** y omitir **7**. Primera aplicación:
444 leídas, 437 insertadas, 0 duplicadas, 7 vacías, 0 errores.
Segunda aplicación de control: 0 insertadas, 437 duplicadas omitidas.

Se preservan las 39 columnas, encabezados, valores, fórmulas, textos formateados,
comentarios y enlaces en `origen_excel`. Las fechas numéricas usan origen
1899-12-30 y UTC. Faltan 34 clientes y 35 fechas de ingreso: permanecen nulos.
Estados importados: enviada 379, descartada 33, en_pausa 16, reproceso 3,
rechazada 2, borrador 4. El tipo Excel/TEOWIN/Plus se conserva en `tipo_origen`;
no se sustituye por FIRPLAK/CEMA. Las tasas auxiliares Sep/Oct 4100/3050 no
son TRM de esas oportunidades y no se asignaron a ninguna fila.

El primer preflight rechazó dos fechas límite sin insertar nada. Con aprobación
expresa: fila 201 `27/04/02026` se interpreta como 2026-04-27; fila 301 `-`
permanece nula. Los originales se conservan. Fila 327 `USD 28.678,5` se
interpreta como 28678,5 USD y conserva el texto original.

La identidad de importación es SHA256 de código, oportunidad, fecha y cliente
originales; queda persistida e inmutable al editar. Por eso una nueva corrida
no reinserta un histórico que luego se editó manualmente. No se confunden filas
vacías con oportunidades ni se crean cotizaciones a partir del Excel.

## Dashboard único

Los KPIs, filtros, gráficas, orden, paginación y CSV existentes continúan en
`?vista=dashboard`. El formulario de filtros incluye el hidden vista=dashboard.
La ruta antigua responde HTTP 301 conservando sus parámetros mediante un Route
Handler: `redirect()` de Next usa 307, no el código requerido.

El bloque Pipeline consulta el histórico de oportunidades de todas las fechas
y lo identifica explícitamente. Sus importes no se suman a las cotizaciones:
son oportunidades y pueden no estar vinculadas. Incluye total, pendientes,
en pausa, vencidas sin cotización, FOB USD/COP, estados y primeras 25
oportunidades; el detalle completo y sus filtros están en Pipeline.

Los componentes del dashboard se movieron a `src/app/cotizaciones/`.
La acción CSV se llama `dashboard-actions.ts` para evitar colisionar con el
`actions.ts` existente de cotizaciones. Solo queda el handler de compatibilidad
bajo `dashboard/`; se retiraron su página, loading y error originales.

## Pruebas, seguridad y límites

Los checkpoints antes/después de las fases se guardan fuera de Git en
`artifacts/`. Las 11 cotizaciones conservaron 7 borrador y 4 enviadas en
todas las fases. Hay respaldo legible previo en
`artifacts/backup-cotizaciones-pre-pipeline.json`. No se emitió UPDATE/DELETE
sobre cotizaciones, líneas o versiones para implementar/probar el módulo.

Pruebas SQL transaccionales: catálogo/agrupación, RLS ajena, enlace atómico,
unicidad y RPC del dashboard. La sincronización de estado usa el trigger real
en una tabla temporal de eventos. No se prueba borrando cotizaciones reales:
se comprueba el FK ON DELETE SET NULL. Los fixtures se revierten con rollback.

Pruebas de navegador con Playwright/Chromium local (plugin Browser no
disponible): registro completo, edición/recarga, filtros, preselección,
CSV, redirect 301, navegación, paginación y scroll. Solo sus propios fixtures
Pipeline se insertan/editan/eliminan. No se crean cotizaciones persistentes.
Anchos 1440, 1280 y 1100: sin overflow horizontal del documento y cabecera fija.

Las suites `tests/pipeline-*.test.ts` protegen normalización, importación,
deduplicación tras edición, preselección, validación, permisos de acciones y
consultas paginadas. El manifiesto las asigna a persistencia. No se cambia la
línea base ni las aserciones anteriores. Ver el informe final en artifacts
para los resultados de compuerta y auditoría finales.

## Cierre de verificación

`quality:plan` sin archivos de código huérfanos; `quality:gate` aprobado con
99 suites, exit 0, sin regresiones de tipos/lint. `quality:learn -- --strict`
sin HIGH; la última ejecución tiene siete avisos de latencia (dos MED y
cinco LOW) del optimizador y cliente Supabase, ajenos a Pipeline. Se conciliaron las 437 filas contra los 39
valores de origen y todos los campos importados: cero diferencias.

Las 11 cabeceras coinciden exactamente con las columnas del respaldo previo,
incluidos importes, estados y ubicación. Auditorías de propuestas y herrajes
en modo estricto sin diferencias ni errores. KUNDARA y Milán Closet generaron
dos PDF por proyecto con texto idéntico entre cargas, 10 y 4 páginas
respectivamente; páginas renderizadas revisadas. Para respetar la prohibición
de UPDATE a cotizaciones se generaron desde el navegador sin ejecutar
Guardar e imprimir, que guarda la plantilla. No se cambió el PDF ni su código.

El reporte completo, con conteos antes/después por fase, versiones de
migraciones, listado de archivos y límites de QA, queda fuera de Git en
`artifacts/pipeline-informe-final.md`. Al cerrar la implementación inicial
todavía no se había realizado commit, push ni despliegue remoto.

## Publicación autorizada: 2026-11-05

Se prepara la promoción completa LIz → DEV → main, incluido el ajuste de los
botones sobre la tarjeta y el PDF Form CEFI de referencia, sin modificar su
contenido. Se verificaron las migraciones 0238–0241 mediante el script
idempotente: ya estaban registradas y no se reaplicaron. El preflight del
importador tiene 437 duplicados existentes y cero filas pendientes; las siete
vacías siguen omitidas. Las 11 cotizaciones mantienen siete borrador y cuatro
enviadas. La publicación exige la suite completa y learn sin HIGH antes del
commit. Los respaldos de artifacts y el Excel fuente permanecen fuera de Git.

La auditoría del contenido preparado detectó una asociación nominal faltante:
las pruebas directas del validador estaban en pipeline-registro.test.ts. Se
renombraron a pipeline-campos.test.ts sin cambiar sus aserciones; se agregaron
pruebas dedicadas del vínculo (dueño/admin, sesión, reintentos y errores) y de
filtros/enlaces. Se repite la suite completa antes de publicar.

Validación de publicación: suite completa aprobada con 101 archivos de pruebas,
20 casos específicos Pipeline aprobados y learn estricto sin HIGH. Sin
regresiones de TypeScript, ESLint o tests y sin cambios de la línea base.

Relacionados: [Dashboard](dashboard_cotizaciones.md),
[protocolo PDF](protocolo_pdf_cotizaciones.md),
[ubicación y RLS](clientes_supabase_rls.md).
