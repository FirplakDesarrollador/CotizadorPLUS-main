# Dependencias del Proyecto y Stack Tecnológico

El proyecto está diseñado sobre tecnologías modernas del ecosistema de JavaScript/React, priorizando la ejecución híbrida (Server/Client) de Next.js y el control del estado liviano.

## 1. Stack Base
*   **Next.js (v16.2.6):** Framework de React para producción, utilizando el modelo de **App Router** (`app/`) para definir las vistas del sistema.
*   **React (v19.2.4) & React DOM:** Librería de renderizado de componentes. Se explota el uso nativo de React Server Components (RSC) y Client Components (`'use client'`).
*   **TypeScript (v5.x):** Añade tipado estático estricto a las entidades de cotización (`Breakdown`, `CalcInput`, `Dims`, etc.) y las consultas de base de datos.

## 2. Dependencias Clave (Producción)

### Estado y Backend
*   **`zustand` (v5.0.14):** Gestor de estado ligero en sustitución de Redux. Mantiene de forma reactiva y persistente (`zustand/middleware/persist`) la configuración activa del simulador.
*   **`@supabase/supabase-js` & `@supabase/ssr`:** Cliente oficial para comunicarse con la base de datos y manejar sesiones con Server-Side Rendering (SSR) y cookies de autenticación.
*   **`server-only`:** Módulo de seguridad que impide la compilación o importación accidental de módulos del lado del servidor (como `cotizar.ts`) en el código que corre en el navegador del cliente.

### Procesamiento y UI
*   **`exceljs` (v4.4.0):** Utilidad en NodeJS/Browser para manipular archivos de hojas de cálculo de Excel. Esencial si se decide exportar la cotización final o desgloses detallados de despiece.
*   **`driver.js` (v1.4.0):** Librería para crear tutoriales dinámicos interactivos paso a paso para guiar a los vendedores sobre cómo simular y configurar sus cotizaciones.
*   **`react-markdown` & `remark-gfm`:** Renderiza sintaxis Markdown directamente en componentes de React, útil para cargar manuales de ayuda o textos enriquecidos de documentación.

## 3. Dependencias de Desarrollo
*   **TailwindCSS (v4):** Framework de estilos CSS basado en utilidades, integrado a través de PostCSS (`@tailwindcss/postcss`).
*   **ESLint (v9) & eslint-config-next:** Herramientas de análisis estático (linting) para forzar buenas prácticas de desarrollo en Next.js y JavaScript.
