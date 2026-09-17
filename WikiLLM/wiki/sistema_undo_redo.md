# Sistema de Undo/Redo (Deshacer / Rehacer)

## Descripción General
El sistema de **Undo/Redo** permite revertir y rehacer cambios de estado en las cotizaciones y simulaciones utilizando los comandos de teclado estándar `Ctrl+Z` (Deshacer) y `Ctrl+Y` / `Ctrl+Shift+Z` (Rehacer), así como botones de acción directa en la interfaz de usuario.

## Arquitectura y Componentes Key

### 1. `useSimuladorStore` (`src/store/simuladorStore.ts`)
- **Historial Temporal:** Mantiene dos pilas de estado (`past` y `future`) con un límite máximo de 50 pasos para prevenir consumo excesivo de memoria.
- **Acciones Disponibles:**
  - `undo()`: Extrae el último estado de `past`, actualiza los valores actuales y lo empuja a `future`.
  - `redo()`: Extrae el primer estado de `future`, aplica los valores actuales y lo empuja a `past`.
  - `canUndo()` y `canRedo()`: Retornan booleanos para habilitar o deshabilitar la UI.
- **Persistencia Optimizada:** Utiliza `partialize` de Zustand Persist para ignorar las pilas `past` y `future` al guardar en `localStorage`, evitando almacenar datos redundantes.

### 2. `UndoRedoHandler` (`src/components/UndoRedoHandler.tsx`)
- **Atajos de Teclado:** Captura globalmente las combinaciones:
  - `Ctrl+Z` / `Cmd+Z`: Deshacer.
  - `Ctrl+Y` / `Cmd+Y` o `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Rehacer.
- **Intercepción Inteligente:** No interrumpe el tipeo o deshacer nativo cuando el usuario está editando campos de texto HTML estándar (`<input type="text">` o `<textarea>`), manteniendo el comportamiento habitual del navegador.
- **Notificación Toast:** Despliega una alerta emergente discreta en la esquina inferior derecha ("Deshecho (Undo)", "Rehecho (Redo)") que desaparece automáticamente en 1.5 segundos.

### 3. Componente `UndoRedoButtons` (`src/components/UndoRedoButtons.tsx`)
- Componente reutilizable con iconos claros de curva hacia la izquierda (Undo) y derecha (Redo), bordes estilizados e indicadores de estado.
- Presente en el encabezado principal `AppHeader` (disponible en todos los módulos de la app) y en subencabezados clave como `CotizadorForm` y `ProyectoHeader`.

