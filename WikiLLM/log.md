# Registro Cronológico (Log)

## [2026-10-04] fix | La barra de acciones de las plantillas CEMA y FIRPLAK permite salto de línea y mantiene visibles Volver, Guardar y Guardar e imprimir / PDF en ventanas angostas.

## [2026-10-04] ingest | Analizado `FPK cotizacion.xlsx` e implementada la plantilla FIRPLAK editable y autoseleccionada al imprimir, con resumen calculado, especificaciones, programación de módulos e imágenes originales; migración 0178 aplicada.

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

## [2026-08-11] update | Piezas de cajoneras DB con gavetas mixtas (DB-1S, DB-2S) ahora coinciden con la lista de corte real
Se corrigió que el despiece de módulos DB-1S/DB-2S (1 o 2 cajones "pequeños" + el resto "grandes") mostrara todos los frentes/traseros de gaveta del mismo tamaño (`A/n_cajones`), cuando la lista de corte real de producción tiene tamaños distintos por posición. Causa raíz: el motor (`engine.ts`) solo sabe calcular "N copias de un mismo tamaño" por fila de `cot_piezas_plantilla`, sin noción de posición dentro del cajón. Solución (migración `0027_db_gavetas_mixtas.sql`): nueva variable derivada `n_cajones_pequenos` (regla default 0, sobreescrita por `DB_TIPOLOGIAS[...].npeq` desde `AddLineForm.tsx`/`CotizadorForm.tsx` al elegir tipología); piezas nuevas `frente_gaveta_pequena`/`frente_gaveta_grande` (pequeño fijo en 6", grandes reparten el resto del Alto descontando 3.2mm de reveal por cajón) y `trasero_gaveta_pequena`/`trasero_gaveta_grande` (alto fijo 68mm/183mm por posición, confirmado con el usuario); las piezas `frente`/`trasero_gaveta` originales quedan en 0 unidades cuando la tipología es mixta, así que las tipologías parejas (DB-2/3/4) no cambian de comportamiento. También se corrigió `base_gaveta.formula_largo` (`L-2.95`→`L-4.13`), que estaba mal en todas las tipologías DB (no solo las mixtas). Verificado contra la lista de corte real de un `DB15-1S` (15x30x24") con menos de 0.1mm de diferencia en cada pieza. Test de regresión: `tests/db-gavetas-mixtas.test.ts`. Quedan sin resolver (flag, no confirmados): ancho de `refuerzo_trasero`/`refuerzo_horizontal` (3.25"→~3.15"?), ancho de `base` (P-0.9→P-0.945?), y la pieza `BACKING` (falta por completo, requiere definir su rol de tablero). Ver [db_gavetas_mixtas.md](wiki/db_gavetas_mixtas.md).

## [2026-08-11] update | El despiece del Simulador oculta piezas con cantidad 0
Se confirmó con el usuario que el alcance de la división pequeña/grande queda solo para tipologías DB mixtas (no aplica a DB-2/3/4). La tabla "Piezas (despiece)" de `CotizadorForm.tsx` listaba también las filas con `cant=0` (ej. `frente` genérico cuando la tipología es mixta, o `frente_gaveta_pequena/grande` cuando no lo es), lo cual confundía al usuario haciéndole pensar que la pieza "frente" seguía activa. Se agregó `filter((p) => p.cant > 0)` antes de renderizar la tabla — no se borra nada de `cot_piezas_plantilla` (esas filas siguen siendo necesarias para otras tipologías), solo se oculta lo que no se produce. Ver [db_gavetas_mixtas.md](wiki/db_gavetas_mixtas.md).

## [2026-08-12] update | Validación de costos de tipología DB-1S contra "Simulación muebles CEMA (1).xlsx"
Se corrió `calcularMueble()` con las piezas reales de DB (post-migración `0027_db_gavetas_mixtas.sql`, leídas de Supabase I+D) para `DB15-1s` (L=15", A=30", P=24", `n_cajones=3`, `n_cajones_pequenos=1`, `n_barras=2`) y se comparó contra la fila 2140 de la hoja `Costos Muebles` del Excel CEMA, usando los precios unitarios tal como están hardcodeados en la hoja `costos unitarios` del propio Excel (para aislar fórmula/geometría de la deriva de precios de catálogo). Resultado: **Costo hardware coincide exactamente** ($199,386.40, confirma que `n_barras` debe fijarse desde `DB_TIPOLOGIAS[...].nb` — sin ese override el hardware queda corto en $19,600, el costo de 2 pares de barra estabilizadora); **Costo con herrajes** coincide con **-0.10% de diferencia** ($314,384.07 vs $314,712.66). El -0.28% de diferencia en "costo sin herrajes" es consistente con los ajustes de `refuerzo_trasero`/`base` ya señalados como no confirmados en la validación de piezas del 2026-08-11. Con los precios *actuales* de catálogo (no los del Excel) el total difiere más porque algunos tableros/cantos ya subieron de precio desde que se armó el Excel — deriva de precio esperada, no defecto de fórmula. Ver [db_gavetas_mixtas.md](wiki/db_gavetas_mixtas.md).

## [2026-08-13] fix | Medidas en fracción imperial ("24 7/8") corrompían el módulo a 0x0x0
El usuario reportó un módulo `PN` (Panel) mostrando código `PN0` y descripción "0x0x0 in", con un costo casi nulo. Causa: los campos Largo/Alto/Prof de `AddLineForm.tsx` (Cotizaciones) son de texto libre para permitir fracciones imperiales, pero se convertían con `Number(largo)` directo — `Number("24 7/8")` da `NaN`, que `JSON.stringify` serializa como `null`, y la columna `numeric` nullable de `cot_cotizacion_lineas` lo guarda como `NULL`; al releerlo, `Number(null)` es `0`. No había ningún error visible, la línea se guardaba "exitosamente" con dimensiones en 0. El Simulador (`CotizadorForm.tsx`) no tiene este bug porque usa `<input type="number">` nativo, que rechaza el formato fracción de entrada. Se agregó `parseMedida()` en `src/lib/module-groups.ts` (interpreta `24 7/8`, `24-7/8`, `7/8` y decimales planos) y se usa en `AddLineForm.tsx` en vez de `Number()` directo; además `onSubmit` ahora bloquea el guardado con un mensaje si alguna medida no se puede interpretar, en vez de guardar silenciosamente un módulo corrupto. De paso se agregó el alto al código de módulo de `PN` (mismo criterio que `W`: `PN2435` en vez de solo `PN24`), que era el pedido original del usuario. Test: `tests/module-groups.test.ts`. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md).

## [2026-08-23] ingest | Validación sistemática del motor contra 1.937 hojas de ruta reales de producción
Se ingirió `Hojas de ruta 2.xlsx` (export de la lista SharePoint del sitio `FPKFabricademuebles`): 17.876 piezas en 1.937 hojas, 2023-03 a 2026-08. Hallazgo metodológico: la columna `Formula` contiene un DSL paramétrico del propio fabricante (`LxL{-30}LyL` = Largo(pieza)=L−30mm, `AxL[0,4958]LyA` = Ancho=L×0,4958; `{}` offset aditivo en mm, `[]` factor). Como cada pieza aporta una ecuación sobre L/A/P, cada hoja queda sobredeterminada y se puede recuperar el módulo por consenso y detectar piezas discrepantes sin conocer la tipología. Se construyó `scripts/validar_hojas_ruta.py` con tres validaciones (coherencia interna, cierre de la pila de frentes contra el Alto, constante interior contra el espesor). Calidad de la fuente: 1.796/1.832 hojas con fórmula son internamente coherentes (98,0%), así que sirve como ground truth. **Tres defectos del cotizador confirmados:** (1) la constante interior no es fija sino `L − 2×espesor_lateral` (15mm→L−30 en 4.968 filas, 18mm→L−36 en 641, 25mm→L−50, 30mm→L−60), mientras `cot_piezas_plantilla` tiene `L-1.18` codificado en 57 plantillas y ninguna fórmula referencia el espesor — todo mueble de carcasa 18mm sale con piezas interiores 6mm largas, y el 18mm pasó de 2% de las hojas en 2024 a 33% en 2026; `L-31` resultó ser un artefacto legado de 2023, no una alternativa válida. (2) La regla de frentes de `0027_db_gavetas_mixtas.sql` ("pequeña 6\" fija, grandes reparten el resto") solo es correcta para DB-1S; DB-2S usa una rejilla de 4 unidades (187,3/187,3/377,8 con A=762, cierre exacto), así que la fórmula actual da −34,9mm en las pequeñas y +69,8mm en la grande. (3) Las puertas no descuentan el reveal: producción usa `(L−2×3,2)/2` de ancho y `A−3,2` de alto, la plantilla usa `L/n_puertas` y `A`. **Validado como correcto:** el resto de `0027` (frente pequeño 152,4mm, traseros 68/183mm, `L-4.607`, `L-4.13`) coincide al milímetro en decenas de hojas, no solo en el `DB15-1S` con que se dedujo. **Modificadores transversales identificados** (no son tipologías nuevas): `O…`=abierto (`OBFD30` es `BFD30` sin las 2 puertas y nada más), `…R`=removible (sí cambia estructura: rails de 139,3/120,75mm), `SM`/`SMG`=gola (agrega 2 piezas `GOLA` de `(L−30)×80×15`, baja los rails delanteros de 3 a 2 y consume 53,6mm del alto de frentes repartidos a 13,4mm por unidad de rejilla — la evidencia de despiece que faltaba en la investigación previa de `variantes_frente_gola_sm.md`), `-F9`=fondo 9mm (`ancho_base = P − 18 − espesor_fondo`), `I…`=nomenclatura métrica (`IC`→DB, `ILVP`→SBFD, candidatos para `pref_metrico`). **Sin mapear con volumen real:** línea completa de clósets (`CC`/`WCC`/`CLV`/`CDB`/`CTK`/`SC`/`DFE`, 60 SKUs), superiores especiales (`S`/`SA`/`SLOC`/`SMO`/`SBAS`/`SEC`, 43), resto de la línea U (`USVFD` 36 + 20 más), hornos/microondas (`BOV`/`BMW`/`IHFC`, 13). **Errores devueltos a Diseño de producto:** 6 hojas DB-2S con el frente inferior copiado del patrón 1S (300,1 en vez de 377,8, faltan 77,7mm), `DB12-2S` incompleta, `W2128` con base/tapa/rail de un mueble de 15" (152,4mm cortas) y 4 hojas `W30xx` con el `BACKING` mal anotado. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md).

## [2026-08-23] update | Corrección de la nomenclatura del DSL de hojas de ruta: `A` es Ancho del mueble, no Alto
El usuario corrigió la glosa del DSL documentado ese mismo día. En la formulación (antigua) de las hojas de ruta, el mueble tiene `L` = **Largo**, `A` = **Ancho** y `P` = **Profundo**, y la pieza solo tiene Largo y Ancho; cada token define el Largo o el Ancho de la pieza indicando de cuál de las tres dimensiones del mueble proviene (`<pieza>x<mueble>{offset}<mueble>y<pieza>`, enunciado de ida y vuelta). Se había escrito `A` como "Alto del módulo", tomando prestado el vocabulario del cotizador. El parser de `scripts/validar_hojas_ruta.py` indexa por la letra, no por la glosa, así que **ninguna cifra ni conclusión del estudio cambia**; lo corregido es la documentación. Se verificó además que la correspondencia física es 1:1 entre ambos sistemas, usando las 419 hojas `W`/`UW`/`OW` cuyo SKU codifica las dos medidas (`W3014` = 30 × 14): el `L` recuperado coincide con el primer número del código en 418/419 casos y el `A` recuperado con el segundo en 419/419. Es decir `A`(Ancho, hoja de ruta) y `A`(Alto, app) son la misma dimensión vertical — un falso amigo de vocabulario, no un desalineamiento de ejes, y quedó documentado como tal para que nadie reordene ejes al cruzar las dos fuentes. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §1.

## [2026-08-24] update | Correcciones de geometría, modificadores transversales y 29 tipologías nuevas en el simulador
Implementación de los tres frentes que salieron del estudio de hojas de ruta. **Motor** (`src/lib/engine.ts`): nueva función exportada `geoVars()` que inyecta en el contexto de toda fórmula las constantes `RV` (reveal 3.2mm), `TC`/`TF`/`TB` (espesor en pulgadas de los tableros de caja/frente/fondo, leídos del preset). `derivarVars()` recibe ahora un cuarto parámetro `extra` y evalúa las reglas con los overrides YA inyectados en el contexto — antes los overrides solo se mezclaban al final, así que ninguna regla podía depender de una variable elegida por el usuario (era imposible que `alto_frente_pequeno` reaccionara a la tipología DB). `group-engine.ts` usa el mismo `geoVars()` en `evaluated()` y en `groupVars`; sin eso, cualquier fórmula con `TC` lanzaba ReferenceError en el cálculo de grupos. **Migración 0028**: `L-1.18`→`L-2*TC` y `L-0.59`→`L-TC` (57 plantillas; para 15mm el cambio es de 0.03mm, para 18mm corrige los 6mm); `P-0.9`→`P-0.70866-TB` en base/base_tapa, que de paso resuelve la duda abierta el 2026-08-11 (0.94488in = 24mm = 18mm + fondo de 6mm); ancho de puerta `L/n_puertas`→`(L-n_puertas*RV)/n_puertas` (regla universal, verificada en W/UW/B/BFD/SBFD/PC); alto de puerta `A`→`A-RV` solo en W/BFD/SBFD/SVFD. En BFD/SBFD convive una segunda población con `A-30` (= A-2*TC, puerta embutida) que NO es legado — aparece todos los años — y quedó documentada como variante pendiente en vez de forzarla al default. Reglas `alto_frente_pequeno_base`/`alto_frente_pequeno` que corrigen el reparto de frentes DB-2S (rejilla de 4 unidades, no "6 pulgadas fijas": la fórmula anterior daba -34.9mm en las pequeñas y +69.8mm en la grande) y arreglan también las tipologías parejas (DB-3 daba 254.0mm contra 250.8mm reales por no descontar el reveal). **Modificadores**: `gola` (0/1) descuenta 53.6mm de la pila de frentes en proporción a la altura, agrega 2 perfiles `gola_perfil` y baja el refuerzo delantero de 3 a 2; `removible` (migración 0030) agrega refuerzos de 140mm y 120.75mm y ahonda la base a `P-TC`, y se habilita solo en USVFD/USBFD/UB/UDB/UBFD (`PREFS_CON_REMOVIBLE` en `muebles.ts`). El modificador "abierto" NO se creó porque ya existía como `modoFrentes='sin_frentes'`, y "fondo 9mm" tampoco: era el defecto de `P-0.9`, ya corregido. **Tipologías**: `scripts/generar_tipologias.py` deriva plantillas desde las hojas de ruta traduciendo el DSL al vocabulario de la app (la dimensión derivada del Largo de la hoja va a `formula_largo`, la del Ancho a `formula_ancho`, y los conteos de enchape a `cantos.largos/anchos`), y se auto-valida reaplicando cada plantilla sobre sus hojas. Genera `0029_tipologias_nuevas.sql` con 29 familias, la mayoría reproduciendo 85-100% del despiece real dentro de 1mm (USVFD 96%, AL 98%, UDB 98%, CC 88%, CLV 86%). Deliberadamente excluye las familias ya mapeadas (borraría su plantilla curada con herrajes y `modo_agrupacion`), los prefijos `O…`/sufijos `…R`/`WSM` (son modificadores) y los `I…` (alias métricos: se registran como `pref_metrico`, `IP`→BFD, `IC`→DB, `ILVP`→SBFD). **UI**: selector "Sistema de frente" (manija/gola) y casilla "Removible" en el simulador y en el formulario de cotizaciones, persistidos en `config` de la línea. Tests: `tests/db-gavetas-mixtas.test.ts` reescrito contra las listas de corte reales de DB-1S/2S/3/4 con y sin gola y con carcasa de 15 y 18mm, más `tests/reveal-puertas.test.ts`. 28/28 pasan, typecheck y lint limpios. **Pendiente**: las migraciones 0028/0029/0030 NO se han aplicado (el proyecto Supabase del cotizador no es accesible desde este entorno); las plantillas generadas no traen herrajes, tarugos ni soportes porque las hojas de ruta no los modelan como pieza. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md).

## [2026-08-25] update | Cruce de las tipologías nuevas contra "Simulación muebles CEMA": cobertura parcial y desviación de área
El usuario señaló que la validación de las 29 tipologías generadas se había hecho solo contra las hojas de ruta (geometría) y nunca contra el maestro de costos CEMA. Correcto: era una brecha. Al cruzar `0029_tipologias_nuevas.sql` contra la hoja `madera` de `Simulación muebles CEMA (1).xlsx` aparecen dos resultados. **(1) Cobertura**: solo 13 de las 31 familias del catálogo tienen alguna referencia en CEMA (UDB 47 filas, UV 23, POD 16, UVFD 12, BOV 9, WER 8, DF 8, BMW 4, BLS 4, S 2, DD 2, BT 2, SDB 1); 18 no existen en el maestro — incluidas USVFD (la de mayor volumen en hojas de ruta, 36 SKUs), toda la línea de clósets (CC/WCC/CLV/DFE), los superiores especiales (SA/SLOC/SMO/SBAS/WLD/WPC), AL y todas las piezas sueltas y kits. Para esas 18 no hay ningún referente comercial de costo contra el cual contrastar: quedan validadas en geometría y sin validar en dinero. **(2) Desviación de área de madera** en las familias comparables: UVFD +2.1% de media (rango -3.9% a +13.9%), POD -9.3% (rango -24.0% a +11.8%). Los valores centrales (UVFD3028 -3.7%, UVFD3628 -3.9%, POD32615 -1.2%) indican que la traducción del despiece es correcta; los extremos se explican porque el cruce asume variables derivadas fijas (`n_puertas`, `n_cajones=3`, `n_entrepanos=1`) en vez de deducirlas por SKU, no por error de la plantilla. Dos bugs propios en el script de cruce se detectaron y corrigieron antes de concluir: se tomaba la profundidad por índice fijo (agarraba el Alto) y se sumaban como área las columnas 41-50, que son roll-ups por material de las mismas piezas más sus duplicados en m², lo que inflaba el total de CEMA hasta 2.4x y producía falsas desviaciones de -40% a -70%. Nota: este cruce valida área de madera, no la cadena de canto, herrajes ni precio. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md).

## [2026-09-03] ingest | Validación de la cadena de precio del app contra la hoja `Precio` del Excel CEMA
Se cruzó fórmula por fórmula la hoja `Precio` de `Simulación muebles CEMA (1).xlsx` (7.027 filas) contra `engine.ts`/`cotizar.ts`/`cotizaciones.ts`. **Convención alineada**: ambos usan margen sobre precio (`costo/(1-margen)`) y ambos separan la cadena de mueble y la de herraje, sumándolas solo al final. **Parámetros del Excel**: no hay hoja de parámetros, viven en la columna T de `Precio` (T1 muebles 0.57 en 5.733 filas, T2 fillers 0.52 en 250, T12 Pn/TK 0.50 en 1.030, T23 hardware 0.35 en las 7.027, T24 MP 0.10 en 4, T25-27 Panel Closet definidos y sin uso, 10 filas sin margen) y la TRM en V1=3650. **Única divergencia de fórmula**: `W=(K/(1-10%)+N)` y `Z=K/(1-10%)` en las 7.027 filas — el recargo del 10% de CEMA está quemado, aplica solo al mueble y nunca al herraje, y en el motor está desactivado (`recargo_extra` sin consumir, bloque `recF` comentado). Como el 10% solo toca el mueble es absorbible exactamente en el margen (`1-m' = 0.9*(1-m)`): muebles 0.613, fillers 0.568, pn_tk 0.550, MP 0.190, hardware 0.35 sin cambio; verificado con error de precisión de máquina en una fila de cada familia. **Desalineaciones de catálogo**: `margenes.pn_tk` está en 0.44 contra 0.50 del Excel, falta la categoría MP, y el seed `0003_seed_parametros.sql` pone `margen_herraje` en 0.57 cuando T23 es 0.35 (el upsert revierte el valor bueno si se reejecuta); `AdminCatalogos.tsx` reescribe `margenes` con tres llaves fijas, así que borraría cualquier categoría nueva. **Dos defectos del app confirmados en código**: (1) `cotizaciones.ts:158` descarta el herraje del precio cuando hay `margenOverride` — la rama "lógica unificada" es falsa, `precioCop` nunca consolida herraje, y como `AddLineForm.tsx:144` inicializa el margen desde `projectDefaults.margen` basta con que el proyecto traiga margen por defecto para que todas las líneas (incluidas las agrupadas) pierdan el herraje, mientras el Simulador sí lo muestra; (2) `engine.ts:281-293` aplica el descuento a los campos USD y a ninguno de los COP, así que `precioUsd*TRM ≠ precio_unit_cop`. **Defectos del Excel**: las 10 filas sin margen tienen unidades rotas (`I` ya en USD, `K=J` sin dividir por TRM, `L=I` duplica el costo del mueble como hardware y lo marca al 35%), la fila 6978 tiene `I=222` contra `L=2526`, y el 10% quemado obliga a editar 7.027 fórmulas para cotizar otro cliente. No se tocó código. Ver [cadena_precio_excel_vs_app.md](wiki/cadena_precio_excel_vs_app.md).

## [2026-09-10] ingest | Interpretación espacial DB en tres vistas y contraste de nomenclatura
Se revisaron las 1.240 filas de 71 hojas DB de producción y las fórmulas locales del motor, seed 0014 y migraciones 0027/0028. Se creó una interpretación interactiva con siete referencias y 125 tableros: vistas frontal, lateral derecha y superior derivadas de los mismos volúmenes, selección de piezas con fila/fórmula originales y apertura ilustrativa de gaveta superior/interior. Las medidas del Excel se preservan; las coordenadas de montaje y herrajes esquemáticos se identifican como inferencias. Hallazgos: P=609,6 mm en los 142 laterales DB (el frente sobrepuesto se suma al total); discrepancia refuerzo_horizontal del seed frente a refuerzo_delantero del UPDATE de gola y del fixture; respaldo real distinto de fondo; traseros de DB-2/3 con 183 mm y L−117 frente al genérico de 68,26 mm y L−87,05; DB24-4 con exceso de cierre de 1,6 mm; precedente explícito DB22-2+INT con dos frentes exteriores y gaveta interior. Se corrigió la glosa de profundidad DB de la wiki y se contextualizó la página histórica 0027. Ver wiki/interpretacion_espacial_db.md. Verificación: siete pruebas DB existentes aprobadas y 125 piezas comprobadas por identidad, medidas, envolvente lateral/vertical y traslación. Sin modificaciones al motor, SQL, datos remotos ni fuentes Excel/raw.

## [2026-09-03] ingest | Auditoría de la diferencia de precio del SBFD30 (Excel $86,66 vs Cotizador $67,51)
Se auditó el SBFD30 (30x30x24") comparando la fila 700 del Excel `Simulación muebles CEMA (1).xlsx` contra `calcularMueble()` corrido sobre los datos reales de Supabase (`engine.ts` cargado con `jiti` fuera de Next, ver §6 de la wiki). **El margen del Excel NO es 50% sino 57%** (`Precio!$T$1 = 0,57`; `J700 = I700/(1-$T$1)`), y su TRM es 3.650 (`Precio!$V$1`), contra 3.200 en `cot_parametros`. La diferencia se descompone al centavo en cuatro factores (86,66 → 67,51): materiales del preset ×0,78934 (**−18,37 USD, el grueso**), margen 57→50% ×0,86 (−9,64), TRM 3.650→3.200 ×1,14063 (+8,32) y residuo de costo del motor ×1,00617 (+0,53). **Causa raíz de la parte grande: el `config_default` del proyecto pisa el perfil de preset global** y sustituye los cuatro roles por tableros mucho más baratos (fondo CHIRHCARB4 $12.900/m² vs PRICARB6 $28.858; caja CHIRHCARB15 $26.003 vs ECOCARB15COLOR $35.609), así que el mismo SKU en dos proyectos no es comparable sin revisar ese campo. **El motor está sano:** las seis áreas del despiece coinciden con la hoja `madera` fila 700 al centímetro cuadrado y el costo de herrajes coincide exacto ($34.816). Se aclaró un falso positivo recurrente al comparar: las columnas `Area … en metros cuadrados` de la hoja `madera` ya traen el 15% de desperdicio incorporado, mientras el motor lo aplica aparte — hay que comparar contra las columnas de área crudas. **Desalineación de catálogo detectada (pendiente de decidir):** `ECOCARB15ARLINGTON` está a $34.987/m² en `cot_tableros` y a $29.645/m² en el Excel (+18,02%, precio neto con descuento en `costos unitarios` fila 5), que explica $742 de los $839 de residuo; los otros $96 son 24 cm de más de canto `19x0,45`. También se dejó anotado que el Excel expone dos precios sin herrajes — `K700` = 86,66 (el comparable) y `Z700` = `K/(1-10%)` = 96,29 con el recargo CEMA, que en el motor está desactivado (`recargo_extra = 0`). Ver [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md).

## [2026-09-03] ingest | Cadena de precio por margen: Excel vs motor, fórmula por fórmula (+2 defectos)
Se documentó la comparación a nivel de fórmula entre la hoja `Precio` del Excel CEMA y `engine.ts` (§6 de la wiki). **Convención idéntica en ambos:** margen sobre precio (`precio = costo/(1-m)`), no markup sobre costo, con dos cadenas separadas (mueble con su margen, herraje con el suyo) que solo se suman al final; `Excel M = L/(1-$T$23)` y `precioHerrajesCop = costoHerrajes/(1-margenHerraje)` coinciden al centavo (USD 14,67 en el SBFD30). Las constantes del Excel viven en la columna T de la fila 1-27 de `Precio`, no en una hoja de parámetros: `$T$1` muebles 0,57 · `$T$2` fillers 0,52 · `$T$12` Pn y TK 0,50 · `$T$23` hardware 0,35 · `$T$24` MP 0,10 · `$T$25` Panel Closet 0,50 · `$T$26-27` Panel Closet Perf 0,52; TRM en `$V$1`. Reparto de las 7.027 filas por margen referenciado en `J`: 5.733 `$T$1`, 1.030 `$T$12`, 250 `$T$2`, 4 `$T$24`, y **10 filas sin margen** (`J = I`; Lavamanos/Lavarropas/Lavaplatos/Bañera, reventa a costo). **Cuatro divergencias estructurales:** el recargo del 10% está quemado en `W`/`Z` del Excel y solo afecta la parte de mueble, mientras el motor lo tiene desactivado (101,87 vs 110,96 USD en el SBFD30); `cot_parametros.margenes` no tiene las categorías MP/Panel Closet/Panel Closet Perf ni el caso "sin margen"; `margenOverride` solo mueve la categoría `muebles` (`cotizar.ts:94`) mientras en el Excel cambiar `$T$1` mueve las 5.733 filas; y el motor no calcula el margen efectivo (`Y`/`AB` del Excel) de la venta mezclada. **Dos defectos:** (1) `cotizaciones.ts:158-160` — con `margenOverride` presente, `usarUnificado` persiste `res.precioCop` aunque `conHerrajes` sea true, pero `precioCop` es solo `costoSinHerrajes/(1-margen)`, así que **el herraje se factura en cero** (SBFD30: 216.041,68 en vez de 269.604,76 COP, −19,9%); solo se dispara si se escribe un margen, con el campo vacío toma la rama correcta. (2) `engine.ts:281-293` — el descuento se aplica a los campos USD pero no a los COP, así que con 10% de descuento `precioUsd*TRM` = 194.437,51 mientras `precio_unit_cop` guarda 216.041,68 y los totales COP/USD de la cotización dejan de cuadrar. Ninguno de los dos se corrigió en esta sesión (auditoría de solo lectura). Ver [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md) §6.

## [2026-09-04] ingest | Formalización matemática de la cadena de margen y de la brecha Excel–Cotizador
Se añadió §7 a la auditoría del SBFD30 con la derivación algebraica de la cadena de precio. **Ambos sistemas usan margen sobre precio** (`m = (P−C)/P` ⇒ `P = C/(1−m)`), equivalente a un markup sobre costo `k = m/(1−m)` (0,57 → 132,56%). La elasticidad es `(dP/P)/dm = 1/(1−m)`, así que un punto de margen vale 2,33% de precio en 0,57 pero solo 1,54% en 0,35 — el mismo error de configuración pesa distinto según la categoría. **Hallazgo formal 1:** el `/(1-10%)` del Excel no suma al margen sino que compone una segunda etapa, `P = C/[(1−T1)(1−r)]`, con margen efectivo `1−(1−0,57)(1−0,10) = 0,613`, que es exactamente la columna `AB` — verificado, y descarta la lectura ingenua 0,57+0,10=0,67. **Hallazgo formal 2:** el margen mezclado mueble+herraje cumple `1−m_mix = ΣCᵢ / Σ(Cᵢ/(1−mᵢ))`, es decir el complemento del margen mezclado es la media armónica de los complementos ponderada por costo; da 0,578218 e iguala la columna `Y` del Excel, valor que el motor no expone. **Hallazgo formal 3:** la brecha 86,66→67,51 se factoriza exactamente en tres términos independientes, `P_app/P_excel = (C_app/C_excel)·[(1−m_ex)/(1−m_app)]·(TRM_ex/TRM_app) = 0,794212·0,86·1,140625 = 0,779073`; en logaritmos los aportes son costo +92,3%, margen +60,4% y TRM −52,7% (único término que empuja hacia arriba). Margen implícito que necesitaría el motor para reproducir los 86,66 USD: 0,610 con los materiales del proyecto, 0,507 con materiales CEMA y TRM 3.200, y **0,567 con materiales CEMA y TRM 3.650** — a 0,003 del 0,57 del Excel, consistente con el residuo de costo de §5. Ver [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md) §7.

## [2026-09-04] ingest | El selector "caja / refuerzos" del simulador impide reproducir el preset del Excel
Al conciliar el SBFD30 con TRM 3.650 y margen 57% se detectó que `CotizadorForm.tsx:481-490` renderiza un **único** combo "caja / refuerzos" que escribe ambos roles a la vez (`setPreset((p) => ({ ...p, caja: v, refuerzo: v }))`), mientras el Excel usa tableros distintos para esos roles (caja = Balance 15mm $35.609/m², refuerzo = Polar 15mm $29.645/m²). El `preset_default` de la BD sí los distingue (`ECOCARB15COLOR`/`ECOCARB15ARLINGTON`), pero en cuanto se toca el selector quedan igualados y no hay forma de separarlos desde el simulador; en el SBFD30 el efecto es de solo +$86 COP porque el refuerzo son 0,14 m², pero impide la conciliación exacta. En la misma sesión se verificó una simulación real del usuario (caja/refuerzo ECOCARB15ARLINGTON, frente PRICARB18COLOR, fondo CHIRHCARB6BLANCO AMERICANO): costo $34,07 USD → precio $79,24, reproducido al centavo por el motor. La brecha de −$11.638 COP contra el Excel se concentra en el **fondo** (CHIRHCARB6BLANCO AMERICANO a $13.062/m² vs $28.858/m² del Excel, −$10.340); frente −$1.098, caja −$1.038 y refuerzo +$742. Corrigiendo los tres tableros desde el formulario se llega a $87,25 (+$0,59 sobre el Excel); el residuo restante son las dos desalineaciones de catálogo ya registradas (precio de `ECOCARB15ARLINGTON` +18,02% y 24 cm de canto `19x0,45` de más). Nota de UI: el desglose muestra dos filas de canto `19X0,45` y `19x0,45` por diferencia de mayúsculas entre el override de proyecto y el calibre derivado del espesor — las dos se tarifan igual (`normCalibre`), es solo cosmético. Ver [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md) §3.

## [2026-09-04] update | Alineación de `cot_tableros` con la hoja `Materiales` del Excel (5 precios corregidos en Supabase)
Se tomó el Excel CEMA como fuente de verdad para el catálogo de tableros y se escribieron los cambios en Supabase (`cot_tableros`), a petición del usuario. Fuente del dato: `Materiales!J` (Precio real) ÷ `Materiales!G` (Área), redondeado a entero — la convención con que la BD ya guardaba `precio_m2` (verificado contra las 36 filas que ya coincidían). Estado previo: 48 tableros, **36 coincidían, 5 diferían y 7 no tienen fila en el Excel**. En las cinco filas divergentes `area_m2`, `precio` y `descuento` ya coincidían con el Excel, así que solo se tocaron `precio_real` y `precio_m2`: `ECOCARB18ARLINGTON` 144.043→175.524 / 32.259→39.309 (**+21,9%**), `ECOCARB15ARLINGTON` 156.224→132.371 / 34.987→29.645 (−15,3%), `CHIRHCARB18H4001 MD133 DARK` 84.575→81.056 / 27.726→26.572 (−4,2%), `CHIRHCARB18H002 YM002 BLANCO` 85.658→83.719 / 28.081→27.445 (−2,3%), `CHIRHCARB15BLANCO AMERICANO` 79.320→79.436 / 26.003→26.041 (+0,1%). Se dejó respaldo de las cinco filas completas antes de escribir. Verificación posterior releyendo de la BD: 41 coinciden, **0 difieren**. **Efecto en la conciliación del SBFD30:** con el preset real del Excel (caja `ECOCARB15COLOR`, refuerzo `ECOCARB15ARLINGTON`, frente `ECOCARB18COLOR`, fondo `PRICARB6CANDELARIA (POLAR)`), TRM 3.650 y margen 57%, el motor pasa de $87,19 a **$86,72 contra los $86,66 del Excel** — los 6 centavos restantes son exclusivamente los 24 cm de canto `19x0,45` de más (+$96 COP), único residuo pendiente. **Advertencia comercial:** `ECOCARB18ARLINGTON` subió 21,9%, así que encarece toda cotización que lo use; conviene contrastar ese precio con compras porque el dato del Excel podría estar desactualizado en la otra dirección. Los 7 tableros sin fila en el Excel (`CHIRHCARB4BLANCO AMERICANO`, `CHIRHCARB18BLANCO AMERICANO`, los `…183`, `CHICARB18…`, `CHI4,5CARBH002…`) quedan sin referencia y no se tocaron. Nota de uso: para reproducir el preset del Excel desde el simulador hay que **elegir el perfil "CEMA (estándar)" y no tocar el combo "caja / refuerzos"**, que iguala ambos roles (`CotizadorForm.tsx:113` aplica `p.valores` completo; `:484` los iguala). Ver [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md) §5.

## [2026-09-08] lint | Verificación de las 5 pestañas de Materiales-Parámetros contra `Simulación muebles CEMA (2).xlsx`
Cotejo completo del panel **Materiales-Parámetros** contra la versión (2) del Excel (4-sep-2026, posterior al (1) con que se hizo la auditoría). **Resultado: cero diferencias de valor en todo lo comparable.** Tableros: de las 48 filas de `cot_tableros`, 41 coinciden exactamente en `area_m2`, `precio`, `descuento`, `precio_real` y `precio_m2` (efecto de la alineación del 2026-09-04) y 7 no tienen fila en el Excel. Cantos 7/7 exactos. Herrajes: 15 de 18 tienen referencia en el Excel y todos coinciden al peso; los 3 restantes (`BARRAESTMCTO` 11.800, `SLIMBOXALTO` 48.250, `SLIMBOXBAJO` 28.700, todos de Madecentro) son altas propias del cotizador — se rastrearon sus importes en todas las hojas del libro sin ninguna coincidencia. Perfiles de material 1/1 con los 4 roles alineados. Parámetros: margen muebles 0,57 / fillers 0,52 / pn_tk 0,50, `margen_herraje` 0,35, TRM 3.650, `desperdicio_madera` 0,15 y lámina 44.652 cm² coinciden todos (nota: la TRM de la BD ya está en 3.650, antes 3.200). **Mapa de fuentes en el Excel (2)**, útil para futuros cotejos: tableros en `Materiales` filas 3-74 (`precio_m2` = J/G); **cantos en `Materiales` filas 79-85, bloque nuevo que en el (1) no existía** (allí solo estaban en `costos unitarios`); herrajes en `costos unitarios` filas 19-110 columna B; perfil de material en `costos unitarios!G4:H8`; parámetros en `Precio!$T$1/$T$23/$V$1` y `madera!AZ`. **Las asimetrías son de cobertura, no de precio:** la BD es un subconjunto curado — 31 referencias del Excel no están cargadas (ARKOPA, TURQUIA, líneas `PRIRH*`/`PRIST*`, `UNKPVC*` y las 9 `LAMCARB*` de LAMINATES). Único parámetro divergente: `recargo_extra` = 0 en BD contra el 10% quemado en `W`/`Z` del Excel; es deliberado y además inocuo porque el motor no lee ese parámetro. Ver [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md) §5.2.

## [2026-09-08] ingest | Auditoría estructural del Excel CEMA: 10 riesgos para la migración al Cotizador PLUS
Se auditó `Simulación muebles CEMA (2).xlsx` **leyendo fórmulas en vez de valores** (doble carga con `openpyxl`, `data_only` False/True), lo que expuso defectos invisibles en la vista normal. **Cuatro de riesgo alto:** (1) *el margen lo decide la fila, no el tipo* — cada una referencia a mano su celda de la columna `T` (`$T$1`=0,57 en 5.733 filas, `$T$12`=0,50 en 1.030, `$T$2`=0,52 en 250, `$T$24`=0,10 en 4, 10 sin margen), y el tipo «Adicional» reparte 1.368 filas entre las cuatro mientras el prefijo `PN` mezcla 980 al 50% con una al 57%; el motor asigna por `margen_key` del tipo y `margenOverride` solo aplica a `muebles`, así que hoy no puede representarlo. (2) *diez filas mezclan USD y COP* (6966-6974 y 6978: `OSLO*`, `AQUA3124`, `KOA3322`, `MSON*`, `TINES6027 1/2`) — su columna de costo apunta a `'Costos Muebles'!L` ("Precio MS/FV") en vez de `!I`, son las **únicas 10 de 7.027 donde `K` no divide por `$V$1`**, y `X=(I+L)/$V$1` suma 222 USD con 2.526 COP dando un margen reportado de 99,7%; su costo real es `SUM(M:AA)=0` porque no tienen despiece: son reventa y hay que modelarlas como tal. (3) *el recargo del 10% está quemado 14.054 veces* (literal `10%` dentro de `W` y `Z` de las 7.027 filas). (4) *el libro solo sabe costear cuatro materiales* — las columnas de madera referencian 7 celdas fijas de `costos unitarios` (C19-C24, C63) con ~1.499 referencias cada una, así que el catálogo de 72 tableros de `Materiales` es decorativo y cambiar un material recalcula retroactivamente las 7.027 filas. **Cuatro de riesgo medio:** doble bloque de precio de canto desalineado 8-9% (`B11-B12` vivo vs `B25-B27` muerto); «Costo Caja» duplicado en `C20` y `C22` con ambas en uso; `precio_real ≠ precio × (1−descuento)` en 59 de 72 tableros y las 9 referencias `LAMCARB*` compartiendo el relleno 145.069,48; y 35 filas con `madera!AZ = 0` (sin desperdicio, ~15% de subcosteo) contra 6.992 con 0,15. **Dos bajos:** 22 accesorios con costo y precio cero, y 4 SKU duplicados (`SVFD34`, `W2530`, `PN12 7/842`, `TK596`). **Fragilidad transversal:** fórmulas por posición absoluta entre hojas, la hoja `canto y otros ` con espacio final en el nombre, 28.098 fórmulas colgando de `$V$1` sin trazabilidad de con qué TRM se emitió cada cotización, y 5 hojas ocultas (una llamada `prueba `). Se publicó el informe como Artifact «Auditoría del simulador CEMA». Ver [riesgos_excel_cema.md](wiki/riesgos_excel_cema.md).

## [2026-09-08] update | Migraciones 0028-0031 aplicadas: geometría por espesor, reveal, tipologías DB paralelas y bug de orden en el motor
Se aplicaron en Supabase I+D las migraciones `0028_geometria_espesor_reveal.sql`, `0029_tipologias_nuevas.sql` y `0030_variante_removible.sql` (redactadas y validadas contra 1.937 hojas de ruta reales, pero pendientes de aplicar según `validacion_hojas_de_ruta.md`). Se detectaron y corrigieron 3 huecos específicos del tipo `DB` preexistente que esas migraciones no tocaban (apuntan por valor de fórmula, y el `DB` original tenía valores distintos a los que buscaban): rieles (`refuerzo_trasero`/`refuerzo_horizontal`) seguían en 82,55mm en vez de 80mm; `refuerzo_horizontal` nunca se renombró a `refuerzo_delantero` (perdía el ajuste "3→2 con gola" de `0028`); y `trasero_gaveta` (tipologías parejas DB-2/3/4, activas en producción) seguía en 68mm en vez de 183mm. Se agregó la migración `0031_db_rieles_trasero_pareja.sql`, validada contra el ejemplo `DB24-2` del usuario (L=24"): `L-4.607`=492,58mm y `183/25.4`=183mm, coincide exacto con "492,6×183mm" de Firplak — confirma la fórmula con un ejemplo independiente del `DB15-1S` original.

Al validar de punta a punta corriendo `calcularMueble()` con las piezas/reglas reales de Supabase, se encontró un **bug real del motor**: `derivarVars()` (`src/lib/engine.ts`) resolvía las reglas en una sola pasada, en el orden en que llegaba el array — pero `alto_frente_pequeno` (introducida en `0028`) depende de `alto_frente_pequeno_base`, y la consulta de `cotizar.ts` a `cot_reglas_config` **no tiene `ORDER BY`**. Cualquier cotización DB-1S/DB-2S podía tronar con `ReferenceError: alto_frente_pequeno_base is not defined` según el orden en que Postgres devolviera las filas — nunca se había manifestado porque `0028` no estaba aplicada hasta ahora. Se corrigió `derivarVars()` para resolver en varias pasadas, reintentando lo bloqueado por dependencia hasta que no haya más progreso (o lanzar un error explícito si hay dependencia circular). `group-engine.ts` reutiliza la misma función, así que queda cubierto también. 28/28 tests pasan.

Validación end-to-end contra los ejemplos de la conversación con Firplak: `DB24-2` reproduce trasero (492,58×183,01mm), rieles (80,01mm) y frentes (377,80×2mm) dentro de 0,02mm; `DB15-1S` da un total de 18 piezas activas, igual al conteo físico de Firplak. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-08] update | Nueva pestaña "HDR": buscador de despiece por código de mueble
Se agregó `src/app/hdr/` (nav "HDR" en `AppHeader`, solo admin): un buscador donde se escribe un código (`SBFD30`, `W2436`, `DB18-1S`) y se genera la tabla de piezas en milímetros, replicando el layout de "Piezas (despiece)" del Simulador/Diseño pero convertido de pulgadas a mm. `HdrBuscador.tsx` interpreta el código (familia por prefijo más largo que coincida, dígitos de ancho/alto según la familia, configuración DB contra `DB_TIPOLOGIAS`) y llama a `previewAction()` (`admin/diseno/actions.ts`), a la que se le agregó un parámetro `overrides` opcional para poder forzar la tipología detectada (antes solo aceptaba L/A/P/preset). Alto/Prof no codificados quedan editables con un default (30"/24" para inferiores, 12" fijo para `W`). Validado el parser contra los 59 tipos reales de Supabase y los ejemplos `SBFD30`, `W2436`, `DB18-1S`, `BFD15`, `B15`, `DB24-4`. 28/28 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.

## [2026-09-08] update | Migración 0032: las correcciones de DB (riel 80mm, trasero_gaveta) se extienden a todo el catálogo
El usuario pidió aplicar la lógica de piezas/medidas "con coherencia en todas las referencias", no solo DB. Auditoría sistemática de las 59 plantillas: la constante `L-1.18` ya estaba corregida en el 100% del catálogo (0028 la reemplaza por valor exacto), pero el ancho de riel/refuerzo (`3.25 in` = 82,55mm) seguía sin corregir en **~23 tipos** (B, BBL, BBLFD, BFD, BOMH, DV, DVE, OVPC, PC, PCFD, SBFD, SV, SVFD, TW, UB, UBFD, UDV, UW, V, VFD, VPC, W, WBL) — 0028 nunca tocó ese ancho, ni siquiera en DB antes de `0031`. Se aplicó el valor confirmado (80mm = 3.14961 in) a **todo el catálogo por valor** (`WHERE formula_ancho = '3.25'`), no una lista de tipos — mismo patrón que ya usan `gola_perfil` y las 29 tipologías generadas desde hojas reales.

También se encontró que `trasero_gaveta` con el mismo `L-3.427` sin corregir que tenía DB antes de `0031` aparecía en B/DV/DVE/PCFD/UB/UDV/V; se corrigió el largo a `L-4.607` en esos 7 tipos (no en BBL ni KD, con geometrías distintas) — confirmado porque los tipos generados desde hojas reales (POD, UV, BMW, UDB) ya traen ese mismo valor de forma independiente. Y el reveal de alto de puerta (`A`→`A-RV`, aplicado en 0028 solo a W/BFD/SBFD/SVFD) se extendió a UBFD/VFD/WBL, que siguen el mismo patrón de puerta sobrepuesta simple. **No se tocó** el ancho de `trasero_gaveta` en las familias legado (68mm vs 183mm, específico por familia y sin hoja de ruta puntual) ni el alto de frente de B/UB/V (estructura de 1 cajón + puertas con una fórmula propia aún sin derivar, según ya documentaba la wiki para B). Validado con `calcularMueble()` end-to-end contra `SBFD30`: riel a 80,01mm, frentes con reveal en ambos lados. 28/28 tests y typecheck limpios. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-09] update | HDR: buscador por código reemplazado por el formulario Tipo/Largo/Alto/Prof/Unidad
Se reemplazó el `parseCodigo()` de texto libre de `HdrBuscador.tsx` por el mismo bloque de formulario que usan `AddLineForm.tsx`/`CotizadorForm.tsx`: un `Combobox` buscable para "Tipo De Mueble" (el usuario elige de la lista real de tipos en vez de que el código se interprete por regex) más Largo/Alto/Prof/Unidad en un grid de 4 columnas, y el selector "Tipología DB" condicional cuando el tipo elegido empieza con `DB`. Más confiable que el parser (que tenía limitaciones documentadas, ej. sufijos compuestos como `-2S-S18MM`), y consistente visualmente con el resto de la app. `previewAction()` y el resto del cálculo no cambiaron. 28/28 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.

## [2026-09-09] fix | BFD.refuerzo_delantero se escapó de la corrección universal de rieles (0032)
El usuario reportó que todos los refuerzos traseros/delanteros de `B` y `BFD` deben ser 80mm. Verificado en Supabase: `B` ya estaba correcto (`0032` lo cubrió), pero `BFD.refuerzo_delantero` seguía dando 82,55mm para módulos ≥12" porque su fórmula es condicional (`L<12 ? 5 : 3.25`) — `0032` corrigió por coincidencia exacta con el valor `'3.25'`, y una expresión que solo *contiene* `3.25` no matcheaba. Búsqueda con `LIKE '%3.25%'` en todo el catálogo confirmó que es el único caso así. Migración `0033`: `L<12 ? 5 : 3.25` → `L<12 ? 5 : 3.14961` (80mm), sin tocar la rama de módulos angostos (`5`, valor distinto y no relacionado). 28/28 tests y typecheck limpios. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-10] fix | "Con herrajes" pasa a obligatorio en muebles DB (riel y barras)
El usuario reportó que al cotizar una tipología DB con riel/barras seleccionados, si "Con herrajes" queda desmarcado el precio no refleja ese costo real — confirmado: `cotizar.ts` vacía `herrajesPlantilla` por completo cuando `conHerrajes=false`, así que el riel Tandem china y las barras dejan de sumarse aunque estén configurados. Se forzó el checkbox ("Con herrajes" en `AddLineForm.tsx`, "Incluir herrajes" en `CotizadorForm.tsx`) a quedar marcado y deshabilitado mientras el tipo sea `DB`, en tres capas (cambio de tipo, `checked` visual, valor enviado al guardar/calcular) para cubrir también el caso de editar un módulo DB guardado antes de este fix con `conHerrajes=false`. 28/28 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §4.1.

## [2026-09-10] fix | Un módulo con herrajes costaba igual que uno sin herrajes (margenOverride); n_cajones=3 se pegaba entre módulos de distinto tipo
El usuario reportó (con una cocina real como evidencia, ~181 mil pesos de impacto) dos bugs encadenados:

1. **Precio de herraje descartado con margen manual.** `construirFilaLinea` (`src/lib/cotizaciones.ts`) tenía una rama "unificada": cuando la línea o el proyecto tenían `margenOverride` (que es el caso normal desde que el proyecto recuerda el margen del último mueble), guardaba `res.precioCop` sin importar `conHerrajes` — y `precioCop` del motor **nunca** incluye herrajes (`engine.ts`: `precioCop = costoSinHerrajes/(1-margen)`, siempre; solo `precioConHerrajesCop = precioCop + precioHerrajesCop` los suma). Resultado: con margen manual activo, un módulo con herrajes y uno sin herrajes costaban exactamente lo mismo. Se extrajo la selección de precio a `precioUnitario()` en `module-groups.ts` (testeable sin Supabase, a diferencia de `cotizaciones.ts` que tiene `import 'server-only'` y revienta al importarse directo) y se eliminó la rama unificada: ahora siempre es `conHerrajes ? precioConHerrajesCop : precioCop`. Test de regresión: `tests/precio-herrajes.test.ts`.

2. **`n_cajones=3` pegado entre módulos de tipo distinto.** El formulario "Agregar mueble" no se remonta entre módulos (a propósito, para heredar configuración al agregar varios seguidos). Si se agregaba un DB-1S (que fija `n_cajones=3` vía la Tipología DB) y luego, sin cerrar el formulario, se cambiaba el Tipo a uno sin gavetas, el override `n_cajones=3` seguía viajando — cosmético mientras el punto 1 estaba roto (el herraje no se cobraba de todas formas), pero real en cuanto se arregla: infla el costo de riel/barras en un módulo que no tiene ninguno. Se corrigió `handleTipoChange` (`AddLineForm.tsx` y `CotizadorForm.tsx`) para limpiar `npuertas/ncajones/nentrepanos/zocalo/nbarras/dbTipo/rielCodigo/pcfdConfig` cada vez que cambia el Tipo.

El usuario también señaló que conciliar contra el Excel exacto requiere igualar el preset de materiales (o aceptar el ~1% de diferencia como decisión de materiales) — no es un bug de código, ya documentado en [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md).

30/30 tests, typecheck y lint limpios. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-10] verificación | Herrajes de DB (ej. DB18-S) contra el Excel: exacto, sin cambios de código

Pedido explícito de confirmar que el Cotizador calcula los herrajes de DB "de la misma forma que el Excel", usando `DB18-S` (DB18-1s) como ejemplo. Se extrajo la fila real de `DB18-1s` y `DB18-2s` de `'Costos Muebles'` en `Simulación muebles CEMA (2).xlsx` (columna J = costo hardware) y se reprodujo el mismo cálculo localmente llamando a `prepararCotizacion()`+`calcularMueble()` contra Supabase con los mismos overrides que produce el selector "Tipología DB" (`n_cajones`, `n_cajones_pequenos`, `n_barras` juntos).

Resultado: coincide al centavo en ambos casos — DB18-1s $199.386,40 (pata×4/tornillo×16/manija×3/riel×3/barra×2) y DB18-2s $189.586,40 (barra×1 en vez de ×2, resto igual). No había ninguna discrepancia nueva: los dos bugs reales que afectaban esta cuenta (precio de herraje descartado con `margenOverride`, y `n_cajones` pegado entre módulos al cambiar de Tipo) ya estaban corregidos en el punto anterior de este log — esto era exactamente lo que faltaba para que la cuenta cerrara. Sin cambios de código; script de verificación (`scratch_db18_check.ts`) fue temporal y se descartó. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-10] verificación | Desperdicio de tablero (15%) confirmado uniforme en todas las tipologías

Pedido explícito: "obliga y revisa que al consumo de tablero de cada tipología de mueble se le esté asignando un 15% de margen... sumatoria neta más un 15% únicamente". Se revisó `engine.ts` (línea ~250): `costoMadera` es `(cm2 * (1 + desperdicio) / 10000) * precio_m2`, calculado en un único loop sobre `areaPorRol` sin ninguna rama por `tipo_mueble_id` ni por rol de tablero — arquitectónicamente no hay forma de que una tipología reciba un trato distinto. Se confirmó `cot_parametros.desperdicio_madera = 0.15` en Supabase, y que `CotizarInput.tarifaMadera` (override por proyecto) existe en el tipo/`cotizaciones.ts` pero ninguna pantalla de la UI lo asigna hoy — el 15% global es lo único que corre en producción.

Verificación empírica contra Supabase real (script temporal `scratch_desperdicio_check.ts`, descartado) para B, W, DB, BFD, SBFD, PCFD, PN y TK: los 4 roles de tablero de cada tipología (caja/refuerzo/frente/fondo, según aplique) dieron `costo = neto × 1.15` exacto, sin ninguna excepción. Sin cambios de código — ya estaba correcto y uniforme. Para dejarlo blindado ante cambios futuros se agregó `tests/desperdicio-tablero.test.ts` (33/33 tests, typecheck y lint limpios), que prueba con una plantilla sintética de 4 roles: (1) neto×1.15 exacto con el desperdicio por defecto, (2) que la tarifa del proyecto mueve todos los roles por igual (ningún rol/tipo puede quedar exento), y (3) que con desperdicio=0 el costo es el neto exacto (sin markup oculto). Ver [motor_calculo.md](wiki/motor_calculo.md) §1.

## [2026-09-10] fix | Cartón de empaque: ya se sumaba al costo, pero se cobraba de más en variantes "abiertas" (O*)

Pedido explícito: "verifica que se esté teniendo en cuenta la lámina de cartón en cada mueble que se asigna en el excel y agrégalo a los costos". El cartón (`consumibles.carton`, `cot_herrajes.CARTON` precio $6.886) ya estaba implementado en `engine.ts` y ya sumaba a `costoConsumibles` → `costoSinHerrajes` → precio final; también ya se mostraba como línea aparte en la tabla "Materiales" del Simulador. Se verificó la fórmula (`cartonUnd` = función de las dos dimensiones más grandes del mueble, dividido entre el tamaño de lámina 200×130cm) contra las 5.639 filas con L/A/P numéricos de `'Costos Muebles'` en el Excel CEMA: **99.3% exacto** a menos de $1 de diferencia.

El 0.7% restante (~36 filas) resultó ser un patrón 100% consistente: todas las filas `O*` (abierto/sin puertas — `OB`, `OBFD`, `OSBFD`, `OSVFD`, `OV`, `OW`, `ODB`, `OBBLFD`, `OPC`) traen `Costo Carton=0` en el Excel, pero la fórmula del motor no distinguía `modoFrentes` y seguía cobrando cartón de una carcasa completa aunque no tuviera puertas que proteger. Corregido: `cartonUnd=0` también cuando `modoFrentes==='sin_frentes'`, además de cuando `usaCarton=false` del tipo. 36/36 tests (se agregó `tests/carton-abierto.test.ts`), typecheck y lint limpios. Ver [motor_calculo.md](wiki/motor_calculo.md) §1.

## [2026-09-10] fix | BACKING de DB: fórmula corregida contra la hoja de ruta real de DB18-1S

El usuario adjuntó la hoja de ruta real de "DB18-1S MBLE INF COC 3 GAVETAS 1 PEQUEÑA" (18 piezas, letras A-R) con la instrucción de verificarla contra el motor y aplicar la misma estructura a los demás tamaños de DBxx-1S. Se comparó pieza por pieza contra `cot_piezas_plantilla` del tipo `DB`: **17 de las 18 piezas ya cerraban exactas** (lateral, base, refuerzo_trasero/delantero a 80mm, base_gaveta, trasero_gaveta_pequena/grande, frente_gaveta_pequena/grande — todo lo ya validado en rondas anteriores de esta wiki). La única con desvío real fue **BACKING** (pieza `fondo`, 6mm): la fórmula del motor daba 762×442.2mm (`largo=A`, `ancho=L-TC`) contra 760×441.2mm real — 2mm y 1mm de más, fuera del margen de redondeo que sí cumplían las otras 17.

Se dedujo la fórmula correcta (`largo=A-2mm`, `ancho=L-16mm`) y se confirmó independiente contra `UDB`/`USVFD`/`UVFD` — tipologías generadas por `scripts/generar_tipologias.py` directo de hojas de ruta reales de familias de cajones emparentadas — que ya traían exactamente `formula_largo='A-0.07874'` / `formula_ancho='L-0.62992'` para su pieza `fondo`; DB nunca se re-apuntó a ese patrón. Aplicado en `0034_db_backing_real.sql` (Supabase I+D). Con el fix, las 18 piezas de la hoja `DB18-1S` cierran exactas contra `calcularMueble()`. Como la pieza `fondo` de DB no tiene ninguna rama por `n_cajones`/`n_cajones_pequenos`, el fix aplica igual a **cualquier tamaño y variante de DB** (DBxx-1S, DBxx-2S, DBxx-2/3/4), no solo a L=18".

38/38 tests (se agregó `tests/db-backing.test.ts`), typecheck y lint limpios. Queda pendiente confirmar si `A-2mm`/`L-16mm` se sostiene en otro alto (A) además de 30", y si el mismo patrón aplica al `fondo` de otras familias fuera de DB — no se tocaron sin evidencia. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-10] update | Modo individual por defecto en simulador y activación voluntaria de muebles combinados con '+ Agregar módulo'
Se ajustó el simulador (`CotizadorForm.tsx`) para que opere por defecto como cotizador de módulo individual sin mostrar de forma permanente la sección superior de "Mueble combinado". La funcionalidad y barra superior de combinaciones ahora se activa explícitamente cuando el usuario pulsa "+ Agregar módulo". Se incorporó el botón "Eliminar combinación" para limpiar el conjunto y regresar a modo individual con un solo clic, y se implementó la reversión automática a módulo individual al reducir el grupo a 1 o 0 integrantes mediante el icono de papelera. Títulos del formulario y de la vista de resultados se ajustaron dinámicamente según el modo activo. Ver [plan_agrupacion_modulos.md](wiki/plan_agrupacion_modulos.md).

## [2026-09-10] update | Soporte completo de tipología DB2-1OP (cajón oculto interior, 2 frentes exteriores y visualización 3 vistas)
Se formalizó e implementó el soporte completo de la tipología `DB2-1OP` en el catálogo, base de datos Supabase (`db/migrations/0036_db2_1op_gaveta_oculta.sql`), motor y visualizador 3 vistas (`MuebleVisualizer.tsx` y `visualizacion.ts`). La estructura física consta de 2 frentes exteriores de fachada (`frente_gaveta_exterior`), 1 gaveta oculta retranqueada interior en el vano superior (`frente_gaveta_interior` de 100mm), 3 rieles Tandem y 1 par de barras estabilizadoras. En el visualizador 3D, la fachada frontal oculta la gaveta interior tras los frentes exteriores, mientras que en vista lateral/superior y al interactuar con el selector de apertura se proyecta claramente en el interior del vano con selección ilustrativa independiente.

## [2026-09-10] update | HDR reproduce el formato real de hoja de ruta (letra por pieza, canto Color/Blanco, espesor)

Pedido con captura de una hoja de ruta real (`B12 MBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO`): mantener ese formato en `/hdr` en vez de la tabla genérica anterior (Pieza/Rol/Cant/Largo/Ancho/m²).

Se extendió `Breakdown['piezas']` en `engine.ts` con `cantoLargos`/`cantoAnchos`/`cantoCalibre` por pieza (antes solo se agregaba a `cantoPorCalibre`, sin desglose por pieza) — cambio aditivo, no rompe nada que ya leyera ese arreglo (se ajustaron 5 literales de fixture en `tests/group-result.test.ts` que construían el tipo a mano).

`HdrBuscador.tsx` ahora expande cada pieza en una fila por instancia física con letra consecutiva (A, B, C…, `lateral` con cant=2 sale como SIDE L/SIDE R), nombre de producción (traducido del nombre interno + sufijo de material por rol: B=caja/Balance, P=refuerzo/Polar, C=frente/Color, F=fondo), espesor (cruzando `maderaPorRol` contra `cot_tableros`), y separa el canto en cuatro columnas (largo/ancho × Color/Blanco). La separación Color/Blanco **no es un dato guardado** — es una inferencia por nombre de pieza (visible=Color, oculta=Blanco) deducida cruzando la hoja B12 real, que explica sus 10 piezas sin excepción; se documentó como inferencia, no como hecho confirmado en todo el catálogo (decisión consultada con el usuario antes de implementar). Se agregaron campos de texto libre Color/Proyecto/Cantidad y un campo Color por fila, sin cálculo detrás — igual que "Por definir" en la hoja real.

**Hallazgo colateral, no corregido:** validar el formato contra `B12` mostró que `fondo` (BACKING) de la tipología `B` tiene el mismo defecto que tenía `DB` antes del fix de esta sesión (`largo=A`/`ancho=L-TC` da 762×289,8mm contra 760×288,8mm real = `A-2mm`/`L-16mm`, mismo patrón exacto). Queda pendiente — mismo alcance que la nota ya existente sobre `BACKING` fuera de DB.

99/99 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.1.

## [2026-09-10] update | HDR puede generar el despiece de todos los módulos de una cotización guardada

Pedido: un campo para elegir una cotización ya realizada y que muestre las HDR de sus módulos, en vez de tener que buscar tipo por tipo a mano.

`src/app/hdr/actions.ts` (nuevo): `listarCotizacionesAction()` (envoltorio admin de `listarCotizaciones()`, ya usada por `/cotizaciones`) y `modulosDeCotizacionAction(cotizacionId)`, que trae todos los módulos de la cotización (`getCotizacion()`, todas las cocinas + `lineasSinCocina`) y **recalcula cada uno con las fórmulas actuales del motor** — deliberado, no lee el `breakdown` guardado en la línea: una cotización vieja tendría congelado cualquier bug ya corregido en esta sesión (herraje con `margenOverride`, `BACKING`, etc.), y el propósito de una hoja de ruta es el corte correcto hoy. Se exportaron `LineaPersistida` e `inputDesdeLinea()` de `cotizaciones.ts` (antes privadas) para reconstruir el `CotizarInput` de cada línea desde su `config` jsonb sin duplicar esa lógica.

Los módulos agrupados (`grupo_id` compartido, laterales físicamente unidos) se recalculan juntos con `cotizarGrupo()` en vez de uno por uno — si no, se pierde la geometría de grupo (laterales compartidos, piezas continuas). Verificado contra una cotización real de 5 líneas / 3 grupos (uno de 2 módulos agrupados con SBFD33 duplicado, otro con BFD15+B12): los 5 módulos calculan sin error, incluidos los 2 grupos. Los errores de un grupo no interrumpen el resto — se listan aparte por módulo.

Se extrajo `construirFilas()`/el render de la tabla a un componente nuevo `HdrTabla.tsx` para reusarlo entre el modo manual (por tipo+medidas) y el nuevo modo por cotización, sin duplicar la lógica de nombres de producción ni la regla Color/Blanco. 99/99 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.2.

Pendiente de la misma conversación: el usuario pidió poner el logo FIRPLAK en el encabezado de cada hoja — no hay forma de extraer un archivo adjuntado en el chat hacia el disco del proyecto; queda a la espera de que el usuario deje el PNG/SVG en `public/` y confirme el nombre.

## [2026-09-10] fix | Logo FIRPLAK en HDR: recortado al contenido real, sin tocar la marca

El usuario dejó el archivo en `public/firplak-logo.jpg` y pidió que se viera "exactamente igual al que subí, sin diferencias". El archivo traía un lienzo de 1376×768px con la marca real ocupando solo 960×239px en el centro — mostrado tal cual en el recuadro del encabezado (180×60 aprox.), el margen blanco duplicado (el del archivo + el del `object-contain` del propio recuadro) dejaba el logo minúsculo, muy distinto a como se ve el archivo abierto directo.

Se usó `sharp().trim({ background: '#ffffff', threshold: 10 })` para recortar exactamente al contenido — sin redibujar, recolorear ni escalar la marca, solo se descarta el margen blanco que nunca fue parte del logo — y se guardó como `public/firplak-logo.png` (sin pérdida, evita artefactos de recompresión que sí introduciría un JPEG). Se borró el `.jpg` original para no dejar un asset sin usar. `HdrTabla.tsx` (`src/app/hdr/`) lo muestra con `next/image`, `width={960} height={239}` igual a las dimensiones reales del PNG (así el aspect ratio nunca se distorsiona) y `className="h-12 w-auto"` para el tamaño de despliegue en el encabezado. Es el primer uso de `next/image` en el proyecto — verificado sirviendo tanto el asset estático como el endpoint de optimización de Next (`/_next/image?...`) contra el dev server real corriendo del usuario (200 en ambos, sin tocarlo ni reiniciarlo). 99/99 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.2.

## [2026-09-10] update | Formulario "Buscar por tipo y medidas" de HDR más compacto

El usuario señaló (con captura) un espacio vacío grande al lado del combo "Tipo De Mueble", porque ese campo vivía solo en su propia fila y Largo/Alto/Prof/Unidad iban en un grid de 4 columnas debajo, dejando la fila de Tipo con la mitad derecha sin usar en pantallas anchas.

Se integró todo en una sola fila (`grid-cols-12`): Tipo De Mueble `col-span-5`, cada medida (Largo/Alto/Prof) `col-span-2`, Unidad `col-span-1`, apilando a una columna completa en pantallas angostas (`col-span-12 sm:col-span-N`) para no romper en mobile. Cambio solo visual/de layout en `HdrBuscador.tsx`, sin tocar cálculo. 99/99 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.

## [2026-09-10] update | HDR: exportar a PDF (individual con un botón, por cotización con un botón que genera N PDFs independientes)

Pedido explícito: en el modo manual (una tabla), un botón de exportar PDF; en el modo por cotización (varias tablas), un solo botón que exporte cada módulo como un PDF **independiente** (no uno combinado).

No había ninguna generación de PDF real en el proyecto — lo único parecido era `window.print()` sobre una vista `@media print` en `src/app/cotizaciones/[id]/imprimir/`, etiquetado "🖨 Imprimir / Guardar PDF" pero sin ninguna librería de PDF de por medio. Eso no alcanza para "un botón, N archivos independientes" (el diálogo de impresión del navegador es una sola sesión interactiva), así que se agregaron dos dependencias nuevas: `jspdf` y `html2canvas-pro`. Se usó la variante "pro" de `html2canvas` a propósito — el proyecto usa Tailwind v4, que pinta con `oklch()`, y el `html2canvas` clásico no sabe parsear ese formato de color (falla en tiempo de ejecución); `html2canvas-pro` es un fork mantenido que sí lo soporta. Ninguna de las dos aparece en `npm audit` — las 11 vulnerabilidades reportadas son todas de paquetes preexistentes (`next`, `postcss`, `sharp`, `xlsx`, etc.), no de este cambio.

`src/app/hdr/pdfExport.ts`: `exportarNodoAPdf(el, filename)` captura el nodo del DOM tal cual se ve en pantalla (mismo header, mismo logo, misma tabla) con `html2canvas-pro` y lo embebe como imagen en un PDF de tamaño a medida con `jsPDF` (página del mismo ancho/alto que el contenido, no A4 forzado). `HdrTabla.tsx` pasó a `forwardRef` (`HdrTablaHandle = { exportarPdf }`) para que tanto el propio componente como `HdrBuscador.tsx` puedan disparar la exportación; el botón vive **fuera** del nodo que se captura (si no, saldría el botón dibujado dentro del PDF). En el modo por cotización, cada `HdrTabla` oculta su botón individual (`mostrarBotonExportar={false}`) y expone su `ref`; el botón único "Exportar todas en PDF" de `HdrBuscador.tsx` recorre esos refs y exporta **secuencialmente** (300ms de pausa entre cada una) — varios navegadores bloquean descargas múltiples si se disparan todas de golpe sin pausa, y cada exportación ya es pesada de por sí (`html2canvas`).

99/99 tests, typecheck y lint limpios. No se pudo probar el clic real en un navegador (sin herramienta de automatización de browser en este entorno) — se verificó que el código compila y corre sin errores contra el dev server real del usuario, pero falta que el usuario confirme que el PDF descargado se ve bien. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.3.

## [2026-09-10] fix | Alto de puerta B/UB/V: -3.2mm de reveal, cerrando una brecha que quedó pendiente desde 0028/0032

El usuario confirmó la regla general: "todos los muebles de puertas como los SBFD, los BFD... la altura es la altura del mueble - 3.2mm", y pidió actualizar Supabase. Auditoría de la pieza `frente` en todo el catálogo (`formula_cantidad='n_puertas'`, `formula_largo='(L-n_puertas*RV)/n_puertas'`, el patrón estándar de puerta simple/doble): BFD, SBFD, SVFD, UBFD, VFD, W y WBL ya tenían `formula_ancho='A-RV'` desde `0028`/`0032`, pero **`B`, `UB` y `V` seguían en `formula_ancho='A'`** — exactamente la brecha que `0032` había dejado anotada como pendiente ("requiere hojas de ruta reales antes de tocarlas").

Con la confirmación explícita del usuario como evidencia, se aplicó `0036_reveal_puerta_b_ub_v.sql` (`A`→`A-RV` en esas 3 filas). Verificado con `calcularMueble()` contra Supabase real: los 5 tipos (B, UB, V, BFD, SBFD) dan 758,80mm exacto de alto de puerta para un mueble de 30" (762mm − 3,2mm), sin excepción.

De paso se aclaró una duda vieja de la wiki: la sospecha de que `B` necesitaba una fórmula de alto propia (`~A-158.8mm`) no era sobre el `B` de solo puertas — venía de un `B` **híbrido** con cajón + puerta compartiendo el alto (ej. `B12`, visto al construir el formato HDR: su puerta real mide 301,6mm de 758,8mm totales, porque la gaveta se lleva el resto). Ese caso híbrido sigue sin resolver — la plantilla de `B` no reparte el alto entre puerta(s) y gaveta(s) cuando conviven en el mismo módulo; `A-RV` solo es correcto para un `B` sin cajones. No se tocó sin evidencia de cómo se reparte. 99/99 tests, typecheck y lint limpios. Ver [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-10] update | Se retira el logo FIRPLAK del encabezado de HDR

El usuario pidió quitar el logo que se había agregado poco antes en el header de cada tarjeta `HdrTabla`. Se eliminó el `<Image>` (`next/image`) y el contenedor que lo envolvía; el header vuelve a ser solo título + Color/Proyecto/Cantidad. El archivo `public/firplak-logo.png` no se borró (queda sin uso, disponible si se pide de nuevo más adelante). 99/99 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.

## [2026-09-10] update | El logo FIRPLAK vuelve al header de HDR

El usuario pidió, dos veces seguidas, volver a poner el logo "exactamente igual, sin modificaciones" en el mismo lugar donde estaba. En ambos casos la imagen adjuntada en el chat era visualmente idéntica a `public/firplak-logo.png` (el archivo ya recortado que había quedado guardado del pedido anterior) — no llegó ningún archivo nuevo a `public/`, así que no hizo falta reprocesar nada. Se restauró el `<Image>` de `next/image` en `HdrTabla.tsx` tal cual estaba antes de quitarlo (mismo `src`, mismo `width={960} height={239}`, mismo `className="h-12 w-auto"`), en el mismo lugar del header (arriba a la derecha, junto a Color/Proyecto/Cantidad). 99/99 tests, typecheck y lint limpios; verificado que el dev server real del usuario compila sin errores tras el cambio. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.

## [2026-09-10] fix | PDF de HDR ahora usa página tamaño carta

El usuario pidió que la exportación a PDF se ajustara correctamente a tamaño carta. Antes (`src/app/hdr/pdfExport.ts`) la página del PDF se armaba a la medida exacta del contenido capturado (`format: [anchoContenidoMm, altoContenidoMm]`) — correcto para no cortar nada, pero no es un tamaño de papel real que alguien pueda imprimir tal cual.

Se cambió a `format: 'letter'` (215.9×279.4mm — verificado directo contra una instancia real de `jsPDF`, `doc.internal.pageSize` da exactamente eso), eligiendo orientación horizontal o vertical según si el contenido capturado es más ancho que alto (una tabla HDR de 11 columnas casi siempre da horizontal). La imagen capturada se escala para llenar la página con 10mm de margen a cada lado (`Math.min` del ancho y alto disponibles contra el ancho y alto del contenido, para no deformar la proporción ni recortar), y queda centrada. 99/99 tests, typecheck y lint limpios. Ver [arquitectura_frontend.md](wiki/arquitectura_frontend.md) §5.3.

## [2026-09-10] fix | Revisión general: ráfaga de rate-limit en Auth, y limpieza de código muerto

Pedido explícito: "revisa si tengo algún error y corrige". Barrido completo: `tsc --noEmit`, `eslint .`, los 99 tests, el log del dev server real del usuario (`.next/dev/logs/next-development.log`, buscando entradas `"level":"ERROR"`), y una corrida de `calcularMueble()` contra Supabase real para los 57 tipos de mueble activos del catálogo (L=30,A=30,P=24 cada uno).

**Encontrado y corregido — ráfaga de `AuthApiError: Request rate limit reached`:** 52 ocurrencias en ~3 segundos en el log del dev server. `getUserAndRole()` (`src/lib/auth.ts`) llama `sb.auth.getUser()` sin ninguna deduplicación, y lo invocan por separado cada `page.tsx` y cada archivo de Server Actions (admin/, hdr/, cotizaciones/) — una sola carga de página puede disparar varias llamadas paralelas al endpoint de Auth de Supabase. Se envolvió `getUserAndRole` en `cache()` de React (patrón estándar de Next.js App Router para deduplicar llamadas dentro de la misma request); no elimina llamadas de Server Actions verdaderamente separadas (son invocaciones distintas por diseño), pero sí evita duplicados dentro de un mismo render. No se pudo confirmar la causa exacta de la ráfaga puntual (el dev server estuvo ~5h inactivo justo antes, consistente con que el navegador reanudara varias peticiones pendientes de golpe al reconectar) ni reproducirla de nuevo — los logs más recientes no muestran errores.

**Encontrado y descartado como falso positivo — `Uncaught Error: espesorDe is not defined`:** una sola vez, con timestamp de un momento intermedio de esta misma sesión (mientras se construía y luego revertía la funcionalidad de desglose de tablero por rol en el Simulador, ya documentada). No es un error actual.

**Limpieza de código muerto genuino** (deja 13 warnings de `eslint .`, antes 18 — los 13 restantes son de archivos `-isazaale.*` sin usar en ninguna ruta viva, o de `recargo_extra`/`cot_recargos_cliente` deliberadamente comentado — el recargo de cliente está desactivado a propósito en todo el proyecto, no se tocó):
- `src/lib/engine.ts`: comentario `eslint-disable` sin efecto (la regla no se disparaba ahí).
- `src/app/cotizaciones/[id]/AddLineForm.tsx`: función `convertir`/`TO_MM` nunca llamada, variable `initialUnit` calculada y nunca leída (diverge de la lógica que sí se usa), y `setUnidad` desestructurado sin uso — la unidad del proyecto es de solo lectura en este formulario (`<select disabled>`, ya documentado), así que no hace falta el setter.
- `src/app/admin/diseno/DisenoEditor.tsx`: prop `tableros` de `Preview` nunca usada dentro del componente — se quitó de la firma y del único lugar que la pasaba.

99/99 tests, typecheck y lint limpios tras cada cambio. Nada de esto se commiteó — pendiente de que el usuario lo pida.

## [2026-09-11] ingest | Tipo nuevo `B-FE` (1 cajón + 1 puerta, riel full extension) desde la hoja real B12-FE

El usuario pidió crear el tipo `B-FE` copiando la estructura de piezas y operaciones de la hoja de ruta real "B12-FE MBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO" (L=12", A=30", P=24"). Aplicado en `0037_tipo_b_fe.sql`.

**Lo que distingue `B-FE` de `B`:** la gaveta no es una caja metálica con riel Tandem, sino una **caja de madera** armada con piezas propias — `lateral_gaveta_der`/`lateral_gaveta_izq` (100×500mm), `contraparche` (L−111,4 × 100mm) y `fondo_gaveta` (L−72 × 492mm, 6mm) — dimensionada al riel `RIELFE500` del catálogo (full extension, 500mm), que es exactamente el largo de los laterales de gaveta de la hoja. El herraje de riel cambia de `RIELTANDEM` a `RIELFE500`; el resto (pata, tornillo, bisagra, manija) es igual a `B`.

**Fórmulas deducidas** (las 15 medidas de la hoja se reproducen con 0,00mm de diferencia, verificado corriendo `calcularMueble()` contra Supabase real): base `L-2*TC` × `P-0.70866-TB`; laterales `A`×`P`; rieles `L-2*TC`×80mm; entrepaño `L-2*TC-1mm` × 300mm (media profundidad — eso es el "1/2" del título, no media cantidad); trasero de gaveta `L-86mm`×80mm; laterales de gaveta 100×500mm; contraparche `L-111,4mm`×100mm; fondo de gaveta `L-72mm`×492mm; frente de gaveta `L-RV` × 6" fijos; puerta `L-RV` × `A - n_cajones*alto_frente_gaveta - (n_cajones+1)*RV`; BACKING `A-2mm` × `L-16mm` (misma fórmula que quedó en DB con `0034` — tercera confirmación independiente). Se agregó la regla de tipo `alto_frente_gaveta = 6`.

`HdrTabla.tsx`: se agregaron los nombres de producción de las piezas nuevas (`LAT DER GAV`, `LAT IZQ GAV`, `CONTRAPARCHE`, `FONDO GAV`) y se extendió la inferencia de canto Color/Blanco para tratar la caja de gaveta de madera como pieza oculta (`lateral_gaveta`, `contraparche` → Blanco), que es lo que muestra la hoja. El `orden` de las piezas sigue el orden de filas de la hoja para que el HDR salga letreado A–P igual que el original. Verificado: las 16 filas coinciden en pieza, cantidad, largo, ancho, espesor, las 4 columnas de canto y el espesor de canto.

**Decisiones y diferencias conocidas:** (1) `permite_agrupacion=false` y todas las piezas `local` — la agrupación (laterales compartidos, piezas continuas) no se puede validar con una sola hoja, y el `fondo` tiene los ejes invertidos respecto a `formula_largo_grupo`, así que habilitarla a ciegas daría math incorrecto; queda para cuando haya evidencia. (2) El código de módulo saldrá `B-FE12`, no `B12-FE` como el SKU real — `codigoModulo()` concatena prefijo+ancho y no soporta sufijo. (3) Los frentes se imprimen ancho-primero (301,6 | 603,2) y la hoja los imprime alto-primero; es la convención de ejes que ya usa todo el catálogo y es neutra en costo porque el canto es simétrico 2/2.

**Hallazgo grave de paso:** esta hoja desmiente la migración `0036` de ayer — ver la entrada siguiente.

## [2026-09-11] fix pendiente | `0036` dejó mal el alto de puerta de B/UB/V (cajón + puerta)

Ayer el usuario dio la regla "todos los muebles de puertas como los SBFD, los BFD: la altura es la altura del mueble − 3.2mm" y se aplicó `A-RV` a `B`, `UB` y `V` (`0036`). La hoja `B12-FE` lo desmiente: su `DOOR` mide **603,2mm**, no 758,8mm.

La causa es que los tres tipos tienen `n_cajones = 1` (confirmado en `cot_reglas_config`) — son muebles de **cajón + puerta**, no Full Door, así que el alto se reparte: `603,2 (puerta) + 3,2 (reveal) + 152,4 (frente gaveta) + 3,2 (reveal) = 762 = A`. La regla de −3,2mm sí es correcta para BFD/SBFD/SVFD/UBFD/VFD/W/WBL (Full Door, sin cajón), que no se tocan.

La fórmula correcta es la que quedó en `B-FE`: `A - n_cajones*alto_frente_gaveta - (n_cajones+1)*RV`, y requiere además definir `alto_frente_gaveta` como regla en `B`/`UB`/`V` (hoy no existe en esos tipos). Nota: el valor previo a `0036` (`A` pelado) tampoco era correcto — ignoraba tanto el frente de gaveta como los reveals. **No se corrigió todavía: se le reportó al usuario para confirmar el alto de frente de gaveta de cada uno de los tres tipos antes de tocarlos** (en `B-FE` son 6" por la hoja, pero no hay hoja real de `B`/`UB`/`V` que lo confirme). Se dejó anotado en [validacion_hojas_de_ruta.md](wiki/validacion_hojas_de_ruta.md) §10.

## [2026-09-11] ingest | Tipos nuevos `UB-FE` y `V-FE` (hermanas de `B-FE`)

El usuario aclaró que `B-FE`, `UB-FE` y `V-FE` son **tipologías nuevas y separadas**, no reemplazos de `B`/`UB`/`V`. Aplicado en `0038_tipos_ub_fe_v_fe.sql`.

Las tres comparten la estructura de la hoja `B12-FE` (13 filas de plantilla → 16 piezas físicas, caja de gaveta en madera dimensionada al `RIELFE500`), verificada contra la hoja en las tres. Lo propio de cada familia:

- **`UB-FE`** hereda de `UB` la variante `removible`: la base pasa de `P-0.70866-TB` a `removible ? P-TC : (P-0.70866-TB)` (585,6mm → 594,6mm al activarla) y aparecen `refuerzo_delantero_removible` (140mm) y `refuerzo_trasero_removible` (120,75mm), ambos con `formula_cantidad='removible'`. Se agregó `'UB-FE'` a `PREFS_CON_REMOVIBLE` (`src/lib/muebles.ts`) — sin eso la casilla "Removible" no sale en la UI y esas dos piezas nunca se activarían. Verificado con `overrides={removible:1}`.
- **`V-FE`** hereda de `V` la categoría `vanity`.
- Las tres quedan en `permite_agrupacion=false` y todas sus piezas en `local`, igual que `B-FE`: no hay hoja de ruta de un módulo agrupado que valide la geometría de laterales compartidos, y el `fondo` tiene los ejes invertidos respecto a `formula_largo_grupo`.

**Confirmado que los originales no se tocaron:** `B` sigue con 10 piezas, `UB` con 12 y `V` con 10, sin cambios. Barrido de todo el catálogo: **60 tipos activos, 0 fallas** (los 57 de antes más las 3 nuevas). 99/99 tests, typecheck y lint limpios.

**Alto de frentes por tipo (dato del usuario, no de la hoja):** el frente de gaveta es de 6" (152,4mm) en `B-FE` y `V-FE`, pero de **5,5" (139,7mm) en `UB-FE`**. Los números que dio para `UB-FE` (puerta 584,15mm) solo cierran si la línea U trabaja con un alto de mueble de **28¾" (730,25mm)** en vez de 30" — lo que concuerda con los SKU de esa línea que ya aparecían en el Excel (`UDB1828 3/4`, `USVR3328 3/4`). Verificado: `B-FE`/`V-FE` a A=30" dan 152,4 + 603,2, y `UB-FE` a A=28¾" da 139,7 + 584,15; en los tres la pila cierra exacta contra `A`. La fórmula de la puerta es la misma en las tres (`A - n_cajones*alto_frente_gaveta - (n_cajones+1)*RV`); lo único que cambia es la regla `alto_frente_gaveta`.

## [2026-09-11] fix | Piezas que no cobraban tablero, en todo el catálogo (`0039`)

Al comparar `B` contra `B-FE` salió que el `frente_cajon` de `B` estaba con `formula_ancho='0'` y `rol_tablero=NULL`: área cero, o sea que el tablero del frente de gaveta nunca se cobraba, solo su canto. El usuario pidió resolverlo con el criterio de que **toda pieza dentro de un mueble debe considerar tablero**, así que se auditó el catálogo completo en vez de parchar solo `B`.

`engine.ts` solo suma área cuando la pieza tiene rol (`if (pz.rol_tablero) areaPorRol[...] += area`), así que una pieza con rol NULL sale en el despiece pero no cuesta madera. Aparecieron **12 piezas con rol NULL**, de las cuales **7 eran error real** y 5 son de solo-canto a propósito:

**Corregidas (7):**
- `frente_cajon` de `B`, `UB`, `V` y `BBL` — pasan a `rol='frente'`, alto real vía la regla nueva `alto_frente_gaveta`, ancho `L-RV` (la convención de reveal del resto del catálogo; `BBL` conserva su `L-27.75` de esquinero ciego) y canto en los 4 lados en vez de 2 (la hoja real muestra el FRENTE GAVETA con canto en largo Y ancho, igual que la puerta).
- `refuerzo_vert_bisagras` de `BBL` y `BBLFD`, y `refuerzo_profundidad` de `BBL` — tenían medidas reales (80mm de ancho, como todo refuerzo) pero sin rol **y sin canto**, o sea costo cero absoluto. Solo les faltaba el rol (`refuerzo`).

**No se tocaron (5), son solo-canto por diseño:** `PCFD.frente_canto_puertas_op` y `frente_canto_gavetas_op` (el área de los frentes ya la carga entera `frente_area_op` con su factor ×1.25; darles rol duplicaría el costo del frente), `PCFD.frente_delgado_informativo_op` (fila documental, sin canto ni área), y `SV.canto_lavamanos` / `UW.gola_canto`, que codifican una LONGITUD de canto en el largo y llevan ancho 0 a propósito.

**Efecto encadenado que cierra la regresión de `0036`:** al darle alto real al frente de gaveta, la puerta ya no podía ser del alto completo o la fachada se pasaba de `A`. Así que la misma migración corrige la puerta de `B`/`UB`/`V`/`BBL` a `A - n_cajones*alto_frente_gaveta - (n_cajones+1)*RV` — la misma fórmula de las FE. Verificado: en los cuatro la fachada cierra exacta (`puerta + RV + frente_gaveta + RV = A`). Reglas `alto_frente_gaveta`: 6" en `B`/`V`/`BBL`, 5.5" en `UB` (línea U). El 6" de `BBL` es inferencia por consistencia de familia, no dato de hoja — queda anotado.

**Impacto en precio** (L=30", preset por defecto, margen 57%): `B`/`V` −$989, `UB` −$936, `BBL` −$5.904, `BBLFD` +$4.833. En los tres primeros baja porque la corrección de la puerta (que estaba 155,6mm más alta de lo debido) pesa más que el tablero del frente de gaveta que se suma; `BBLFD` sube porque ahí solo se agregó el refuerzo que faltaba.

Barrido final: **60 tipos activos, 0 fallas, 0 piezas con área 0 inesperada**. 99/99 tests, typecheck y lint limpios.

## [2026-09-11] fix | Precio del riel full extension, y conciliación de B-FE contra el Excel

El usuario preguntó si ya podía confiar en el precio de las tipologías FE. La geometría estaba validada contra la hoja de ruta, pero **el precio nunca se había cruzado contra el Excel** — así que se hizo.

Apareció un Excel más reciente en la raíz del repo: `Simulación muebles CEMA (10-09-2026).xlsx` (reemplaza a los `(1)` y `(2)` de antes). Tiene **298 SKU con sufijo `-FE`**, incluido `B12-FE` (fila 1369, observación literal: *"1 gaveta 1 puerta 1/2 entrepaño, para riel full extension (Cajón madera)"*) — o sea que la tipología existe en el maestro de costos y se pudo conciliar de verdad.

**Resultado del cruce inicial** (B12-FE, 12×30×24, preset por defecto): herrajes $56.121 vs $60.080 del Excel. Toda la diferencia era el riel: patas (7.948), bisagra (5.800), manija (14.900) y tornillos (368) coincidían al peso, y la columna AG del Excel ("Costo PAR rieles cajon FULL EXTENSION") trae **31.064** contra los **27.105** del catálogo. Los 27.105 venían de `materiales.xlsx` cuando se sembró el riel en `0021`; el maestro CEMA es más reciente y es la fuente con la que se cotiza. Corregido en `0040_precio_riel_fe.sql`, y también en `DB_RIELES` de `src/lib/muebles.ts`, donde el precio estaba duplicado (no se usa en la UI —solo código y nombre— pero dejarlo desactualizado ya había causado un bug silencioso antes con los códigos de riel).

**Con el riel corregido, el costo de herrajes de B12-FE queda en $60.080, idéntico al Excel.** Consumibles también idénticos y canto a −0,4%.

**Tres divergencias hoja de ruta vs Excel, resueltas por el usuario a favor de la hoja:**
- Laterales de gaveta: la hoja dice 100×500mm (50cm² c/u); el área del Excel implica ~175mm de alto (875cm² c/u). **Manda la hoja** — el Excel sobrecostea ahí.
- Fondo de gaveta: la hoja lo pone en 6mm; el Excel lo costea como Polar 15mm. **Manda la hoja (6mm)**.
- Rieles/refuerzos a 80mm: el Excel sigue en 82,55mm; el catálogo ya está en 80mm por las hojas de ruta (fix anterior de esta wiki). Sin cambio.

**Lo que queda de diferencia es selección de material, no plantilla.** Madera: $78.901 vs $68.575 (+15,1%), y **$7.452 de esos $10.326 (72%) son solo el tablero de fondo**: nuestro `preset_default` usa `PRICARB6CANDELARIA` a $28.858/m² mientras el Excel costea el backing con un tablero de **$9.600/m²**. El resto se reparte entre precios de tablero distintos por m² (Balance 15mm: Excel $32.489 vs catálogo $35.610; Color 18mm: Excel $39.380 vs catálogo $48.529) y el sobrecosteo del Excel en los laterales de gaveta, que se compensan parcialmente. Es el mismo patrón ya documentado en [auditoria_precio_sbfd30.md](wiki/auditoria_precio_sbfd30.md): el grueso de la brecha contra el Excel es el preset de materiales, no el motor.

Total B12-FE: $158.652 vs $148.362 del Excel (+6,9%), enteramente atribuible al preset. 99/99 tests, typecheck y lint limpios.

## [2026-09-11] update | Código de módulo: la medida va después de la letra base (`B12-FE`, no `B-FE12`)

Las tres tipologías nuevas rendían su código como `B-FE12` porque `codigoModulo()` concatenaba la medida al final del prefijo completo. La convención comercial es la contraria: **la medida va siempre inmediatamente después de la letra base**, y el sufijo de familia queda al final.

`codigoModulo()` (`src/lib/module-groups.ts`) ahora parte el prefijo en el primer `-` e inserta la medida ahí: `B-FE` + 12" → `B12-FE`, `UB-FE` → `UB12-FE`, `V-FE` → `V30-FE`.

El cambio es seguro porque **ningún tipo del catálogo salvo esos tres tiene guion en `pref`/`pref_imperial`/`pref_metrico`** (verificado por consulta antes de tocar nada), así que la rama sin guion —que es la que usan todos los demás— queda idéntica: `B12`, `SBFD30`, y los sufijos que `cotizaciones.ts` concatena después siguen cayendo al final (`W3614`, `DB18-1S`). Cubierto con test nuevo en `tests/module-groups.test.ts`, incluyendo los casos de no-regresión.

`0041_codigo_modulo_medida_antes_del_sufijo.sql` normaliza las líneas ya guardadas (había una, `B-FE12` → `B12-FE`). El filtro exige guion en `pref` y `codigo_modulo <> pref`, lo que deja fuera a las cajoneras `DB`: ahí el guion pertenece al sufijo de tipología, y existe al menos una línea con `pref = 'DB25-1S'` que el guard protegió de ser reescrita como `DB25-1S25-1S`. Sin la migración el arreglo llegaría igual, pero solo al volver a guardar la cotización (`recalcularGrupo()` reescribe `codigo_modulo` en cada recálculo).

100/100 tests, typecheck y lint limpios.

## [2026-09-11] update | Auditoría del catálogo activo: dimensiones negativas, herrajes en cero y duplicados en UW

Barrido de los 60 tipos `activo=true` corriendo `calcularMueble()` real contra el `preset_default`. **39 limpios, 21 con anomalía, 0 errores duros.** Detalle completo en [auditoria_catalogo_activo.md](wiki/auditoria_catalogo_activo.md).

**Corregido — dimensiones negativas restaban costo.** `BBL` escribe su gaveta como `L-30.70` / `L-30.427` / `L-27.75`, válido solo por encima de ~31″. Por debajo, `area = cant * lIn * aIn` salía negativa y **restaba** tablero y canto: a L=24″ eran −152, −837, −111 y −145 cm². Acotadas ambas dimensiones a cero en `engine.ts` en vez de parchear fórmula por fórmula — una dimensión negativa nunca es física y la pieza debe aportar cero, no descontar. Test nuevo `tests/dimension-negativa.test.ts`. El frente negativo de `WPC` sí era falso positivo: su `A-36.87598` implica alacena alta y la medida de prueba la evaluaba a 14″.

**Corregido — `UW` cobraba bisagras y manijas por duplicado.** Dos filas `bisagra` idénticas y dos `manija` (`n_puertas + n_cajones` y `n_puertas`); el motor suma todas las filas sin deduplicar por rol, así que un UW de 2 puertas cotizaba 4 pares y 4 manijas. `0042_uw_herrajes_duplicados.sql` deja una por rol, conservando la fórmula de `W`/`WBL`. Estaba `activo=false`, sin cotizaciones afectadas. Único tipo del catálogo con duplicados.

**Abierto, deliberadamente no inferido — 20 tipos activos cotizan con $0 de herrajes.** `engine.ts` no tiene fallback (`for (const hp of (inp.herrajesPlantilla || []))`), y esos 20 tienen piezas de puerta/gaveta con cero filas en `cot_herrajes_plantilla`. Son seleccionables hoy porque la UI filtra por `activo=true`, aunque **ninguno se ha usado en una cotización real** (las únicas líneas sin herrajes son `PN`, `F`, `TK`, que correctamente no llevan). No se arregló en bloque porque la plantilla del catálogo se escribe contra `n_puertas`/`n_cajones` mientras estos tipos —generados por `generar_tipologias.py`— codifican las cantidades en la pieza: `UDB` tiene 3 frentes de gaveta pero `n_cajones` global es 0, así que `riel = n_cajones` daría cero rieles; `WPC` tiene 5 piezas de frente contra `n_puertas`=2. Además `SBAS` (basculante) necesita pistón y `BLS` su mecanismo giratorio, que no están en el catálogo de herrajes. Requiere criterio de producto, no deducción del esquema.

**Verificado sin drift**: 0034, 0039, 0040 y 0041 están todas aplicadas y coinciden con el archivo. `VDF` sin piezas y las 5 piezas con `rol_tablero` nulo siguen siendo correctas (tipo inerte y piezas solo-canto).

También: botón in/mm en el despiece del simulador (`CotizadorForm.tsx`). El cálculo sigue en pulgadas —el catálogo es imperial—; el toggle solo cambia presentación, para leer el despiece en las unidades de producción. `Card` gana un slot opcional `action` para alojarlo en la cabecera.

102/102 tests, typecheck y lint limpios.

## [2026-09-15] update | W2936-SM integrado como variante Gola/SM de `W`

Se analizo la hoja real adjunta `W2936-SM MBLE SUP COC 2 PUERTAS 2 ENTREPANOS`
y se implemento como `W` con `gola=1`, no como copia de `B-FE` ni como tipo
duplicado `W-SM`. La migracion `0045_w_sm_hoja_real.sql` fue aplicada y
verificada en Supabase: entrepanos `L-2*TC-1mm`, puertas `A+15.85mm`, backing
`A-16mm` por `L-16mm`, y orden HDR igual a la hoja real. El motor ahora excluye
herrajes con rol `manija` cuando `gola=1`, conservando bisagras; el cruce contra
el Excel CEMA vigente confirma COP 11.600 de herrajes para `W2936-SM` (2
bisagras, 0 manijas).

Tambien se actualizaron Simulador, Cotizaciones y HDR: `W` inicializa Prof en
12", Cotizaciones genera el codigo comercial `W2936-SM` al elegir Gola/SM, y
HDR permite seleccionar sistema de frente y muestra puertas alto x ancho para
coincidir con la hoja. Se agregaron `tests/w-sm.test.ts` y una prueba de sufijo
`-SM`; `npx tsc --noEmit` y ESLint focal pasaron. El runner `tsx --test` quedo
bloqueado por un error del entorno Windows (`uv_os_get_passwd ENOMEM`), no por
fallas de las aserciones.

## [2026-09-15] ingest | Patron permanente para integrar nuevas tipologias como `B-FE`

El usuario pidio recordar la ultima integracion de la tipologia `B-FE` para repetirla "exactamente igual" con proximas referencias nuevas. Se creo [patron_integracion_tipologias.md](wiki/patron_integracion_tipologias.md) como protocolo explicito: toda nueva tipologia debe nacer como tipo independiente, desde hoja de ruta/referencia primaria, con migracion SQL re-ejecutable, validacion geometrica en mm, revision de herrajes/precio contra Excel CEMA cuando exista, ajustes de UI/HDR/codigo comercial, tests y documentacion. Tambien queda fijado que no se activa agrupacion ni se muta el tipo base por analogia sin evidencia.

## [2026-09-15] update | Aclaracion: `B-FE` es metodo de integracion, no molde estructural

El usuario aclaro que cuando pida incluir una nueva tipologia NO se debe reemplazar la estructura del mueble adjunto por la estructura de `B-FE`. Se actualizo [patron_integracion_tipologias.md](wiki/patron_integracion_tipologias.md): `B-FE` queda como referencia de rigor metodologico (tipo independiente, fuente primaria, validacion, migracion, herrajes/precio y documentacion), pero cada nueva tipologia debe analizarse desde su propia referencia y modelarse con sus propias piezas, medidas, reglas y herrajes.

## [2026-09-15] update | "Incluir nueva tipologia" exige Simulador, Cotizaciones y HDR

Se amplio [patron_integracion_tipologias.md](wiki/patron_integracion_tipologias.md) para que la frase del usuario "incluir nueva tipologia" active el flujo end-to-end completo: analisis de la referencia adjunta, migracion/datos, disponibilidad en Simulador/Diseño, alta y edicion en Cotizaciones, interpretacion y tabla en HDR, codigo comercial correcto, validacion con motor real y cruce contra Excel CEMA cuando exista. Queda explicito que no se debe cerrar una tipologia si solo existe en base de datos pero no es usable en esas tres superficies.

## [2026-09-15] update | Nuevas tipologias deben cargarse y verificarse en Supabase

El usuario agrego que al incluir nuevas tipologias tambien se deben actualizar, analizar y cargar a la base de datos de Supabase. Se actualizo [patron_integracion_tipologias.md](wiki/patron_integracion_tipologias.md): el flujo ahora exige aplicar/cargar la migracion en Supabase, consultar la base real para confirmar `cot_tipos_mueble`, `cot_piezas_plantilla`, `cot_reglas_config`, `cot_herrajes_plantilla` y tablas relacionadas, y validar el motor con datos leidos desde Supabase. No se debe cerrar la tarea si la tipologia queda solo como SQL local; si no hay acceso a Supabase, debe reportarse como bloqueo/pendiente concreto.

## [2026-09-11] update | Herrajes de 7 tipos derivados del Excel CEMA; el catálogo baja de 21 a 13 anomalías

Segunda pasada sobre el hueco de herrajes que quedó abierto en la entrada anterior. La clave fue la columna **"Costo hardware"** de la hoja `Costos Muebles` del Excel CEMA, que da el costo de herrajes por SKU real y, con los precios unitarios del catálogo, **descompone de forma única**:

- base carcasa de piso = `4×PATA10AJUST(1.987) + 16×TORNILLO858(23)` = **8.316**
- puerta completa = `BISAGRAPAR(5.800) + MANIJA415(7.450)` = **13.250**
- rieles 31.064 (FE) / 49.706,8 (Tandem), barra 9.800

Control: `BFD9` del Excel = 21.566 = 8.316 + 13.250, exacto. Con eso, siete tipos quedaron determinados sin interpretación y se aplicaron en `0043_herrajes_tipos_sin_plantilla.sql`, copiando la plantilla del hermano ya validado en cada caso: `UVFD`←`VFD`, `USVFD`←`SVFD`, `UV`←`V`, `UDB`←`DB`, `WER`←`W`, y `POD`/`DD` con solo riel (el Excel les da 31.064/49.707, un riel y nada más).

El hallazgo que cerró `UDB`: su reparto de barras en el Excel —1 gaveta→1 barra, 3 iguales→0, `-1s`→2, `-2s`→1— **coincide exactamente con `DB_TIPOLOGIAS` de `src/lib/muebles.ts`**, o sea que UDB es la cajonera DB de la línea U y comparte su fórmula de barra. Eso convierte la copia desde DB en evidencia, no analogía.

Las reglas nuevas (`n_cajones` en UV/POD/DD, `n_cajones`+`n_puertas` en UDB) son **geometría-neutra**: se verificó por consulta que ninguna pieza de esos tipos referencia esas variables, así que cambian el conteo de herrajes sin mover una medida de corte. A `USVFD`/`UVFD` no se les tocó ninguna regla justamente porque sí usan `n_puertas` en el ancho del frente, y la global por `L` es la que reproduce sus dos valores del Excel.

**`DF` resultó no ser defecto**: el Excel le asigna 0 de hardware, su plantilla vacía es correcta.

Validado con el motor real contra 8 montos del Excel (UVFD 1 y 2 puertas, USVFD, UV 1 y 2 puertas, UDB 3 gavetas, POD, WER): **los 8 coinciden al peso**.

**El catálogo pasa de 21 a 13 anomalías sobre 60 tipos activos.** Efecto colateral visible del clamp de la entrada anterior: `WPC` sube de 128.094 a 151.481 en madera, porque su frente negativo ya no le resta área.

Quedan 12 pendientes por criterio de producto: `SLOC`, `WLD`, `SBAS`, `WPC`, `KF`, `KD`, `CLV`, `DFE`, `CC`, `BLS`, `BMW`, `SDB` — ausentes del Excel o presentes solo en variantes gola/push/con accesorio que no descomponen contra una base estable.

102/102 tests, typecheck y lint limpios.

## [2026-09-11] update | Precio real del push (8.032) y herrajes de SLOC/WLD/KF; el catálogo baja de 13 a 10 anomalías

Tercera pasada. La hoja **`costos unitarios`** del Excel CEMA resultó ser el maestro de herrajes del simulador, y contrastarla contra `cot_herrajes` dejó ver que **todos los precios coinciden salvo el dispositivo PUSH: el Excel lo tiene en 8.032 y el catálogo en 5.600**. Es el mismo código HBM237-02 ya sembrado, o sea el mismo herraje con precio viejo — el mismo patrón del riel full extension en `0040`.

Confirmado con cuatro filas que cierran al peso solo con 8.032: `WPC24 3/44924-PUSH-2S` (19.632 = 2 bis + 1 push), `WPC2461 1/2-18MM` (55.328 = 4 bis + 4 push), `PCFD219525 1/2-4OP-PUSH` (234.807) y `PCFD34 1/28416 1/2-2OP` (146.994). **Las dos de PCFD las reproduce exacto la plantilla que ya existía, sin tocarla**: el único dato equivocado era el precio. Corregido en `0044_push_real_y_herrajes_superiores.sql`. Verificado que el 5.600 no estuviera duplicado en código (a diferencia de los rieles, no lo estaba).

La misma migración resuelve tres tipos más copiando la plantilla de `W` (bisagra `n_puertas`, manija `n_puertas + n_cajones`, sin patas): **`SLOC`** y **`WLD`**, que tienen el mismo juego de piezas que `W` y cuyo ancho de frente ya se escribe `(L-n_puertas*RV)/n_puertas` —la geometría del propio tipo ya asume `n_puertas` puertas, igual que `WER` en 0043—, y **`KF`**, que sí está en el Excel con muchas filas: 13.250 con 1 puerta, 26.500 con 2. Los `KF-*` en 0 son huecos de la fuente, no regla: `KF-SBFD30` está en 0 y `KF-SBFD36` en 26.500.

Validado con el motor real: **10 de 10 casos al peso**, incluidas las 4 regresiones de 0043.

**El catálogo pasa de 13 a 10 anomalías.** De esas 10, `DF` está confirmado como correcto (el Excel le da 0 de hardware), así que quedan **9 pendientes**: `SBAS`, `WPC`, `SDB`, `KD`, `BLS`, `BMW`, `CC`, `CLV`, `DFE`. Para cada uno queda anotado en [auditoria_catalogo_activo.md](wiki/auditoria_catalogo_activo.md) exactamente qué dato falta. El más cercano es `SBAS`: el Excel fija el brazo basculante en 63.000 (confirmado 3 veces), pero la plantilla declara 3 piezas `frente` y `n_puertas` daría 2, y además conviven dos variantes de basculante (las filas `TW-WLM` llevan solo bisagras).

**Anotado sin corregir**: el `TW` del Excel es un mueble de puerta basculante en todas sus filas, mientras que el `TW` del catálogo es "Mueble superior esquinero". O el nombre está mal o son dos cosas con el mismo prefijo; cambiar la semántica de un tipo que ya se usa es decisión de producto.

102/102 tests, typecheck y lint limpios.

## [2026-09-15] update | Codificación comercial unificada: el alto de la familia W y el sufijo -SM en las 4 superficies

La regla del código de módulo estaba replicada en cuatro superficies y producía cadenas distintas para el mismo mueble. Para un `W` 29×36 con frente `SM`: `recalcularGrupo()` daba `W2936-SM`, el `HdrBuscador` daba `W2936-SM`, pero **`AddLineForm` daba `W29-SM`** (omitía el alto) y el **Simulador daba `W29`** (sin alto, sin tipología DB y sin sufijo). El valor persistido en `codigo_modulo` siempre salió de `recalcularGrupo()`, así que el dato guardado nunca estuvo mal; lo que divergía era lo que el usuario veía antes de guardar.

Se centralizó en **`codigoComercial()`** (`src/lib/module-groups.ts`), que fija el orden de los segmentos: `pref + largo [+ alto] [+ -tipologiaDB] [+ -nOP-PUSH] [+ -SM]`. Las cuatro superficies ahora la llaman.

**Qué tipos llevan el alto**: `PREFS_ALTO_EN_CODIGO = ['W','WBL','WER','WLD','WPC','PN']` — la familia `W` de superiores de pared más los paneles. `WCC` queda fuera a propósito: pese al prefijo, es un módulo de clóset (`categoria='closet'`), no un superior de pared. Los superiores de la línea `S` (`S`, `SA`, `SBAS`, `SLOC`, `SMO`) y `UW`/`TW` tampoco lo llevan: no hay hoja real que lo respalde y ampliarlo reescribiría códigos ya guardados en el próximo recálculo. Decisión de producto tomada con el usuario.

**Etiqueta**: la opción del desplegable pasa de "Gola" a **`SM`**, que es el código que usa comercial. La clave interna sigue siendo `gola` y el override `gola=0/1` no cambia.

**Simulador**: ahora muestra el código comercial como badge bajo el precio estimado (antes no se veía en ninguna parte) y las tarjetas de módulo combinado muestran el código completo en vez de `W29`. Como el Simulador no tiene sistema de medida de proyecto, se deriva de la unidad activa (`in` → imperial, resto → métrico).

Complementa la integración de geometría `W-SM` de [w_sm_hoja_real.md](wiki/w_sm_hoja_real.md), que ya había añadido el sufijo en tres de las cuatro superficies. Documentado en [codificacion_comercial_modulos.md](wiki/codificacion_comercial_modulos.md), que también deja anotada una deuda: `descripcion_es` cambia de `W2936-SM 29x36x12 in` a `W 29x36x12 in` tras el primer recálculo, porque `construirFilaLinea()` recibe el prefijo base en vez del código.

108/108 tests, typecheck y lint limpios.

## [2026-09-15] update | La puerta con gola cuelga por debajo de la base, no sobre la tapa

Reportado desde la vista lateral del Simulador: en un `W` con `SM` el frente se dibujaba asomando **por encima** del mueble. La puerta con gola se corta más alta que la carcasa (`gola ? A+0.62402 : A-RV`, migración 0045: `A+15.85mm`), pero `construirVisualizacion()` apilaba las puertas desde la base hacia arriba sin distinguir gola, así que todo el sobrante quedaba arriba.

Está al revés de cómo se fabrica: ese excedente **es el agarre**, y en un superior la puerta se toma por debajo. Para `W2936-SM` la puerta pasa de `z=0 … 930.2` (sobresaliendo 15.8mm sobre la tapa de 914.4) a `z=-15.8 … 914.4`, es decir colgando bajo la base y a ras por arriba. Con `gola=0` la geometría no cambia.

De paso desaparece un aviso falso: la escena disparaba *"la fachada necesita distribución específica por niveles"* porque el apilado superaba `A+4` por el voladizo mal orientado.

**Límite anotado, no resuelto**: la dirección hacia abajo corresponde a la gola de un mueble **superior**. En un mueble base la gola va arriba (la puerta se toma por debajo del mesón), así que el excedente debería subir. Hoy solo `W` tiene fórmula de puerta condicional a gola, así que es el único tipo con voladizo y la regla no se puede equivocar; si se añade una a un tipo base (`B`, `BFD`, `SBFD`…) habrá que hacerla dependiente de la familia. Documentado en [visualizacion_gola_voladizo.md](wiki/visualizacion_gola_voladizo.md).

Los frentes de gaveta siguen otro camino (`drawerSlots` ya reserva 53.6mm repartiendo desde la tapa) y no se tocaron. 110/110 tests, typecheck y lint limpios.

## [2026-09-15] update | Normalizados en Supabase los códigos de módulo de la familia W/PN sin alto

Auditoría de la base real antes de tocar nada: **las migraciones 0037–0045 ya estaban todas aplicadas**, verificado contra la base y no contra el repo (3 tipos FE, precio PUSH 8032, 6 plantillas SLOC/WLD/KF, `UW` sin herrajes duplicados, 0 líneas con el formato de código viejo de 0041, y las 4 fórmulas condicionales de gola en `W`). La 0045 la había aplicado la sesión de esta mañana.

Al ampliar `PREFS_ALTO_EN_CODIGO` a la familia W completa quedaba la duda de si había códigos guardados desactualizados. Los cuatro tipos añadidos (`WBL`, `WER`, `WLD`, `WPC`) **no tienen ninguna línea guardada**, así que la ampliación no reescribió nada. De las 16 líneas W/PN existentes, 15 ya coincidían y **1 estaba desfasada: `PN14` debía ser `PN1422`** — desfase anterior a este cambio, porque `PN` ya estaba en la regla.

`0046_codigo_modulo_alto_familia_w.sql` la normaliza, siguiendo el precedente de 0041. La condición es estricta a propósito: solo toca filas cuyo código es exactamente `pref || largo`, así que un código con sufijo (`-SM`, `-1S`, `-2OP-PUSH`) no coincide y queda intacto; y solo normaliza líneas cuya unidad ya es la del sistema del proyecto (imperial→in, métrico→cm), porque las demás exigirían replicar la conversión de unidades en SQL y el recálculo ya las corrige con el motor real.

Aplicada y verificada: 16 líneas, 0 desactualizadas. Idempotente — re-ejecutarla toca 0 filas.

## [2026-09-15] fix | El backing de W con gola estaba girado 90°: la hoja ordena por tamaño, el motor por eje

Al revisar el fondo salió el defecto de raíz. La hoja de ruta ordena sus columnas **por tamaño** (la medida mayor primero, sin importar el eje: `BASE 706.6x304.8` es horizontal y `SIDE 914.4x304.8` es vertical). El motor usa `formula_largo`/`formula_ancho` como **ejes geométricos**, y cuál es cuál lo fija `visualizacion.intercambiar` de la pieza.

`0045_w_sm_hoja_real.sql` copió el backing tal como lo lista la hoja (`898.4 x 720.6`) y lo escribió como largo/ancho. Pero el fondo de `W` tiene `intercambiar=false`, y su rama **sin** gola (`L-TC`/`A-0.59`) ya seguía esa convención: la rama **con** gola quedó con la contraria. Como una pieza solo tiene un `intercambiar`, una de las dos ramas tenía que estar mal.

En `W2936-SM` (carcasa 736.6 x 914.4mm) el backing se construía **898.4mm de ancho horizontal — sobresaliendo 161.8mm por los lados** — y solo 720.6mm de alto. Era también la causa de que la vista frontal del Simulador reportara `Largo 898,4 mm` en un mueble de 736.6: el bounding box lo fijaba el fondo girado, no la carcasa. `0047_w_fondo_ejes_gola.sql` deja ambas ramas en la convención de `intercambiar=false`.

**El costo nunca estuvo afectado**: misma área (`720.6 × 898.4 = 0.6474 m²`) y el fondo no lleva canto. Solo cambia qué medida es el largo y cuál el ancho.

**Auditoría de los 44 tipos con respaldo**: `W` era la única incoherencia real entre fórmulas e `intercambiar`. `BMW` y `SDB` aparecieron como sospechosos pero son falsos positivos (backing de medidas constantes). Cuatro tipos (`B-FE`, `UB-FE`, `V-FE`, `UW`) no tienen `visualizacion` cargada y caen en `inferirMontaje()`.

El orden de columnas de la hoja es presentación, no geometría, así que vive en `HdrTabla.tsx`: el frente va con el alto primero y el fondo se ordena por tamaño, de modo que el HDR sigue leyendo `898.4 x 720.6` como la hoja real. Documentado en [ejes_fondo_backing.md](wiki/ejes_fondo_backing.md). 110/110 tests, typecheck y lint limpios.

## [2026-09-15] lint | Auditoría empírica del fondo en los 60 tipos: sin más hallazgos; el fixture de tests queda desactualizado

Cierre de la revisión del backing. La auditoría anterior era estática (cruzar fórmulas contra `intercambiar`) y dejaba fuera cuatro tipos sin `visualizacion` cargada. Se completó con una pasada **empírica** sobre el catálogo real de Supabase (60 tipos, 446 piezas): construir la escena de cada tipo con tres juegos de medidas y `gola` 0/1, y verificar que el respaldo quepa en la carcasa. **Ningún fondo excede su carcasa en ningún caso** tras 0047.

`SDB` apareció en la primera corrida, pero por medidas de prueba irreales: es "Cajonera con panel removible", modelada con despiece de medidas **constantes** (backing fijo de 422.4 x 441.0 mm), así que solo se fabrica al ancho para el que se tomó ese despiece. A su ancho nominal cabe. Mismo caso que `BMW` en la pasada estática.

**Los 4 tipos sin `visualizacion` (`B-FE`, `UB-FE`, `V-FE`, `UW`) no son un problema**: para el plano `XZ`, `inferirMontaje()` deriva el flag de las propias fórmulas (`intercambiar = /\bL\b/.test(ancho) && !/\bL\b/.test(largo)`), que es justo la definición de la convención B. Los cuatro quedan correctos. Esto confirma de paso por qué el defecto de `W` había que arreglarlo en las fórmulas y no en el flag: sus dos ramas usaban convenciones opuestas y una pieza solo tiene un `intercambiar`.

18 tipos no tienen respaldo, como corresponde: no son cajas (`F`, `PN`, `TK`, `BOV`, `BT`, `CC`, `CLV`, `DD`, `DF`, `DFE`, `E`, `FL`, `KD`, `KF`, `POD`, `D`, `R`, `WCC`).

Añadido test de regresión: el fondo de `W` debe caber en la carcasa y su eje vertical ser el mayor, con gola 0 y 1. Verificado que **falla** con las fórmulas de 0045 y pasa con las de 0047 — no es un test decorativo.

**Deuda anotada**: `tests/fixtures/catalogo-visualizacion.json` está desactualizado (57 tipos, le faltan `B-FE`/`UB-FE`/`V-FE`, y su `W` no tiene las ramas de gola). Por eso los tests de gola parchean las fórmulas en el test en vez de leerlas del fixture. Refrescarlo cambiaría las entradas de los 57 tipos de golpe, así que se deja para una tarea propia. 112/112 tests, typecheck y lint limpios.

## [2026-09-15] fix | El lateral de W-SM se corta 1" menos que el alto nominal; el backing lo sigue

Corrección de producción reportada por el usuario: **en un `W` con `SM` el lateral no mide el alto nominal, sino 1" menos** — esa pulgada la ocupa la gola. Para `W2936-SM` (A=36") el lateral es 35" = 889mm.

Esto contradecía la transcripción de la hoja real hecha en 0045, que registraba `SIDE = 914.4mm` (36"), es decir el alto nominal tomado como si fuera el corte del lateral. Se consultó antes de aplicar: **gobierna 35"**, y solo en la rama con gola (un `W` con manija conserva `lateral = A`, que no tiene evidencia en contra).

**El efecto en cadena que obligó a preguntar**: con el lateral en 889mm, el backing de `A-0.62992` (898.4mm) quedaba **9.4mm más alto que el lateral** — imposible de armar, y rompía el test de regresión añadido en la revisión del fondo. Decidido que el backing sigue al lateral conservando su misma holgura de 16mm: `A-1.62992` = 873.0mm.

`0048_w_sm_lateral_una_pulgada_menos.sql` aplica ambos cambios. Despiece resultante de `W2936-SM`: lateral 889.0, backing 720.6 x 873.0. La rama con manija queda intacta (lateral 914.4, backing 721.6 x 899.4).

Verificado en la escena: el backing (33.4..906.4) queda dentro del lateral (25.4..914.4); la puerta va de -15.8 a 914.4, a ras del lateral por arriba y colgando **41.2mm** por debajo, que es el agarre de la gola — coherente con los 53.6mm de holgura de gola que documenta el motor. Sin avisos.

Corregidas en [w_sm_hoja_real.md](wiki/w_sm_hoja_real.md) las dos tablas que arrastraban la transcripción vieja (despiece confirmado y validación). Tests: lateral 889 con gola / 914.4 con manija, y el fondo ahora se valida contra el lateral y no contra el alto nominal. 113/113 tests, typecheck y lint limpios.

## [2026-09-15] fix | La holgura de 1mm del entrepaño y el fondo es estructural, no de gola: aplicada a 22 tipos

Reportado desde el despiece de un `W` **con manija**: entrepaño 706.6mm y fondo 721.6 x 899.4mm, cuando deben ser 705.6 y 720.6 x 898.4. Las piezas que entran *dentro* de la carcasa se cortan 1mm más pequeñas; sin esa holgura no entran.

La auditoría mostró que **no era un caso aislado de `W`**: la holgura ya existía en los tipos validados más recientemente contra hojas reales, y `W` era el inconsistente. El entrepaño de `B-FE`/`UB-FE`/`V-FE` ya usaba `L-2*TC-0.03937` incondicional, y el fondo de `S`/`SA`/`SBAS`/`SLOC`/`SMO` ya usaba 16mm (`A-0.62992`/`L-0.62992`). `0045` había introducido el 1mm del entrepaño **condicionado a `gola`** porque lo dedujo de una hoja de `W2936-SM` — pero la holgura no depende del sistema de frente.

`0049_holgura_1mm_entrepano_y_fondo.sql`, con el alcance decidido por el usuario tras presentarle el impacto de cada opción:

- **Entrepaño**: los 22 tipos que usaban `L-2*TC` pasan a `L-2*TC-0.03937` (`AL`, `B`, `BBL`, `BBLFD`, `BFD`, `BMW`, `CC`, `CLV`, `OVPC`, `PC`, `PCFD`, `SBAS`, `UB`, `UBFD`, `UW`, `V`, `VFD`, `VPC`, `W`, `WBL`, `WCC`, `WPC`). En `W` además deja de depender de gola.
- **Fondo**: los 4 superiores de pared con 15mm (`W`, `TW`, `UW`, `WBL`) pasan a 16mm, alineados con la familia `S`. En `W` el ancho conserva su rama de gola (`gola ? A-1.62992 : A-0.62992`) porque con SM el fondo sigue al lateral, que se corta 1" más corto.

**Quedaron fuera a propósito** los tipos que modelan estas piezas con medidas constantes, donde la holgura ya está en el número: `BLS`, `WER`, `SDB`, `BMW` (fondo). Aparecen como falsos positivos en cualquier auditoría que los pruebe a anchos que no fabrican.

Confirmado además que **solo hay una base de datos**: `run-sql-isazaale.mjs` usa las mismas credenciales que `run-sql.mjs`; esos archivos son un duplicado histórico, no un segundo entorno.

Auditoría posterior: 60 tipos, 348 escenas, fondos y entrepaños dentro de la carcasa, sin dimensiones inválidas. Migración idempotente, sin notas duplicadas. 114/114 tests, typecheck y lint limpios. Documentado en [holgura_1mm_estructura.md](wiki/holgura_1mm_estructura.md).

## [2026-09-16] fix | El despiece del Simulador contradecía al del HDR: orientación y nombre de pieza unificados

Reportado sobre un `SBFD` (Sink Base Full Door) 30x30x24: en el Simulador el frente salía `377.8 x 758.8` y el fondo `747 x 762`, cuando producción los lee `758.8 x 377.8` y `762 x 747`. Además la pieza se llamaba `frente` siendo una puerta.

**La causa no era el motor sino una inconsistencia entre dos tablas**: `HdrTabla.tsx` ya aplicaba ambas convenciones —invertía frente y fondo, y renombraba `frente`→`DOOR` cuando el mueble tenía puertas— mientras el despiece del Simulador mostraba los valores crudos. Las dos tablas mostraban lo mismo de forma distinta.

La regla se extrajo a `orientarPieza()` y `nombrePieza()` en `src/lib/muebles.ts`, y ahora ambas tablas la consumen. `HdrTabla` pierde su copia local.

- `orientarPieza`: el frente siempre con el alto primero; el fondo ordenado por tamaño, porque su eje depende del `intercambiar` del tipo y la tabla no tiene acceso a esa configuración.
- `nombrePieza`: `frente` → `puerta` solo cuando la tipología declara `n_puertas`. El motor usa el mismo nombre para una puerta y para la cara de una gaveta; en una cajonera sigue diciendo `frente`.

**Alcance decidido con el usuario**: aplicar la convención del HDR en vez de codificar el caso SBFD. Cubre los 13 tipos con puertas; los 20 que usan el frente como cara de gaveta no cambian. Se descartó la variante "solo SBFD" justamente porque dejaba la contradicción viva en los otros 12 tipos con puertas.

Añadido `tests/despiece-presentacion.test.ts` (4 casos). 118/118 tests, typecheck y lint limpios.

## [2026-09-16] fix | Consumo de tablero en m² y de canto en metros lineales, con la merma incluida

Pedido: producción compra tablero por m² y canto por metro lineal, y el Simulador los mostraba en `cm²` y `cm`. Al implementarlo apareció una asimetría de fondo en el motor: **la cantidad del tablero no explicaba su costo y la del canto sí.**

- Tablero: se reportaba `cm2` **neto** mientras el costo era `cm2 × (1+desperdicio) / 10000 × precio_m2`.
- Canto: se reportaba `longCm` que **ya incluía** su merma (5 cm por arista), y el costo era `longCm / 100 × precio`.

El motor ahora expone ambas magnitudes en las dos formas: `maderaPorRol` con `cm2` (neto, del despiece) y `m2` (facturable, con merma); `cantoPorCalibre` con `longCm` y `metros`. También expone `desperdicio` en el `Breakdown`, que antes solo existía en la entrada, para que la UI pueda mostrar el porcentaje aplicado. `group-result.ts` consolida los campos nuevos.

**Las dos mermas son distintas y conviene no confundirlas**: el tablero usa el porcentaje del proyecto; el canto no lo usa, su merma son 5 cm por arista más 8 cm por pieza de refuerzo. Cambiar el `desperdicio` mueve el consumo de tablero pero no el de canto.

**Trazabilidad con la HDR**: `Σ piezas[rol].areaCm2 == maderaPorRol[rol].cm2`, y de ahí sale el m² aplicando la merma. En el `SBFD 30x30x24` del reporte el neto suma **2.710 m²**, exactamente el TOTAL de la tabla de despiece; con 15% de merma el facturable es 3.117 m². La celda lleva el desglose en su `title`.

Dos defectos los encontró el propio test al escribirlo: la regla de los **8 cm de canto por pieza de refuerzo** no estaba documentada en ningún lado, y redondear `m2` a 4 decimales rompía la igualdad `cantidad × precio = costo` (se guardan 6 decimales y se muestran 3).

Añadido `tests/consumo-materiales.test.ts` (4 casos). 122/122 tests, typecheck y lint limpios.

## [2026-09-16] fix | El calibre de canto se agrupaba por texto crudo: una fila duplicada y la columna de espesor vacía en la HDR

Al auditar las listas de materiales en Supabase apareció que `cot_cantos` era internamente inconsistente: `19X0,45`, `19X1` y `19X2` con X mayúscula, contra `22x0,45`, `22x1` y `22x1 High Gloss` con minúscula. Las plantillas de pieza usan siempre minúscula — 334 piezas con `19x0,45` y 74 con `22x1`, ni una mayúscula.

El calibre llega al motor desde **tres sitios**: la plantilla de la pieza, el valor derivado del espesor del tablero, y el override del formulario (que toma el texto de `cot_cantos`). El motor normalizaba para **buscar** el precio pero agrupaba por el **texto crudo**, así que la discrepancia producía dos defectos de presentación:

1. **El listado de materiales partía un mismo canto en dos filas** — visible en el reporte: `19X0,45` 909,44 cm y `19x0,45` 328,8 cm. Las piezas de caja reciben el override; las de refuerzo no.
2. **La columna "Espesor canto" de la HDR salía vacía** en las piezas con override, porque `espesorCantoLabel()` partía por `x` minúscula y devolvía `''`. Afectaba a **44 de 47 líneas guardadas**, que llevan `cantoCaja: "19X0,45"`.

El costo nunca estuvo mal; fallaba solo la presentación, y en las dos tablas a la vez — justo lo contrario de que los consumos "hablen con la HDR".

Corregido en tres capas: `0050_normaliza_calibre_canto.sql` normaliza `cot_cantos` (3 filas), los overrides de 44 líneas y el `config_default` de 4 proyectos; el motor agrupa por `norm(calibre)` y reporta la grafía del catálogo; `espesorCantoLabel()` parte por `/x/i`. Las dos últimas impiden que reaparezca si entra otra grafía por cualquiera de los tres caminos.

Verificado: 0 filas con mayúscula en catálogo, líneas y proyectos; sin duplicados al normalizar; migración idempotente. `calibre` no tiene FK y el `NA` con precio 0 no lo usa ninguna plantilla, así que se deja. 123/123 tests, typecheck y lint limpios.

## [2026-09-16] fix | La ruta /cotizador quedó en blanco: el store persiste el resultado y no tenía los campos nuevos

Regresión introducida por mí al añadir `m2`/`metros`/`desperdicio` al `Breakdown`. `simuladorStore` guarda el `result` completo en `localStorage`, así que un resultado calculado **antes** del cambio no trae esos campos. El render llamaba `m.m2.toLocaleString()` directo y lanzaba `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` en `CotizadorForm.tsx:776`, dentro del `map` de `maderaPorRol` — la página entera en blanco.

Confirmado en `.next/dev/logs/next-development.log`, con el stack apuntando exactamente a `superficie()`.

El `migrate` del store ya ponía `result: null`, pero **solo corre si cambia la `version`**, y yo no la toqué. Corregido en dos capas: `version` de 2 a 3 para invalidar los resultados persistidos, y render tolerante que deriva `m2` de `cm2 × (1+desperdicio)` y `metros` de `longCm/100` cuando los campos faltan. Reproducido el crash con la forma vieja y verificado que el arreglo lo absorbe.

**Regla anotada en [consumo_materiales.md](wiki/consumo_materiales.md)**: al añadir un campo al `Breakdown` y renderizarlo, hay que subir la `version` del store **y** dejar el render tolerante. Solo una de las dos no basta — la versión no ayuda a quien ya tiene la pestaña abierta, y la tolerancia sola deja datos viejos indefinidamente.

123/123 tests, typecheck y lint limpios. Sin errores en el log tras recompilar.

## [2026-09-16] update | El refuerzo delantero de SBFD mide 128mm de ancho, no 127

La plantilla lo tenía en `5` pulgadas exactas = 127.0 mm; producción lo corta a **128 mm**. `0051_sbfd_refuerzo_delantero_128mm.sql` lo pasa a `5.03937` in = 128.0000 mm, con la misma convención de cinco decimales que ya usan otras piezas (`3.14961` = 80 mm, `11.81102` = 300 mm).

**Solo cambia el ancho.** El rol de tablero sigue siendo `caja`: el espesor no entra en esta corrección.

Nota sobre la lectura del pedido: llegó como "los refuerzos delanteros siempre son de 18mm", que interpreté como espesor. Al preguntar por el alcance el usuario aclaró que se refería al **ancho**, 128 mm en lugar de 127. Vale la pena preguntar cuando un número en milímetros puede ser espesor o dimensión — el espesor habría exigido un rol de tablero nuevo y un cambio de costo de varios miles de pesos por módulo, frente a este cambio de un milímetro.

**Alcance confirmado: solo `SBFD`.** Los otros siete tipos cuyo refuerzo delantero también cuelga del rol `caja` (`BBLFD`, `BFD`, `BOMH`, `SV`, `SVFD`, `UBFD`, `VFD`) quedan como están, sin evidencia que los respalde.

Despiece resultante de `SBFD 30x30x24`: lateral 762.0 x 609.6, base 732.0 x 585.6, **refuerzo_delantero 732.0 x 128.0**, refuerzo_trasero 732.0 x 80.0, frente 377.8 x 758.8, fondo 747.0 x 762.0. Migración idempotente. 123/123 tests, typecheck y lint limpios.

## [2026-09-17] fix | B contra hoja real: tres medidas corregidas que las variantes FE ya tenían bien

Cruce de la hoja **"B12 · MUEBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO CARB2"** (L=12", A=30", P=24") contra el motor. **7 de 10 piezas ya coincidían al milímetro**; tres arrastraban aproximaciones antiguas:

| Pieza | `B` antes | Hoja | Dif |
| --- | ---: | ---: | ---: |
| SHELF | `P*0.5` = 304.8 | 300 | 4.8 mm |
| PIEZA CAJON | `L-2.95` = 229.9 | 199.8 | 30.1 mm |
| BACKING | `L-TC`/`A` = 289.8×762 | 760 × 288.8 | 1 y 2 mm |

**Lo relevante: en los tres casos la fórmula correcta ya existía en el catálogo.** El entrepaño de 300mm (`11.81102`) lo tienen `B-FE`/`UB-FE`/`V-FE`; la base de gaveta `L-4.13386` la tiene `UDB`; el fondo `A-0.07874`/`L-0.62992` lo tienen `B-FE`, `DB`, `UDB`, `UB-FE` y `V-FE`. Mismo patrón que la holgura de 1mm: los tipos validados recientemente traen la geometría buena y los tipos base se quedaron atrás. `0052_b_geometria_hoja_real.sql` alinea `B` con ellos.

**Dos decisiones consultadas**: el entrepaño queda **constante en 300mm** y no como media profundidad (la hoja lo titula "1/2 ENTREPAÑO", que era el origen del `P*0.5`); y el alcance es **solo `B`** — `UB` y `V` arrastran exactamente las mismas tres fórmulas, y `DV` la del cajón, pero se dejan hasta tener una hoja suya.

**El fondo cambió de eje**: al pasar el largo a base `A` hubo que voltear `intercambiar` a `true`, o la escena lo construiría girado 90°. Verificado en 12", 24" y 36" que el respaldo cabe en el lateral y queda vertical.

Anotado sin corregir: `DB` usa `L-4.13` para la base de gaveta, 0.1mm largo frente al `L-4.13386` de `UDB`.

Añadido `tests/b12-hoja-real.test.ts` (3 casos: las 10 piezas contra la hoja, las tres correcciones fijadas, y que la geometría escale con la medida). Migración idempotente. 126/126 tests, typecheck y lint limpios.

## [2026-09-17] update | DB contra hoja real: la estructura ya era correcta, solo la base de gaveta estaba 0.1mm larga

Cruce de la hoja **"HRJ DB18-1S · MUEBLE INF COC 3 GAVETAS 1 PEQUENA CARB2"** (L=18", A=30", P=24") contra el motor. A diferencia de `B`, aqui **la estructura de piezas ya era correcta**: las 18 filas de la hoja se agrupan en 10 piezas del motor y todas salieron con la cantidad y las medidas esperadas, incluido el reparto asimetrico entre la gaveta pequena y las dos grandes, y los tres rieles delanteros (uno por gaveta) contra dos traseros fijos.

**Lo unico corregido**: `base_gaveta` usaba `L-4.13`, que da 352.298mm donde la hoja pide 352.2. `4.13386"` = 105mm exactos. `DB` era el **unico tipo del catalogo** que conservaba el valor truncado — `B` (corregido en 0052), `POD`, `UDB` y `UV` ya usaban `L-4.13386`. Lo alinea `0053_db_base_gaveta_precision.sql`.

**Diferencia que no se persiguio**: `frente_gaveta_grande` da 300.00mm y la hoja dice 300.08. Para que diera 300.08 el reveal tendria que ser 3.1467mm en vez de 3.2, valor que no aparece en ninguna otra parte del catalogo y que la propia hoja contradice: el largo de los frentes es `454 = L - 3.2`. Son 80 micras, por debajo de cualquier tolerancia de corte, asi que se trata como redondeo de la hoja. Anotado por si aparece en mas hojas.

**Falso positivo descartado**: al cruzar los datos aparece `n_barras = -1`. Es un centinela que significa "sin fijar" — la plantilla de herrajes lo guarda con `n_barras >= 0 ? n_barras : (n_cajones <= 2 ? n_cajones : 0)`, asi que nunca produce cantidad negativa.

Anadido `tests/db18-hoja-real.test.ts` (3 casos: las 10 piezas contra la hoja, los 105mm exactos escalando con la medida, y que el reparto de frentes siga la tipologia — con `DB-3` los tres frentes se reparten el alto y no se corta frente ni trasero de gaveta pequena). Migracion idempotente. 129/129 tests, typecheck y lint limpios.

## [2026-09-17] update | Auditoria de los tres grupos rezagados; UB y V se alinean con B

Cruce de las tres formulas que la hoja de `B12` corrigio contra los 60 tipos del catalogo, para ver quien mas las arrastraba:

| Formula antigua | Tipos que la usaban |
| --- | --- |
| entrepano `P*0.5` | `BBL`, `UB`, `V` |
| base_gaveta `L-2.95` | `DV`, `DVE`, `PCFD`, `UB`, `UDV`, `V` |
| fondo `L-TC`/`A` | 14 tipos, entre ellos `SBFD` y `BFD` |

**`UB` y `V` son analogos exactos de `B`**: arrastran las tres formulas y sus propias variantes `UB-FE`/`V-FE` ya traen la geometria validada — la misma relacion que `B` tenia con `B-FE` antes de que la hoja dirimiera cual era buena. Ademas **no tienen ni una linea de cotizacion guardada**, asi que corregirlos no recostea nada. `0054_ub_v_geometria_como_b.sql` los alinea; `B`, `UB` y `V` quedan identicos en las tres piezas.

**El resto se deja a proposito.** `BBL`, `DV`, `DVE`, `PCFD`, `UDV`, `BFD`, `SBFD`, `BOMH`, `SV`, `SVFD`, `UBFD` y `BBLFD` no tienen variante FE que respalde el cambio, y `SBFD`/`BFD` suman 15 lineas guardadas. `L-TC`/`A` no es necesariamente incorrecto: es la formula de 12 tipos y solo se sabe que estaba mal en `B` porque una hoja lo demostro. Propagarlo sin hoja convertiria una correccion en una suposicion.

Auditoria posterior del catalogo completo (60 tipos, 348 escenas): fondos y entrepanos dentro de la carcasa, sin dimensiones invalidas ni excepciones — el giro de ejes del fondo de `UB`/`V` quedo correcto. Migracion idempotente. 129/129 tests, typecheck y lint limpios.

## [2026-09-17] update | Corrección de retención de estado en DisenoEditor (nomenclatura y agrupación)

Se corrigió un defecto en `DisenoEditor.tsx` donde el subcomponente `TipoAgrupacionEditor` no se remontaba al cambiar de tipología en el selector por carecer de `key={tipoId}`, reteniendo en pantalla los valores del tipo anterior (`pref_imperial`, `pref_metrico`, `permite_agrupacion`). Se añadió `key={tipoId}` y sincronización del estado local `tiposList` para reflejar con precisión los valores de base de datos y las actualizaciones guardadas.

## [2026-09-17] ingest | Visualización 3D y agrupación continua de familias FE (B-FE, UB-FE, V-FE)

Se corrigieron los defectos del visor 3D en tipologías con gaveta de madera (`B-FE`, `UB-FE`, `V-FE`): reconocimiento de `fondo_gaveta` como base del cajón (evitando la proyección de paneles `suelto` fuera del mueble a $L+40\text{ mm}$), colocación de la gaveta en el tope superior en muebles con puerta inferior y omisión del falso desdoblamiento por `contraparche`. En `group-engine.ts` se habilitó soporte para piezas continuas con grano girado (cuyo largo corre a lo largo del ancho de fórmula), resolviendo el bloqueo de fondos entre módulos de distinto ancho. Se aplicó la migración `0055_visualizacion_agrupacion_fe.sql` en Supabase habilitando agrupación física continua (`lateral_compartido`, `base`, `refuerzo_delantero`, `refuerzo_trasero`, `fondo`) y metadatos de montaje 3D confirmados.


## [2026-09-18] fix | Segunda pasada sobre B: cantidades y cantos; corregido el trasero de gaveta y el orden del listado

El cruce anterior con la hoja de `B12` solo habia mirado medidas. Esta revision verifico ademas **cantidades, orden del listado y cantos**, y ahora la HDR reproduce la hoja **fila por fila**, las 13.

**Ya estaba bien**: las cantidades (1 base, 2 laterales, 2 rieles delanteros, 2 traseros, 1 entrepano, 1 base de gaveta, 1 trasero, 1 puerta, 1 frente de gaveta, 1 backing) y el reparto Color/Blanco — la inferencia por nombre de `esVisible()` en `HdrTabla` coincide con la hoja en las 13 filas sin excepcion.

**Corregido en `0081_b_trasero_gaveta_y_orden.sql`**:

| | Antes | Hoja |
| --- | --- | --- |
| trasero de gaveta, ancho | `2.6875` = 68.26 mm | **68.00** (`2.67717`) |
| trasero de gaveta, canto | 2 largos | **1** largo |
| orden del listado | lateral, base, ref. trasero, ref. delantero | **base, lateral, ref. delantero, ref. trasero** |

El ancho es el mismo patron que el `L-4.13` de `DB`: un valor truncado que sobrevivio en unos tipos mientras otros ya tenian el exacto — `BMW`, `POD`, `SDB`, `UDB` y `UV` ya usaban `2.67717` y `DB` `68/25.4`. El canto de un solo largo tiene sentido fisico: es la cara superior del trasero, la inferior queda oculta contra la base de la gaveta. El orden solo afecta la letra que la HDR asigna a cada fila, pero produccion lee por esa letra.

**Rezagados anotados**: `BBL`, `DV`, `DVE`, `PCFD`, `UB`, `UDV` y `V` siguen con `2.6875`. Nota util: `UB` y `V` si recibieron las tres correcciones de `0054`, asi que esta es una cuarta diferencia que aquella migracion no cubria porque el canto todavia no se habia mirado.

Tres casos nuevos en `tests/b12-hoja-real.test.ts`: orden y cantidades del listado, cantos de cada pieza, y los 68mm exactos. Migracion idempotente. 136/136 tests y typecheck limpios.

## [2026-09-18] update | Sincronización de rama Liz desde DEV y corrección de tipos en tests

Se integraron en la rama `LIz` los últimos cambios de `origin/DEV` (41 commits: soporte de familias FE, correcciones 3D, agrupación continua, ajustes de geometría real, migraciones 0020-0055). Se actualizaron dependencias mediante `npm install`, se corrigieron 6 errores de tipado `@typescript-eslint/no-explicit-any` en `tests/visualizacion-b-fe.test.ts` (reemplazando `as any` por `as unknown as Pieza[]` y `Record<string, Tablero>`) dejando `npm run lint` en 0 errores, y se verificó que la suite completa de 133 pruebas y el build de producción (`npm run build`) pasen al 100%.

## [2026-09-21] update | Tipología DB disponible para UDB y UDV en el Simulador

El selector de tipología DB se habilitó también para las cajoneras `UDB` y `UDV`. La regla compartida aplica los overrides de cajones, barras y gavetas especiales, habilita el riel, obliga a incluir herrajes y preserva el sufijo comercial de la tipología en el código del mueble.

## [2026-09-21] update | UVFD de una puerta en anchos estrechos y orden del despiece

Se reemplazó la cantidad fija de 2 puertas de UVFD por `n_puertas`, que respeta la regla global de una puerta hasta 21″ y dos desde 24″. La tabla de despiece del Simulador quedó ordenada para producción y normaliza `shlef`/`shelf` como `entrepano` al mostrarlo.

## [2026-09-21] update | SVFD36 alineado con hoja de ruta real

Se comparó la plantilla de `SVFD36` con la hoja de ruta de dos puertas. Base, laterales, puertas y refuerzos traseros ya coincidían; se corrigieron el refuerzo delantero de 127mm a 96mm y el fondo a 760×898,4mm (`A−2mm` × `L−16mm`). Se agregó una prueba de regresión que cubre las nueve piezas físicas.

## [2026-09-21] update | UDV1228¾-2S con gavetas pequeñas y grande reales

La hoja de UDV de 12×28¾×21 confirmó que la tipología `-2S` lleva dos gavetas pequeñas de 139,7mm y una grande de 441,25mm, con traseros de 68/68/183mm. Se convirtió UDV a plantilla mixta por `n_cajones_pequenos`, se corrigieron bases de gaveta a 199,8×441mm y BACKING a 728,25×288,8mm. Regresión incluida para las 18 piezas.

## [2026-09-22] update | Migraciones UVFD, SVFD y UDV aplicadas y verificadas en Supabase

Se corrigió `scripts/run-sql.mjs` para leer `.env` como respaldo de `.env.local`, donde este proyecto guarda las credenciales de administración. Se aplicaron `0056`, `0057` y `0058` en Supabase (HTTP 201 cada una) y una consulta posterior confirmó las fórmulas y piezas nuevas. Typecheck limpio; lint sin errores (13 advertencias preexistentes); enlaces de WikiLLM: 29 válidos, sin huérfanos.

## [2026-09-22] update | Eje visual del fondo SVFD corregido

La migración `0059_svfd_fondo_visualizacion_ejes.sql` configura `intercambiar=true` para representar L−16mm sobre X y A−2mm sobre Z. Se añadió una regresión geométrica para un SVFD de 36×30×21.

## [2026-09-22] update | Patrón estándar de BACKING propagado

La hoja 760×746mm para una carcasa 762×762mm confirmó `A−2mm` × `L−16mm`. La migración `0060` actualiza las familias estándar rezagadas y UDV; la visualización protege respaldos XZ heredados contra desbordes.

## [2026-09-22] update | Ejes de BACKING visibles en el despiece

La tabla del Simulador y el HDR dejan de ordenar los fondos por tamaño: conservan largo=`A−2mm` y ancho=`L−16mm`, por ejemplo 760×898,4mm.

## [2026-09-22] update | Tarugos estándar de base y tapa

La migración `0061` asigna 8 tarugos a cada base o tapa estructural y excluye las bases de gaveta; se añadió regresión de consumo.

## [2026-09-22] update | Cantidad de consumibles en Materiales

El resultado incluye unidades por consumible y la tabla Materiales presenta la cantidad de tarugos junto con su costo calculado.

## [2026-09-22] update | Lint de visualización corregido

Se eliminó la mutabilidad innecesaria de la profundidad del panel en la construcción de la escena, dejando el lint sin errores.

## [2026-09-22] update | Compatibilidad de resultados de consumibles

La tabla Materiales tolera resultados guardados antes de `cantidadesConsumibles`, evitando un error de render mientras los cálculos nuevos muestran las unidades.

## [2026-09-22] update | Barras por trasero de gaveta alto

El motor agrega un par BARRAEST por cada `trasero_gaveta*` de 183mm y cubre plantillas heredadas sin fila de barra; se añadieron regresiones para traseros de 183 y 68mm.

## [2026-09-22] update | Traseros bajos para DB-4

La migración `0062` configura los cuatro traseros de DB-4 a 68mm; se añadieron regresiones de corte y visualización por gaveta.

## [2026-09-22] update | Hoja real DB33-4

Validada la referencia DB33-4: se corrigió el frente DB-4 a 187,7mm mediante `0063`; base, rieles, fondos de gaveta, traseros de 68mm y BACKING coinciden.

## [2026-09-22] update | Refuerzo delantero vertical en SBFD/SVFD

La migración `0064` cambia el plano de montaje de `refuerzo_delantero` a XZ para ambas tipologías; se añadió regresión de visualización.

## [2026-09-22] update | Entrepaños al fondo y cajones superiores

Los estantes se montan contra el respaldo; `0065` convierte los frentes de cajón heredados en ranuras de gaveta para ubicar frente, base y trasero en la parte superior.

## [2026-09-22] update | Refuerzos alrededor de gaveta superior

La visualización sitúa el segundo `refuerzo_horizontal` bajo la gaveta superior en muebles con puertas, eliminando su posición intermedia sobre la puerta.

## [2026-09-22] update | Soporte de entrepaño metálico 5mm

La migración `0066` registra el soporte solicitado a $45,7/und, desactiva la referencia anterior del selector y el cálculo consulta solo herrajes activos.

## [2026-09-22] update | Hoja real UW1336

La migración `0067` corrige base/tapa, rails, tres entrepaños, puerta y BACKING de UW contra la hoja UW1336, sin activar la tipología.

## [2026-09-22] update | UW1336 sin filas heredadas de gola

La migración `0068` anula los perfiles de gola no presentes en la hoja, dejando el despiece UW1336 en las 11 piezas reales.

## [2026-09-22] update | Activación de UW1336

La migración `0069` habilita la tipología UW validada para que pueda revisarse desde el Simulador.

## [2026-09-22] update | UW1336: shelf superior fijo y ejes del fondo

La migración `0070` sustituye los soportes del shelf superior por 8 tarugos y corrige el orden Largo×Ancho del BACKING F según la hoja UW1336.

## [2026-09-22] update | UW1336: descuentos para ancho exterior de 13in

La migración `0071` corrige las fórmulas de las piezas señaladas para reproducir la hoja UW1336 a 13×36×12in.

## [2026-09-22] update | Montaje visual validado para UW1336

La migración `0072` fija la puerta arriba, el shelf superior a 198,15mm de la base interna y el BACKING delante de los rails traseros.

## [2026-09-22] update | Separación de entrepaños interiores UW1336

La migración `0073` deja 40mm de holgura desde el shelf superior fijo y redistribuye los entrepaños interiores.

## [2026-09-22] update | Entrepaños UW1336 delante del fondo

La migración `0074` desplaza los entrepaños a la cara frontal del BACKING para evitar superposición visual.

## [2026-09-22] update | Puertas UW lado a lado

La migración `0075` divide el ancho útil por puerta, por lo que las dos puertas se muestran juntas en la visualización UW.

## [2026-09-23] update | Nueva tipología abierta OW3018

La migración `0076` incorpora OW como superior abierto de 18mm, sin puertas, herrajes ni cartón, y reproduce las siete piezas de la hoja OW3018.

## [2026-09-23] update | OW3018: medidas estables, visualización y cartón

La migración `0077` fija los descuentos de 18mm de OW3018, alinea visualmente su BASE extendida y reactiva el cartón en materiales.

## [2026-09-23] update | OW3018 según hoja con shelf

La migración `0078` actualiza la BASE a 726×304,8mm y agrega el shelf móvil de 726×266,7mm con cuatro soportes.

## [2026-09-23] update | Regla paramétrica de entrepaños en OW

La migración `0079` vincula el shelf OW con `n_entrepanos`, conservando uno como valor predeterminado de OW3018.

## [2026-09-23] update | DB sin herrajes opcional

El Simulador y Cotizaciones dejan de forzar `conHerrajes=true` para tipologías DB; al desmarcarlo se excluyen todos los herrajes, incluido riel y barras.

## [2026-09-23] update | Alto en código comercial de UW y OW

`codigoComercial()` muestra el alto para las familias superiores UW y OW, por ejemplo `UW1236`.

## [2026-09-23] update | Profundidad de 24 in en código W

La familia W concatena la profundidad cuando equivale a 24 in, por ejemplo `W302024`, en Simulador, cotizaciones y HDR.

## [2026-09-23] update | Normalización Supabase de códigos W a 24 in

La migración `0080` actualiza de forma idempotente los códigos W previos sin profundidad y conserva el sufijo `-SM` cuando corresponda.


## [2026-09-23] ingest | Comparación de consumos PRUEBA 1
Se compararon 15 filas de madera y 15 de cantos/herrajes contra Supabase y el motor local. Se documentaron diferencias de madera, barras y consumibles UW, y el cruce inconsistente DB19-1s/DB12-1s. Sin cambios en la base de datos ni en el motor.

## [2026-09-23] ingest | Auditoría de precios Simulador CEMA 23_09
Comparación de 48 tableros, 7 cantos y 20 registros de herrajes contra el archivo del proyecto. Tres diferencias relevantes en tableros; cantos y 16 equivalencias activas de herrajes coinciden. Documentado el cambio de soporte y los bloques alternativos de precios del Excel. Sin modificaciones a catálogos productivos.

## [2026-09-23] update | Sincronización de tableros desde Mat_2309

`sync-tableros.mjs` acepta el archivo maestro como argumento, omite referencias `NA` y desactiva —sin eliminar— las referencias ausentes para conservar trazabilidad.

## [2026-09-24] update | Hidratación tolerante a extensiones del navegador

El layout raíz suprime solo la advertencia de hidratación de `<body>` causada por atributos inyectados por extensiones como Grammarly.

## [2026-09-24] update | Tipologías independientes de Prueba Tipologías

La migración `0081` incorpora BFD-SM, OW-MO, W-SM y W-SM-PUSH, con reglas exclusivas, Gola de madera y Push solo en la variante W correspondiente.

## [2026-09-24] update | Ajustes de puertas y piezas SM

`0082` fija las puertas SM inferiores en alto menos 30 mm, retira manijas de las variantes SM y elimina la Gola adicional de las SM superiores.

## [2026-09-24] update | Montaje de refuerzo y Gola en BFD-SM

`0083` ubica el refuerzo delantero vertical 20 mm detrás de los frentes y la Gola de madera horizontal, en contacto con los frentes y bajo dicho refuerzo.

## [2026-09-24] update | Tipología SBFD-SM sin entrepaño

`0084` agrega la variante independiente SBFD-SM desde BFD-SM, con las mismas fórmulas, Gola, herrajes y montaje; excluye la pieza y regla de entrepaño.

## [2026-09-24] update | Puerta y montaje de W-SM según hoja real

`0085` restaura en W-SM el lateral reducido, la puerta de alto A + 15,85 mm y el fondo asociado; la visualización ancla la puerta arriba para que sobresalga debajo de los laterales.

## [2026-09-24] update | Lateral W-SM al alto nominal

`0086` corrige W-SM para que el largo del lateral sea exactamente A; el fondo queda a 16 mm de holgura y la puerta mantiene el excedente inferior de 15,85 mm.

## [2026-09-24] update | Fondo y entrepaños de W-SM

`0087` ubica el fondo delante de los refuerzos traseros y limita los entrepaños a la cara anterior del fondo en la visualización.

## [2026-09-24] update | Tipología W-SM-LOC sin entrepaños

`0088` agrega W-SM-LOC como copia independiente del W-SM vigente; no incluye pieza ni regla de entrepaño a ninguna altura.

## [2026-09-24] ingest | Tipología SB-SM desde hoja de ruta

`0089` incorpora SB-SM como inferior independiente con frente falso, puertas inferiores, Gola de madera, sin manijas ni entrepaños; sus fórmulas reproducen SB30-SM.

## [2026-09-24] update | Posición de refuerzos y Gola SB-SM

`0090` baja visualmente el refuerzo delantero 30 mm y el rail horizontal junto con la Gola 132,4 mm, sin cambiar el corte.

## [2026-09-24] update | Orden de ensamble visual SB-SM

`0091` ordena el lateral de SB-SM conforme a la referencia: refuerzo delantero superior, refuerzo horizontal vertical solapado y Gola horizontal bajo éste.

## [2026-09-24] update | Contacto de refuerzo delantero SB-SM

`0092` mueve el refuerzo delantero a la cara posterior de los frentes, sin sobrepasarlos.

## [2026-09-25] ingest | Tipología DB-2S-SM desde hoja de ruta

`0093` agrega DB-2S-SM como cajonera independiente: dos gavetas pequeñas, una grande, perfiles de Gola superior/inferior y sin manijas; reproduce DB26-2S-SM sin modificar DB.

## [2026-09-25] update | Cantos de traseros DB-2S-SM

`0094` ajusta los cantos de traseros de gaveta a la hoja DB26-2S-SM: 1 largo en pequeños y 1 largo + 2 anchos en el grande.

## [2026-09-23] fix | Suite en verde tras integrar DEV: fixture regenerado y dos asserts desactualizados

`DEV` llego con **4 tests en rojo**. Verificados como preexistentes en `origin/DEV` (9b0c211) levantando un worktree limpio y corriendolos alli — no los introdujo el merge.

**Los dos de montaje de cajon**: el fixture de visualizacion estaba 10 campos desfasado solo para `B`, y en `frente_cajon` tenia `rol_tablero: null` y `ancho: '0'` — un placeholder que dejaba la pieza de altura cero, asi que `construirVisualizacion` la omitia por "dimension nula" y los tests reventaban con `TypeError` al no encontrarla en la escena. **Regenerado desde el catalogo real**: 62 tipos (antes 57; entran `B-FE`, `OW`, `UB-FE`, `UW`, `V-FE`), 459 piezas, 84 reglas. Esto salda la deuda anotada en [ejes_fondo_backing.md](wiki/ejes_fondo_backing.md) y de paso sumo 5 tipos de cobertura al test generico.

**`db-sin-herrajes`**: la logica nueva de barras estabilizadoras las **deriva del despiece** —un par por cada trasero de gaveta de 183mm— e ignora el `formula_cantidad` de la plantilla. El fixture de ese test no tenia piezas, asi que la fila de barra aportaba 0 y el total daba 300 en vez de 340. Se le anadio ese trasero: ahora el test ejercita la logica nueva en vez de sortearla, que es mejor que bajar la expectativa a 300.

**`una puerta angosta`**: comparaba con `assert.equal` contra `28.75 - 3.2/25.4` sin redondear, pero el motor redondea `anchoIn` a 3 decimales (`+aIn.toFixed(3)`). Pasa a comparar con tolerancia.

**Ademas**: la migracion local `0056` se renumero a `0081` porque DEV ya habia usado ese numero (llega a 0080); ya estaba aplicada en Supabase y es idempotente, y se alineo la referencia en sus `notas`. El conflicto del merge estuvo solo en este log, donde ambas ramas anadieron entradas al final: se conservan las dos.

159/159 tests, typecheck, lint (0 errores) y build limpios.

## [2026-09-25] fix | DB-2S-SM conserva Gola propia en el Simulador

El Simulador ya no permite que el selector global de sistema de frente desactive la Gola integrada de `DB-2S-SM`. La tipología calcula siempre sus dos perfiles Gola, dos refuerzos delanteros y los frentes 173,9/173,9/351 × 657,2 mm para la referencia DB26.

## [2026-09-25] fix | Orden de frentes DB-2S-SM

`0095` elimina la doble inversión de ejes de los frentes DB-2S-SM: el despiece presenta 173,9/173,9/351 × 657,2 mm, igual que la hoja DB26-2S-SM.

## [2026-09-25] fix | Gola y frentes exactos DB-2S-SM

`0096` renombra `gola_perfil` a `gola_madera` y ajusta el reparto de alturas de DB26-2S-SM a 173,9/173,9/351 mm exactos.

## [2026-09-25] update | Montaje DB-2S-SM de refuerzos y Gola

`0097` define los refuerzos delanteros DB-2S-SM verticales (plano XZ) y las dos golas de madera horizontales (plano XY), según la guía lateral.

## [2026-09-25] update | Posición por niveles de refuerzos y Golas DB-2S-SM

`0098` coloca un par refuerzo/Gola arriba y el segundo inmediatamente debajo de la segunda gaveta, conservando las orientaciones de montaje.

## [2026-09-25] fix | Protección de geometría DB-2S-SM en el montaje

El generador fuerza los planos confirmados de DB-2S-SM para impedir que una configuración heredada represente el refuerzo horizontal o la Gola vertical.

## [2026-09-25] fix | Segundo par DB-2S-SM anclado a base de gaveta

`0099` y el generador de montaje sitúan el segundo refuerzo directamente bajo la segunda `base_gaveta`, con la Gola inmediatamente debajo y contra el frente.

## [2026-09-25] ingest | Tipología DB-2-SM con dos gavetas grandes

`0100` crea `DB-2-SM` a partir de `DB-2S-SM`: conserva carcasa, herrajes, dos refuerzos y dos Golas de madera, elimina las gavetas pequeñas y monta dos gavetas grandes iguales. La visualización ancla el segundo par refuerzo/Gola bajo la gaveta superior.

## [2026-09-25] update | Migración DB-2-SM aplicada en Supabase

Se aplicó `0100_db_2_sm.sql` al proyecto Supabase conectado. Se verificó `DB-2-SM` activa con 15 piezas, 12 reglas y 4 herrajes; los dos frentes grandes están habilitados, los pequeños desactivados y los dos pares refuerzo/Gola conservados. `DEV` no recibió cambios.

## [2026-09-25] fix | DB-2-SM usa una única fila frente

`0101` elimina de `DB-2-SM` las plantillas `frente_*` heredadas y conserva solo `frente` con cantidad 2. Las dos gavetas iguales dejan de duplicarse como `frente` y `frente_gaveta_grande` en el despiece.

## [2026-09-25] fix | DB-2-SM usa una única fila trasero_gaveta

`0102` elimina de `DB-2-SM` las plantillas `trasero_gaveta_*` y conserva solo `trasero_gaveta`, cantidad 2 y 183 mm. La fila unificada mantiene el canto de producción de la pieza grande: 1 largo y 2 anchos.

## [2026-09-25] ingest | Tipología DB-3-SM con tres gavetas iguales

`0103` crea `DB-3-SM` desde `DB-2-SM`: `frente`, `base_gaveta` y `trasero_gaveta` son filas únicas de cantidad 3. Mantiene dos pares refuerzo/Gola y sitúa el segundo entre la segunda y tercera gaveta.

## [2026-09-25] update | Migración DB-3-SM aplicada en Supabase

Se aplicó `0103_db_3_sm.sql` al proyecto Supabase conectado. Se verificó `DB-3-SM` activa con 9 plantillas sin duplicados, 12 reglas y 4 herrajes: tres frentes, tres bases, tres traseros de 183 mm, dos refuerzos y dos Golas. `DEV` no recibió cambios.

## [2026-09-25] update | Variantes DB-SM agrupadas en el Simulador

El selector de tipo presenta una sola familia `DB-SM` y ofrece `DB-2S-SM`, `DB-2-SM` y `DB-3-SM` en un selector secundario. Cada opción mantiene su tipo real y sus reglas; el selector existente de DB permanece sin cambios.

## [2026-09-25] ingest | Tipología independiente WSM93614

`0104` crea `WSM` con profundidad predeterminada de 14 pulgadas, laterales `A-1`, puerta de alto nominal y cortes propios de la hoja WSM93614. El código comercial es `WSM` + ancho + alto + profundidad. `W-SM` no se modifica.

## [2026-09-25] update | Migración WSM aplicada en Supabase

Se aplicó y registró `0104_wsm.sql` en el proyecto conectado. Se verificó `WSM` activa con 7 piezas, 10 reglas y 1 herraje; `W-SM` permanece activa y conserva sus propios registros. `DEV` no recibió cambios.

## [2026-09-25] fix | WLD respeta la regla de cantidad de frentes

`0105` cambia exclusivamente `frente.formula_cantidad` de `2` a `n_puertas` en WLD. Conserva el ancho paramétrico por cantidad y la altura `A-RV`; a 21×36 pulgadas produce una puerta de 530,2 × 911,2 mm.

## [2026-09-25] update | Migración WLD aplicada en Supabase

Se aplicó y registró `0105_wld_cantidad_frentes.sql`. Se verificó que WLD usa `n_puertas`, conserva `A-RV` y recibe las reglas globales activas de una puerta hasta 21 pulgadas y dos desde 24. `DEV` no recibió cambios.

## [2026-09-25] update | Nombre comercial de TW

`0106` cambia exclusivamente `cot_tipos_mueble.nombre_es` de TW a `Mueble superior puerta basculante`, resolviendo la discrepancia documentada con sus referencias de puerta basculante. No modifica geometría, reglas ni herrajes.

## [2026-09-25] update | Nombre de TW aplicado en Supabase

Se aplicó y registró `0106_tw_nombre_puerta_basculante.sql`. Se verificó que TW está activa y que `nombre_es` es exactamente `Mueble superior puerta basculante`. `DEV` no recibió cambios.

## [2026-09-25] update | Código dimensional y Manija predeterminada para F

La tipología `F` incorpora largo y alto en el código comercial (`F630` para 6 × 30 pulgadas). Al seleccionarla en Simulador, cotizaciones o HDR, el sistema de frente se restablece automáticamente a `manija`.

## [2026-09-25] update | Eliminación de la tipología FL

La auditoría previa encontró 0 líneas de cotización, 1 pieza, 0 reglas y 0 herrajes asociados a `FL`. `0107_eliminar_tipologia_fl.sql` elimina el tipo y su pieza por cascada; la migración se bloquea si detecta una referencia de cotización creada después de la auditoría.

## [2026-09-25] update | Tipología FL eliminada de Supabase

Se aplicó y registró `0107_eliminar_tipologia_fl.sql`. La verificación posterior confirma 0 tipos `FL` y 0 líneas de cotización con ese prefijo; su plantilla se eliminó por cascada. `DEV` no recibió cambios.

## [2026-09-25] update | Fracciones imperiales en códigos comerciales

`anchoCodigo()` representa las partes decimales imperiales como fracciones reducidas al 1/16 más cercano. `12.75` pasa a `12 3/4` y el caso reportado `PN12.87536` pasa a `PN12 7/836`; las medidas de cálculo no se redondean y los códigos métricos conservan decimales.

## [2026-09-25] update | Regresión fraccionaria también para el alto

Se confirma y protege con prueba explícita que el alto usa la misma conversión fraccionaria que el largo: `PN` de 12,875 × 36,75 pulgadas genera `PN12 7/836 3/4`.

## [2026-09-25] update | Alto incorporado al código de TK

La tipología `TK` incorpora el alto después del largo en su código comercial. El caso 4,25 × 36,5 pulgadas pasa de `TK4 1/4` a `TK4 1/436 1/2`, usando fracciones en ambas dimensiones.

## [2026-09-28] update | Familia DB-SM-FE creada y validada

Se crearon el encabezado de selector `DB-SM-FE` y las tipologías paramétricas `DB-2S-SM-FE`, `DB-2-SM-FE` y `DB-3-SM-FE` desde la hoja `DB12-2S-SM-FE`. La migración `0108_db_sm_fe.sql` fue aplicada y verificada en Supabase; la referencia reproduce 28 piezas con diferencia máxima de 0,02 mm, cuatro patas, dieciséis tornillos y tres rieles `RIELFE500`.

## [2026-09-28] update | Tarugos en Golas y cajas DB-SM-FE

La migración `0109_db_sm_fe_tarugos_gavetas.sql` asigna cuatro tarugos por pieza —dos a cada lado— a `gola_madera`, traseros de gaveta y contraplacas de las tres tipologías DB-SM-FE.

## [2026-09-28] update | Tarugos homologados en todas las Golas SM

La migración `0110_gola_madera_tarugos_sm.sql` confirmó nueve tipologías con `gola_madera` y corrigió las tres pendientes (`DB-2S-SM`, `DB-2-SM`, `DB-3-SM`) a cuatro tarugos por pieza: dos al lado derecho y dos al izquierdo.

## [2026-09-28] update | Seis tarugos en piezas de gaveta grande

La migración `0111_tarugos_piezas_gaveta_grande.sql` asigna seis tarugos por pieza —tres a cada lado— a todos los `trasero_gaveta_grande` y `contraparche_grande`, reemplazando las notas anteriores de cuatro tarugos donde correspondía.

## [2026-09-28] update | Traseros de gaveta alineados por arriba

El generador visual alinea el borde superior de cada `trasero_gaveta` con sus `lateral_gaveta`; la diferencia de altura queda íntegramente en la parte inferior. Se agregó regresión geométrica para cajas con trasero más bajo que sus laterales.

## [2026-09-28] update | Ensamble interno completo de cajas de gaveta

El montaje ubica trasero y contraparche dentro de los laterales y distribuye un juego por gaveta. La base queda 13 mm sobre el borde inferior de los laterales y atraviesa el contraparche. La regresión valida estas relaciones en las tres gavetas DB-2S-SM-FE.

## [2026-09-28] update | Cajas pequeñas bajo la Gola superior

La visualización de DB-2S-SM-FE baja conjuntamente las dos cajas pequeñas hasta dejar 3,2 mm bajo la `gola_madera` superior, conserva el ensamble interno y no desplaza la gaveta grande inferior.

## [2026-09-28] update | Segunda caja sobre el refuerzo inferior

La segunda caja pequeña de DB-2S-SM-FE sube 13 mm como conjunto para que el borde inferior de sus laterales apoye sobre el borde superior del `refuerzo_delantero` inferior, sin mover la primera caja ni la gaveta grande.

## [2026-09-28] update | Tres cajas pequeñas en DB-3-SM-FE

La tipología DB-3-SM-FE reemplaza laterales, traseros y contraparches grandes por tres juegos pequeños de 500 x 100/80 mm. La regla `n_cajones_pequenos=3` sincroniza el despiece con la visualización.

## [2026-09-28] update | DB tradicional separado de DB-SM

Los formularios Simulador, Cotizaciones y HDR fuerzan `gola=0`, ocultan el selector SM y omiten el sufijo `-SM` para el tipo DB tradicional y todas sus configuraciones. DB-SM y DB-SM-FE permanecen como familias independientes. La auditoría de Supabase confirmó que las 14 líneas DB existentes ya estaban libres de Gola y del sufijo SM.

## [2026-09-29] update | Agrupación física de tipologías SM y WLD

Se habilitó la agrupación física conservadora de todas las tipologías SM creadas y WLD mediante laterales compartidos y carcasa continua compatible, sin modificar fórmulas ni piezas de producción existentes.

## [2026-09-29] update | Inferiores B sin fondo y continuidad estructural precisa

Se eliminó el fondo de los muebles inferiores con B en el prefijo, se recuperó TB en la profundidad de la base, se hicieron continuos base/refuerzos traseros y opcionales los refuerzos delanteros/Golas compatibles. El despiece agrupado identifica el módulo o grupo de origen y muestra hasta dos decimales en milímetros.

## [2026-09-29] update | Fondo omitido solo en agrupaciones inferiores B-SM

Se corrigió el alcance de 0114: todas las tipologías recuperan su fondo y base originales cuando están separadas. La omisión del fondo y la recuperación de TB ocurren únicamente al agrupar tipologías inferiores cuyo prefijo contiene el segmento SM; los tipos no-SM quedan intactos.

## [2026-09-29] update | Orden y etiquetas compactas del despiece agrupado

Las piezas unificadas aparecen primero con etiquetas compactas `Grupo A (A1 + A2...)`; a continuación se listan, en orden, todas las piezas locales de A1, A2, A3 y los módulos adicionales.

## [2026-09-29] update | Refuerzos y Golas a 80 mm exactos

Los refuerzos y `gola_madera` nominales de 80 mm se normalizan antes del cálculo; el despiece presenta todas las dimensiones con máximo un decimal.

## [2026-09-29] update | Material estructural heredado desde A1

El cálculo agrupado normaliza caja, refuerzos y canto de caja con los valores de A1, evitando el bloqueo por perfiles divergentes. Los grupos B-SM ya no comparan tablero de fondo porque esa pieza se omite durante la agrupación.

## [2026-09-29] update | Nueva tipología TW-SM-PUSH

Se creó la variante activa y agrupable `TW-SM-PUSH` basada en `TW`, con descripción "Mueble superior basculante con push", una única puerta sin importar el ancho y alto de puerta igual a `A - 3,2 mm`. La manija se reemplazó por un dispositivo Push To Open.

## [2026-09-29] update | Holgura horizontal de puerta TW-SM-PUSH

La puerta única de `TW-SM-PUSH` ahora descuenta 3,2 mm tanto del largo como del alto del módulo: `L - 3,2 mm` por `A - 3,2 mm`.

## [2026-09-29] update | Entrepaños en las dos tipologías TW

`TW` y `TW-SM-PUSH` incorporan la pieza `entrepano` gobernada por la regla global de superiores: 0 hasta 16 pulgadas, 1 hasta 24, 2 hasta 36 y 3 por encima.

## [2026-09-29] update | Código dimensional completo de TW-SM-PUSH

El código comercial de `TW-SM-PUSH` incorpora siempre largo, alto y profundidad antes del sufijo; por ejemplo, 30 × 24 × 12 pulgadas produce `TW302412-SM-PUSH`. `TW` tradicional conserva su nomenclatura previa.

## [2026-09-29] update | Código y puerta de TW tradicional

`TW` ahora incorpora largo, alto y profundidad en el código (`TW302412`). Su puerta mide `A + 15,85 mm` y se representa con el borde superior 3,2 mm por debajo del borde superior del lateral.

## [2026-09-29] update | Reemplazo completo de BBLFD por BBLFD-D-L/R

`BBLFD` adopta el despiece de la hoja de ruta suministrada, con campos exclusivos y obligatorios `Door` y mano `L/R`, código `BBLFD<largo>-D<Door><mano>`, una sola puerta móvil y la pieza fija denominada exactamente `blind door`. Los valores sobreviven a edición, recálculo e HDR.

## [2026-09-29] update | Etiqueta única de BBLFD-D-L/R

Los selectores de Simulador, Cotizaciones, HDR y Diseño muestran `BBLFD-D-L/R — Mueble inferior esquinero 1 puerta` sin anteponer nuevamente el prefijo interno `BBLFD`.

## [2026-09-29] update | Nombres y montaje normalizados de BBLFD

Las piezas especiales de `BBLFD` adoptan los nombres estándar `lateral`, `refuerzo_delantero`, `refuerzo_trasero`, `refuerzo_vertical`, `entrepano`, `frente` y `fondo`; solo se conserva `blind door`. El refuerzo vertical lleva 4 tarugos y se visualiza vertical, centrado en la unión de los frentes según la mano L/R.

## [2026-09-29] update | Código BBLFD resistente a Door incompleto

El formateador de medidas ahora ignora valores no finitos y el código BBLFD omite temporalmente el sufijo de puerta hasta que `Door` sea válido, evitando el desbordamiento de pila al cargar o editar el formulario.

## [2026-09-29] update | Ensamble y orientación de refuerzos BBLFD

La base BBLFD queda con 8 tarugos (4 por lado), cada refuerzo con 4 (2 por lado), y el refuerzo vertical se representa perpendicular a los frentes, desde la base hasta debajo del refuerzo delantero horizontal de 100 mm.

## [2026-09-29] update | Ancho paramétrico de blind door BBLFD

La puerta fija `blind door` conserva el alto total del módulo y calcula su ancho como `L - Door - 3,2 mm`, completando el frente junto a la puerta móvil con la holgura indicada.

## [2026-09-29] update | Cotizaciones configurables con fondo o sin fondo

El formulario de proyecto permite elegir `Con fondo` o `Sin fondo`. La segunda opción elimina las piezas de rol fondo y calcula la profundidad de cada pieza `base` como `P-TC`, descontando exactamente un espesor del tablero de caja; la selección se conserva en el proyecto y en sus líneas.

## [2026-09-29] update | Materiales globales separados para B y W

Las cotizaciones guardan bloques independientes de perfil, tableros y cantos para inferiores y superiores. El primer carácter `B` o `W` presente en el prefijo determina automáticamente el bloque aplicado; si aparecen ambos, gana el que esté más a la izquierda.

## [2026-09-29] update | Características del proyecto unificadas

La edición de cabecera y la configuración de materiales se integraron en un único panel denominado `CARACTERÍSTICAS DEL PROYECTO`; se eliminó el desplegable separado de materiales sin cambiar sus mecanismos de persistencia.

## [2026-09-29] update | Desplegable de características reubicado

Se eliminó `editar` junto al nombre. `CARACTERÍSTICAS DEL PROYECTO` aparece ahora como control plegable en texto pequeño y negrita antes de Exportar/Imprimir/Versiones; cerrado mantiene despejado y visible el listado de muebles.

## [2026-09-29] update | Alineación de materiales superiores

El encabezado de materiales superiores incorpora su propio separador y comienza en la primera columna, alineado con el encabezado de módulos inferiores; se eliminó el elemento de cuadrícula que lo desplazaba a la derecha.

## [2026-09-29] update | Regla B/W oculta en la interfaz

Los encabezados muestran solo `Módulos inferiores (B)` y `Muebles superiores (W)`. La prioridad basada en la primera B o W del prefijo permanece como regla interna, sin explicación visible para el usuario.

## [2026-09-29] update | Filas uniformes de materiales globales

Los bloques inferior y superior usan cuadrículas independientes e idénticas: perfil y tres tableros ocupan la primera fila de cuatro columnas; los dos cantos aparecen en una segunda fila sin mezclarse con el bloque siguiente.

## [2026-09-29] update | Orden de campos en características del proyecto

Nombre/cliente ocupan la primera fila; moneda, TRM y margen la segunda. Estado se movió debajo de materiales, inmediatamente antes de Guardar y Cancelar.

## [2026-09-30] update | Versiones manuales e inmutables sin respaldos automáticos

Se rediseñó el flujo de versiones para que opere exclusivamente por demanda manual del usuario ("Guardar versión"). Se eliminaron por completo los respaldos automáticos en restauraciones (`cot_restaurar_version`). Se convirtió el nombre de la versión en un campo obligatorio con validación y trim, deshabilitación de doble clic y confirmación post-transacción. Se añadió visualización de fecha y hora local (`es-CO`), ordenamiento más reciente primero y restauración limpia sin estados residuales. Se aplicó la migración `0123_versiones_manuales_inmutables.sql` y se añadieron pruebas automatizadas en `tests/versiones.test.ts`.

## [2026-09-30] update | Precios con/sin herrajes y TRM automática

Se añadieron columnas seleccionables de precio con y sin herrajes en pantalla, impresión/PDF y Excel; detalle informativo de herrajes por módulo; inclusión obligatoria de herrajes al cotizar; y recálculo completo al cambiar la TRM.

## [2026-09-30] update | Ampliación de la tabla de módulos

Se amplió el detalle de cotización a 1600 px y se asignaron anchos mínimos a descripción, precios y acciones. Se verificó que Editar abre el formulario funcional del módulo y se conservó junto a la X de eliminación.

## [2026-09-30] update | Edición de módulo dentro de su fila

El formulario de edición ahora se expande inmediatamente debajo del mueble seleccionado y deja de mostrarse al final del listado; se sincronizaron los estados de edición, detalle de herrajes y alta de módulos.

## [2026-09-30] update | Base sin fondo usa el espesor real de caja

En grupos B-SM que omiten el fondo, la profundidad de la base ahora se calcula como `P-TC`, reemplazando el descuento fijo heredado; `TC` sale del tablero de caja seleccionado.

## [2026-09-30] update | Monedas seleccionables en columnas de precio

Se añadieron selectores USD/COP que controlan costos, precios unitarios y totales en la tabla de cotización, Excel y la vista de impresión/PDF; permiten mostrar una moneda o ambas y evitan dejar las dos desactivadas.

## [2026-09-30] update | Compatibilidad de piezas continuas heterogéneas

El motor de grupos dejó de exigir conjuntos continuos idénticos: ahora unifica la intersección compatible y conserva localmente las piezas estructurales adicionales, evitando bloquear combinaciones SM válidas.

## [2026-09-30] ingest | Comparativo PB SHORE PRUEBA frente a HDR
Auditoría de 20 módulos contra 23 PDF: 4 piezas adicionales, diferencias de canto en WLD, DB y TK, y un panel de distinta altura. Informe PDF y CSV por módulo/pieza; cotización y fuentes sin cambios.

## [2026-09-30] update | Regla de entrepaños para muebles superiores

W, WLD, W-SM, W-SM-PUSH, WSM, OW, TW y TW-SM-PUSH usan 0 entrepaños hasta 17 pulgadas, 1 de 18 a 27, 2 de 28 a 40 y 3 por encima de 40; UW conserva su regla exclusiva.

## [2026-09-30] update | Separación superior de puertas WLD

La puerta de todos los WLD queda 3,2 mm por debajo de la cara exterior de la tapa, sin modificar el corte ni el costo.

## [2026-09-30] update | Orden posterior de fondos y entrepaños superiores

En W, WLD, W-SM, W-SM-PUSH, WSM, OW, TW, TW-SM-PUSH, UW, OW-MO y W-SM-LOC el fondo queda delante de los refuerzos traseros y los entrepaños terminan delante del fondo, sin cambiar cortes ni costos.

## [2026-09-30] update | Cantos largos en refuerzos y Gola de madera

Todas las piezas cuyo nombre contiene `refuerzo` y todas las `gola_madera` llevan canto en sus dos lados largos, preservando calibre y cantos cortos existentes.

## [2026-09-30] update | Sufijo comercial para caja y frente de 18 mm

Los módulos cuyo tablero de caja y tablero de frente son ambos de 18 mm agregan `-18MM` al final del código comercial en simulador, cotizaciones, persistencia y HDR.

## [2026-09-30] update | Integración de espesor en códigos W-SM y TW-SM

En muebles superiores W y TW con sistema SM, los materiales de caja y frente de 18 mm se identifican como `SM18` dentro del segmento (`W2636-SM18`, `W332124-SM18-PUSH`, `TW302412-SM18-PUSH`) en lugar del sufijo separado `-18MM`. TW y sus variantes quedan explícitamente incluidos en la clasificación central de muebles superiores.

## [2026-09-30] update | Alineación del entrepaño superior de UW con la puerta

El `entrepano_superior` de UW queda a la misma altura que el borde inferior de la puerta (`Z=7,841732in`, aproximadamente 199,18mm desde la base). Los entrepaños interiores conservan su separación de 40mm tomando esta posición como nueva referencia.

## [2026-09-30] ingest | Nueva tipología superior WBL-D-L/R-SM

Se creó desde la hoja WBL3840 D22 7/8L-SM, sin reutilizar la tipología WBL existente. Incluye puerta paramétrica con fracciones, apertura L/R, pieza fija `Blind Door`, geometría propia, ausencia de manija, código `WBL<largo><alto>-D<Puerta><L/R>-SM` y la regla común de entrepaños superiores.

## [2026-09-30] update | Nombre único de WBL-D-L/R-SM

Los selectores de Simulador, cotizaciones, HDR y Diseño muestran exactamente `WBL-D-L/R-SM — Mueble superior Blind Door`, sin anteponer nuevamente el prefijo.

## [2026-09-30] update | Entrepano fijo de UW identificado por el largo de la base

En UW, la pieza antes llamada `entrepano_superior` se denomina `entrepano_fijo`. La migración asigna ese nombre al entrepano cuya fórmula de largo coincide con la de la base; los entrepaños móviles mantienen su nombre.

## [2026-09-30] update | Sufijo comercial para caja y frente de 15 mm

Todos los módulos cuyos materiales de caja y frente son ambos de 15 mm agregan `-15MM`. En muebles superiores W/TW con segmento SM, el espesor se integra como `SM15` o `SM15-PUSH`, siguiendo la misma regla establecida para 18 mm. Los espesores mixtos no generan indicador.

## [2026-09-30] ingest | BLS36 reconstruido desde hoja Lazy Susan

La plantilla BLS que mezclaba tres configuraciones fue sustituida por el despiece confirmado de BLS36: base cuadrada, laterales diferenciados, dos refuerzos delanteros, un trasero, dos fondos de 15 mm, un entrepaño y dos puertas iguales. Se fijaron las reglas de dos puertas y un entrepaño sin inferir herrajes no presentes en la hoja.

## [2026-10-01] update | Nombre BLS sin prefijo duplicado

Los selectores de Simulador, cotizaciones, HDR y Diseño muestran `BLS — Mueble inferior esquinero Lazy Susan`, respetando el nombre completo almacenado en catálogo sin anteponer nuevamente `BLS`.

## [2026-10-01] update | Visualización BLS36 ajustada con archivo IGES

Se extrajeron los once sólidos de `BLS36.iges` y se parametrizó la planta esquinera real de BLS: laterales, fondos y puertas perpendiculares, refuerzos del entrante, entrepaño a 200 mm y refuerzo trasero diagonal. El visor ahora admite giros no ortogonales para representar la pieza a 45 grados; cortes y costos no cambian. Tras detectar en la UI que el entrepaño seguía en la posición heredada `P-D=-148 mm`, se aplicó `0132` a Supabase y se verificaron los diez registros de montaje persistidos.

## [2026-10-01] update | Puertas cerradas y refuerzo trasero reubicado en BLS36

Se corrigió una mezcla de unidades en la coordenada de la puerta horizontal (`L-282,6 mm`, no `L-(282,6/25,4)`), que extendía falsamente el dibujo hasta 1.182,7 mm. Las dos puertas quedan cerradas y perpendiculares junto al rincón. El refuerzo trasero parte ahora explícitamente de la esquina posterior izquierda y se orienta `-45°` hacia el interior, junto al fondo izquierdo.

## [2026-10-01] update | Orientación final del refuerzo trasero BLS36

La vista superior aportada confirmó que el refuerzo trasero debía inclinarse en el sentido contrario al montaje anterior. Se cambió a `+45°` y se compensaron ancho y espesor con `sqrt(1/2)` para apoyarlo en el fondo izquierdo, dirigirlo hacia la esquina posterior y mantenerlo completamente dentro de la planta de 914,4 mm.

## [2026-10-01] ingest | Nueva tipología BMW-1 desde hoja BMW36-1

Se creó `BMW-1` como tipología independiente de `BMW`, con código comercial `BMW<largo>-1`. La plantilla reproduce doce piezas normalizadas desde la hoja de producción, declara una gaveta, cero puertas, un entrepaño fijo y cuatro patas, e incluye riel Tandem, manija, cuatro patas y dieciséis tornillos. BMW histórico no se modificó.

## [2026-10-01] update | Medidas y montaje inferior de BMW-1

Se corrigieron los ejes persistidos de `frente_gaveta` y `frente` para que el despiece muestre 220,13×911,2 mm y 535,47×911,2 mm, respectivamente. La gaveta y sus componentes se ubicaron en la zona inferior; el `entrepano_fijo`, explícitamente igual a la base, se fijó a 241,33 mm. El fondo queda debajo y termina en esa misma cota, sin invadir el vano superior.

## [2026-10-01] update | BMW histórico retirado del selector

La captura de validación mostró `BMW · gaveta 1` y las medidas de la plantilla histórica, no BMW-1. Se comprobó que BMW y BMW-1 tenían cero líneas de cotización asociadas; BMW se marcó inactivo para evitar la selección equivocada y BMW-1 queda como la única tipología activa de esta configuración.

## [2026-10-01] update | BMW eliminado y refuerzo delantero BMW-1 alineado

Se eliminó definitivamente la tipología histórica `BMW`, después de volver a comprobar que no tenía líneas de cotización asociadas. En `BMW-1`, el `refuerzo_delantero` queda en `y=0` y con su cara superior contra la cara inferior del `entrepano_fijo` a 241,33 mm, reproduciendo la ubicación señalada en la vista lateral.

## [2026-10-01] update | Refuerzo delantero BMW-1 en posición superior

Se corrigió la interpretación de la anotación visual: el amarillo señalaba la posición anterior y la marca azul superior era el destino. El `refuerzo_delantero` se trasladó a la esquina frontal superior, en `y=0` y `z=A-H`, con su cara superior al ras del mueble.

## [2026-10-01] update | Entrepaño fijo BMW-1 centrado en la junta de frentes

El `entrepano_fijo` se desplazó al centro vertical de la unión entre el frente de gaveta y el frente superior: 224,93 mm. Su origen visual es `224,93-H/2`, de modo que el tablero cruza el centro de la junta; en profundidad se mantiene entre los frentes y el fondo con `y=P-D`. Conserva exactamente las mismas medidas de corte que la base.

## [2026-10-01] update | Refuerzo delantero de BFD simple fijado en 80 mm

Se eliminó de `BFD` la excepción `L<12 ? 5 : 3.14961`, que producía refuerzos delanteros de 127 mm en módulos angostos. El ancho queda siempre en `80/25.4`. El alcance usa coincidencia exacta `pref='BFD'`: no modifica BFD-SM, SBFD, SBFD-SM, UBFD ni ningún otro prefijo compuesto.

## [2026-10-01] update | Contraparche B-FE corregido contra hoja B18-FE

La auditoría exclusiva de B-FE comparó sus 16 piezas con B18-FE. Quince medidas ya coincidían; `contraparche` daba 345,8mm por usar `L-111,4mm`, mientras la hoja exige 371,2mm. Se corrigió a `L-86mm`, igual al largo del `trasero_gaveta`. No se modificaron B, UB-FE, V-FE ni otras tipologías.

## [2026-10-01] update | Segundo refuerzo delantero B-FE bajo la gaveta

La visualización genérica repartía el segundo `refuerzo_delantero` a media altura. En B-FE se fijaron posiciones por instancia: el primero en `A-H` y el segundo en `A-155,6-H`, inmediatamente bajo la gaveta superior de 152,4 mm y su reveal de 3,2 mm. El cambio es exclusivo de B-FE.

## [2026-10-01] update | Base de gaveta DB-2S-SM-FE a 492 mm

Se cambió exclusivamente `DB-2S-SM-FE.base_gaveta` de 508 mm (`19.99999in`) a 492 mm (`492/25.4`). La cantidad sigue siendo tres. No se modificaron DB-2-SM-FE, DB-3-SM-FE ni otras tipologías.

## [2026-10-01] ingest | Nueva tipología BMW-1-FE

Se creó `BMW-1-FE` manteniendo la estructura general, entrepaño, fondo limitado y frentes de `BMW-1`. Exclusivamente el conjunto de gaveta procede de `B-FE`: laterales de madera de 100×500 mm, trasero y contraparche `L-86 mm`, fondo `L-72 mm` × 492 mm y riel `RIELFE500`. Conserva los demás herrajes de BMW-1 y el montaje inferior bajo el entrepaño fijo. El código comercial a 36 pulgadas es `BMW36-1-FE`.

## [2026-10-01] update | Entrepaños WLD con canto en cuatro lados

Se ajustó exclusivamente la plantilla `WLD.entrepano` para aplicar canto a dos lados largos y dos lados anchos, conservando el calibre existente. No se modificaron otras tipologías superiores.

## [2026-10-01] ingest | Nueva tipología BOMH-1 con hueco de horno paramétrico

Se creó `BOMH-1` desde la hoja BOMH36-1 usando BMW-1 únicamente como guía y sin editarla. La plantilla reproduce trece piezas físicas, una gaveta inferior y los herrajes de la familia. El Simulador y las cotizaciones incorporan `Largo libre del horno` y `Alto libre del horno`, inicialmente 219,2×153,2 mm. `frente_izq` y `frente_der` conservan el alto solicitado y reparten simétricamente el ancho restante para mantener exactamente el hueco libre indicado.

## [2026-10-01] update | Nombre visible definitivo de BOMH-1

La tipología se muestra como `BOMH-1 Mueble inferior medio horno` en Simulador, cotizaciones, HDR y Diseño. Se evita anteponer nuevamente el prefijo para que el nombre aparezca una sola vez.

## [2026-10-01] update | Tipología BOMH heredada eliminada

Se comprobó que `BOMH — Base para microondas` tenía cero líneas de cotización asociadas y se eliminó completamente del catálogo junto con sus plantillas dependientes. `BOMH-1 Mueble inferior medio horno` permanece activa como la única tipología BOMH.

## [2026-10-01] update | Trasero y montaje frontal de BOMH-1

El `trasero_gaveta` de BOMH-1 cambió de 68 a 183 mm de alto. El `refuerzo_delantero` conserva 884,4×80 mm en la referencia de 36 pulgadas, pero pasa del plano horizontal XY al plano frontal XZ, montado de canto entre los laterales y contra la esquina superior. `frente_izq` y `frente_der` se ubican inmediatamente debajo del refuerzo con `z=A-80-H`, conservando las dimensiones libres paramétricas del horno.

## [2026-10-01] update | Cantos largos en traseros de gaveta FE

Se auditaron las piezas `trasero_gaveta_pequena` y `trasero_gaveta_grande` según el herraje real de cada tipología. Las cuatro piezas presentes en `DB-2S-SM-FE`, `DB-2-SM-FE` y `DB-3-SM-FE`, todas con `RIELFE500`, pasan a tener enchape en ambos lados largos (`largos=2`). DB, UDV y DB-2S-SM usan RIELTANDEM y permanecen sin cambios.

## [2026-10-01] update | Frentes laterales BOMH-1 separados 3,2 mm de la gaveta

`frente_izq` y `frente_der` de BOMH-1 ahora parten de `z=339,2mm`, exactamente 3,2 mm sobre el borde superior del `frente_gaveta` (3,2+332,8=336mm), por lo que no lo invaden. La validación del alto libre del horno limita además ambos frentes al espacio disponible bajo el refuerzo delantero superior de 80 mm.

## [2026-10-01] update | BOMH-1 ajusta los frentes laterales al vano disponible

Se eliminó el bloqueo que impedía calcular cuando `horno_alto` superaba el espacio físico. `frente_izq` y `frente_der` conservan el alto solicitado cuando cabe; si lo excede, se limitan automáticamente al tramo entre `z=339,2mm` y la cara inferior del refuerzo superior (`A-80mm`). La fachada queda como la referencia: gaveta inferior, separación de 3,2 mm, laterales continuos, hueco central y refuerzo superior, sin solapes.

## [2026-10-01] update | Frentes BOMH-1 dentro de los laterales

`frente_izq` y `frente_der` se retrajeron al interior de la carcasa. Horizontalmente respetan un espesor de caja (`x=TC` y `x=L-TC-W`) y en profundidad quedan en `y=TC`, en vez de sobresalir frente al lateral. Conservan `z=339,2mm` y el alto limitado por `A-80mm`, por lo que siguen debajo del refuerzo delantero.

## [2026-10-01] update | Alineación frontal y material del refuerzo BOMH-1

`frente_izq` y `frente_der` conservan su posición entre los laterales, pero pasan de `y=TC` a `y=0` para alinear su cara exactamente con el borde frontal de estos. El `refuerzo_delantero` cambia de rol `refuerzo` a rol `frente`, por lo que toma el mismo tablero frontal y su espesor de 18 mm; conserva canto `22x1` y su montaje superior en el plano XZ.

## [2026-10-01] ingest | Nueva tipología BOMH-1-FE con gaveta grande

Se creó `BOMH-1-FE` como copia independiente de la BOMH-1 vigente. Carcasa, hueco paramétrico, frentes, refuerzo delantero de material frontal, entrepaño y fondo permanecen iguales. Solo cambia la gaveta: dos laterales grandes de 500×200 mm, trasero L-86×180 mm con enchape en ambos largos, contraparche L-86×200 mm, fondo de 508 mm por L-72 mm y riel `RIELFE500`. Conserva manija, cuatro patas y dieciséis tornillos. El código a 36 pulgadas es `BOMH36-1-FE`.

## [2026-10-01] update | Recuperación de contraseña con Supabase Auth

Se añadió el flujo PKCE completo desde el login: solicitud de correo, callback seguro para intercambiar el código, validación del enlace, actualización de la contraseña y cierre de la sesión temporal. El proxy permite las pantallas públicas de recuperación sin desproteger el resto de la aplicación.

## [2026-10-02] update | Largo de base_gaveta FE fijado en 492 mm

Se normalizaron como `fondo_gaveta` las piezas `base_gaveta` de todas las tipologías cuyo prefijo termina en `-FE`, y se fijó su `formula_largo` en 492 mm. La misma validación incluye los `fondo_gaveta` ya existentes; cuando estos tenían 492 mm en el ancho, se trasladó al ancho la fórmula variable anterior del largo para conservar las dimensiones físicas con la orientación solicitada. Las demás propiedades permanecen intactas.

## [2026-10-02] update | BOV ajustado a la hoja real BOV24

La plantilla BOV pasó de cuatro renglones ambiguos a cinco renglones y siete piezas físicas: base, dos laterales, dos rails traseros, rail delantero y frente de horno. Se corrigieron medidas, roles, cantos y metadatos 3D; la visualización separa los dos rails traseros entre el nivel inferior y el superior.

## [2026-10-02] update | Frente BOV usa alto menos 3,2 mm

El `formula_largo` del frente de BOV cambió de 124 mm fijos a `A-RV`, donde `RV=3,2 mm`. Para BOV24 con alto de 30 pulgadas, el frente resulta de 758,8×606,4 mm.

## [2026-10-02] ingest | Nueva tipología BBLFD-D-L/R-SM

Se creó una variante independiente de BBLFD-D-L/R que conserva las piezas y reglas de la fuente, eleva el refuerzo vertical a `A-TC`, divide los refuerzos delanteros en las caras del montante, agrega un tramo vertical de 80 mm a 20 mm del frente y una Gola horizontal debajo, ambos con cuatro tarugos. La puerta móvil queda en `A-30 mm`; la variante conserva patas, tornillos y bisagras, pero elimina la manija.

## [2026-10-02] update | Refuerzos y junta frontal BBLFD SM

Todos los refuerzos de `BBLFD-D-L/R-SM` adoptan sección de 80 mm. El montante se centra bajo la separación de 3,2 mm entre puerta y Blind Door; los tramos delantero horizontal, delantero vertical y Gola se recalculan hasta las caras del montante. En BBLFD original y SM, la puerta móvil descuenta 3,2 mm a `Door` y ambos frentes normalizan sus ejes para presentar primero el alto calculado desde `A`.

## [2026-10-02] update | Gola de madera BBLFD SM contra el frente

La `gola_madera` de `BBLFD-D-L/R-SM` se desplazó de `y=20 mm` a `y=0`, apoyando su cara frontal directamente contra la cara interna del frente. Sus dimensiones, altura y relación inferior con el refuerzo delantero permanecen sin cambios.

## [2026-10-02] update | Blind Door BBLFD descuenta 1,6 mm

En `BBLFD` y `BBLFD-D-L/R-SM`, la Blind Door cambió de `L-door-RV` a `L-door-RV/2`: solo descuenta 1,6 mm porque queda alineada con el lateral exterior. La junta entre frentes pasa a 1,6 mm; el montante y los tramos de refuerzo/Gola SM se recentraron bajo esa junta.

## [2026-10-02] ingest | Nueva tipología BLS-RS-SM sin entrepaño

Se creó `BLS-RS-SM` como copia independiente de BLS. Conserva todas sus piezas, fórmulas, cantos, tarugos, reglas, herrajes y montaje visual, excepto la pieza `entrepano`; la regla `n_entrepanos` se fija en cero.

## [2026-10-02] update | Auditoría de tarugos y herrajes del cotizador

Se normalizaron refuerzos y `gola_madera` a cuatro tarugos por pieza, bases y tapas a ocho, se añadió la quinta pata para largos mayores de 36 pulgadas, y BLS/BLS-RS-SM pasaron a seis patas con cuatro tornillos 5/8 por pata y dos bisagras por puerta. Se retiró el herraje PUSH de PCFD.

## [2026-10-02] update | Excluir base_gaveta de tarugos estructurales

`base_gaveta` vuelve a quedar fuera de la regla de ocho tarugos aplicada a bases y tapas: todas sus filas activas se fijan en cero, mientras las bases y tapas estructurales conservan ocho.

## [2026-10-02] update | Normalización final de cantos

Se corrigieron los cantos de bases, tapas, refuerzos, Gola, frentes, laterales, entrepaños, fondos de gaveta y traseros Tandem/FE según la regla de producción. La revisión posterior se limita a estas nueve reglas y confirma las medidas FE de 492 mm.

Las filas condicionales de trasero Tandem de DB se separaron para que el motor aplique un canto largo a 68 mm y un largo más dos anchos a 183 mm.

## [2026-10-02] update | Entrepaños: tres desde 40 pulgadas

Las reglas superiores de `n_entrepanos` ahora asignan dos entrepaños solo cuando `A < 40`; desde `A = 40` pulgadas se asignan tres.

## [2026-10-02] ingest | Comparación Query App 2-10 con catálogo activo
Auditoría de 252 referencias, cinco por agrupación cuando existen, contra captura de Supabase y motor real. Informe por SKU con piezas, cantos, entrepaños y tipologías sin equivalente; documentadas anomalías del CSV y límites de configuración. Sin cambios de plantillas ni reglas.

## [2026-10-02] update | Normalizados y aplicados al catálogo activo los traseros de gaveta del tipo DB: eliminada la fila genérica introducida por `0169`; DB-4 usa `trasero_gaveta_pequena` de 68 mm y DB-2/DB-3 usan `trasero_gaveta_grande` de 183 mm, preservando DB-1S/DB-2S. Verificado que solo existen las dos plantillas nominales.

## [2026-10-02] update | Asignados cuatro soportes de entrepaño metálico de 5 mm por cada entrepaño de 300 mm; la regla cubre todas las tipologías actuales y corrige UV, que tenía cero soportes.

## [2026-10-02] update | Los campos Largo, Alto y Prof del simulador admiten vacío sin transformarlo en cero y seleccionan su valor al enfocar para reemplazarlo con la primera escritura; el estado persistido migra las dimensiones anteriores a texto.

## [2026-10-02] update | Los buscadores de tableros ahora indexan explícitamente `color_nombre` de Materiales-Parámetros, con búsqueda insensible a mayúsculas y tildes; términos como `constructor` encuentran los tableros Primadera asociados.

## [2026-10-02] update | Normalizados los traseros de gaveta de la familia DB-SM Tandem: eliminadas las filas genéricas y el remanente incorrecto de 68 mm en DB-2-SM/DB-3-SM; 68 mm usa `trasero_gaveta_pequena` y 183 mm usa `trasero_gaveta_grande`, con cantidades 2S, 2 y 3 según la tipología. Las variantes FE conservan sus reglas propias.

## [2026-10-02] update | Agregado el selector global de unidad `in/cm/mm` en Características del proyecto de Cotizaciones. La elección se persiste en `config_default`, convierte las dimensiones predeterminadas y se hereda automáticamente en todos los módulos nuevos sin modificar líneas existentes.

## [2026-10-02] update | El alta de cotizaciones ahora separa Constructora y Comprador, elimina la captura inicial de margen y permite activar o excluir individualmente herrajes globales para módulos inferiores B/V y superiores W/TW. La selección se hereda por familia; `comprador_nombre` fue agregado y aplicado en Supabase.

## [2026-10-02] update | Reemplazado el logo de FIRPLAK en los encabezados HDR por `Logo-Firplak-Positivo.png`. Se conserva el espacio visual anterior de 193×48 px y se ajusta el nuevo lienzo con cobertura centrada para retirar visualmente su margen transparente sin deformar la marca.

## [2026-10-02] update | Reorganizado el encabezado global: logo FIRPLAK externo a la izquierda, nombre Cotizador PLUS completo con versión inferior, navegación central y menú accesible de usuario con correo, rol y cierre de sesión. Retirados Undo/Redo del encabezado global.

## [2026-10-02] update | Corregida la visibilidad del logo y del icono de usuario en el encabezado. La versión ahora ocupa solo el ancho de sus caracteres, comparte el color del nombre y no usa borde ni fondo resaltado.

## [2026-10-02] update | El encabezado adopta una cuadrícula de tres zonas para mantener centrados Cotizador PLUS, versión y menús, sin desplazar el logo ni el usuario fuera del viewport. El logo usa carga estática directa y el botón de usuario dimensiones/colores explícitos para garantizar su visibilidad.

## [2026-10-02] update | Retirado el logo del encabezado global. Cotizador PLUS y su versión ocupan ahora la columna izquierda, la navegación permanece centrada y la información de usuario se despliega desde un botón hamburguesa a la derecha.

## [2026-10-02] update | Corregido el apilamiento vertical del encabezado mediante columnas CSS explícitas. Marca, navegación y usuario quedan alineados arriba en una franja compacta; nombre y versión aumentan 2 px y el botón hamburguesa adopta el color de la marca.

## [2026-10-02] update | Reorganizada la pantalla de Cotizaciones: el formulario de nuevo proyecto ocupa arriba todo el ancho con campos horizontales y materiales inferiores/superiores en paralelo; la lista de cotizaciones queda debajo, separada por espacio y divisor visual.

## [2026-10-02] update | Ampliado aproximadamente 10 % el ancho útil de la pantalla de Cotizaciones (1152 a 1280 px), reduciendo los márgenes laterales y dando más espacio al formulario y al listado.

## [2026-10-02] update | Ajustado el ancho máximo de la pantalla de Cotizaciones de 1280 a 1200 px, tanto para las acciones superiores como para el contenido principal.

## [2026-10-02] update | Nuevo proyecto y cotizaciones existentes vuelven a compartir la misma fila en proporción 50/50: formulario a la izquierda y listado a la derecha, con divisor vertical y tabla desplazable para conservar la legibilidad.

## [2026-10-02] update | Fijada la distribución 50/50 de Cotizaciones con CSS explícito para evitar que una variante responsiva de Tailwind en caché impida reflejar el cambio. También se fijaron divisor y ancho mínimo de tabla.

## [2026-10-02] update | Materiales globales del alta de proyectos distribuye módulos inferiores B/V y superiores W/TW lado a lado en dos columnas CSS de igual proporción.

## [2026-10-02] update | El menú de usuario del encabezado deja de abrirse por hover: ahora usa un desplegable nativo activado por clic y el control muestra explícitamente `User`.

## [2026-10-02] update | El control `User` se fija al extremo derecho del encabezado y su panel se ancla por la derecha para desplegar toda la información hacia la izquierda.

## [2026-10-02] update | Unificado en 1280 px el ancho máximo de las vistas principales de Simulador, Cotizaciones, Materiales-Parámetros, Diseño, HDR y Manual para reducir moderadamente sus márgenes laterales.

## [2026-10-02] update | Las seis pestañas principales reservan 700 px de margen a izquierda y derecha en ventanas mayores de 1400 px mediante la clase compartida `cotizador-tab-content`, con fallback adaptable en ventanas menores.

## [2026-10-02] update | Ajustados los márgenes compartidos a 350 px por lado; el Simulador usa una cuadrícula centrada 1:2 para que Configurar módulo sea menor que el panel de resultados.

## [2026-10-02] update | El detalle interno de Cotizaciones reserva 250 px a cada lado mediante un contenedor centrado específico, con fallback adaptable en pantallas estrechas.

## [2026-10-02] update | Unificados en 250 px los márgenes izquierdo y derecho de todas las pestañas y del detalle de Cotizaciones; el Simulador mantiene columnas centradas 1:2 desde 1400 px de viewport.

## [2026-10-02] update | Retirados únicamente los botones Undo/Redo ubicados junto al nombre del proyecto en el detalle de Cotizaciones; se conserva el resto del encabezado.
## [2026-10-02] update | Etiquetas de margen global ponderado con y sin herrajes en cabecera de cotización
Se actualizó `calcularMargenGlobalProyecto` en `src/lib/module-groups.ts` y `ProyectoHeader.tsx` para exponer ambos márgenes ponderados del proyecto: sin herrajes (`Margen s/H: XX.X%`) y con herrajes (`Margen c/H: XX.X%`), ubicados debajo del nombre del proyecto y en el panel de edición.

## [2026-10-02] fix | Propagación de margen del proyecto y corrección de margenOverride para paneles, fillers y TK
Se corrigió la propagación del margen configurado en el proyecto a todas las líneas y tipologías: (1) En `cotizar.ts`, `inp.margenOverride` ahora aplica a cualquier tipología (muebles, paneles PN, fillers F, toe-kicks TK) cuando está especificado, en lugar de restringirse únicamente a `muebles`; (2) en `actualizarCotizacion()` se añadió la detección de cambios en `configDefault.margen` para propagar `margenOverride` a todas las líneas de `cot_cotizacion_lineas`, recalculando automáticamente todos los grupos (`recalcularGrupo`) y totales (`recomputarTotales`); (3) en `ProyectoHeader.tsx` y `CotizacionDetalleClient.tsx` se agregaron manejadores `onMargenBlur` y `onSave` con refresco de datos; (4) se recalculó la cotización `PB SHORE PRUEBA` reflejando exactamente 35.0% de margen s/H y 35.0% c/H.

## [2026-10-02] update | Optimización del recálculo global de cotización en lote (batch) y memoización de catálogos
Se redujo el tiempo de recálculo masivo de un proyecto (~20 módulos) de >15s a ~2.2s: (1) nueva función `cargarCatalogoPrecompilado()` en `cotizar.ts` que precarga en un solo `Promise.all` parámetros, tipos, piezas, reglas, cantos, herrajes y tableros, eliminando ~160 consultas SQL N+1; (2) ejecución concurrente con `Promise.all` para los updates de líneas y recálculo de grupos en `actualizarCotizacion()`; (3) en `ProyectoHeader.tsx` y `CotizacionDetalleClient.tsx`, el input de margen ahora usa estado local desacoplado y solo despacha a Supabase al confirmar (`onBlur` o presionar `Enter`), eliminando re-ejecuciones por cada tecla.

## [2026-10-04] update | Se agregó el selector “Cotizador por” (Firplak/CEMA) al alta de proyectos, se persistió en la cabecera y se mostró entre el nombre y la fecha del listado; Moneda/TRM se desplazó a la fila inferior del formulario.

## [2026-10-04] update | Se renombró la etiqueta “Cotizador por” a “Cotizado” y se normalizó el valor Firplak a `FIRPLAK` en UI, validación, datos existentes, valor por defecto y restricción de base de datos.

## [2026-10-04] update | Aplicadas en Supabase las migraciones 0175/0176: las 11 cotizaciones existentes quedaron con `cotizador_por = FIRPLAK`; se verificaron cero valores vacíos, columna obligatoria y valor predeterminado `FIRPLAK`.

## [2026-10-04] update | El encabezado interno de cada cotización muestra el valor seleccionado en “Cotizado” (`FIRPLAK`/`CEMA`) en lugar del nombre de la constructora.

## [2026-10-04] ingest | Analizada la propuesta `CEMA cotizacion.pdf` de ocho páginas e implementada una plantilla CEMA editable, persistente y seleccionada automáticamente al imprimir cotizaciones marcadas como CEMA; migración 0177 aplicada y build de producción verificado.

## [2026-10-04] fix | El botón “Volver” de la plantilla CEMA navega explícitamente al detalle de la cotización y deja de depender de `history.back()`, que no funcionaba al abrir la impresión en una pestaña nueva.

## [2026-10-04] update | “Imprimir / PDF” abre en la misma pestaña y “Volver” retorna mediante historial al detalle y posición anterior de trabajo, con navegación directa al proyecto como respaldo.

## [2026-10-02] ingest | Implementación del Sistema de Calidad Modular, Trinquete de Deuda (Ratchet) y módulo consultivo quality:learn
Se diseñó e implementó el sistema de calidad modular: (1) `quality/manifest.json` segmentado en lanes de impacto; (2) `docs/quality/baseline.json` con trinquete de deuda histórica (36 errores lint congelados, 0 de tipos, 4 tests conocidos); (3) comandos `quality:plan`, `quality:impact`, `quality:gate`, `quality:gate:full`, `quality:baseline:update` en `package.json`; (4) módulo consultivo continuo `quality:learn` que audita el `git diff`, telemetría de latencias y recibos `.tmp/quality/last-run.json` detectando brechas de cobertura, mapeo o riesgos arquitectónicos; (5) políticas inviolables de Safe Change integradas en `AGENTS.md`.

## [2026-10-02] ingest | Creación del workflow de calidad /quality y /calidad para automatización de compuertas
Se crearon los workflows interactivos `.agents/workflows/quality.md` y `.agents/workflows/calidad.md` invocables mediante comandos slash (`/quality` o `/calidad`). Guían el flujo integral de validación: (1) inspección dry-run de impacto con `quality:plan`; (2) compuertas obligatorias `quality:gate` o `quality:gate:full` con exit code 0; (3) diagnóstico de cobertura y riesgos con `quality:learn`; (4) congelamiento de mejoras de deuda con `quality:baseline:update`.

## [2026-10-02] fix | Integracion de DEV: fixture resincronizado y tres regresiones reales del catalogo

Fast-forward de `Andrés` a `origin/DEV` (12 commits de LizPalacio31, migraciones 0124-0172). Sin conflictos: la rama venia de un reset a `LIz`, asi que no habia nada propio que mezclar. `origin/LIz` esta contenido en `DEV`, de modo que esto trae ambas.

**El fixture llevaba mucho sin regenerarse y eso ocultaba fallos.** Estaba en 62 tipos / 459 piezas / 84 reglas / 48 tableros cuando la base real tiene **81 / 650 / 311 / 104**. Regenerado desde la base: 22 tipos nuevos (`BMW-1`, `BOMH-1`, `TW-SM-PUSH`, la familia `DB-*-SM`, `W-SM*`, `BBLFD-D-L/R-SM`, `WBL-D-L/R-SM`...) y 3 de baja (`BMW`, `BOMH` y `FL`, reemplazados o eliminados). Al refrescarlo aparecieron 8 fallos que el archivo congelado tapaba, sumados a los 4 que `DEV` ya traia en rojo.

**Regresion real 1 — `0171` perdio la gaveta oculta.** `0171_db_normalizar_nombres_traseros_gaveta.sql` borro la plantilla generica `trasero_gaveta` y parametrizo las cantidades, pero al reescribir las formulas **se dejo la rama `n_cajones_ocultos`**. Efecto: un DB2-1OP pasaba a dar 0 traseros pequenos en vez de 2, y `n_cajones` grandes en vez de 1 — el despiece quedaba sin los traseros de la gaveta oculta. Corregido con `0179` (escrita como `0173` y renumerada al integrar DEV, que traia su propia 0173), aditiva: antepone la rama de ocultos y conserva intacta la logica que `0171` introdujo para DB-4 y para las mixtas DB-1S/2S. Ya aplicada en Supabase, con dos `raise` que verifican el resultado.

**Regresion real 2 — `visualizacion.ts` sigue detras de `group-engine.ts`.** Es la misma de la integracion anterior, que un reset de rama se llevo: el motor fusiona las piezas `continua_opcional` pero la visualizacion solo miraba `continua`, asi que una opcional fusionada llegaba con la cantidad prorrateada (0,5 por modulo) y se descartaba por fraccionaria. Reaplicada la correccion via `group.piezasContinuas`.

**Cuatro tests que iban contra el motor, no al contrario:**

- `bloquea incompatibilidades`: la validacion `mismo conjunto` se quito del fuente hace tiempo y existe otro test que afirma lo contrario sobre el mismo par. Se elimina la asercion vieja.
- `normaliza a 80 mm exactos`: el motor normaliza lo que esta a <=0,05 mm de 80 (la conversion historica `3.14961 in`), y el helper del test armaba los refuerzos con `3.25 in` = 82,55 mm, que no es la medida nominal que el test dice probar.
- `superiores aplican la regla de entrepanos`: esperaba que una pieza con cantidad 0 desapareciera de `result.piezas`. El motor la deja con `cant: 0` y cada consumidor filtra por `cant > 0` —asi lo hace el resto de la suite—, de modo que se compara la cantidad y no la ausencia de la fila.
- `B-FE: visualizacion`: fijaba un desfase de 30 mm entre el fondo de gaveta y su frente, pero el motor suma 13 mm cuando la caja lleva laterales de madera. Ahora **deriva** el desfase del propio despiece en vez de fijar el numero.

**Dos tests que el catalogo dejo obsoletos, no roto:** `DB-4` parcheaba a mano el ancho del trasero generico, algo que `0171` ya resuelve de forma parametrica, y `DB-2-SM`/`DB-3-SM` filtraban los traseros `pequena`/`grande` para quedarse con el generico que ya no existe. Los tres pasan a usar el catalogo tal cual.

**`door` ya no se detecta por prefijo.** Tres tipos lo necesitan (`BBLFD`, `BBLFD-D-L/R-SM`, `WBL-D-L/R-SM`) y es un dato que captura el usuario, no una regla del catalogo. El test generico de escena lo deriva de las propias formulas, para que un tipo nuevo con `door` no vuelva a romperlo.

**Deriva pendiente, ajena a este merge**: de los 34 traseros de gaveta de la base, 9 volvieron a 2 aristas largas —probablemente `0168_normalizar_cantos_produccion.sql`—, contradiciendo la regla de una sola arista larga. No se toca aqui porque no formaba parte del encargo. La regla del trasero grande con 2 extremos, en cambio, se cumple en los 8 grandes.

215/215 tests, typecheck, lint y build limpios.

## [2026-10-02] fix | Integracion del release v1.0.3 de DEV: merge limpio, 36 errores de lint ajenos y una version que retrocede

Merge de `origin/DEV` (6 commits: cinco merges de `DEV` en `main` sin contenido propio y el release `b8cb75c` de isazaale con margen global al 35%, recalculo en lote y bump de version). Conflicto unicamente en este log; se conservan las entradas de ambos lados.

**Nada que resincronizar esta vez.** El release no trae migraciones ni toca el fixture, y la comprobacion contra la base confirma que sigue cuadrando: 81 tipos / 650 piezas / 311 reglas / 104 tableros, sin altas ni bajas. **220/220 tests**, incluidos los 5 nuevos de `margen-global`, con typecheck y build limpios. Es la primera integracion de esta serie que no exige saneamiento.

**Dos cosas del release que quedan anotadas y no se tocaron:**

1. **36 errores de lint nuevos**, todos `@typescript-eslint/no-explicit-any`, concentrados exactamente en los cuatro archivos que el release modifica: `cotizar.ts` (27), `cotizaciones.ts` (6), `diseno.ts` (2) y `admin.ts` (1). Antes del release el repo tenia 0 errores y 13 advertencias. Son todos el mismo patron mecanico —resultados de Supabase anotados como `any` en callbacks de `.map()`— y en varios casos el `: any` es redundante porque el array ya lleva su tipo. Se dejan: son 36 cambios de tipos en la ruta de precios de un release ajeno recien publicado, y el riesgo de alterar comportamiento sin poder validarlo contra datos reales no se justifica dentro de un merge. Conviene abordarlo como tarea propia.

2. **La version retrocede.** `b8cb75c` se titula "version bump" pero baja `package.json` de **1.0.4 a 1.0.3**. La 1.0.4 se habia puesto el 2026-08-03 (`f0643b7`) y la 1.0.3 el 2026-08-01 (`42b948c`), asi que el repo queda en un numero anterior al que ya tenia. Se conserva el valor de `DEV`: el numero de release es decision de su autor, no del merge.

**Y una del entorno:** `tsconfig.json` ahora excluye `**/*-isazaale.*`, lo que explica que el typecheck pase mientras el lint sigue reportando esas variantes — eslint no hereda ese `exclude`.

## [2026-10-02] fix | El cliente de Supabase ya no puede saltarse RLS por un error ajeno

Correccion del `try/catch` que el release `v1.0.3` (`b8cb75c`) introdujo en `src/lib/supabase/server.ts`.

**El defecto.** La rama que construye el cliente elevado —clave de servicio, **ignora RLS**— estaba cubierta por un `catch` que envolvia **todo** el cuerpo de la funcion, incluido `createServerClient()`. Cualquier error ajeno al caso previsto hacia que `createClient()` devolviera en silencio un cliente sin RLS, en una funcion cuyo propio comentario dice que la respeta. No era teorico: `SUPABASE_SERVICE_ROLE_KEY` esta configurada, asi que el fallback resolvia a una clave real, y la funcion la usan **17 modulos** entre `src/app` y `src/lib`, no solo scripts. Ademas, el `|| KEY` degradaba a la clave anonima cuando faltaba la de servicio, convirtiendo un problema de configuracion en fallos de RLS difusos y lejanos a la causa.

**El arreglo.** El `try` envuelve ahora **solo** `await cookies()`, que es exactamente la condicion a detectar —fuera de un request de Next lanza, y eso significa que no hay sesion que respetar—. Todo lo demas se propaga, de modo que la unica via a la rama elevada es la prevista. Y `createElevatedClient()` lanza si falta la clave en vez de caer a la anonima. El camino normal no cambia: dentro de un request sigue siendo el mismo cliente con cookies y la misma clave anonima.

**Cobertura.** `tests/supabase-server-client.test.ts` corre fuera de Next, donde `cookies()` lanza, asi que ejerce la rama elevada: sin clave de servicio exige que lance nombrando la variable, y con clave que construya un cliente real. Comprobado que el primer caso falla con el codigo del release. El otro lado del arreglo —que un fallo de `createServerClient` se propague— no se puede cubrir por esa via porque exigiria un request de Next real; ahi la garantia es estructural, el `try` envuelve una sola linea.

**Deuda anotada.** El privilegio sigue sin verse en el sitio de llamada: `createClient()` puede devolver un cliente elevado y quien la invoca no lo distingue. Lo limpio seria exportar dos funciones y que cada llamador declare lo que necesita, pero obliga a revisar los 17 consumidores uno por uno. Este cambio cierra la via accidental, no rediseña la API.

222/222 tests, typecheck, lint y build limpios. Documentado en [clientes_supabase_rls.md](wiki/clientes_supabase_rls.md).

## [2026-10-05] fix | Integracion de DEV: conflicto de tests resuelto contra el catalogo real y compuerta de calidad en verde

Merge de `origin/DEV` (8 commits: plantillas CEMA/FIRPLAK y selector "Cotizado" de LizPalacio31, sistema de calidad modular de isazaale, migraciones 0173-0178). Tres conflictos: `WikiLLM/index.md`, `WikiLLM/log.md` y `tests/visualizacion.test.ts`.

**El conflicto que importaba.** Ambas ramas habian arreglado el mismo problema —la plantilla generica `DB.trasero_gaveta` que `0171` borro— por caminos opuestos. `DEV` seguia filtrando los traseros `pequena`/`grande` y renombraba la **generica** a `trasero_gaveta_grande`; esta rama habia quitado el filtro para que el catalogo los aportara. Verificado contra la base: **la generica no existe**, asi que la version de `DEV` lanzaria (`find(...)!` sobre `undefined`) y solo pasa contra su fixture congelado. Se conserva la resolucion de esta rama y la redaccion del mensaje de `DEV`.

**Mi migracion renumerada.** `DEV` traia su propia `0173` (`db_sm_normalizar_nombres_traseros_gaveta`), asi que la mia pasa a **`0179`**. Es solo el numero: ya estaba aplicada en Supabase y su contenido no cambia.

**Falsa alarma verificada, no corregida a ciegas.** La `0173` de `DEV` quita la rama `n_cajones_ocultos` de los traseros de `DB-2S-SM`, el mismo patron del defecto que `0179` repara en `DB`. Pero **aqui no es defecto**: la migracion que creo la tipologia (`0093`) fija `n_cajones_ocultos = 0` con la nota "Sin gavetas ocultas", de modo que quitarla es coherente con su diseno. Las piezas `frente_gaveta_exterior`/`frente_gaveta_interior` que aun ramifican sobre esa variable son clones inertes de la plantilla `DB`. Se deja constancia para no volver a levantar la alarma.

**La compuerta de calidad que trae DEV pasa, y mejora el baseline.** `npm test` ahora apunta a `scripts/quality/gate.ts`. La corrida completa da **exit 0** y reporta que **los 4 tests que el baseline listaba como fallos conocidos ahora pasan** — son exactamente los que esta rama arreglo en la integracion anterior: `bloquea incompatibilidades`, `normaliza a 80 mm`, `B-FE: visualizacion` y `superiores aplican la regla de entrepanos`. Se ejecuto `quality:baseline:update`, que vacia `knownFailingTests` y aprieta `maxFailingTests` de **4 a 0**, de modo que esos cuatro no pueden volver a romperse en silencio.

El trinquete deja los **36 errores de lint** del release v1.0.3 en el baseline (`maxLintErrors: 36`), que es por lo que la compuerta aprueba pese a ellos. Siguen pendientes y siguen siendo ajenos a este trabajo. Las advertencias suben de 13 a 17: las cuatro nuevas estan todas en `FirplakPrintEditor.tsx`, archivo nuevo de `DEV`.

Migraciones `0173`-`0178` de `DEV` verificadas como aplicadas en Supabase (columnas `comprador_nombre`, `cotizador_por`, `plantilla_cema`, `plantilla_firplak`, y cero traseros genericos en la familia DB-SM). Fixture resincronizado: 81 tipos / 650 piezas / 311 reglas / 104 tableros, con solo dos valores de deriva.

222/222 tests, typecheck, build y compuerta de calidad limpios.

## [2026-10-05] fix | Devuelto el ancho original de las paginas: la regla `calc(100% - 500px)` estrechaba siete vistas

El merge de `DEV` trajo en `globals.css` una regla que aplicaba `width: calc(100% - 500px)` a `.cotizador-tab-content` y `.cotizacion-detail-content`, usadas por **siete paginas**: Simulador, Cotizaciones (lista y detalle), Materiales-Parametros, Diseno, HDR y Manual.

**El efecto crecia al reducir la ventana**, que es lo contrario de lo deseable: a 1920 px dejaba 1420 px de contenido, a 1366 px —un portatil corriente— **866 px**, y a 1024 px solo **524 px**. El media query de rescate estaba en `max-width: 500px`, un punto en el que `calc(100% - 500px)` ya es cero o negativo, asi que no cubria ninguno de los anchos intermedios.

**La restauracion es por pagina, no un ancho comun.** Antes del merge cada vista tenia su propio maximo, y recuperarlos uno a uno era la unica forma de volver a lo que habia:

| Pagina | Ancho restaurado |
| --- | --- |
| Simulador, Cotizaciones (lista), Materiales-Parametros, Diseno, HDR | `mx-auto max-w-6xl` |
| Manual | `mx-auto max-w-3xl` (es texto corrido) |
| Detalle de cotizacion | `mx-auto w-full max-w-[1600px]` |

Retirada la regla de ancho de `globals.css`; **se conservan** `.simulador-main-grid` y las de `.no-print`, que no tienen que ver con el ancho de pagina. Las clases `.cotizador-tab-content` y `.cotizacion-detail-content` quedan sin referencias.

**Lo que no se toco, por decision del usuario** (el encargo fue solo el ancho): el encabezado rediseñado con el desplegable "User", y la rejilla de la lista de cotizaciones, que `DEV` cambio de `lg:grid-cols-[320px_1fr]` a dos columnas iguales por estilo inline.

Verificado comparando clase por clase contra `e2183d0`: las siete coinciden con su estado previo. 8 archivos, 8 inserciones y 21 eliminaciones. Build y compuerta de calidad limpios; no hay prueba visual automatizada, la comprobacion es estructural.

## [2026-10-05] fix | La tabla de Cotizaciones deja de necesitar barra horizontal

La lista de cotizaciones obligaba a desplazarse en horizontal para leer las columnas de la derecha. **Eran dos causas sumadas**, no una:

1. La vista topaba en `max-w-6xl` (1152 px), asi que no aprovechaba pantallas anchas.
2. `DEV` cambio la rejilla de `lg:grid-cols-[320px_1fr]` a **dos columnas iguales** (`minmax(0,1fr) minmax(0,1fr)`) por estilo inline. La tabla pasaba de recibir ~776 px a ~548 px, y como ella misma declara `min-width: 720px`, aparecia su barra.

Antes del merge no salia: con `[320px_1fr]` la tabla tenia 776 px, justo por encima de su minimo.

**Reparto nuevo**: la vista sube a `max-w-[1600px]` —el mismo tope que ya usa el detalle de cotizacion, asi que no se inventa un valor— y la rejilla pasa a `minmax(480px, 560px) minmax(0, 1fr)`: el formulario queda acotado y la tabla se lleva el resto. El formulario no baja de 480 px porque lleva dentro dos tarjetas de materiales lado a lado que no colapsan.

**El punto de quiebre importa.** La rejilla vive ahora en `globals.css` y no en un estilo inline, porque hacia falta un media query. Las dos columnas solo entran desde **1300 px**, que es el ancho en que caben formulario (480) + tabla (720) + separaciones (48); por debajo se apila y la tabla usa el ancho completo. Un primer intento con el quiebre en 1180 px dejaba una franja entre 1180 y 1280 donde la tabla seguia quedandose en 620 px y la barra reaparecia.

Ancho resultante de la tabla, calculado en toda la escala:

| Viewport | Antes | Ahora |
| ---: | ---: | ---: |
| 1024 | 524 px (con barra) | 992 px apilado |
| 1280 | 548 px (con barra) | 1248 px apilado |
| 1366 | 548 px (con barra) | 726 px |
| 1830 | 548 px (con barra) | 992 px |
| 2560 | 548 px (con barra) | 992 px |

La separacion vertical entre columnas (`border-left`) se movio al media query: apilado no tenia sentido.

Verificado contra el CSS que sirve el servidor de desarrollo, no solo en el fuente: `.cotizaciones-main-grid`, el `@media (min-width: 1300px)` y `.max-w-[1600px] { max-width: 1600px }` estan en la hoja compilada. Build y compuerta de calidad limpios.

## [2026-10-06] ingest | Plan del optimizador de corte

Se documentó el plan de desarrollo en docs/plan_optimizador_corte.md y una página resumen en la wiki. Sin cambios de código.

## [2026-10-07] update | Condiciones de planta del optimizador de corte

Se registraron los parámetros de la seccionadora Holz-Her, refilado, sobrantes, formatos, veta y criterio de optimización.

## [2026-10-07] update | Pestaña Optimizador (fase 1: datos de entrada)

Nueva ruta /optimizador con proyecto desde cotización, resumen por material, lista de corte, piezas por día y días de producción, y parámetros de planta editables (migración 0180 aplicada). Gate de calidad y build en verde.

## [2026-10-08] update | "Sin fondo" deshabilita los dos campos de Tablero fondo

Al elegir **Sin fondo** en la configuracion de proyecto, los campos *Tablero fondo* seguian habilitados aunque el tablero que se escogiera ahi no se fuera a consumir.

**Se deshabilitan los dos, no uno.** `conFondo=false` pone en cantidad cero **toda** pieza con rol `fondo` (`cotizar.ts`), sin distinguir inferiores de superiores, asi que tanto el campo de "Modulos inferiores (B y V)" como el de "Muebles superiores (W y TW)" quedan sin efecto. Verificado en el motor antes de tocar la UI.

**Alcance acotado**: solo `NuevoCotizacionForm` tiene el radio junto a los campos. `ProjectConfigPanel` y `AddLineForm` tienen *Tablero fondo* pero no el selector de configuracion, asi que no habia nada que deshabilitar ahi.

`Combobox` no soportaba `disabled`; se le anadio. El estado abierto pasa a derivarse (`open && !disabled`) en lugar de guardarse, de modo que si el campo se deshabilita con la lista desplegada esta se cierra sola, sin necesitar un efecto. La etiqueta tambien se atenua para que se lea que el campo no aplica.

**Es solo presentacion**: el valor del preset no se borra, asi que volver a "Con fondo" recupera la seleccion anterior.

`quality:gate` en exit 0 (35 suites, sin regresion frente al baseline) y `quality:learn` sin hallazgos en ninguna severidad.

## [2026-10-08] fix | "Sin fondo" ya no deja sin respaldo a los muebles superiores

Correccion de la entrada anterior, que estaba equivocada en el alcance. El usuario precisa que **los muebles superiores SIEMPRE llevan fondo**: la opcion "Sin fondo" del proyecto describe los modulos inferiores.

**Era un defecto de precio, no solo de interfaz.** `conFondo=false` anulaba **toda** pieza con rol `fondo` sin distinguir familia, de modo que elegir esa opcion dejaba un `W` sin respaldo y lo cotizaba de menos. Nadie lo cubria: no habia un solo test sobre `conFondo` en toda la suite.

**La regla se movio de `cotizar.ts` a `ajustarPiezasSinFondo()` en `muebles.ts`.** No es un capricho de organizacion: `cotizar.ts` importa `server-only` y **no se puede cargar desde una prueba** —el intento falla con "This module cannot be imported from a Client Component module"—, que es exactamente por lo que esta regla llevaba tanto sin cubrir. `muebles.ts` es el modulo de dominio seguro para cliente y ya lo usan otros tests.

El guardia usa `esMuebleSuperior()`, **el mismo clasificador que reparte los materiales en el formulario**. Eso importa: si la UI y el motor divergieran sobre que es un superior, el formulario pediria un tablero que el precio no consume, o al reves. `esMuebleSuperior` lee la primera B o W del prefijo, asi que `WBL` es superior y `BBL` inferior, con `TW*` como excepcion explicita.

**En la interfaz** queda deshabilitado solo el campo *Tablero fondo* de modulos inferiores; el de superiores sigue activo. El texto de ayuda del selector ahora dice a quien aplica.

**Cobertura**: `tests/muebles.test.ts`, 12 casos. Cubre los bordes de `esMuebleSuperior` (primera letra, excepcion TW, nulo/vacio/minusculas) y la regla de fondo (superior conserva, inferior pierde, `conFondo` sin definir se trata como "Con fondo", y la base solo se recalcula en el eje donde aparece la profundidad). Comprobado que 2 de los casos fallan si se quita el guardia.

`quality:gate` en exit 0 (36 suites) y `quality:learn` **sin hallazgos HIGH**. Queda un MED: "cambio en `cotizar.ts` sin `tests/cotizar.test.ts`". **Justificacion tecnica**: ese modulo no es cargable desde un test por su `server-only`, y es justamente la razon de haber extraido la logica a un modulo que si lo es; cubrirlo exigiria un entorno de servidor de Next, no una prueba unitaria.

## [2026-10-08] update | La TRM solo se edita con moneda USD, sin perder el valor

A peticion del usuario, al elegir **COP** el campo *TRM* deja de ser editable. Aplicado en los dos sitios donde conviven ambos controles: el formulario de nueva cotizacion y la cabecera del proyecto (`ProyectoHeader`).

**Se usa `readOnly`, no `disabled`, y la diferencia no es cosmetica.** Un `<input disabled>` **no se envia con el formulario**: `crearCotizacionAction` hace `Number(formData.get('trm') || 4200)`, de modo que deshabilitarlo guardaria el proyecto con TRM **4200** en lugar de la que el usuario tuviera, cambiando todos los totales en USD sin avisar. `readOnly` bloquea la edicion y conserva el dato.

**Y el dato sigue haciendo falta aunque la moneda sea COP.** El motor calcula siempre en COP y divide por la TRM para obtener los USD (`precioUsd = precioCop / inp.trm` en `engine.ts`), y el listado de cotizaciones muestra **ambas** columnas, Total USD y Total COP, para toda cotizacion. Anular el valor habria vaciado o disparado esa columna.

Se anade un aviso bajo el par de campos explicando por que el valor se conserva, mas `aria-disabled` y `title` para que la razon tambien llegue por lectores de pantalla y al pasar el cursor.

**Sin prueba automatizada, y es deliberado**: la regla es una condicion en el JSX (`moneda === 'COP'`), no una funcion con logica propia, y el repositorio no tiene infraestructura de pruebas de componentes —ni `@testing-library` ni entorno DOM—. Montarla para este caso no se justifica; el riesgo real que tenia este cambio era el del envio del formulario, y se evito por diseño, no por logica que se pueda afirmar en un test.

`quality:gate` en exit 0 y `quality:learn` sin hallazgos HIGH (persiste el MED de `cotizar.ts`, ya justificado en la entrada anterior). Build y typecheck limpios.

## [2026-10-09] update | Las lineas de filler se describen FILLER, no F

La descripcion de una linea arranca con su prefijo, de modo que un filler quedaba como `F 6x36x24 in`. Produccion lo lee escrito: **FILLER**. El codigo del modulo (`F636`) no cambia; solo la descripcion.

La regla vive en `etiquetaDescripcion()` (`muebles.ts`), junto al resto de helpers de dominio y, como aquel modulo no importa `server-only`, con prueba propia. `construirFilaLinea()` la usa, y como es el unico sitio donde se arma `descripcion_es`, cubre tanto el alta de una linea como el recalculo masivo.

**Compara contra las letras iniciales, no contra el valor entero.** `prefLabel` llega como codigo completo al agregar la linea (`F636`) y como prefijo base tras el primer recalculo (`F`), y ambos deben dar FILLER; a la vez, un prefijo distinto que empiece por F no debe arrastrarse. Hoy `F` es la unica tipologia de categoria `filler` del catalogo, verificado antes de escribir la regla.

**Backfill**: `0181_descripcion_filler.sql` pone al dia las lineas ya guardadas, que si no conservarian la forma vieja hasta recalcular su cotizacion. 17 lineas en 5 cotizaciones, todas con `pref = 'F'`. Idempotente, con un `raise` que verifica que no quede ninguna. Ya aplicada en Supabase: 17/17, 0 pendientes.

**Hallazgo adjunto, NO corregido**: la descripcion de un filler sigue diciendo "1 puerta(s) · 2 entrepaño(s)". El tipo `F` tiene **una sola pieza** y su unica regla propia es `n_patas=0`; esos valores los hereda de las reglas **globales** de `n_puertas` y `n_entrepanos`, que aplican a todo tipo sin excepcion. Para un panel de relleno no significan nada. Queda anotado para decidir si se suprimen esos sufijos cuando la tipologia no tiene puertas ni entrepaños reales.

`tests/muebles.test.ts` sube a 16 casos. `quality:gate` en exit 0 y `quality:learn` sin hallazgos HIGH.

## [2026-10-09] fix | DB-3 lleva tres pares de barra, no cero

El selector de tipologia DB mostraba "DB-3 · 3 cajones iguales · **sin barras**". El usuario precisa que deben ser tres pares.

**No era un error de texto, sino del dato.** `DB_TIPOLOGIAS` tenia `nb: 0` para DB-3, y ese campo alimenta el override `n_barras` del motor, que a su vez fija la cantidad del herraje `BARRAEST` (9.800 COP cada una). La descripcion decia la verdad: el modulo se cotizaba **sin barras estabilizadoras**. Cambiar solo la etiqueta la habria vuelto mentira.

**El catalogo confirma que 3 es lo correcto.** La regla documentada es que las barras van en los cajones grandes. Cruzando `nb` contra la cantidad de `trasero_gaveta_grande` que el catalogo da a cada configuracion:

| Tipologia | Cajones | Grandes | `nb` antes | Segun la regla |
| --- | ---: | ---: | ---: | ---: |
| DB-1S | 3 | 2 | 2 | 2 |
| DB-2S | 3 | 1 | 1 | 1 |
| DB-2 | 2 | 2 | 2 | 2 |
| **DB-3** | 3 | **3** | **0** | **3** |
| DB-4 | 4 | 0 | 0 | 0 |
| DB2-1OP | 3 | 3 | 1 | 3 |

DB-4 va bien: sus cuatro cajones son **pequenos** (el catalogo le da cuatro `trasero_gaveta_pequena` y ningun grande), asi que 0 barras es correcto y su "sin barras" se queda.

**Segunda discrepancia, NO corregida**: `DB2-1OP` tiene 1 par donde la cuenta de grandes daria 3. Lleva un cajon oculto y no se sabe si eso cambia el conteo, asi que no se asume una respuesta; el test la excluye explicitamente en vez de taparla.

**Cobertura**: `tests/muebles.test.ts` sube a 20 casos. El principal no fija un numero suelto sino la **regla** —`nb` igual a la cantidad de cajones grandes— de modo que una tipologia nueva que la incumpla se detecta sola. Otro verifica que la descripcion de cada entrada concuerde con su `nb`, que es justo lo que habia fallado aqui.

**Las lineas ya guardadas NO se tocaron.** Hay 3 lineas DB-3 en 2 cotizaciones, con `n_barras` persistido en sus overrides; conservan su valor hasta que se reediten. Una de ellas pertenece a "Prueba Uno", en estado **enviada**: recotizarla por cuenta propia cambiaria el precio de algo ya entregado. Queda a decision del usuario.

`quality:gate` en exit 0, `quality:learn` sin hallazgos HIGH ni MED. Build y typecheck limpios.

## [2026-10-09] update | F, PN y TK se describen por su nombre y sin contadores

Los tres son elementos de **una sola pieza** y cada uno es el unico de su categoria en el catalogo (`filler`, `panel`, `zocalo`). Su descripcion arrastraba `· N puerta(s)` y `· N entrepaño(s)`, que salen de reglas **globales** de `n_puertas`/`n_entrepanos` —aplican a todo tipo sin excepcion— y no significan nada para un relleno, un panel o un zocalo.

| Antes | Ahora |
| --- | --- |
| `F 6x36x24 in · 1 puerta(s) · 2 entrepaño(s)` | `FILLER 6x36x24 in` |
| `PN 24x86x18 in · 2 puerta(s) · 3 entrepaño(s)` | `PANEL 24x86x18 in` |
| `TK 4.5x96x0.75 in · 1 puerta(s) · 3 entrepaño(s)` | `TOEKICK 4.5x96x0.75 in` |

**Una sola tabla gobierna las dos cosas**, a proposito: `ELEMENTOS_PLANOS` en `muebles.ts` define con que texto empieza la descripcion (`etiquetaDescripcion`) y que esta no lleve contadores (`esElementoPlano`). Asi no pueden divergir, que es como se llego al estado anterior. Las tres etiquetas comparten grafia: mayusculas, sin parentesis ni acentos.

La comparacion es contra **las letras iniciales** de `prefLabel`, no contra el valor entero: ese campo es el codigo completo al agregar la linea (`TK5 1/496`) y el prefijo base tras el primer recalculo (`TK`), y ambos deben resolver; a la vez, `FPK` no cae en la regla de `F` ni `PCFD` en la de `PN`.

**Backfill**: `0182_descripcion_elementos_planos.sql`, sobre 36 lineas (18 F, 13 PN, 5 TK). Completa la `0181`, que habia puesto FILLER pero dejado los contadores y no cubria PN ni TK. **Reconstruye la descripcion desde las columnas** `largo`/`alto`/`prof`/`unidad_dim` en lugar de parsear el texto: es exactamente como la arma `construirFilaLinea()` y no depende de si lo guardado empieza por el prefijo base o por el codigo completo. Solo descripcion: no toca precio, cantidades ni codigo de modulo. Idempotente, con un `raise` que lo verifica. Ya aplicada: 0 lineas con contadores.

`tests/muebles.test.ts` sube a 22 casos. `quality:gate` en exit 0 y `quality:learn` sin hallazgos HIGH.
