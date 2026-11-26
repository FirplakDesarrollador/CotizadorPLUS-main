# HDR: Buscar/Crear y Seguimiento

## Orden de la pestaña

Diseño abre Seguimiento en `/admin/diseno?seccion=seguimiento`. HDR y Consumos mantienen sus propios selectores en sus secciones de Diseño.

## Buscar/Crear

La parte superior permite escribir el nombre completo o parcial de una HDR y pulsar **Buscar**. `buscarMueblesHdrAction` exige rol administrador, consulta las cotizaciones accesibles y compara sus nombres actuales, sin distinguir mayúsculas o tildes para la búsqueda. Las palabras introducidas deben estar presentes en el nombre. No modifica cotizaciones ni guarda muebles nuevos.

Los resultados identifican proyecto, sección y nombre completo. Al seleccionar uno se muestra su despiece mediante la misma `HdrTabla` usada en la sección superior. Los grupos físicos permanecen completos: una coincidencia dentro de un grupo devuelve su HDR física, con sus piezas compartidas. Las incidencias de cálculo o lectura se muestran; no se informa de una búsqueda completa si alguna cotización no pudo revisarse. Los avisos de validación permanecen visibles y no se permite usar la búsqueda para exportar una HDR con revisiones pendientes.

La consulta comparte un catálogo precompilado por búsqueda y procesa hasta tres cotizaciones a la vez. Evita consultar los catálogos por cada módulo individual. El buscador limita el texto a 200 caracteres y no incorpora la entrada del usuario en filtros SQL.

Debajo permanece el formulario de tipo, dimensiones, unidad y opciones existentes; su botón se llama **Crear**. Genera una vista previa de HDR con el motor actual, como antes; no añade automáticamente una línea a una cotización.

## Seguimiento y Excel

La parte superior lista los seguimientos guardados y su avance. Al abrir uno, se recuperan sus responsables, muebles y casillas. Seleccionar una cotización que aún no tiene seguimiento recalcula sus HDR y abre un borrador. Debajo de los responsables se muestra una matriz con las 18 actividades por mueble, agrupadas en Diseño, Empaque y Entrega. El avance general divide las casillas marcadas por el total de casillas. Cada fila muestra su propio avance sobre 18 actividades.

**Guardar seguimiento** crea un registro por cotización o actualiza el existente. La primera escritura conserva una copia de los nombres y grupos de los muebles. Las siguientes actualizan responsables y marcas con control de revisión para evitar sobrescribir una edición guardada desde otra sesión. La migración `0269_hdr_seguimientos.sql` crea la tabla y restringe las operaciones al rol administrador.

**Descargar plantilla Excel** genera el libro `.xlsx` de dos hojas, **Seguimiento** y **Códigos**, con los nombres del seguimiento abierto, las casillas vacías y los responsables predeterminados de la plantilla. El nombre incluye proyecto y fecha de Bogotá.

Los nombres proceden de `tituloModuloHdr`, compartido con el encabezado de las HDR. En Seguimiento se muestran completos, sin agregar el prefijo HRJ de la imagen de referencia. En Buscar/Crear, el interruptor **Prefijo HRJ** antepone `HRJ ` al nombre mostrado y exportado (PDF y Excel) del mueble buscado o creado; omite las tipologías PN, F y TK y no duplica un prefijo ya presente. Se eliminan únicamente nombres exactamente iguales, comparando cada carácter: mayúsculas, espacios, tildes y sufijos L/R distintos se conservan como nombres separados. La búsqueda flexible no se reutiliza para deduplicar.

Orden de grupos: **Inferiores → Superiores → Baños → Clósets → Fillers → Paneles**. Dentro de cada grupo se aplica orden alfabético español y numérico natural. Paneles y fillers mantienen sus grupos propios aunque estén en una sección de clóset. Las otras piezas de una sección cuyo nombre contiene closet se clasifican como clóset; las categorías del catálogo permiten reconocer variantes de baño. Los grupos físicos usan el contexto de sus piezas para resolver su familia. Si el mismo nombre aparece en más de una familia, se conserva una sola aparición en el primer grupo según el orden indicado.

No se exportan cantidades ni consumos. Una línea de mueble con error de cálculo impide generar un listado incompleto.

### Hoja Seguimiento

Replica las fases DISEÑO, EMPAQUE y ENTREGA, la fila Responsable y las 18 actividades de la referencia. Los responsables solicitados quedan asignados así: B:G Angie/Lizeth, H:K Elias, L:R Mariana/Liz/Angie/Elias y S Angie/Liz. Las actividades quedan vacias para marcar manualmente, sin controles ni valores booleanos. Revisión HDR y Corrección HDR conservan el encabezado rojo de la referencia. Los separadores de familias tienen fondo durazno y los nombres de fillers/paneles fondo rosado. Se congelan encabezados y la columna de nombres; las alturas de las filas se adaptan al largo del nombre.

`generarArchivoSeguimiento()` serializa directamente con ExcelJS, sin extensiones de controles. Se conservan responsables, formato, nombres y grupos.

### Hoja Códigos

Encabezados: REF, Muebles, Código, Descripción español, Descripción inglés, LdM, % DESPERDICIO, Herrajes y Consecutivo. Solo **Muebles** contiene los nombres generados; todos los demás campos de cada mueble quedan vacíos para llenar manualmente. No se copian códigos, descripciones, marcas LdM, porcentaje 15, letras x, material/color ni errores `#REF!` de la imagen. No se generan fórmulas.

## Verificación y límites

`tests/hdr-buscar-seguimiento.test.ts` verifica orden, nombres exactos, permisos, errores, cancelación y pantalla. Genera y reabre el XLSX final para verificar actividades vacías, responsables y estructura. También cubre el cálculo de avance, la validación de marcas y la reapertura de un seguimiento con una base simulada, incluido el rechazo de una revisión antigua.

`quality:gate` aprobó con exit 0 las 133 suites, TypeScript y el trinquete de ESLint. El build de producción terminó con exit 0. `quality:learn -- --strict` no encontró HIGH. Evidencia local: `.tmp/hdr-buscar-seguimiento-gate-final.txt`, `.tmp/hdr-buscar-seguimiento-build.txt` y `.tmp/hdr-buscar-seguimiento-learn.txt`.

Tras asignar responsables e incorporar las casillas nativas, se repitieron gate (133 suites, exit 0), build (exit 0) y auditoría consultiva sin HIGH. Evidencia de esta actualización: `.tmp/seguimiento-responsables-gate.txt`, `.tmp/seguimiento-responsables-build.txt` y `.tmp/seguimiento-responsables-learn.txt`. El control XML y la reapertura del archivo verifican su estructura; no sustituyen una prueba visual con Excel interactivo.

En la actualización del 26 de noviembre se verificó la pantalla de Seguimiento en Chromium con Playwright, a 1440 × 1000 y 390 × 844. Se probó seleccionar una cotización, editar un responsable, marcar y desmarcar, guardar, recargar y abrir el seguimiento conservando los cambios. La prueba de navegador usó acciones simuladas.

La migración 0269 se aplicó en Supabase con la versión `20261126215506`. Se verificaron el registro de migración, la tabla `public.hdr_seguimientos`, su índice, las políticas RLS de administrador y los permisos de actualización por columna.

Relacionados: [consumos](hdr_consumos.md), [HDR y Excel continuo](hdr_excel_consolidado.md), [instrucciones R…L](hdr_instrucciones_ranura.md).

El 2026-11-10 se retiraron las casillas porque la evidencia del usuario mostraba FALSO en Excel. Las actividades se completan manualmente en celdas vacias.
