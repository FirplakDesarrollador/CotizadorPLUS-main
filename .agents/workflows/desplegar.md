---
description: Ejecuta el ciclo completo local de calidad y publicación (sincronizar DEV, validar/corregir calidad, commit y push a rama actual, merge a DEV, merge a main y verificación en Vercel), más subcomandos modulares de calidad.
---

<!-- AUTO-GENERATED from .agents/skills/desplegar/SKILL.md via npm run skills:sync. Do not edit directly. -->

# Protocolo Universal `/desplegar`

Este documento en `.agents/skills/desplegar/SKILL.md` es la **fuente canónica única** del sistema de calidad e ingeniería de cambio seguro de **Cotizador PLUS**. Cualquier agente o IDE (Antigravity, Claude Code, Codex, Gemini CLI, Cursor) debe ejecutar exactamente el mismo protocolo.

---

## 1. Regla de Autorización

- **Invocar `/desplegar` ES la autorización explícita**: no preguntes ni te detengas a pedir confirmación; ejecuta el flujo completo de principio a fin.
- **Sin invocación de `/desplegar`** (trabajo normal de desarrollo):
  - Permitido libremente: `npm run test:focused -- <archivo>`, `npm run quality:plan`, `npm run quality:learn`, `npm run skills:check`, `npm run skills:validate`, `git status`, `git diff`, `git log`.
  - Prohibido sin orden del usuario: correr `impact`, `quick`, `gate`, `full`, commits, push, merges o despliegues espontáneamente.

---

## 2. Flujo Principal: `/desplegar` (sin argumentos — Ejecución Directa Completa)

Todo se opera en **local** (sin GitHub Actions), usando las herramientas de calidad con criterio y **sin detenerse a preguntar**:

1. **Traer e integrar primero lo nuevo de `DEV`**:
   - Ejecuta `git fetch origin`.
   - Detecta dinámicamente la rama de trabajo actual (`git rev-parse --abbrev-ref HEAD`); nunca la hardcodees.
   - Revisa qué commits están esperando en `origin/DEV` (`git log --oneline HEAD..origin/DEV` y `git diff --stat HEAD...origin/DEV`).
   - Integra `origin/DEV` en la rama de trabajo actual (guardando/commiteando primero cambios locales si hace falta para un merge limpio), evalúa las funcionalidades entrantes y resuelve cualquier conflicto o archivo nuevo sin mapear en `quality/manifest.json`.
2. **Correr el flujo de calidad, evaluar y corregir**:
   - Ejecuta `npm run quality:plan` para revisar el impacto real y verificar `0` archivos huérfanos productivos.
   - Ejecuta `npm run quality:full` (política de no regresión + `skills:check` + `typecheck` + `lint` bajo trinquete + suite completa + `npm run build`, sin bypass).
   - Ejecuta `npm run quality:learn` y revisa `.tmp/quality/learning-report.md`.
   - **Si algo falla o hay hallazgos `HIGH`**: corrige el código/manifiesto/pruebas (nunca con `.skip`, borrando tests ni inflando `baseline.json`), ejecuta `npm run skills:sync` si cambiaron skills, y repite hasta lograr `exit 0` y `HIGH=0`.
   - Si se redujo deuda histórica de forma verificada, ejecuta `npm run quality:baseline:update`.
3. **Commit y push en la rama de trabajo actual**:
   - Consolida todos los cambios validados con un commit claro y ejecuta `git push origin <rama-actual>`.
4. **Merge a `DEV` con validaciones**:
   - Actualiza la rama local `DEV` desde `origin/DEV`, integra `<rama-actual>` en `DEV`, revalida que el árbol integrado esté sano (`npm run quality:full` + `npm run quality:learn` si hubo merge no trivial) y ejecuta `git push origin DEV`.
5. **Merge a `main` y verificación de despliegue en Vercel**:
   - Actualiza `main` desde `origin/main`, integra `DEV` en `main` y ejecuta `git push origin main`.
   - Verifica el estado del despliegue en Vercel (vía GitHub statuses/deployments del commit de `main` o CLI de Vercel) hasta confirmar estado `success`/`READY`.
   - Si Vercel falla, corrige en la rama de trabajo y repite desde el paso 2 antes de dar el despliegue por cerrado.
6. **Sincronización final y reporte**:
   - Regresa a `<rama-actual>` y entrega el **Reporte Final Estandarizado** con todo lo realizado.

---

## 3. Subcomandos Modulares (opcionales para fases específicas)

- **`/desplegar plan`**: ejecuta únicamente `npm run quality:plan` (costo 0, no muta nada).
- **`/desplegar impact`**: ejecuta `npm run quality:impact`; si exit 0, corre `npm run quality:learn`.
- **`/desplegar quick`**: validación local ágil (`npm run quality:quick`: `policy` + `skills:check` + `typecheck` + pruebas de impacto); si exit 0, corre `npm run quality:learn`.
- **`/desplegar gate`**: compuerta conservadora por impacto (`npm run quality:gate`, con escalamiento automático a `FULL` por huérfanos/transversales/harness); si exit 0, corre `npm run quality:learn`.
- **`/desplegar full`**: cobertura exhaustiva (`npm run quality:full` incluyendo `npm run build` sin bypass); si exit 0, corre `npm run quality:learn`.
- **`/desplegar learn`**: ejecuta `npm run quality:learn` (estrictamente consultivo en `.tmp/quality/learning-report.md`).
- **`/desplegar release`**: alias explícito del flujo completo de `/desplegar` (Sección 2).

---

## 4. Salvaguardas e Invariantes del Motor

- **Estados verificables explícitos por etapa**: `VERIFIED`, `FAILED`, `SKIPPED`, `NOT_CONFIGURED`.
  - Si cualquier etapa requerida termina en `FAILED`, `SKIPPED` o `NOT_CONFIGURED`, la compuerta falla (`exit 1`). Prohibido falsear verdes.
- **Política de no regresión (`npm run quality:policy`)**:
  - Prohíbe `.skip`, `.todo`, `.only`, pruebas eliminadas o recortadas, subidas de deuda en `docs/quality/baseline.json`, nuevos `exclude`/`globalIgnores` en `tsconfig.json`/`eslint.config.mjs` y referencias rotas o tests huérfanos en `quality/manifest.json`.
- **Trinquete de deuda (Ratchet)**:
  - `docs/quality/baseline.json` congela la deuda histórica permitida. La deuda solo puede bajar (`npm run quality:baseline:update`), nunca subir.
- **Desarrollo iterativo (Nivel 1)**:
  - Durante desarrollo usa `npm run test:focused -- <archivo>` para retroalimentación inmediata.

---

## 5. Reporte Final Estandarizado

Al finalizar cualquier invocación de `/desplegar`, entrega siempre este resumen sintético:

```markdown
### Reporte `/desplegar`
- **Modo solicitado / efectivo**: `<solicitado>` → `<efectivo>` (Escalado a FULL: `Sí/No` + motivo)
- **Rama y sincronización DEV**: `<rama>` (commits integrados desde `origin/DEV`: `<N>`)
- **Capacidades afectadas**: `<lista de lanes>`
- **Etapas ejecutadas**:
  - `quality:policy`: `<ESTADO>` (exit `<código>`)
  - `skills:check`: `<ESTADO>` (exit `<código>`)
  - `typecheck`: `<ESTADO>` (exit `<código>`)
  - `lint`: `<ESTADO>` (exit `<código>`)
  - `tests`: `<ESTADO>` (`<pass>/<total>`, exit `<código>`)
  - `build:next`: `<ESTADO>` (exit `<código>`)
- **Resultado `quality:learn`**: `HIGH=<n> | MEDIUM=<n> | LOW=<n>` (`.tmp/quality/learning-report.md`)
- **Correcciones aplicadas**: `<resumen breve o "Ninguna">`
- **No regresión confirmada**: `Sí/No` (sin `.skip`/`.todo`, sin borrados de pruebas, sin subida de baseline ni nuevos `exclude`)
- **Estado Git / Vercel**: `rama=<sha>`, `DEV=<sha>`, `main=<sha>`, `Vercel=<READY/success>`
```
