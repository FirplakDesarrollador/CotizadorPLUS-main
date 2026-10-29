# Protocolo de cotizaciones: herrajes, materiales y PDF

## Reglas obligatorias

1. Todo artículo del botón **+ Agregar herrajes/otros** se presenta y se cuenta en **Herrajes / otros adicionales** del PDF. Incluye herrajes, tableros y cantos sueltos. Nunca pertenece al resumen de muebles ni a la programación de módulos. El origen se reconoce por `config.material`, incluso en líneas históricas sin marcador, y se persiste como `config.clasificacionPdf = herrajes_otros`.
2. Cantidad impresa = cantidad del material × cantidad de la línea × repeticiones del área. El precio persistido de la línea ya contiene las unidades de esa línea: solo se multiplica por repeticiones del área. Precio unitario del artículo = total / cantidad real. No se pierden cantidades fraccionarias.
3. Total de la propuesta = muebles con sus herrajes incorporados + adicionales, una sola vez. Los herrajes del despiece siguen incluidos en el precio del módulo; su lista es informativa y no vuelve a cobrarlos. La clasificación del PDF no cambia el margen de catálogo de tableros o cantos sueltos.
4. Si el nombre del área contiene **closet**, sin distinguir mayúsculas ni tildes, todos sus módulos, paneles, fillers y zócalos usan `materialesCloset`. Esta prioridad precede al prefijo del módulo (incluidos W y B). Las demás áreas siguen la familia de su tipología.
5. La fuente de materiales y cantos es **Características del proyecto** (`config_default`). Las especificaciones del PDF muestran referencia, sustrato, espesor, color, proveedor y cantos del catálogo seleccionado; no anuncian espesores, colores ni materiales de textos predeterminados de la plantilla. El fondo seleccionado se identifica como aplicable solo donde el módulo lleva espaldar.
6. Las referencias históricas solo se resuelven cuando hay un único código equivalente: espacios de borde, `COLOR CONSTRUCTOR` → `CONSTRUCTOR` y el alias descriptivo `(POLAR)` de CANDELARIA. No se cambia proveedor, sustrato, color o espesor por aproximación. Una referencia desconocida debe señalarse y resolverse antes de reparar datos.

## Implementación y persistencia

- `src/lib/propuesta-cotizacion.ts` separa las líneas y conserva los importes persistidos, evitando diferencias por redondeo del breakdown. Lo consumen las plantillas FIRPLAK, CEMA y general.
- `src/lib/materiales-proyecto.ts` comparte resolución de familia y especificaciones entre cliente, servidor y auditoría.
- `sincronizarMaterialesCotizacion` normaliza referencias, aplica los materiales elegidos y recalcula grupos, áreas y cabecera. Se ejecuta al guardar características, renombrar áreas y restaurar versiones. Agregar, editar, mover o recalcular módulos resuelve los materiales del área en el servidor.
- La migración `0228_clasificacion_pdf_herrajes_otros.sql` marca las líneas históricas. Las versiones guardadas conservan su snapshot; al restaurarlas se aplican las reglas vigentes sin reescribir el snapshot original.
- El formulario de adicionales muestra explícitamente la clasificación en el PDF. En FIRPLAK los materiales ya no son textos editables separados de las características del proyecto.

## Verificación previa a una corrección

1. Ejecutar `npm run quality:plan`. Identificar rutas, tipos de línea, unidades, multiplicadores, monedas y todas las plantillas afectadas.
2. Auditar todas las cotizaciones con `node --conditions=react-server --env-file=.env --import tsx scripts/auditar-propuestas.ts`. Es de solo lectura: valida referencias y simula todos los grupos antes de permitir cambios.
3. Añadir casos de regresión del ejemplo del usuario y de límites: área repetida, cantidad fraccionaria, adicional tipo tablero/canto, mismo código que un herraje incorporado, W/PN/TK dentro de closet, referencias antiguas y redondeo COP/USD.
4. Para una reparación autorizada, añadir `--apply`. El script guarda un respaldo completo de cabeceras, áreas, grupos y líneas en el directorio temporal del sistema antes de escribir. No modifica `WikiLLM/raw/` ni catálogos por inferencia.

## Verificación posterior: dos pasadas independientes

1. Volver a ejecutar la auditoría con `--strict`. Debe haber cero diferencias de materiales, cero referencias sin catálogo y cero grupos inválidos. Conciliar cada moneda contra la cabecera con tolerancia inferior a un centavo por aritmética de coma flotante.
2. Abrir las vistas de impresión de todas las cotizaciones existentes. Confirmar página correcta, contenido visible, ausencia de error de Next y consola sin errores de aplicación.
3. En KUNDARA y una cotización closet con materiales distintos, usar **Guardar e imprimir / PDF**. Verificar cada adicional, cantidades y valores contra una consulta independiente a las líneas guardadas. Confirmar ausencia de sus referencias en la programación de muebles. Comparar las especificaciones contra las características y el catálogo.
4. Generar el PDF con estilos de impresión. Extraer su texto y renderizar las páginas para comprobar legibilidad, saltos, encabezados, filas completas y totales.
5. Recargar desde el servidor y repetir el guardado y la generación, sin reutilizar el DOM de la primera pasada. Ambas pasadas deben coincidir en valores y cantidades. Probar también la impresión con teclado y el nombre de archivo.
6. Ejecutar `npm run quality:gate` y `npm run quality:learn -- --strict`. No entregar con regresiones ni hallazgos HIGH sin resolver o justificación técnica documentada. Actualizar wiki, índice y log con evidencia y límites reales de la verificación.

## Pruebas permanentes

Los cambios de Características se guardan en orden mediante `guardado-secuencial.ts`: una petición anterior nunca puede sobrescribir la selección posterior. El estado de aplicación y los errores se muestran en pantalla; no se confirma un guardado fallido. Tras aplicar cada cambio se refrescan los datos, se invalida la vista imprimible y el editor de una línea se reconstruye cuando cambia su preset o sus cantos. La etiqueta de materiales globales contrasta el material visible con el elegido, en vez de anunciar siempre que fue aplicado.

Antes de publicar cambios de propagación se debe probar el flujo real **abrir un panel → cambiar frente de Closet desde Características → comprobar presets y despieces de PN, F, W y DFE → comprobar el editor que seguía abierto → volver a cambiar → revisar PDF**. Usar una cotización temporal y eliminarla al finalizar para no alterar las selecciones del usuario durante la prueba. `tests/guardado-secuencial.test.ts` cubre peticiones concurrentes, snapshots inmutables y comunicación de errores.

`tests/propuesta-cotizacion.test.ts` verifica separación, multiplicadores, importes y HTML imprimible. `tests/materiales-proyecto.test.ts` verifica prioridad closet y referencias. `tests/cotizaciones.test.ts` prueba la sincronización persistida, recálculo y segunda pasada idempotente, además de sus pruebas anteriores de tipología con/sin fondo. Las suites se incluyen en los lanes de persistencia y frontend del manifiesto de calidad.

Relacionados: [FIRPLAK](plantilla_propuesta_firplak.md), [CEMA](plantilla_propuesta_cema.md), [material suelto](lineas_material_suelto.md), [nombre de PDF](nombre_pdf_cotizacion.md).

## Evidencia de aplicación: 2026-10-29

- Se auditaron las 7 cotizaciones existentes y se sincronizaron 201 módulos en 199 grupos: Santa Bárbara (9), Milán Closet (13), Entrevillas (11) y KUNDARA (168). La auditoría posterior contrasta también `breakdown.maderaPorRol` con los materiales elegidos: cero diferencias, referencias faltantes o grupos inválidos. Totales COP/USD conciliados con las cabeceras.
- Se aplicó y registró la migración 0228 en Supabase para las 51 líneas históricas de adicionales. Los adicionales de KUNDARA conservan $142.514.535,384615 COP antes de redondeo de presentación.
- Los recálculos actualizaron precios de los módulos afectados. En KUNDARA el total antes de IVA pasó de $1.688.153.764,034615 a $1.689.697.739,054615 COP, sin cambiar los precios de sus adicionales. El respaldo previo quedó en el directorio temporal del sistema (`cotizador-respaldo-materiales-1793280310422.json`).
- Se abrieron las 7 vistas de impresión en `http://localhost:3000` con Chrome mediante Playwright (plugin Browser no disponible), viewport 1440×1000 y sesión temporal autenticada sin envío de correo. No hubo errores de aplicación en consola ni overlay de Next.
- KUNDARA y Milán Closet se verificaron con dos ejecuciones de **Guardar e imprimir / PDF**, recargando desde el servidor cada vez. La llamada nativa se instrumentó para comprobar `beforeprint` y los PDF se generaron con el motor de impresión de Chromium. Los pares tienen texto y metadatos idénticos. El nombre incluye proyecto y fecha del día.
- Se comprobaron las 51 filas de adicionales, sus cantidades multiplicadas por área, el subtotal independiente, su exclusión del schedule y las referencias reales de tableros. Se extrajo texto de los PDF y se revisaron páginas renderizadas con Poppler y PDFium. Los subtotales aparecen una sola vez, las filas no se dividen y los encabezados continúan en las páginas siguientes. Resultado: KUNDARA 11 páginas, Milán 4 páginas.
- `quality:gate` ejecutó 83 archivos de pruebas con exit 0. La cobertura incluye cantidades fraccionarias, COP/USD, HTML imprimible, prioridad closet y persistencia idempotente. La prueba de persistencia usa un cliente en memoria y comprueba el input del motor y los totales guardados, sin escribir en Supabase desde la suite.
- Límite de la revisión visual: escritorio e impresión de Chromium en local. No se verificó despliegue remoto, impresión física ni diseño móvil. Las cotizaciones CEMA existentes no tienen módulos; la separación de adicionales usa la función compartida probada y se abrió su vista vacía durante el barrido.
