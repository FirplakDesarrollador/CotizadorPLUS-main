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

*NOTA: Gran parte del diseño y la interacción fluye a través de Server Actions de Next.js, conectando directamente los componentes interactivos con funciones seguras del servidor (como `cotizar.ts`).*
