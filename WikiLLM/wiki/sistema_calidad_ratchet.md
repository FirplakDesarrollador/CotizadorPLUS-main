# Sistema Modular de Calidad, Safe Change y Protocolo Universal `/desplegar`

El sistema de calidad de **Cotizador PLUS** protege el repositorio contra regresiones introducidas por desarrolladores o agentes de IA mediante análisis de impacto por capacidades, política de no regresión, trinquete estricto de deuda histórica (*Ratchet*), auditoría consultiva continua y un flujo local controlado de publicación (sin GitHub Actions).

---

## 1. Arquitectura General

1. **Manifiesto Funcional (`quality/manifest.json` + `quality/manifest.schema.json`)**:
   - Clasifica todo el código productivo (`src/**`, `db/migrations/**`, configuraciones, harness y skills) en **8 capacidades (*lanes*)**:
     - `lane:engine` (crítico): `src/lib/engine.ts`, `src/lib/muebles.ts` y sus suites de hojas reales/geometría.
     - `lane:grouping` (crítico): `group-engine.ts`, `group-result.ts`, `module-groups.ts` y márgenes globales.
     - `lane:pricing-db` (crítico): `cotizar.ts`, `cotizaciones.ts`, `diseno.ts`, `admin.ts`, `db/migrations/**` y versiones.
     - `lane:auth-rls` (crítico): `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/supabase/**` y rutas de autenticación/recuperación.
     - `lane:visualization`: `visualizacion.ts`, `visualizacion-config.ts`, `MuebleVisualizer.tsx`.
     - `lane:proposals-export`: plantillas CEMA/FIRPLAK, vistas imprimibles, export Excel y HDR.
     - `lane:frontend`: App Router, componentes UI, `simuladorStore.ts` y tooltips.
     - `lane:core-transversal` (crítico, `escalatesToFull: true`): `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `quality/**`, `scripts/quality/**`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` y skills sincronizados.
   - **Regla de seguridad**: cualquier archivo productivo que no coincida con ningún lane se clasifica como huérfano y **escala automáticamente a `FULL`**.

2. **Invocación Universal Multi-IDE (`/desplegar`)**:
   - **Fuente canónica única**: `.agents/skills/desplegar/SKILL.md` (frontmatter YAML estándar: solo `name` y `description`).
   - **Sincronización determinista sin symlinks** (`scripts/quality/skills-sync.ts`):
     - `npm run skills:sync` replica hacia `.claude/skills/desplegar/SKILL.md` (Claude Code), `.agents/workflows/desplegar.md` (Antigravity), `.cursor/rules/desplegar.mdc` (Cursor), `.agents/AGENTS.md` y `.cursor/rules/agents.mdc`.
     - `npm run skills:check` detecta cualquier drift o symlink prohibido.
     - `npm run skills:validate` valida frontmatter estándar, cláusulas obligatorias y referencias en `AGENTS.md`, `CLAUDE.md` y `GEMINI.md`.

3. **Estados Verificables Explícitos y Recibos**:
   - Cada etapa (`quality:policy`, `skills:check`, `typecheck`, `lint`, `tests`, `build:next`) registra un estado explícito en `.tmp/quality/run-receipt.json` (y espejo `.tmp/quality/last-run.json`): `VERIFIED`, `FAILED`, `SKIPPED` o `NOT_CONFIGURED`.
   - Si cualquier etapa marcada como `required: true` termina en `FAILED`, `SKIPPED` o `NOT_CONFIGURED`, la compuerta falla (`exit 1`). Está prohibido falsear verdes.

4. **Política de No Regresión (`scripts/quality/policy.ts`)**:
   - Bloquea `.skip`, `.todo`, `.only` y opciones `{ skip/todo/only: true }` en `tests/*.test.ts`.
   - Bloquea archivos de prueba eliminados o reducción del número de casos `test(...)` respecto a `HEAD`.
   - Bloquea incrementos en `docs/quality/baseline.json`.
   - Bloquea nuevos `exclude` en `tsconfig.json` o `globalIgnores` en `eslint.config.mjs`.
   - Verifica integridad de `quality/manifest.json` (cero rutas rotas y cero suites activas huérfanas).

5. **Línea Base y Trinquete (`docs/quality/baseline.json`)**:
   - Congela deuda histórica permitida (0 errores de TypeScript, 36 errores de ESLint heredados en 4 archivos de `src/lib/`, 0 tests fallidos).
   - Regla inviolable: $\text{Errores Nuevos} = 0 \;\land\; \text{Errores Totales} \le \text{Errores Baseline}$.
   - `npm run quality:baseline:update` solo admite reducciones verificadas de deuda.

6. **Auditoría Consultiva Continua (`scripts/quality/learn.ts`)**:
   - Estrictamente consultivo: nunca modifica código, pruebas ni baselines.
   - Cruza `git diff` + `quality/manifest.json` + `.tmp/quality/run-receipt.json` y genera `.tmp/quality/learning-report.md` y `.tmp/quality/learn-report.json`.
   - Reporta brechas de mapeo, cobertura, riesgo arquitectónico, rendimiento/latencia y commits pendientes de traer desde `origin/DEV`.
   - Todo hallazgo `HIGH` bloquea el cierre de entrega hasta resolverse o justificarse técnicamente.

---

## 2. Modos de `/desplegar` y Comandos

| Invocación / Comando | Propósito |
| :--- | :--- |
| `npm run test:focused -- <archivo>` | Nivel 1 en desarrollo: corre una o más suites puntuales en milisegundos. |
| `/desplegar` (sin argumentos) | Flujo completo directo sin preguntas: trae/integra primero `origin/DEV` → calidad completa + correcciones → commit/push rama actual → merge y validación en `DEV` → merge a `main` + verificación en Vercel → reporte final. |
| `/desplegar plan` / `npm run quality:plan` | Analiza diff, capacidades afectadas, huérfanos y si escala a `FULL` (costo 0, solo lectura). |
| `/desplegar impact` / `npm run quality:impact` | Política + `skills:check` + pruebas de las capacidades tocadas. Tras exit 0 ejecuta `quality:learn`. |
| `/desplegar quick` / `npm run quality:quick` | Alias ágil local: política + `skills:check` + `typecheck` + pruebas de impacto. Tras exit 0 ejecuta `quality:learn`. |
| `/desplegar gate` / `npm run quality:gate` | Compuerta conservadora con auto-escalamiento a `FULL` + `typecheck` + `lint` bajo trinquete + pruebas. Tras exit 0 ejecuta `quality:learn`. |
| `/desplegar full` / `npm run quality:full` | Suite exhaustiva completa + `npm run build` sin bypass. Tras exit 0 ejecuta `quality:learn`. |
| `/desplegar learn` / `npm run quality:learn` | Diagnóstico consultivo escrito en `.tmp/quality/learning-report.md`. |
| `/desplegar release` | Flujo local completo sin GitHub Actions: sincronizar/evaluar `origin/DEV` primero → `quality:full` + `quality:learn` → commit/push a rama actual → merge y validación en `DEV` → merge a `main` verificando despliegue en Vercel. |
| `npm run quality:policy` | Verifica exclusivamente la política de no regresión. |
| `npm run quality:baseline:update` | Congela disminuciones verificadas de deuda técnica. |
| `npm run skills:sync` / `skills:check` / `skills:validate` | Sincroniza y valida `.agents/skills/desplegar/SKILL.md` y `AGENTS.md` hacia todos los IDEs. |

---

## 3. Cómo Mantener el Manifiesto y los Skills

1. **Al crear un módulo productivo nuevo** en `src/` o una migración en `db/migrations/`:
   - Verifica que quede cubierto por un patrón de `quality/manifest.json` (si no, `quality:plan` lo marcará huérfano y escalará a `FULL`).
   - Agrega su prueba en `tests/*.test.ts` y regístrala en `patterns` y `tests` del lane correspondiente.
2. **Al actualizar el protocolo `/desplegar` o las reglas globales**:
   - Edita únicamente las fuentes canónicas: `.agents/skills/desplegar/SKILL.md` o `AGENTS.md`.
   - Ejecuta `npm run skills:sync && npm run skills:validate && npm run skills:check`.
3. **Sin Docker**:
   - Toda la suite corre 100 % offline con `tsx --test` (`node:test`) sobre fixtures y mocks en ~2 segundos; no requiere contenedores ni BD local.
