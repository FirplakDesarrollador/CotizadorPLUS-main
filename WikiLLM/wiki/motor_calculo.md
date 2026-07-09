# Motor de Cálculo (Engine)

El cálculo financiero de la cotización está centralizado en el backend. Su objetivo es replicar con precisión de centavos la lógica de un Excel maestro (CEMA). 

## 1. Núcleo Algorítmico (`src/lib/engine.ts`)
Este archivo es totalmente agnóstico del framework y de Supabase. Funciona como una función pura `calcularMueble` que toma entradas (dimensiones, reglas, plantillas) y devuelve un `Breakdown` completo de costos.

**Características principales:**
- **Evaluador de Expresiones (`evalExpr`):** Ejecuta fórmulas de base de datos dinámicamente usando una whitelist de caracteres y `new Function()`.
- **Derivación de Variables:** Interpreta reglas dependientes del tipo de mueble (ej. cuántos herrajes se necesitan para una altura determinada).
- **Procesamiento de Tableros y Cantos:** Calcula las áreas (en `cm2`) multiplicadas por el factor de desperdicio del proyecto, y el perímetro total considerando aristas para el tapacantos.
- **Herrajes y Consumibles:** Calcula el consumo exacto de componentes estructurales y accesorios basándose en la configuración del mueble.
- **Cadena de Precios:** Aplica la cadena contable: Costo Base -> Margen -> Recargos del Cliente -> Conversión de Moneda (TRM).

## 2. Capa de Integración (`src/lib/cotizar.ts`)
Este archivo actúa como puente entre la base de datos y el motor de cálculo. Se ejecuta estrictamente en el servidor (`import 'server-only'`).

**Flujo de Ejecución (`cotizar`):**
1. Recibe los inputs de la vista del simulador (`CotizarInput`).
2. Obtiene de Supabase todas las tablas necesarias en paralelo (piezas, reglas, tableros, cantos, herrajes).
3. Construye los objetos de parámetros que espera el `engine.ts` (resolviendo presets y overrides).
4. Invoca `calcularMueble()` y devuelve el `Breakdown` al frontend.

**Carga de Datos (`getCotizadorData`):**
Provee al frontend con toda la metadata necesaria para construir la interfaz (tipos de mueble, recargos disponibles, tableros habilitados, herrajes filtrados por rol), asegurando que la UI esté sincronizada con la Base de Datos en tiempo real.
