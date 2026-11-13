# HDR: Buscar/Crear y Seguimiento

## Orden de la pestaña

La página `/hdr` presenta, en este orden: HDR desde cotización guardada, Consumos, Seguimiento y Buscar/Crear. Cada selector conserva su propio estado; seleccionar una cotización en Seguimiento no cambia las HDR o los consumos de las otras secciones.

## Buscar/Crear

La parte superior permite escribir el nombre completo o parcial de una HDR y pulsar **Buscar**. `buscarMueblesHdrAction` exige rol administrador, consulta las cotizaciones accesibles y compara sus nombres actuales, sin distinguir mayúsculas o tildes para la búsqueda. Las palabras introducidas deben estar presentes en el nombre. No modifica cotizaciones ni guarda muebles nuevos.

Los resultados identifican proyecto, sección y nombre completo. Al seleccionar uno se muestra su despiece mediante la misma `HdrTabla` usada en la sección superior. Los grupos físicos permanecen completos: una coincidencia dentro de un grupo devuelve su HDR física, con sus piezas compartidas. Las incidencias de cálculo o lectura se muestran; no se informa de una búsqueda completa si alguna cotización no pudo revisarse. Los avisos de validación permanecen visibles y no se permite usar la búsqueda para exportar una HDR con revisiones pendientes.

La consulta comparte un catálogo precompilado por búsqueda y procesa hasta tres cotizaciones a la vez. Evita consultar los catálogos por cada módulo individual. El buscador limita el texto a 200 caracteres y no incorpora la entrada del usuario en filtros SQL.

Debajo permanece el formulario de tipo, dimensiones, unidad y opciones existentes; su botón se llama **Crear**. Genera una vista previa de HDR con el motor actual, como antes; no añade automáticamente una línea a una cotización.

## Seguimiento y Excel

Al seleccionar una cotización, se recalculan sus HDR y se descarga un libro `.xlsx` con dos hojas: **Seguimiento** y **Códigos**. Hay también un botón para repetir la descarga sin cambiar de cotización. El nombre incluye proyecto y fecha de Bogotá. Cambiar rápidamente la selección invalida las respuestas y descargas de selecciones anteriores, incluso si el archivo ya se estaba preparando.

Los nombres proceden de `tituloModuloHdr`, compartido con el encabezado de las HDR. En Seguimiento se muestran completos, sin agregar el prefijo HRJ de la imagen de referencia. En Buscar/Crear, el interruptor **Prefijo HRJ** antepone `HRJ ` al nombre mostrado y exportado (PDF y Excel) del mueble buscado o creado; omite las tipologías PN, F y TK y no duplica un prefijo ya presente. Se eliminan únicamente nombres exactamente iguales, comparando cada carácter: mayúsculas, espacios, tildes y sufijos L/R distintos se conservan como nombres separados. La búsqueda flexible no se reutiliza para deduplicar.

Orden de grupos: **Inferiores → Superiores → Baños → Clósets → Fillers → Paneles**. Dentro de cada grupo se aplica orden alfabético español y numérico natural. Paneles y fillers mantienen sus grupos propios aunque estén en una sección de clóset. Las otras piezas de una sección cuyo nombre contiene closet se clasifican como clóset; las categorías del catálogo permiten reconocer variantes de baño. Los grupos físicos usan el contexto de sus piezas para resolver su familia. Si el mismo nombre aparece en más de una familia, se conserva una sola aparición en el primer grupo según el orden indicado.

No se exportan cantidades ni consumos. Una línea de mueble con error de cálculo impide generar un listado incompleto.

### Hoja Seguimiento

Replica las fases DISEÑO, EMPAQUE y ENTREGA, la fila Responsable y las 18 actividades de la referencia. Los responsables solicitados quedan asignados así: B:G Angie/Lizeth, H:K Elias, L:R Mariana/Liz/Angie/Elias y S Angie/Liz. Las actividades quedan vacias para marcar manualmente, sin controles ni valores booleanos. Revisión HDR y Corrección HDR conservan el encabezado rojo de la referencia. Los separadores de familias tienen fondo durazno y los nombres de fillers/paneles fondo rosado. Se congelan encabezados y la columna de nombres; las alturas de las filas se adaptan al largo del nombre.

`generarArchivoSeguimiento()` serializa directamente con ExcelJS, sin extensiones de controles. Se conservan responsables, formato, nombres y grupos.

### Hoja Códigos

Encabezados: REF, Muebles, Código, Descripción español, Descripción inglés, LdM, % DESPERDICIO, Herrajes y Consecutivo. Solo **Muebles** contiene los nombres generados; todos los demás campos de cada mueble quedan vacíos para llenar manualmente. No se copian códigos, descripciones, marcas LdM, porcentaje 15, letras x, material/color ni errores `#REF!` de la imagen. No se generan fórmulas.

## Verificación y límites

`tests/hdr-buscar-seguimiento.test.ts` verifica orden, nombres exactos, permisos, errores, cancelacion y pantalla. Genera y reabre el XLSX final: actividades vacias, responsables conservados y ausencia de booleanos, controles, formulas y errores.

`quality:gate` aprobó con exit 0 las 133 suites, TypeScript y el trinquete de ESLint. El build de producción terminó con exit 0. `quality:learn -- --strict` no encontró HIGH. Evidencia local: `.tmp/hdr-buscar-seguimiento-gate-final.txt`, `.tmp/hdr-buscar-seguimiento-build.txt` y `.tmp/hdr-buscar-seguimiento-learn.txt`.

Tras asignar responsables e incorporar las casillas nativas, se repitieron gate (133 suites, exit 0), build (exit 0) y auditoría consultiva sin HIGH. Evidencia de esta actualización: `.tmp/seguimiento-responsables-gate.txt`, `.tmp/seguimiento-responsables-build.txt` y `.tmp/seguimiento-responsables-learn.txt`. El control XML y la reapertura del archivo verifican su estructura; no sustituyen una prueba visual con Excel interactivo.

La validación de HTML usa renderizado de React, sin navegador interactivo. En esta sesión no hay plugin Browser ni Playwright instalado; el acceso a pestañas y el control nativo de Edge tenían los bloqueos documentados en [apertura L/R](apertura_superiores_una_puerta.md). No se afirma una prueba visual de navegador o de Excel, ni una doble generación de PDF. Esta modificación no altera las fórmulas de despiece, medidas, materiales, precios o datos de Supabase.

Relacionados: [consumos](hdr_consumos.md), [HDR y Excel continuo](hdr_excel_consolidado.md), [instrucciones R…L](hdr_instrucciones_ranura.md).

El 2026-11-10 se retiraron las casillas porque la evidencia del usuario mostraba FALSO en Excel. Las actividades se completan manualmente en celdas vacias.
