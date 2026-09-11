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

`HdrBuscador.tsx` genera el despiece de un mueble sin necesidad de abrir un módulo en Cotizaciones/Simulador. El formulario reproduce el mismo bloque "Tipo De Mueble / Largo / Alto / Prof / Unidad" de `AddLineForm.tsx`/`CotizadorForm.tsx` (mismo `Combobox` buscable para el tipo, mismos componentes `Campo`), en vez de interpretar un código como texto libre — más confiable que parsear el código, porque el usuario elige el tipo directamente de la lista real de `cot_tipos_mueble`. Si el tipo elegido empieza con `DB`, aparece además el selector "Tipología DB" (mismas opciones que en Cotizaciones/Simulador, `DB_TIPOLOGIAS` de `src/lib/muebles.ts`), que arma los overrides `n_cajones`/`n_cajones_pequenos`.

El cálculo lo hace `previewAction()` (`src/app/admin/diseno/actions.ts`, ya usada por el panel de Diseño), extendida con un parámetro `overrides` opcional para poder forzar la tipología DB elegida. Solo admin — misma restricción que `/admin/diseno`, porque reutiliza la misma acción con `assertAdmin()`.

*NOTA: Gran parte del diseño y la interacción fluye a través de Server Actions de Next.js, conectando directamente los componentes interactivos con funciones seguras del servidor (como `cotizar.ts`).*
