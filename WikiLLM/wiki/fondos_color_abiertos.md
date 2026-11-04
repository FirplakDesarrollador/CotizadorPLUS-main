# Fondos del color del frente en abiertos

## Regla vigente

OBFD, OBFD-SM, OSBFD-SM, OW y OW-MO usan caja y refuerzos del frente, y fondo de 6 mm de la misma referencia de proveedor, sustrato y color. Incluye las variantes `-SF` como selección de materiales, sin añadir una pieza de fondo a módulos configurados sin fondo. No se propaga esta excepción a muebles cerrados ni a los materiales globales de toda la familia.

Ejemplo de la incidencia: el OW803030.4-SM15 de ELEVEN tenía seleccionado CHIRHCARB4,5BLANCO AMERICANO EXPO RI pese a llevar frente PRIRH15CONSTRUCTOR. Su referencia correcta es PRIRH6CONSTRUCTOR. La regla anterior del fondo de color estaba limitada a OW-MO; esta extensión cubre también OW y los otros abiertos indicados.

## Aplicación compartida y validación

- `presetMaterialesTipologia` deriva el fondo de la referencia de frente sustituyendo su espesor por 6 mm. `usaFondoMaterialFrente` comparte el alcance entre el servidor y las interfaces.
- Editor y simulador muestran el fondo derivado deshabilitado; cambiar el frente cambia inmediatamente el fondo. Los muebles cerrados conservan su selector independiente.
- `prepararCotizacion` verifica, tanto con catálogo precargado como con consultas directas, que el fondo requerido exista y tenga 6 mm. Una selección sin referencia válida detiene el cálculo con un error explícito; no se sustituye por blanco. Las variantes SF y configuraciones sin fondo no requieren ese espaldar para poder calcular.
- El motor usa el material efectivo para `TB`, área, merma, precio por m² y costo. HDR y Optimizador consumen el mismo cálculo. Las especificaciones PDF distinguen el fondo de abiertos del fondo general para evitar una descripción contradictoria.

## Evidencia 2026-11-04

- Auditoría independiente de los 28 abiertos guardados en la última lectura: frente y fondo conservan la referencia de color; catálogo de fondo de 6 mm; `breakdown.maderaPorRol` usa esa misma referencia y su costo concilia con m² × precio de catálogo con tolerancia de redondeo.
- OW803030.4-SM15 de ELEVEN: frente PRIRH15CONSTRUCTOR; fondo PRIRH6CONSTRUCTOR; 2162,84 cm² netos y 0,248727 m² con merma; precio de fondo 30223 COP/m²; costo 7517,26 COP. Guardado real en editor y lectura posterior de la base confirmaron referencia, consumo y costo. Precio total de esa línea en dicha lectura: 149680,83 COP.
- Se simuló el cambio de frente a PRIRH18TENDENCIA y se comprobó que el editor deriva PRIRH6TENDENCIA. Se canceló ese cambio de color antes de guardar. No se modificaron selecciones globales para forzar la prueba.
- Sincronización limitada con respaldo `cotizador-respaldo-abiertos-1793805508654.json` en el directorio temporal: tres líneas en ELEVEN y tres en Condominio V según el plan de esa ejecución. Hubo correcciones concurrentes a lo largo de la revisión; los conteos reflejan las lecturas de cada momento, no una base inmóvil.
- La auditoría general posterior sigue detectando tres diferencias de caja/refuerzos en OW-MO de Condominio V: caja/refuerzo PRIRH15CONSTRUCTOR frente a PRIRH18CONSTRUCTOR, con fondo PRIRH6CONSTRUCTOR correcto. Los guardados se produjeron después de sincronizar y no figuran como acciones de Condominio V en el servidor local reiniciado. Origen no determinado; se solicitó la URL usada por el usuario. No se afirma que la auditoría general esté libre de pendientes ni se atribuye el origen a una caché sin evidencia.
- Pruebas reales en Chrome local con Playwright (Browser plugin no disponible): editor, cambio de frente, guardado/lectura del OW de la imagen y seis PDF desde dos cargas independientes de ELEVEN (5 páginas), KUNDARA (10) y Milán Closet (4). Texto idéntico entre pares; referencias y excepción de fondo presentes solo donde hay abiertos. Se renderizaron todas las páginas con PDFium y se revisaron los mosaicos. Plantillas comerciales restauradas después de las pruebas. Reinicio del servidor local para asegurar carga de la versión actual; sin despliegue remoto.
- `quality:gate`: 92 suites, exit 0. Regresión del motor verifica `TB = 6 mm`, dimensiones, consumo y costo con un precio de fondo de color distinto del blanco; ausencia del fondo requerido provoca rechazo. Persistencia e idempotencia de los abiertos también cubiertas. `quality:learn -- --strict`: cero HIGH; los MED de nombres de archivo (`cotizar.test.ts`, `cema-template.test.ts`) tienen cobertura efectiva en `cotizar-materiales-abiertos.test.ts` y `firplak-template.test.ts`; resto de avisos de latencia del optimizador.

Relacionados: [materiales de abiertos](materiales_tipologias_abiertas.md), [reglas B/OW-MO y programación](inferiores_b_ow_mo_programacion_pdf.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).


## Auditoría previa a publicación (2026-11-04)

Tras la autorización de actualizar Supabase y publicar todas las ramas, se sincronizaron de nuevo los tres OW-MO desalineados de Condominio V. Respaldo: `cotizador-respaldo-abiertos-1793806965408.json`. Se actualizaron 14 códigos pendientes (12 de Condominio V y 2 de ELEVEN), sin recalcular precios; respaldo `cotizador-respaldo-codigos-1793806970738.json`. La auditoría estricta de las 11 cotizaciones y la auditoría de códigos finalizaron con cero diferencias, errores, líneas o grupos pendientes. Esta es la lectura posterior a los pendientes descritos arriba, no una garantía frente a escrituras posteriores de otras versiones.
