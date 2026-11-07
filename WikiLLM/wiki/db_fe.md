# DB-FE: cajonera paramétrica Full Extension

Actualización 2026-11-07: DB-FE y su variante SF usan caja para paredes de gaveta, contraparche, laterales y traseros, sin selector independiente ni obligación de 15 mm. El piso de la gaveta usa el mismo tablero y espesor del respaldo en todas las variantes FE (migración 0252). HDR describe solo la cantidad de gavetas. Las otras tipologías FE conservan su selección; véase [migración 0249 y HDR](hdr_excel_consolidado.md).

## Catálogo y variantes

`DB-FE` es una única tipología activa y agrupable. La migración `0236_db_fe.sql`, aplicada y registrada en Supabase, copia la DB vigente y sustituye únicamente la caja de gaveta Tandem por las piezas FE confirmadas de `DB-2S-SM-FE`. No crea una tipología independiente para cada variante y no incorpora Gola. Los prefijos imperial y métrico principales son DB-FE.

Las claves internas de `config.dbTipo` siguen siendo las de DB para conservar el contrato existente; la etiqueta y el código FE colocan la variante antes de `-FE`.

| Variante visible | Clave interna | Gavetas pequeñas de madera | Gavetas grandes de madera | Rieles FE |
| --- | --- | ---: | ---: | ---: |
| DB-1S-FE | DB-1S | 1 | 2 | 3 |
| DB-2S-FE | DB-2S | 2 | 1 | 3 |
| DB-2-FE | DB-2 | 0 | 2 | 2 |
| DB-3-FE | DB-3 | 0 | 3 | 3 |
| DB-4-FE | DB-4 | 4 | 0 | 4 |
| DB-2-1INT-FE | DB2-1OP | 2, incluida la interior | 1 | 3 |

La opción manual conserva el comportamiento paramétrico de DB. La carcasa, frentes, reglas de fachada, respaldo, materiales por rol y configuración de agrupación se copian de DB. Las 14 piezas y sus metadatos de la DB fuente se compararon contra la lectura previa sin cambios.

## Ajustes FE

- Laterales de gaveta: largo 500 mm si P ≥ 609,6 mm; 450 mm si 533,4 ≤ P < 609,6 mm; 350 mm si P < 533,4 mm. Alturas 100 mm para pequeñas y 200 mm para grandes; dos por gaveta.
- Traseros: largo `L − 2×espesor caja − 26 mm − 2×espesor lateral de gaveta`; alturas 80 mm y 180 mm. Conservan cantos, tarugos y montaje del donante FE.
- Contraparches: largo `L − 2×espesor caja − 26 mm − 2×espesor lateral de gaveta`; alturas 100 mm y 200 mm. Uno por gaveta, con mecanizados FE.
- Fondo de cada gaveta: una sola plantilla `fondo_gaveta`, largo del lateral menos 8 mm y ancho `L-72 mm`. Se elimina la `base_gaveta` Tandem para evitar duplicación de consumo.
- Riel `RIELFE500`: un par por gaveta, con referencia y precio reales del catálogo; se conserva la manija de DB. No hay barras estabilizadoras Tandem ni Gola. El cambio no modifica el precio de RIELTANDEM en el catálogo precargado.
- Para 2-1INT el visor adapta el orden de las cajas pequeña/grande/interior, usando el montaje FE ya existente.

La migración 0251 aplica esas dimensiones a las variantes DB con FE y conserva sus roles de material. El refuerzo del mismo tablero que la caja respeta su canto seleccionado también en grupos mixtos; no se fuerza 1 mm. Las piezas de 4,5/5,5/6/9 mm siguen sin canto. Por autorización expresa, los largos 350/450 conservan temporalmente RIELFE500 y su precio vigente: solo cambian las piezas.

## Contrato entre pantallas y servidor

`esTipologiaDbFe`, `DB_FE_TIPOLOGIAS`, `tipologiasDbParaPrefijo` y `aplicarConfiguracionDbFe` viven en `muebles.ts`. El último normaliza riel, sistema de frente y cantidades, incluso ante estados heredados de DB; no muta el input ni altera otras familias.

Cotizaciones, Simulador y HDR ofrecen DB-FE como tipo principal con selector interno de seis variantes. El riel queda fijo en Full Extension y los controles SM no se ofrecen para este tipo. El servidor aplica la misma normalización al calcular, agregar, editar y recalcular, por lo que `config.rielCodigo` guarda RIELFE500 y `config.sistemaFrente` guarda manija. Una variante desconocida o un riel FE ausente provoca error explícito.

`codigoComercial` inserta la variante antes de FE y conserva SF/espesor al final: `DB24-2S-FE-15MM`, `DB24-2-1INT-FE-15MM`. Las etiquetas históricas de DB permanecen iguales. En HDR se normalizan las referencias históricas de tablero con el catálogo antes de buscar; por ejemplo el alias `(POLAR)` de CANDELARIA no debe provocar una referencia de fondo inexistente.

## Verificación 2026-11-04

- `db/tests/db_fe.sql`: catálogo real, copia exacta de carcasa/frentes, piezas FE idénticas al donante salvo cantidades, riel correcto y ausencia de fondos duplicados. Solo lectura dentro de transacción con ROLLBACK.
- `tests/db-fe.test.ts`, con fixture acotada de las fuentes reales: seis variantes, dimensiones, frentes iguales a DB, precios finitos, cantidades y precio de riel FE, ausencia de barras/Tandem, catálogo Tandem intacto, estados heredados, variante inválida y agrupación/visualización. La prueba de disponibilidad de variantes de Simulador/Cotizaciones usa ahora el selector compartido por prefijo, conservando la comprobación de todas las claves DB y añadiendo DB-FE.
- Chrome local con Playwright (Browser plugin no disponible): alta y edición de las seis variantes dentro de una cotización temporal aislada, lectura independiente de `config`, `breakdown`, código y precio después de cada guardado. Simulador y HDR verificados con 2-1INT, riel fijo y estados heredados. Sin errores de aplicación. Cotización temporal eliminada mediante finally; consulta posterior confirmó cero registros QA restantes.
- Dos generaciones independientes de Guardar e imprimir: cinco páginas por PDF y texto idéntico; DB24-2-1INT-FE-15MM, tres RIELFE500, sin RIELTANDEM. Texto extraído con pypdf y todas las páginas renderizadas con PDFium para revisión visual. No se modificaron cotizaciones del usuario para probar DB-FE.
- `quality:gate`: 93 suites, exit 0. `quality:learn -- --strict`: cero HIGH; un MED de cobertura por nombre de archivo `cotizar.test.ts` tiene cobertura efectiva del preparador real en `db-fe.test.ts`; resto de avisos de latencia del optimizador.
- Auditoría general de las once cotizaciones existentes: cero diferencias de materiales, referencias faltantes o grupos inválidos; se detectó un descuadre de cabecera en Condominio V de 403431,14 COP / 130,14 USD, ajeno a la creación del catálogo y sin líneas DB-FE del ensayo. No se recalculó esa cotización dentro de esta tarea ni se afirma auditoría global limpia.

La implementación y las pruebas de interfaz se realizaron en LIz y entorno local; el catálogo quedó actualizado en Supabase. Relacionados: [DB mixtas](db_gavetas_mixtas.md), [rieles DB](rieles_db.md), [familias FE](visualizacion_familias_fe.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).


## Verificación previa a publicación (2026-11-04)

Por solicitud del usuario se prepara la integración LIz a DEV y DEV a main con todos los archivos. Migración 0236 confirmada en el historial de Supabase; tipo DB-FE activo y agrupable, 18 piezas y RIELFE500. Prueba SQL repetida con resultado correcto. `quality:gate:full`: 93 suites, exit 0. Nueva auditoría estricta de las 11 cotizaciones: cero diferencias y cero errores; el descuadre anterior de Condominio V ya no aparece en esta lectura, sin haber recalculado esa cotización dentro de esta publicación.

## Verificación 2026-11-07 (0251)

Recálculo atómico de 42 grupos afectados; auditoría de 12 cotizaciones y 1054 líneas: 35 módulos FE, 14 módulos 2S SM/SMG, 476 PN/F y 217 adicionales intactos. Dimensiones exteriores, cantidades, notas, áreas, grupos, configuración individual/global y herrajes comparados con respaldo: sin cambios. Auditoría estricta de propuestas: cero errores y cero diferencias. Códigos pendientes tras normalizar PN/F: cero.

Chrome local: SVFDH/SVFDH-SMG, DB-FE a 440 mm y frentes 2S a 785 mm; cuatro Excel reabiertos con medidas numéricas, selector del simulador, cero errores de consola. Dos PDF de Casa A, seis páginas cada uno, texto idéntico y revisión de las doce páginas renderizadas. SVFDH clona las seis plantillas sin diferencias imprevistas; SMG solo cambia el alto de frente. Calidad: 126 archivos / 763 pruebas; gate exit 0; learn estricto sin HIGH.

## Fondos de gaveta FE: actualización 0252

`piezasConTableroGaveta` asigna `base_gaveta` y `fondo_gaveta` a `fondo` antes de las excepciones de caja o Tablero Gaveta. Aplica a DB-FE, SM/SMG con FE y sus variantes SF; se utiliza la referencia completa de `preset.fondo`, no solamente el espesor. No afecta las paredes, dimensiones ni cantidades de gaveta. El modo sin respaldo exterior conserva el piso del cajón. Las piezas de 4,5/5,5/6/9 mm siguen sin canto.

Migración idempotente 0252 aplicada a plantillas. Caché del simulador v16 invalida resultados calculados con el material anterior sin borrar entradas. Las especificaciones impresas identifican el tablero del fondo de gavetas FE; los consumos y precios se recalculan por rol. Las selecciones individuales de fondo se conservan.

Verificación de 0252: recálculo atómico de 35 grupos FE, 35 módulos y 125 fondos (cantidades de línea, antes de repeticiones de área). Referencia del rol fondo contrastada con preset.fondo y catálogo: cero diferencias. Auditoría estricta de las doce cotizaciones: cero errores y diferencias de totales. Integridad frente al respaldo: selecciones/globales, herrajes, dimensiones exteriores, cantidades y notas intactos. Chrome local verificó DB-FE, SMG-FE y SMG-FE-SF con fondos de 6 mm, control DB sin FE con 15 mm, cuatro Excel reabiertos con espesores numéricos y dos PDF de Casa A (seis páginas, texto idéntico y páginas renderizadas revisadas). Browser plugin no disponible; se utilizó Playwright.

Las regresiones de material anterior se actualizaron con aserciones exactas del nuevo contrato: las paredes conservan caja; los pisos usan fondo. El fixture mínimo de cotizar incorpora ahora el tablero de respaldo requerido y comprueba su consumo; no se elimina ninguna aserción anterior.
