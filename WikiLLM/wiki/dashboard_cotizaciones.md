# Dashboard de cotizaciones y ubicación

## Alcance y puntos de entrada

La ruta fija es `/cotizaciones/dashboard`. El botón **Dashboard** está junto a la guía de `/cotizaciones`, con `next/link` en la misma pestaña. No se agregó ninguna entrada a la navegación principal ni un rol nuevo. La página es un Server Component; los filtros, las gráficas SVG y la descarga son componentes cliente. Se conserva `AppHeader` y la paleta slate/blanco existente.

La migración **0229_dashboard_cotizaciones_ubicacion.sql** continúa la numeración real del repositorio (0228), superior a la 0036 mencionada como referencia inicial. Se aplicó al Supabase configurado. Agrega `pais text not null default 'Colombia'` y `ciudad text`, los índices de país, país/fecha y fecha, y una restricción que impide países vacíos.

## Creación y edición de ubicación

- `UbicacionCotizacion` comparte los campos de creación y edición: país obligatorio con datalist de países frecuentes y entrada libre; ciudad opcional, deshabilitada si el país está vacío.
- `normalizarUbicacion` limpia espacios, reconoce países frecuentes sin distinguir mayúsculas/tildes, permite otros países y valida longitudes. Ciudad vacía se persiste como `null`.
- `crearCotizacionAction` exige país en el servidor. `crearCotizacion` conserva un default Colombia para compatibilidad con llamadas internas previas; las filas históricas reciben el default en Postgres.
- `UbicacionEditor` permite editar desde el detalle. Su acción actualiza únicamente país/ciudad, sin recalcular módulos ni tocar características, TRM, PDF o HDR. El `update(...).select('id').single()` comprueba que RLS permita actualizar realmente la cotización.
- El listado incorpora los campos al tipo `CotizacionHeader`. No se modificó ningún archivo de `imprimir/` ni se agregaron campos al documento PDF.

## Agregación y seguridad

La vista `vw_dashboard_cotizaciones` usa **security_invoker=true** y una fecha local en `America/Bogota`. Los tres RPC son **SECURITY INVOKER**, tienen `search_path` explícito y usan las políticas RLS existentes de `cot_cotizaciones`:

1. `cot_dashboard_filtradas`: fuente única de filas filtradas para tabla, CSV y resumen. Tiene parámetros tipados, sin SQL dinámico, y búsqueda literal en código, nombre, cliente y comprador.
2. `cot_dashboard_resumen`: total, importes COP/USD, tickets promedio, conteos por estado, comparación mensual y series agregadas. Los agregados se calculan en Postgres; el navegador no recibe todas las cotizaciones.
3. `cot_dashboard_opciones`: países, estados y años presentes entre las filas visibles por RLS. No depende de opciones fijas para países o estados del dashboard.

Se revocaron permisos de `anon` y `public` sobre los objetos nuevos y se otorgaron a `authenticated` y `service_role`. La aplicación usa el cliente con cookies y `getUserAndRole()`, exige sesión y no usa una clave de servicio para consultar el dashboard ni exportar. Todo usuario que accede a Cotizaciones puede abrirlo; no hay condición de administrador.

`cargarDashboardCotizaciones` consulta resumen, opciones y página en paralelo. La tabla usa `.range()` con 25, 50 o 100 filas y orden de columna permitido más `id` como desempate estable. No se añadieron dependencias.

## Semántica de filtros y KPIs

Los filtros se combinan por intersección y se guardan en `searchParams`: `rango`, `desde`, `hasta`, `pais`, `mes`, `anio`, `cotizador`, `estado`, `q`, `orden`, `direccion`, `pagina`, `tamano`.

- Rango inicial: últimos 30 días. Los rangos de 7/30 días incluyen hoy y los 6/29 días anteriores. Este año inicia el 1 de enero. Personalizado usa fechas reales y normaliza extremos invertidos.
- Las fechas representan días de Bogotá; el límite final SQL es exclusivo, a medianoche del día siguiente. Mes/año también se evalúan en Bogotá y restringen el rango elegido.
- País utiliza opciones presentes en BD; empresa admite FIRPLAK/CEMA/Todos; estados proceden de los datos. La búsqueda trata `%`, `_` y comillas como texto literal, sin interpolarlos en SQL.
- COP y USD son sumas separadas de los importes persistidos, sin convertir un total agregado por una TRM. El ticket muestra los promedios en ambas monedas, incluyendo cotizaciones de valor cero.
- El KPI de pipeline cuenta borradores y enviadas/aprobadas (también admite el código histórico `cerrada`, si existiese); no se creó ningún estado nuevo. La gráfica muestra los estados realmente presentes.
- La comparación de cantidades del mes actual y anterior usa el conjunto filtrado. Si el anterior es cero y el actual es positivo se muestra **Sin base de comparación**, sin inventar un porcentaje. Ambos meses en cero producen 0%.
- La línea tiene doce meses consecutivos hasta el mes final del rango y rellena con cero los meses sin cotizaciones que cumplan los filtros. Países muestra top 5 más Otros, conciliando el total. Empresa usa barras apiladas y pipeline barras por estado.

## Gráficas y comportamiento de interfaz

`GraficasDashboard.tsx` utiliza únicamente SVG propio, `viewBox`, `preserveAspectRatio` y títulos SVG de texto único, compatibles con React 19. `escalaLineal` maneja dominios constantes y rangos invertidos; la línea admite valores negativos y ceros. No se usa recharts, chart.js, d3 ni imágenes como interfaz.

El diseño conserva la estructura ejecutiva del concepto visual: filtros, seis KPIs, cuatro gráficas y tabla inferior. Las diferencias intencionales son mantener el header real, utilizar slate en lugar del azul decorativo del concepto y omitir porcentajes de crecimiento que no existen en los datos. En móvil las tarjetas se apilan y encabezado/tabla tienen scroll local, sin desbordar el documento.

La línea utiliza una variante SVG móvil con seis etiquetas de mes legibles y la variante de escritorio con doce; ambas muestran los mismos doce puntos. Los tooltips describen todos los puntos. Un filtro compartido de país, estado o año que ya no tiene registros conserva su valor visible en el selector, en vez de aparentar Todos.

La ruta tiene `loading.tsx` y un error boundary con `unstable_retry`, API documentada en Next 16.2.6. Un resultado vacío conserva filtros y muestra **Sin cotizaciones para los filtros seleccionados**. El orden y la navegación de páginas conservan los demás filtros; al aplicar filtros se vuelve a la primera página.

## Exportación CSV

El botón llama una Server Action autenticada. Se reutiliza `cot_dashboard_filtradas`, los mismos parámetros y el mismo orden. La lectura recorre lotes de 1000 filas con `.range()`, sin limitarse a la página visible. Las fechas visibles se congelan para evitar que una descarga posterior a medianoche cambie un rango relativo.

El CSV usa separador `;`, BOM UTF-8, finales CRLF, comillas escapadas, ciudad vacía y decimales con coma. Los campos de texto que empiezan como fórmulas Excel se neutralizan. El cliente normaliza el BOM al construir el Blob para conservarlo después del transporte de la Server Action. No se agregaron librerías.

## Verificación y mantenimiento

- Unitarias: `tests/dashboard-cotizaciones.test.ts`, `tests/dashboard-cotizaciones-datos.test.ts`, `tests/dashboard-csv.test.ts`, `tests/ubicacion-cotizacion.test.ts`.
- SQL: `node scripts/run-sql.mjs db/tests/dashboard_cotizaciones.sql`. Usa fixtures y `rollback`: filtros combinados, límites de fecha, doce meses, promedios, estados, top 5/Otros, opciones, permisos anónimos y paridad de visibilidad entre tabla y RPC bajo el rol authenticated.
- Navegador: crear con país libre sin ciudad, editar ubicación, verificar botón en la misma pestaña, paginación de 32 filas (25+7), CSV con las 32 filas, combinación de todos los filtros, orden, vacíos, escritorio/móvil y rechazo de acceso sin sesión. Los fixtures se eliminan al terminar; no se cambian cotizaciones de usuarios para probar filtros.
- Ejecutar en orden `quality:plan`, `quality:impact`, `quality:gate` y luego `quality:learn -- --strict`. El manifiesto incluye los helpers y sus pruebas en frontend/persistencia. No se modifica la línea base.
- Mantener los [invariantes y el protocolo de PDF](protocolo_pdf_cotizaciones.md). Los campos nuevos son aditivos y no alteran clasificación de herrajes, materiales de closet, despieces o precios.

## Inventario de archivos

| Área | Archivos |
| --- | --- |
| Postgres | `db/migrations/0229_dashboard_cotizaciones_ubicacion.sql`, `db/tests/dashboard_cotizaciones.sql` |
| Datos y helpers | `src/lib/cotizaciones.ts`, `ubicacion-cotizacion.ts`, `dashboard-cotizaciones.ts`, `dashboard-cotizaciones-datos.ts`, `dashboard-csv.ts` (los últimos cuatro también en `src/lib/`) |
| Ubicación y acceso | `src/components/UbicacionCotizacion.tsx`, `src/app/cotizaciones/NuevoCotizacionForm.tsx`, `src/app/cotizaciones/actions.ts`, `src/app/cotizaciones/page.tsx`, `src/app/cotizaciones/[id]/UbicacionEditor.tsx`, `src/app/cotizaciones/[id]/CotizacionDetalleClient.tsx` |
| Dashboard | `page.tsx`, `FiltrosDashboard.tsx`, `GraficasDashboard.tsx`, `ExportarDashboard.tsx`, `actions.ts`, `loading.tsx`, `error.tsx`, todos en `src/app/cotizaciones/dashboard/` |
| Pruebas y calidad | Los cuatro archivos `tests/` citados arriba y `quality/manifest.json` |
| Wiki | Esta página, `WikiLLM/index.md` y `WikiLLM/log.md` |

## Evidencia funcional y visual

Se verificó con Chrome/Playwright (plugin Browser no disponible), escritorio 1440×1000 y móvil 390×844, sobre `http://localhost:3000`. La prueba creó y eliminó 32 cotizaciones de datos conocidos y una creada desde el formulario real. País libre Uruguay sin ciudad persistió correctamente; la edición reconoció Panamá y guardó la ciudad. La descarga desde página 2 exportó las 32 filas, con los bytes iniciales UTF-8 `EF BB BF`. La combinación de país, fechas, mes, año, empresa, estado y búsqueda devolvió las 13 filas esperadas y sus KPIs conciliaron con los fixtures. Se verificaron orden, vacío, enlace en la misma pestaña, URL compartida, cuatro gráficas visibles, rechazo sin sesión y consola limpia.

Los fixtures temporales se eliminaron y la prueba SQL usa rollback. Las ocho cotizaciones reales conservaron un país válido por defecto. Dos generaciones de un PDF existente produjeron texto idéntico (cuatro páginas); se revisó la portada renderizada sin guardar cambios en la cotización. No se modificaron archivos del PDF, dependencias, variantes isazaale, fuentes raw ni baseline.

La comparación del concepto y las capturas revisó cinco aspectos: jerarquía y orden de secciones, densidad de filtros/tabla, tipografía de controles, paleta y bordes de la aplicación, y adaptación móvil de gráficas y scroll. Las desviaciones intencionales del concepto son el header existente y las métricas reales sin crecimientos ficticios. Los límites de QA son navegador Chrome local; no se realizó despliegue remoto ni impresión física.

Resultado final del 2026-10-30: `quality:plan`, `quality:impact` y `quality:gate` finalizaron en ese orden con exit 0; el impacto y el gate ejecutaron 88 archivos de pruebas. `quality:learn -- --strict` terminó con exit 0 y cero hallazgos HIGH; sus avisos MEDIUM/LOW son latencias de pruebas históricas. La última ejecución integral del navegador pasó todos los casos y eliminó sus 33 fixtures. Los índices de WikiLLM resuelven a archivos existentes y `git diff --check` terminó sin errores.
