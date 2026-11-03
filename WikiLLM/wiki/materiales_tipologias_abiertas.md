# Material de caja y refuerzos en tipologías abiertas

## Regla

OBFD, OBFD-SM, OSBFD-SM y OW usan el tablero de **frentes** también en los roles **caja** y **refuerzo**. Incluye sus variantes sin fondo `-SF`, pero no OSBFD, OW-MO ni otros tipos. Aplica igualmente a entrepaños y golas que consuman esos roles. El fondo y los cantos conservan su selección; no se añaden puertas.

La selección procede de Características del proyecto según la familia de la tipología; un área cuyo nombre contiene closet conserva prioridad. Sin selección global de frente, se utiliza el frente ya conocido de la línea. Si tampoco existe, no se inventa una referencia.

## Implementación

- `presetMaterialesTipologia` en `src/lib/materiales-proyecto.ts` deriva caja y refuerzo después de resolver los materiales globales. No muta los presets originales ni la configuración global de la familia, porque los muebles cerrados mantienen sus propios materiales de caja.
- `prepararCotizacion` aplica la misma regla con catálogo precompilado y con consultas directas. El cálculo de madera, precio, espesor y visualización recibe el preset efectivo: por ejemplo, un frente de 18 mm sustituye la caja previa de 15 mm también en `TC`.
- `AddLineForm` muestra la caja derivada como campo deshabilitado y permite consultar el frente aunque la plantilla abierta no contenga piezas con ese rol. Cambiar el frente actualiza la caja visible sin efectos de sincronización. El indicador de materiales globales compara el preset efectivo. Al recordar materiales tras agregar un módulo se conserva el preset seleccionado de la familia, evitando propagar la caja derivada a los muebles cerrados.
- Las especificaciones del PDF describen esta excepción junto al tablero de frentes solo en las familias que realmente contienen estos abiertos. El resumen económico sigue usando los importes recalculados.

## Aplicación histórica limitada

`scripts/aplicar-materiales-abiertos.ts` es de solo lectura por defecto. Planifica exclusivamente líneas de las tipologías indicadas que difieran de la regla; valida catálogo y simula sus grupos antes de escribir. Rechaza cualquier grupo que incluya una línea fuera del plan. Con `--apply` guarda un respaldo en el directorio temporal y sincroniza mediante `lineasPermitidas`.

La sincronización limitada no modifica otras líneas, otras áreas ni `config_default`; recalcula los grupos permitidos, sus áreas y la cabecera correspondiente. La sincronización normal de Características y restauración de versiones sigue aplicando las reglas a toda la cotización. Los snapshots de versiones anteriores no se reescriben.

El 2026-11-03 se actualizaron 7 módulos OW en 7 grupos: KUNDARA (3), Casa Poro - Casa modelo (2) y Casa Poro - Casa modelo - Color Tendencia (2). Respaldo: `cotizador-respaldo-abiertos-1793711475741.json` en el directorio temporal del sistema. Comparación independiente con el respaldo: las otras 355 líneas de esos proyectos y sus selecciones globales quedaron intactas; fondos y cantos de los abiertos se conservaron. La segunda simulación no encontró pendientes. Auditoría estricta de las 10 cotizaciones: cero diferencias de materiales, referencias faltantes, grupos inválidos o errores de totales.

| Cotización | Total antes COP | Total después COP |
| --- | ---: | ---: |
| KUNDARA | 1.584.337.544,71 | 1.585.644.483,29 |
| Casa Poro - Casa modelo | 19.557.944,02 | 19.583.179,59 |
| Casa Poro - Casa modelo - Color Tendencia | 18.577.380,94 | 18.602.616,51 |

## Cobertura

`tests/materiales-proyecto.test.ts` cubre familia, closet, fallback histórico, referencias sin frente y exclusión de tipos ajenos. `tests/cotizar-materiales-abiertos.test.ts` ejecuta el preparador y motor reales con catálogo en memoria: materiales de caja/refuerzo/fondo y dimensiones con `TC` de 18 mm. `tests/cotizaciones.test.ts` cubre persistencia, segunda pasada idempotente, alcance limitado y rechazo de grupos mixtos antes de escribir.

Gate aprobado con 92 suites, sin regresiones de tipos o ESLint. `quality:learn -- --strict` sin HIGH. Su aviso MED sobre ausencia de `tests/cotizar.test.ts` es una heurística de nombre: la cobertura real del preparador está en `tests/cotizar-materiales-abiertos.test.ts`; los otros avisos son de latencia del optimizador.

En Chromium local, viewport 1440×1000, se abrió el editor de OW: caja deshabilitada y coincidente con frente de 18 mm; cambiar el frente actualizó la caja visible, cancelar y reabrir recuperó la selección persistida. No hubo errores de aplicación. La prueba de alta/eliminación de una cotización temporal fue rechazada por revisión automática por implicar escrituras en la base real; no se creó ese registro. El guardado se cubre con las pruebas de persistencia en memoria, sin afirmar una prueba de alta nueva en producción.

Se abrieron las 10 vistas de impresión y se generaron dos PDF desde recargas independientes de Casa Poro (8 páginas), su versión Color Tendencia (7), KUNDARA (9) y Milán Closet (4). En cada pasada se ejecutó Guardar e imprimir; texto completo idéntico entre pares, cantidades de adicionales contrastadas con una consulta independiente. Se revisaron los mosaicos de todas las páginas y la página de especificaciones renderizada a tamaño completo con PDFium. Browser plugin no disponible: se usó Playwright. No se verificaron otros navegadores, impresión física ni despliegue remoto.

Relacionados: [Protocolo de PDF](protocolo_pdf_cotizaciones.md), [Arquitectura frontend](arquitectura_frontend.md).
