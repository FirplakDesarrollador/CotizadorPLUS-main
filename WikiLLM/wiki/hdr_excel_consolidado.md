# HDR consolidada y Excel continuo

## Presentación vigente

Desde una cotización, HDR conserva el despiece real de cada grupo físico y consolida únicamente módulos equivalentes: mismo código, descripción/notas, piezas con medidas, cantidades y cantos, y referencias de material. Ignora el área para consolidar, pero no une muebles de distinta fabricación aunque compartan código. Mantiene la primera aparición y el orden de piezas; las gavetas conservan su orden relativo.

La cantidad inicial suma `cantidad de línea × repeticiones del área` de todas las apariciones equivalentes. Es editable y se puede vaciar. No se agrega área ni multiplicador al título. PN conserva `PN - Panel` y sus notas; F conserva sus notas. La consolidación se aplica a la vista HDR, no elimina líneas ni áreas de las cotizaciones ni cambia los grupos usados por el optimizador.

La búsqueda manual por tipo también admite notas en F. El caché del simulador pasa a v12: conserva entradas/notas/muebles y descarta resultados previos a las nuevas reglas. Las especificaciones impresas aclaran que las paredes DB-FE usan caja y sus fondos usan respaldo y omiten personalizaciones históricas de gaveta que no se utilizan en ese tipo.

Se retiraron la nota de inferencia Color/Blanco y los sufijos de rol B/P/C/F de los nombres de pieza. Las letras A, B, C… de identificación de filas y las columnas de canto se conservan.

Regla posterior del 2026-11-07: los tableros de 4,5/5,5/6/9 mm no muestran calibre ni contadores de canto y no generan su costo, incluido el BACKING de WLD. Se aplica en motor y presentación; véase [materiales delgados sin canto](cantos_por_espesor.md). El caché vigente del simulador es v13.

## Excel

El botón **Exportar Excel** descarga un `.xlsx` con una sola hoja `HDR`, como tabla continua, sin bloques por cocina. Cada fila identifica el módulo y conserva letra, pieza, largo/ancho/espesor, los cuatro contadores de canto, espesor del canto, cantidad de módulos, color general, proyecto y color de pieza. Mantiene el orden de las tarjetas y sus filas; las piezas repetidas dentro de un mueble se representan igual que en pantalla.

La exportación usa los valores editados de la tabla, incluida cantidad vacía. Medidas y cantidades son valores numéricos, con formatos de Excel, encabezado congelado y autofiltro. ExcelJS se carga dinámicamente al exportar. La búsqueda por tipo también permite exportar su resultado individual.

Implementación: `datosHdr.ts` comparte filas/descripciones y consolidación; `HdrTabla` expone datos editados mediante su ref; `excel.ts` genera el libro y descarga; `HdrBuscador` exporta los módulos visibles.

## Correcciones de fabricación del 2026-11-07

- BFD-SMG, SBFD-SMG y sus variantes SF tenían frente con cantidad fija 2 y ancho `(L-2*RV)/2`, aunque `n_puertas` indicara una. Se reemplazan por `n_puertas` y `(L-n_puertas*RV)/n_puertas`. Se conservan las fórmulas existentes de altura/gola. El BFD de 43 cm produce una puerta de 426,8 mm de ancho.
- `base_gaveta`, mostrada como PIEZA CAJON, lleva dos cantos largos y cero anchos en DB sin FE. Las variantes FE conservan sus reglas de canto.
- Solo DB-FE y DB-FE-SF dejan de usar el tablero independiente de gaveta. Contraparche, laterales y traseros usan `caja`, también si es de 18 mm. Desde 0252, fondo/base de gaveta usa `fondo` en todas las FE, igual que el backing. Se oculta su selector individual y no se exige tablero gaveta de 15 mm. Las otras DB, incluidas DB-SM-FE, conservan su selección independiente. No se elimina la selección global necesaria para esas otras familias.
- La descripción HDR de DB-FE muestra solo la cantidad de gavetas, sin entrepaños de reglas globales que no correspondan a piezas físicas.

Migración idempotente `0249_hdr_puertas_gavetas.sql`, aplicada en Supabase, más normalización en el preparador compartido. Recálculo real de doce cotizaciones, 805 grupos y 1.054 líneas, aplicado en transacción con comprobación de concurrencia. Respaldo previo en el temporal del sistema: `cotizador-fabricacion-1794029494426.json`. Ningún cambio de selección individual/global en el preflight; solo cambian piezas, consumos e importes derivados. Segunda corrida: cero actualizaciones pendientes. Auditorías SQL: cero discrepancias de puertas, cantos DB o roles DB-FE; auditoría de propuestas sin diferencias.

Regresiones: `tests/hdr-continuo.test.ts`, identificadores HDR existentes y prueba DB-FE con caja de 18 mm y una selección histórica de gaveta de 15 mm. Evidencias locales en `.tmp/hdr-nuevo-browser.json`, `.tmp/hdr-nuevo.xlsx`, `.tmp/hdr-nuevo-postflight.txt` y `.tmp/hdr-nuevo-auditoria.txt`.

## Cierre de verificación

Chrome autenticado local, usando Playwright existente por ausencia de Browser plugin: Casa A presenta 50 HDR desde 51 líneas, exporta 232 filas de piezas y conserva valores editados de cantidad, color y proyecto. Se descargó/reabrió un segundo Excel con cantidad vacía. PN4470 de Condominio V aparece una sola vez como `PN4470 PN - Panel Paneles Horizontales x12`, con cantidad 360 al sumar las apariciones/áreas, sin volver a multiplicar por el texto de las notas. Selectores DB-FE ocultos en simulador y editor real; notas F y exportación individual verificadas. Sin errores de consola/página.

PDF de HDR generado con su botón real y renderizado: una puerta de 755 × 426,8 mm, sin sufijos ni nota inferior. Dos cargas y guardados/impresiones independientes de Casa A: seis páginas por PDF, texto idéntico y páginas renderizadas revisadas, con la excepción DB-FE explícita. Comparación estricta de las 1.054 líneas contra respaldo: selecciones/globales intactos y 217 adicionales sin cambios. Las comprobaciones son locales, no un despliegue remoto.

`quality:gate`: 123 archivos, 748 pruebas aprobadas y exit 0; sin aumentar la deuda. `quality:learn -- --strict`: cero HIGH; avisos restantes de latencia del optimizador. Wiki/raw y baseline intactos. Migración y recálculos aplicados en Supabase; código local en LIz sin commit/publicación en esta tarea.

Relacionados: [puertas y cantos](puertas_cantos_orientacion.md), [Tablero Gaveta](tablero_gaveta_db.md), [DB-FE](db_fe.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).

## Proyecto y color editables (2026-11-07)

El campo común Nombre del proyecto se precarga del nombre de la cotización al seleccionarla y alimenta Proyecto de cada HDR (también en búsqueda manual). Cada mueble puede editar su proyecto independientemente; futuras ediciones del campo común solo actualizan los muebles sin edición propia. No renombra la cotización guardada.

Color general precarga los colores de todas las piezas. Las ediciones individuales se conservan al cambiar el color general. Al salir de un color vacío se restaura el heredado o Por definir, que es un valor real. Excel aplica la misma resolución defensiva para evitar celdas de color vacías. Campos de edición locales de HDR; los materiales y precios de la cotización no se modifican.

Regresiones: tests/hdr-campos.test.ts para normalización y Excel, además de las pruebas de interfaz de carga, herencia y edición.

Verificación de campos: Chrome local con Casa A: nombre precargado, cambios comunes y particulares sin sobrescritura, herencia de color, conservación de edición individual, recuperación al borrar o escribir espacios y Excel reabierto con valores correctos. Dos cargas independientes de HDR manual produjeron PDF de una página con renders idénticos y legibles, con proyecto y colores editados. Browser plugin no disponible; se utilizó Playwright. Build de producción y quality:gate:full aprobados (127 suites / 768 pruebas); learn estricto sin HIGH. Auditoría de doce cotizaciones: cero errores/diferencias. Supabase permanece al día hasta 0253; no se requiere migración para estos campos locales.
