# Registro Cronológico (Log)

Registro de ingestión, consultas y cambios en la wiki.

## [2026-07-08] ingest | Inicialización de WikiLLM
Se creó la estructura base de WikiLLM siguiendo los lineamientos de Karpathy. Se añadió el documento general de la aplicación.

## [2026-07-09] ingest | Documentación de la Arquitectura Base
Se analizó el directorio `src/` (incluyendo `lib`, `app`, `store` y `components`). Se crearon los documentos `motor_calculo.md` y `arquitectura_frontend.md` para documentar el algoritmo de cotización y la estructura de Next.js. Se actualizó el índice general.

## [2026-07-09] ingest | Documentación de BBDD y Dependencias
Se analizaron los archivos `db/migrations/0001_schema.sql` y `package.json` para mapear la infraestructura relacional de Supabase y las dependencias tecnológicas del proyecto. Se crearon los documentos `esquema_base_datos.md` y `dependencias_proyecto.md` en la wiki.
## [2026-07-14] update | Desactivación global del recargo de cliente (se prioriza uso exclusivo de margen)
## [2026-07-14] update | Cambio en formato de inputs de márgenes y recargos a porcentajes (0-100) en todos los formularios de la UI

## [2026-07-14] ingest | Plan funcional y técnico para agrupación de módulos
Se documentaron las reglas de identificación, geometría compartida, compatibilidad, precios individuales, nomenclatura imperial/métrica, persistencia, interfaz, exportación, migración y pruebas. Se contrastaron las fórmulas activas de Supabase y los libros Excel del proyecto; la tabla completa de prefijos métricos queda pendiente, con `BFD -> IP` como equivalencia confirmada.

## [2026-07-14] update | Implementación de agrupación física de módulos
Se añadió la migración de grupos y nomenclaturas, el cálculo de laterales/piezas continuas y prorrateo individual, las validaciones de compatibilidad, la edición A/A1/A2 con renumeración, los códigos individuales y concatenados, subtotales y colores en UI, impresión y Excel, y la configuración administrativa de prefijos y reglas de fusión.

## [2026-07-15] update | Pruebas integradas y correcciones de precisión en agrupación
Se aplicó y verificó la migración 0020 en Supabase I+D; se añadieron ocho pruebas automatizadas y se ejecutó el flujo E2E B12.DB10.BFD20, métrico IP50, validaciones, impresión y Excel. Se corrigió el ruido de coma flotante en conversiones/prorrateos y se implementó el cierre determinístico del residuo monetario en la última línea.

## [2026-07-15] ingest | Rieles de cajón para muebles DB
Se integraron los 5 tipos de riel del Excel `materiales.xlsx` (Hoja1 sección HERRAJES) al catálogo `cot_herrajes`. Se creó la migración `0020_rieles_db.sql`, se añadió `DB_RIELES` a `muebles.ts`, se extendió `CotizarInput` con `rielCodigo` en `cotizar.ts` (override de precio en memoria, sin tocar el motor), y se agregó el selector "Tipo de riel" al simulador (`CotizadorForm.tsx`) y formulario de cotizaciones (`AddLineForm.tsx`), visible solo para muebles DB. Se creó la página `wiki/rieles_db.md`.

## [2026-07-21] update | Integración de ramas DEV y Andres en rama Solve
Se resolvió la integración de cambios remotos de DEV y Andres en la rama `Solve`, unificando las firmas de componentes (`NuevoCotizacionForm`, `CotizadorForm`, `CocinaCard`), resolviendo conflictos de tipos de TypeScript y verificando la compilación limpia de Next.js (`npm run build`).

## [2026-07-21] update | Nuevo tipo de riel: Riel full extension 500mm
Se agregó un 6º tipo de riel al catálogo, tomado de `materiales.xlsx` (Hoja1 fila 64 y hoja `Rieles`, valor $27,105 — ya existía en Hoja1 con el nombre "Costo riel full extension 500mm" y se renombró a "Riel full extension 500mm" para consistencia con el resto de la lista). Cambios: nueva entrada en `DB_RIELES` (`muebles.ts`), nueva migración `0021_riel_full_extension.sql` que inserta el registro en `cot_herrajes`. No se tocó `cotizar.ts` ni el motor: el mecanismo de override de precio por `rielCodigo` ya es genérico y toma cualquier código presente en `cot_herrajes`. El selector "Tipo de riel" en Simulador y Cotizaciones lo muestra automáticamente al iterar `DB_RIELES`. Actualizada `wiki/rieles_db.md`.

## [2026-07-21] fix | Códigos de riel en muebles.ts no coincidían con la BD real
El usuario reportó (con capturas del panel admin de Herrajes) que el catálogo real en Supabase usa códigos distintos a los que tenía `DB_RIELES`. Se consultó `cot_herrajes` directamente vía REST API y se confirmó el desajuste en 4 de 6 códigos: `RIELSLIMCHINA`→`RIELSLIMCHI`, `RIELSLIMALTO`→`SLIMBOXALTO`, `RIELSLIMBAJO`→`SLIMBOXBAJO`, y el `RIELFULLEXT500` recién agregado→`RIELFE500`. Como `cotizar.ts` indexa `herrajesByCode` por `codigo` exacto, este desajuste hacía que el override de precio fallara en silencio para esos 4 rieles (la cotización usaba el precio de `RIELTANDEM` sin importar cuál se seleccionara). Se corrigieron los códigos en `muebles.ts` para que coincidan exactamente con producción, y se actualizaron `0020_rieles_db.sql` y `0021_riel_full_extension.sql` para que un entorno nuevo se sembraría con los mismos códigos que ya están en producción. Verificado contra la BD real que los 6 códigos y precios ahora coinciden 1:1.

## [2026-07-21] update | Botones de Undo y Redo con iconos en el header superior de todos los módulos
Se creó el componente reutilizable `UndoRedoButtons` con iconos vectores claros de flecha curva (Undo/Redo) e indicadores de estado, e integrado en la barra de navegación superior principal `AppHeader` (que cubre todos los módulos: Simulador, Cotizaciones, Administración y Diseño) y en `ProyectoHeader`.

## [2026-07-21] update | Funcionalidad de Drag & Drop para muebles individuales y agrupados en el módulo de Cotización
Se implementó el soporte para arrastrar y soltar (Drag & Drop) muebles individuales y bloques de muebles combinados (2 o más módulos) dentro de la vista de cotización. Se agregaron grips draggables y botones de ajuste ▲/▼ en las tablas de cocina, la Server Action `reordenarGruposCocinaAction`, la reorganización optimista en cliente y la normalización secuencial automática de etiquetas (A, B, C...) en base de datos.

## [2026-07-21] update | Alineación de totales superiores y columna Costo por módulo en la tabla de cocina
Se agregó la columna 'Costo USD' en la tabla de módulos por cocina (`CocinaCard.tsx`) calculando el costo del módulo en USD a partir del costo total en COP dividido por la TRM del proyecto. Además, se alinearon los totales superiores de la cocina (Costo USD, Cantidad, Unit USD, Total USD y Total COP) directamente en la cabecera de la tabla con cada columna correspondiente y se removieron los totales duplicados que estaban en la barra de título de la cocina.

## [2026-07-21] ingest | Muebles esquineros ciegos BBL desde el Excel CEMA
Se analizaron 59 referencias Blind Base de `Simulación muebles CEMA (1).xlsx`: 57 `BBLFD` y 2 `BBL` con cajón. Se creó la migración `0022_muebles_bbl.sql` para activar y normalizar `BBLFD`, crear `BBL`, cargar sus piezas, reglas y herrajes como dos plantillas paramétricas y dejarlas disponibles automáticamente en los cotizadores. Se documentó la geometría y el tratamiento de variantes comerciales en `wiki/muebles_bbl.md`.

## [2026-07-21] update | Frente falso paramétrico para BBLFD
Se separó el frente de `BBLFD` en puertas y frente falso. La longitud del frente falso es la profundidad `P`; el vano de puertas es `L - P` y se divide entre `n_puertas`. Así, una o dos puertas más el paño ciego cierran exactamente el largo frontal del mueble sin requerir un override dimensional.

## [2026-07-21] update | Casilla de cantidad por cocina en módulo de cotizaciones
Se añadió la columna `cantidad` a la tabla `cot_cocinas` en base de datos (migración `0023_cocina_cantidad.sql`), permitiendo definir una cantidad por cocina que multiplica los importes y costos de la totalidad de sus muebles internos. Se actualizó la UI en `CocinaCard.tsx` con la casilla de edición rápida, la Server Action `actualizarCocinaAction`, el recomputo de totales en `lib/cotizaciones.ts`, y la visualización en la exportación Excel e impresión PDF.

## [2026-07-21] update | Conteo de muebles agrupados como un solo mueble en totalización de cocina
Se ajustó el contador total de muebles (`totalMuebles`) en `CocinaCard.tsx` para que cada bloque de muebles agrupados (que contenga 2, 3 o más módulos) contabilice como 1 solo mueble físico en los totales de la cocina y de la cabecera.

## [2026-07-22] update | Se implementó el historial persistente de versiones de cotizaciones con snapshots completos, restauración transaccional, respaldo automático e interfaz de gestión.

## [2026-07-23] ingest | Torres PCFD con gavetas ocultas de la cotización 26037
Se cruzó la cotización POD 26037 White con las filas 5448–5451 de `Simulación muebles CEMA (1).xlsx`. Se confirmó que `2OP/4OP` representa dos/cuatro gavetas ocultas, se documentaron geometría, cantos, consumibles y herrajes, y se identificó que la plantilla `PCFD` vigente no usa `n_cajones` ni `n_entrepanos` y por tanto no puede reproducir esta familia. También se registraron las inconsistencias de la descripción comercial inglesa sobre cantidad de pull-outs y puertas.

## [2026-07-23] update | PCFD paramétrico con gavetas ocultas y entrepaños editables
Se implementó y aplicó en Supabase la migración `0025_pcfd_gavetas_parametricas.sql`, los presets `STANDARD`, `2OP` y `4OP`, la edición manual de cajones, entrepaños y zócalo, la selección persistente de riel y la generación del sufijo comercial `OP-PUSH`. Se añadieron validaciones de entradas y pruebas de regresión contra la geometría CEMA de la fila 5449.

## [2026-07-23] ingest | Variantes de frente Gola identificadas como SM
Se analizaron 1.026 referencias `SM`, 209 referencias `SMG` y 478 pares exactos contra muebles base en `Simulación muebles CEMA (1).xlsx`, además de las especificaciones comerciales de las cotizaciones 25083 y 26052. Se documentó que la gola es una variante transversal de frentes, que los refuerzos cambian por familia y que la nomenclatura histórica distingue de forma inconsistente `SM`, `SMG` y `GOAL`. Se propuso un sistema de frente persistido por proyecto/línea con modificadores paramétricos por tipo de mueble.

## [2026-07-31] update | Corrección en asignación automática de bloque al agrupar o editar líneas sin grupo_id
Se corrigió la función `cambiarGrupoLinea` en `src/lib/cotizaciones.ts` para asignar y crear automáticamente un bloque de grupo en base de datos si la línea carece de `grupo_id`. Además, se previno la sustitución errónea por el índice `"1"` en `CocinaCard.tsx` cuando se edita un grupo sin bloque persistido.

## [2026-08-03] update | Ajuste visual en el simulador para evitar apiñamiento de botones
Se modificaron los botones del encabezado en `CotizadorForm.tsx` para hacerlos compactos (`UndoRedoButtons compact`) y se ajustó el contenedor con `flex-wrap` y espaciado adaptativo, previniendo solapamiento en pantallas pequeñas y anchos restringidos (380px).

## [2026-08-03] update | Simulación incremental de muebles combinados
El simulador ahora permite confirmar, heredar, editar, eliminar y reordenar múltiples módulos bajo las reglas físicas del cotizador. Se añadió validación inmediata, recálculo del conjunto, persistencia versionada del constructor y un único desglose consolidado de materiales, piezas, cantos, consumibles y herrajes.

## [2026-08-04] update | Corrección de escritura en campos numéricos (cursor-jump)
Se corrigió el bug donde al escribir en los campos numéricos de `AdminCatalogos.tsx` (parámetros globales: TRM, márgenes, desperdicios) y `ProyectoHeader-isazaale.tsx` (campo TRM), era necesario hacer clic en cada carácter. La causa era que el estado React era `number`, y cada pulsación de tecla disparaba `Number(e.target.value)` que re-renderizaba el input controlado perdiendo el cursor. Solución: el campo ahora usa estado local `string` para la edición libre (`onChange`), y solo convierte y propaga el número al padre en el evento `onBlur`.

## [2026-08-10] update | Los "materiales globales" del proyecto ahora se persisten en BD
Se corrigió que el preset de materiales globales (tableros, perfil, cantos, margen) elegido en "Nuevo proyecto / cotización" se perdía al reabrir la cotización más tarde: solo viajaba en el parámetro `?cfg=` de la redirección de creación, nunca se guardaba. Se agregó la columna `config_default jsonb` a `cot_cotizaciones` (migración `0026_config_default_cotizacion.sql`, aplicada y verificada en Supabase I+D). `crearCotizacion` ahora la guarda al crear el proyecto, y cada cambio en el panel "Materiales del proyecto" se persiste vía `actualizarCotizacionAction`. `page.tsx` prioriza `config_default` de BD sobre `?cfg` al cargar la página. Ver [esquema_base_datos.md](wiki/esquema_base_datos.md).

## [2026-08-10] update | El código de módulo DB ahora incluye el sufijo de tipología (ej. DB15-1S)
Se corrigió que el código de módulo mostrado en la tabla de la cocina (`codigo_modulo`) perdía el sufijo de la "Tipología DB" (ej. `-1S`, `-2S`) elegida en el formulario, tanto al crear como al editar un mueble de cajonera. La causa: `recalcularGrupo()` en `src/lib/cotizaciones.ts` siempre reconstruye `codigo_modulo` a partir del prefijo base del tipo (`prefImperial`/`prefMetrico`, ej. `DB`) más el largo, y la tipología elegida nunca se guardaba en ningún campo — solo existía transitoriamente en el estado del formulario. Se agregó `dbTipo` a `AgregarLineaInput`/`config` de la línea (persistido en `cot_cotizacion_lineas.config.dbTipo`) y `recalcularGrupo()` ahora anexa el sufijo (`dbTipo.split('-').slice(1).join('-')`) al código recalculado. También se restauró `dbTipo` al abrir "Editar mueble" (antes siempre arrancaba en blanco). Ver [esquema_base_datos.md](wiki/esquema_base_datos.md).

## [2026-08-10] update | El código de módulo W ahora incluye el alto (ej. W3614)
Se agregó el alto al código de módulo de los muebles `W` (superior de pared / Wall cabinet), que a diferencia de los demás tipos sí tiene alto variable. `recalcularGrupo()` en `src/lib/cotizaciones.ts` anexa `anchoCodigo(alto, ...)` justo después del largo cuando el prefijo base es `W` (ej. largo 36 + alto 14 → `W3614`). Primera versión de este fix usaba la profundidad (`W3612`); se corrigió a alto por pedido explícito del usuario. Ver [esquema_base_datos.md](wiki/esquema_base_datos.md).

## [2026-08-10] update | El campo Prof arranca en 12 al elegir un tipo W
En `AddLineForm.tsx`, seleccionar un tipo de mueble `W` (superior de pared) en el combo "Tipo" ahora fuerza el campo "Prof" a `12` por defecto (`handleTipoChange`). Antes conservaba lo que trajera `projectDefaults`/el mueble anterior, lo que no correspondía al fondo estándar de un superior de pared. Ver [esquema_base_datos.md](wiki/esquema_base_datos.md).

## [2026-08-10] update | "Agregar mueble" recuerda los materiales del último mueble agregado
Antes, al abrir "Agregar mueble" para un nuevo módulo, los tableros y cantos siempre volvían al preset fijado al crear el proyecto (`config_default`), aunque el mueble anterior se hubiera cotizado con materiales distintos. Ahora `AddLineForm` reporta (vía el nuevo prop `onMaterialesUsados`) los tableros/cantos usados cada vez que se agrega un mueble (no al editar); `CotizacionDetalleClient` los mezcla en `projectDefaults` y los persiste con `actualizarCotizacionAction`. El siguiente mueble que se agregue —en la misma pestaña, en otra pestaña, o al reabrir la cotización otro día— arranca con esos materiales. Ver [esquema_base_datos.md](wiki/esquema_base_datos.md).

## [2026-08-10] lint | Barrido de errores de typecheck/lint tras el merge con DEV
`npx eslint .` pasó de 15 errores a 0 (quedan solo warnings de estilo, en su mayoría en archivos `-isazaale` que ya no se importan en la app viva). Se corrigieron 3 problemas reales:
- `AdminCatalogos.tsx`: `NumInput` estaba definido dentro de `ParametrosEditor` (se recreaba en cada render, arriesgando perder el estado del input al escribir — variante del bug de cursor-jump ya resuelto antes). Se movió a componente de módulo.
- `CocinaCard.tsx`: `setCantCocina`/`setLocalGroupOrder` se llamaban dentro de un `useEffect` solo para sincronizar con props (`cocina.cantidad`, `cocina.lineas`); se reemplazó por el patrón de React "ajustar estado durante el render" (comparar contra el valor previo guardado en estado, sin efecto). Se tipó `Linea.breakdown` en vez de castear con `as any`.
- `DisenoEditor.tsx`: se tipó el estado de `Preview` como `CotizarResult` en vez de `any`. El tipo `Row` (fila de catálogo con columnas dinámicas por tabla) se dejó como `any` con un `eslint-disable` puntual y justificado — pasar a `Record<string, unknown>` dispara ~40 errores en cascada por los accesos a campos dinámicos a lo largo del archivo, sin beneficio real en esta pantalla admin secundaria.
Se revisó también el log del servidor de desarrollo (`.next/dev/logs/next-development.log`): los únicos errores de runtime registrados fueron ruido transitorio del propio merge (marcadores de conflicto durante la edición en vivo) y una advertencia de migración de Zustand (`simulador-storage`) atribuible a una pestaña de navegador con un bundle en caché desde antes de que existiera `migrate()`, no a un defecto del código actual (`migrate` y `version` siempre se agregaron juntos en el historial de git). No se encontraron más errores distintos. 16/16 tests (`tests/*.test.ts`) siguen pasando.
