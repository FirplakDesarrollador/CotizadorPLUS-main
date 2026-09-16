# Arquitectura del Frontend

El frontend de Cotizador PLUS está construido sobre **Next.js (App Router)** y sigue un enfoque de diseño componetizado.

## 1. Enrutamiento (`src/app/`)
El proyecto utiliza el App Router (`app/`) para definir las secciones principales de la aplicación:
- **`cotizador/`**: Interfaz principal para simular muebles y generar desgloses de precios en tiempo real.
- **`cotizaciones/`**: Historial y gestión de cotizaciones ya guardadas.
- **`admin/`**: Panel administrativo para gestionar parámetros globales, reglas y catálogos.
- **`hdr/`**: Buscador de despiece por código de mueble (ej. `SBFD30`, `W2436`, `DB18-1S`). Solo admin, ver §5.
- **`login/`**: Manejo de autenticación.
- **`manual/`**: Documentación o guías de uso para el usuario final.

## 2. Gestión de Estado (`src/store/simuladorStore.ts`)
Se utiliza **Zustand** para manejar el estado del simulador del lado del cliente.
- Mantiene un borrador activo y una lista ordenada de módulos confirmados. Cada módulo conserva tipo, dimensiones, materiales, cantos, modo de frentes y configuración local de herrajes; unidad, TRM y moneda pertenecen a la sesión del conjunto.
- Conserva `editingId` y `pendingDraft` para editar un módulo confirmado sin perder el formulario nuevo que estaba en curso.
- Retiene el último resultado consolidado generado por el motor (`result`) y guarda instantáneas completas para Undo/Redo.
- Persiste la sesión a través de recargas con el middleware `persist`, bajo `simulador-storage`. El esquema está versionado en `2`; la migración desde el estado individual conserva el formulario anterior, inicia una lista vacía y descarta resultados incompatibles con el nuevo contrato.

## 3. Componentes Visuales (`src/components/`)
La interfaz está altamente componetizada para mantener el código limpio y reusable.
Ejemplos de componentes destacados:
- **Campos de Entrada (`Campo.tsx`)**: Envoltorios estandarizados para inputs y selects.
- **Selectores Complejos (`Combobox.tsx`)**: Usados para selecciones avanzadas (como búsqueda de tableros o herrajes).
- **Utilidades de UI (`TooltipToggle.tsx`, `GuideButton.tsx`)**: Para presentar información de contexto o ayuda al usuario sin sobrecargar la pantalla principal.
- **Constructor combinado (`CotizadorForm.tsx`)**: Presenta arriba los módulos confirmados en orden físico, permite editarlos, eliminarlos, arrastrarlos o moverlos con botones. `+ Agregar módulo` valida el formulario activo, lo confirma y abre el siguiente heredando su configuración. La unidad queda bloqueada después del primer módulo. La tarjeta "Desglose de costo" muestra los totales agregados (Tablero/Canto/Consumibles/Herrajes) sin desglosar por rol de tablero ni por herraje individual — el detalle por rol de tablero (`result.maderaPorRol`) vive en la tarjeta "Materiales" más abajo, y el detalle por herraje (`result.herrajes`) en la tarjeta "Herrajes".
- **Tarjeta de Cocina (`CocinaCard.tsx`)**: Renderiza los módulos de cada cocina con arrastre de grupos, columna de Costo USD, desgloses por línea y una fila de totales superiores alineada exactamente con las columnas de valores (Costo USD, Cant, Unit USD, Total USD, Total COP).

## 4. Medidas en fracción imperial (`AddLineForm.tsx`)

Los campos Largo/Alto/Prof del formulario de módulos en Cotizaciones (`AddLineForm.tsx`, distinto del Simulador) son `<input type="text">` a propósito, para permitir fracciones imperiales comunes en carpintería (`24 7/8`), en vez del `<input type="number">` nativo del Simulador que las rechaza. Antes de guardar, esos valores pasan por `parseMedida()` (`src/lib/module-groups.ts`), que interpreta `24 7/8`, `24-7/8`, `7/8` o un decimal plano. Si el texto no es interpretable, `onSubmit` bloquea el guardado con un mensaje de error.

Esto reemplazó un `Number(largo)` directo: `Number("24 7/8")` da `NaN`, que al serializarse a JSON para el insert de Supabase se convierte silenciosamente en `null` (`JSON.stringify(NaN) → null`), y una columna `numeric` nullable lo guarda como `NULL` — al releerlo, `Number(null)` es `0`. El síntoma era un módulo con Largo/Alto/Prof en `0`, código como `PN0` y un costo casi nulo, sin ningún error visible para el usuario.

## 4.1. "Con herrajes" es obligatorio en DB (`AddLineForm.tsx` / `CotizadorForm.tsx`)

`calcularMueble()` solo suma riel/barra/pata/etc. al costo cuando `conHerrajes=true`: si está en `false`, `herrajesPlantilla` queda vacío (`cotizar.ts`) y el precio final no incluye ese hardware, aunque el usuario haya elegido un riel/tipología DB específicos. Para evitar cotizar un DB sin el costo real de riel y barras, el checkbox "Con herrajes"/"Incluir herrajes" queda **deshabilitado y forzado a `true`** mientras el tipo elegido empiece con `DB` — en tres capas independientes, para que ningún camino (edición de un módulo antiguo guardado con `conHerrajes=false`, cambio de tipo, envío del formulario) deje pasar un DB sin herrajes:

1. Al cambiar el Tipo (o la Tipología DB) se fuerza el estado a `true`.
2. El `checked` del checkbox se muestra como `esDB ? true : conHerrajes` (nunca aparece desmarcado en DB, incluso si el estado subyacente quedó en `false` por un módulo editado de antes de este fix).
3. El valor que se envía al guardar/calcular también se fuerza (`esDB ? true : conHerrajes` en el payload de `AddLineForm.tsx`; `pref.startsWith('DB') ? true : modulo.conHerrajes` en `inputFromModule()` de `CotizadorForm.tsx`) — así el precio queda correcto aunque el estado de React no se haya sincronizado.

## 5. Buscador HDR por código (`src/app/hdr/`)

`HdrBuscador.tsx` genera el despiece de un mueble sin necesidad de abrir un módulo en Cotizaciones/Simulador. El formulario reproduce el mismo bloque "Tipo De Mueble / Largo / Alto / Prof / Unidad" de `AddLineForm.tsx`/`CotizadorForm.tsx` (mismo `Combobox` buscable para el tipo, mismos componentes `Campo`), en vez de interpretar un código como texto libre — más confiable que parsear el código, porque el usuario elige el tipo directamente de la lista real de `cot_tipos_mueble`. Si el tipo elegido empieza con `DB`, aparece además el selector "Tipología DB" (mismas opciones que en Cotizaciones/Simulador, `DB_TIPOLOGIAS` de `src/lib/muebles.ts`), que arma los overrides `n_cajones`/`n_cajones_pequenos`. A diferencia de `AddLineForm`/`CotizadorForm` (donde Tipo va en su propia fila y Largo/Alto/Prof/Unidad debajo en un grid de 4), en HDR ese bloque quedó **integrado en una sola fila** (`grid-cols-12`, Tipo con `col-span-5`, cada medida `col-span-2`, Unidad `col-span-1`, apilando a una columna en pantallas angostas) — pedido explícito para eliminar el espacio vacío que dejaba el Combobox de Tipo solo en su fila.

El cálculo lo hace `previewAction()` (`src/app/admin/diseno/actions.ts`, ya usada por el panel de Diseño), extendida con un parámetro `overrides` opcional para poder forzar la tipología DB elegida. Solo admin — misma restricción que `/admin/diseno`, porque reutiliza la misma acción con `assertAdmin()`.

Desde `W2936-SM` (2026-09-15), el modo manual de HDR tambien expone el selector
"Sistema de frente". Si se elige Gola/SM, el buscador envia `gola=1`, agrega el
sufijo comercial `-SM` al titulo (`W2936-SM`) y usa las mismas formulas que
Simulador/Cotizaciones. En la tabla HDR, las piezas de rol `frente` se muestran
como alto x ancho para coincidir con la hoja de ruta real, aunque el motor
internamente conserve largo horizontal x alto vertical.

### 5.1 Formato de hoja de ruta real (2026-09-10)

El resultado se muestra en el mismo formato que la hoja de ruta real de producción (pedido con captura de una hoja `B12`), no como una tabla genérica de piezas:

- **Una fila por pieza física**, no una fila con `Cant`: si `cant=2`, salen dos filas letradas consecutivas (A, B, C…). El caso `lateral` con `cant=2` se etiqueta `SIDE L`/`SIDE R`.
- **Nombre de producción**, traducido del nombre interno vía `NOMBRE_PRODUCCION` en `HdrBuscador.tsx` (`lateral`→SIDE, `refuerzo_trasero`→RAIL TRASERO, `refuerzo_delantero`/`refuerzo_horizontal`→RAIL DELANTERO, `entrepano`→SHELF, `base_gaveta`→PIEZA CAJON, `trasero_gaveta*`→TRASERO CAJON, `frente_gaveta*`/`frente_cajon`→FRENTE GAVETA, `frente`→DOOR si `n_puertas>0` si no FRENTE, `fondo`→BACKING), con sufijo de material por rol de tablero (`caja`→B, `refuerzo`→P, `frente`→C, `fondo`→F — confirmado contra la hoja B12: BASE B/RAIL…P/DOOR…C/BACKING F). **No se reprodujeron** los sufijos de código de riel/bisagra que trae la hoja real (ej. `R17L762`): no hay ese dato en la app.
- **Espesor por pieza**: se resuelve por `rol_tablero` cruzando `result.maderaPorRol` (código de tablero usado) contra el catálogo `cot_tableros.espesor_mm`. Las piezas con `rol_tablero=null` (ej. `frente_cajon` en `B`) no tienen de dónde sacar el espesor — sale `—`; es una limitación pre-existente de esa plantilla, no de esta pantalla.
- **Canto Color vs Blanco**: `cot_piezas_plantilla.cantos` solo trae un calibre por pieza, no una bandera de color. Se agregaron al motor (`engine.ts`, `Breakdown['piezas']`) los campos `cantoLargos`/`cantoAnchos`/`cantoCalibre` (el calibre ya resuelto por espesor+rol, no el crudo de la BD) para poder mostrar la cuenta de cantos por pieza. La separación Color/Blanco es una **inferencia por nombre** (`esVisible()`): piezas visibles desde afuera (lateral, base, rail delantero, puertas, frentes de gaveta) van en Color; piezas ocultas (rail trasero, entrepaño, fondo/trasero de gaveta) van en Blanco — deducida cruzando la hoja B12 real, donde explica las 10 piezas sin excepción. No es un dato confirmado pieza por pieza en el resto del catálogo.
- **Color / Proyecto / Cantidad**: campos de texto libre sin cálculo detrás (igual que "Por definir" en la hoja real), más un campo "Color" por fila — son para completar a mano, no se persisten.
- **Hallazgo colateral**: al validar el formato contra `B12` se confirmó que `fondo` (BACKING) de `B` tiene el mismo defecto de fórmula que tenía `DB` antes del fix del 2026-09-10 (`largo=A`/`ancho=L-TC` da 762×289.8mm; la hoja real da 760×288.8mm = `A-2mm`/`L-16mm`, igual patrón). No se corrigió — pendiente, mismo alcance que la nota de `motor_calculo.md` §1 sobre `BACKING` fuera de DB.

### 5.2 Generar HDR desde una cotización guardada (2026-09-10)

`HdrBuscador.tsx` ahora tiene dos modos, independientes entre sí:

1. **Por tipo y medidas** (el original, §5): formulario manual.
2. **Desde una cotización guardada** (nuevo): un `Combobox` con `listarCotizaciones()` (`src/lib/cotizaciones.ts`, ya usado por `/cotizaciones`), y al elegir una, `modulosDeCotizacionAction()` (`src/app/hdr/actions.ts`) trae **todos** sus módulos (de todas las cocinas, incluida `lineasSinCocina`) y genera una tabla HDR por módulo, apiladas.

`modulosDeCotizacionAction()` **recalcula con las fórmulas actuales del motor**, no lee el `breakdown` guardado en la línea — decisión deliberada: una cotización guardada antes de un fix de esta sesión (ej. el bug de herraje con `margenOverride`, o la fórmula de `BACKING`) tendría ese bug congelado en su `breakdown`, y el propósito de una hoja de ruta es darle a producción el corte *correcto* hoy, no una foto histórica. Usa `inputDesdeLinea()` (recién exportada desde `cotizaciones.ts`, antes privada) para reconstruir el `CotizarInput` de cada línea desde su columna `config` jsonb.

Los módulos **agrupados** (`grupo_id` compartido — laterales físicamente unidos) se recalculan juntos con `cotizarGrupo()`, igual que hace `recalcularGrupo()` al guardar; si no, se pierde la geometría de grupo (laterales compartidos, piezas continuas) y el despiece de esas piezas saldría mal. Los errores de un grupo (ej. la restricción "cantidad debe ser 1 para agrupar") no interrumpen el resto — se listan aparte, por módulo, con su mensaje.

La construcción de la tabla (`construirFilas`, nombres de producción, regla Color/Blanco) se extrajo a `HdrTabla.tsx` para reusarla en ambos modos sin duplicar código.

**Logo FIRPLAK**: el usuario dejó el archivo en `public/firplak-logo.jpg`, con mucho margen blanco alrededor de la marca (lienzo 1376×768px, contenido real solo 960×239px) — se recortó con `sharp().trim()` (sin tocar un píxel de la marca) y se guardó como `public/firplak-logo.png`. Se agregó al header de `HdrTabla.tsx` con `next/image` (`width={960} height={239}`, `className="h-12 w-auto"`), se retiró a pedido del usuario, y se volvió a agregar (mismo archivo, sin reprocesarlo — el usuario reconfirmó el mismo logo dos veces más y coincidía byte a byte con lo ya guardado) — estado final: **presente**, arriba a la derecha del header de cada tarjeta HDR.

### 5.3 Exportar a PDF (2026-09-10)

`src/app/hdr/pdfExport.ts` — `exportarNodoAPdf(el, filename)`: captura el nodo del DOM de una tarjeta `HdrTabla` tal cual se ve en pantalla (header, logo, tabla, nota al pie) con `html2canvas-pro` y lo mete como imagen en un PDF `jsPDF`. Se usó `html2canvas-pro` — no el `html2canvas` original — porque Tailwind v4 pinta con `oklch()` y la librería clásica revienta al parsear esos colores; es una fork mantenida que sí los soporta. Es la primera vez que se generan PDFs de verdad en el proyecto (antes de esto, "PDF" en la app significaba `window.print()` sobre una vista `@media print`, ver `src/app/cotizaciones/[id]/imprimir/`) — aquí se necesitaban archivos `.pdf` reales y, para el caso de una cotización completa, varios archivos independientes disparados por un solo clic, algo que un diálogo de impresión del navegador no puede hacer.

**Página tamaño carta** (pedido explícito, 2026-09-10; antes la página era a medida del contenido capturado): `format: 'letter'` (215.9×279.4mm, verificado con `doc.internal.pageSize` contra la instancia real de `jsPDF`), orientación horizontal si el contenido capturado es más ancho que alto (el caso normal de una tabla HDR de 11 columnas) o vertical si no. La imagen se escala — `Math.min(anchoDisponible/anchoContenido, altoDisponible/altoContenido)`, con 10mm de margen a cada lado — para llenar la página sin deformar la proporción ni recortar nada, y queda centrada en ambos ejes.

`HdrTabla.tsx` se convirtió a `forwardRef` (`HdrTablaHandle = { exportarPdf: () => Promise<void> }`) para que tanto el propio componente como su padre puedan disparar la exportación: el botón "⬇ Exportar PDF" vive **fuera** del nodo capturado (si viviera dentro, saldría el propio botón dibujado en el PDF), controlado por la prop `mostrarBotonExportar` (default `true`).

- **Modo manual** (una sola tabla): el botón de `HdrTabla` alcanza, no hace falta nada más.
- **Modo por cotización** (N tablas): cada `HdrTabla` se renderiza con `mostrarBotonExportar={false}` y un `ref` que `HdrBuscador.tsx` guarda en un `Map<lineaId, HdrTablaHandle>`; un único botón "⬇ Exportar todas en PDF" arriba de la lista recorre ese mapa y llama `exportarPdf()` de cada módulo **secuencialmente** (no en paralelo, con 300ms de pausa entre uno y otro) — cada exportación es pesada (`html2canvas`) y varios navegadores bloquean descargas múltiples disparadas de golpe si no hay una pausa entre ellas. El resultado son N archivos `.pdf` independientes (`HDR_<código>.pdf` cada uno), no un solo PDF combinado — así lo pidió el usuario explícitamente.

Nuevas dependencias: `jspdf` y `html2canvas-pro` (ninguna aparece en el reporte de vulnerabilidades de `npm audit`; las 11 que sí salen son todas de paquetes preexistentes — `next`, `postcss`, `sharp`, `xlsx`, etc. — sin relación con este cambio).

*NOTA: Gran parte del diseño y la interacción fluye a través de Server Actions de Next.js, conectando directamente los componentes interactivos con funciones seguras del servidor (como `cotizar.ts`).*
