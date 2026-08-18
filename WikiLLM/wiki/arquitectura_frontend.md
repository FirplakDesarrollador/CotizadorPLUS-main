# Arquitectura del Frontend

El frontend de Cotizador PLUS está construido sobre **Next.js (App Router)** y sigue un enfoque de diseño componetizado.

## 1. Enrutamiento (`src/app/`)
El proyecto utiliza el App Router (`app/`) para definir las secciones principales de la aplicación:
- **`cotizador/`**: Interfaz principal para simular muebles y generar desgloses de precios en tiempo real.
- **`cotizaciones/`**: Historial y gestión de cotizaciones ya guardadas.
- **`admin/`**: Panel administrativo para gestionar parámetros globales, reglas y catálogos.
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
- **Constructor combinado (`CotizadorForm.tsx`)**: Presenta arriba los módulos confirmados en orden físico, permite editarlos, eliminarlos, arrastrarlos o moverlos con botones. `+ Agregar módulo` valida el formulario activo, lo confirma y abre el siguiente heredando su configuración. La unidad queda bloqueada después del primer módulo.
- **Tarjeta de Cocina (`CocinaCard.tsx`)**: Renderiza los módulos de cada cocina con arrastre de grupos, columna de Costo USD, desgloses por línea y una fila de totales superiores alineada exactamente con las columnas de valores (Costo USD, Cant, Unit USD, Total USD, Total COP).

## 4. Medidas en fracción imperial (`AddLineForm.tsx`)

Los campos Largo/Alto/Prof del formulario de módulos en Cotizaciones (`AddLineForm.tsx`, distinto del Simulador) son `<input type="text">` a propósito, para permitir fracciones imperiales comunes en carpintería (`24 7/8`), en vez del `<input type="number">` nativo del Simulador que las rechaza. Antes de guardar, esos valores pasan por `parseMedida()` (`src/lib/module-groups.ts`), que interpreta `24 7/8`, `24-7/8`, `7/8` o un decimal plano. Si el texto no es interpretable, `onSubmit` bloquea el guardado con un mensaje de error.

Esto reemplazó un `Number(largo)` directo: `Number("24 7/8")` da `NaN`, que al serializarse a JSON para el insert de Supabase se convierte silenciosamente en `null` (`JSON.stringify(NaN) → null`), y una columna `numeric` nullable lo guarda como `NULL` — al releerlo, `Number(null)` es `0`. El síntoma era un módulo con Largo/Alto/Prof en `0`, código como `PN0` y un costo casi nulo, sin ningún error visible para el usuario.

*NOTA: Gran parte del diseño y la interacción fluye a través de Server Actions de Next.js, conectando directamente los componentes interactivos con funciones seguras del servidor (como `cotizar.ts`).*
