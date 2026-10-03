# Sistema de Calidad Modular, Basado en Impacto y Trinquete de Deuda (Ratchet)

El sistema de calidad de Cotizador PLUS previene regresiones introducidas por desarrolladores o agentes de IA, combinando análisis de impacto por grafo de dependencias, congelamiento estricto de deuda histórica (*Ratchet*) y auditoría consultiva continua.

## Arquitectura y Componentes

1. **Manifest de Capacidades (`quality/manifest.json`)**:
   - Define los *lanes* de impacto del repositorio (`grouping`, `visualization`, `pricing-db`, `engine`, `frontend`, `core-transversal`).
   - Mapea rutas de archivo a suites de pruebas específicas (`tests/*.test.ts`).
   - Detecta archivos huérfanos y escala a suite completa cuando se tocan archivos centrales.

2. **Línea Base y Trinquete (`docs/quality/baseline.json`)**:
   - Registra el conteo actual de deuda permitida: errores de TypeScript (0), errores de ESLint (36) y tests fallidos conocidos (4).
   - Regla de trinquete:
     $$\text{Errores Nuevos} = 0 \quad\land\quad \text{Errores Totales} \le \text{Errores Baseline}$$
   - Si se añade un solo error o falla un test no registrado en la lista de conocidos, el gate aborta con código 1.

3. **Módulo de Auditoría y Aprendizaje (`quality:learn`)**:
   - Script consultivo en `scripts/quality/learn.ts`.
   - Analiza el `git diff`, los recibos de ejecución (`.tmp/quality/last-run.json`) y las latencias por prueba.
   - Diagnostica:
     - **Brechas de Cobertura**: Lógica sustancialmente modificada sin suite de pruebas.
     - **Brechas de Mapeo**: Archivos tocados sin lane asignado.
     - **Rendimiento / Flakiness**: Pruebas con duración $\ge 500\,\text{ms}$ o $\ge 1500\,\text{ms}$.
     - **Riesgo Arquitectónico**: Modificaciones en motores core sin pruebas de integración ejecutadas.
   - Genera `.tmp/quality/learn-report.json`.

## Comandos Operativos

| Comando | Propósito |
| :--- | :--- |
| `npm run quality:plan` | Inspecciona el `git diff` e imprime las capacidades/tests afectados (costo 0). |
| `npm run quality:impact` | Ejecuta únicamente las pruebas unitarias de los módulos tocados. |
| `npm run quality:gate` | Compuerta pre-commit/pre-push: impact plan + linter + types + tests bajo trinquete. |
| `npm run quality:gate:full` | Suite exhaustiva completa para CI y releases. |
| `npm run quality:baseline:update` | Congela la línea base cuando se reduce deuda técnica. |
| `npm run quality:learn` | Auditoría consultiva de riesgos, latencias y brechas de cobertura. |

## Gobernanza Safe Change para Agentes
- Prohibido relajar aserciones o usar `.skip`.
- Prohibido inflar la línea base de deuda.
- `quality:learn` es estrictamente consultivo (no muta código automáticamente).
- No se da por concluida ninguna tarea si hay hallazgos `HIGH` sin resolver o sin justificar.

## Workflows Disponibles
- `/quality` o `/calidad`: Ejecuta el ciclo guiado paso a paso desde el análisis de impacto (`plan`) y compuertas de trinquete (`gate`/`gate:full`) hasta el diagnóstico consultivo (`learn`).

