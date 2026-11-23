<!-- AUTO-GENERATED from AGENTS.md via npm run skills:sync. Do not edit directly. -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Protocolo Universal `/desplegar` y Sistema de Calidad

Este repositorio cuenta con un sistema modular de calidad, trinquete de deuda histórica (*Ratchet*) y publicación local controlada. Su fuente canónica es `.agents/skills/desplegar/SKILL.md` (sincronizada determinísticamente hacia Claude Code, Antigravity y Cursor mediante `npm run skills:sync`).

## 1. Reconocimiento del Comando `/desplegar`

Cualquier agente o IDE (Claude Code, Codex, Antigravity, Gemini CLI, Cursor) debe leer y ejecutar exactamente `.agents/skills/desplegar/SKILL.md` cuando el usuario invoque `/desplegar`:

- `/desplegar` (sin argumentos — ejecución directa sin preguntas): trae e integra primero lo nuevo de `origin/DEV` en la rama actual → corre calidad (`plan` + `full` + `learn`), evaluando y corrigiendo hasta verde → commit y push a la rama actual → merge y validación en `DEV` → merge a `main` + verificación de despliegue en Vercel → reporte final.
- `/desplegar plan`: solo ejecuta `npm run quality:plan` (costo 0, no muta nada).
- `/desplegar impact`: ejecuta `npm run quality:impact`; si termina en exit 0, ejecuta `npm run quality:learn`.
- `/desplegar quick`: ejecuta `npm run quality:quick`; si termina en exit 0, ejecuta `npm run quality:learn`.
- `/desplegar gate`: ejecuta `npm run quality:gate` (escala automáticamente a `FULL` ante archivos huérfanos, cambios transversales o del harness); si termina en exit 0, ejecuta `npm run quality:learn`.
- `/desplegar full`: ejecuta `npm run quality:full` (cobertura exhaustiva incluyendo `npm run build`); si termina en exit 0, ejecuta `npm run quality:learn`.
- `/desplegar learn`: ejecuta `npm run quality:learn` (análisis estrictamente consultivo en `.tmp/quality/learning-report.md`).
- `/desplegar release`: alias explícito del flujo completo de `/desplegar`.

## 2. Comandos Operativos

- `npm run test:focused -- <archivo>`: pruebas enfocadas Nivel 1 durante desarrollo.
- `npm run quality:plan`: plan de impacto y detección de archivos huérfanos (costo 0).
- `npm run quality:policy`: política de no regresión (bloquea `.skip`/`.todo`, pruebas borradas, subidas de baseline y nuevos `exclude`).
- `npm run quality:impact`: validación modular de capacidades tocadas.
- `npm run quality:quick`: validación rápida (`policy` + `skills:check` + `typecheck` + pruebas de impacto).
- `npm run quality:gate`: compuerta conservadora por impacto + trinquete (con auto-escalamiento a `FULL`).
- `npm run quality:full` / `npm run quality:gate:full`: validación exhaustiva completa + `next build`.
- `npm run quality:learn`: auditoría consultiva (`.tmp/quality/learning-report.md` y `.tmp/quality/learn-report.json`).
- `npm run quality:baseline:update`: congela reducciones verificadas de deuda en `docs/quality/baseline.json`.
- `npm run skills:sync` / `npm run skills:check` / `npm run skills:validate`: sincronización y validación multi-IDE sin symlinks.

## 3. Reglas Inviolables de Gobernanza (Safe Change)

1. **Autorización estricta**: ningún agente puede ejecutar `impact`, `quick`, `gate`, `full`, `release` ni pruebas o acciones con coste/red externa sin autorización explícita del usuario (excepto `test:focused`, `quality:plan`, `quality:learn`, `skills:check` o cuando el usuario invoque directamente `/desplegar <modo>`).
2. **Estados verificables explícitos**: cada etapa reporta `VERIFIED`, `FAILED`, `SKIPPED` o `NOT_CONFIGURED`. Si una etapa requerida queda `SKIPPED` o `NOT_CONFIGURED`, el gate falla. Prohibido falsear verdes.
3. **Prohibido relajar aserciones o saltar pruebas**: prohibido usar `.skip`, `.todo`, `.only`, eliminar pruebas, añadir `exclude`/`globalIgnores` para esconder errores o debilitar aserciones.
4. **Trinquete de deuda inviolable**: `docs/quality/baseline.json` solo puede bajar deuda, jamás subirla.
5. **Gobernanza de `quality:learn`**: estrictamente consultivo (nunca edita código, pruebas ni baselines). Ninguna entrega se cierra con hallazgos `HIGH` sin resolver o justificar técnicamente.
6. **Sin GitHub Actions**: todo el ciclo de calidad y publicación se opera en local con verificación previa de `origin/DEV` y verificación final de Vercel.

---

# Reglas y Workflows de WikiLLM

## Schema de WikiLLM

Esta aplicación utiliza una base de conocimiento (Wiki) gestionada por el LLM en el directorio `WikiLLM/`, siguiendo la arquitectura descrita en https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f.

### Estructura
- `WikiLLM/raw/`: Fuentes crudas e inmutables (documentos, imágenes, pdfs).
- `WikiLLM/wiki/`: Archivos markdown generados y mantenidos por el LLM.
- `WikiLLM/index.md`: Catálogo y tabla de contenidos de la wiki.
- `WikiLLM/log.md`: Registro cronológico y bitácora de cambios en la wiki.

### Operaciones Obligatorias
Cada vez que realices una mejora, cambio, corrección o ingestión de información nueva sobre el funcionamiento de la app:
1. **Actualiza o Crea Páginas Wiki:** Ve a `WikiLLM/wiki/` y crea una nueva página Markdown o actualiza las existentes con la nueva síntesis o información técnica que hayas descubierto/implementado.
2. **Actualiza el Índice:** Añade la nueva página o actualiza la descripción en `WikiLLM/index.md`.
3. **Añade al Log:** Añade una entrada al final de `WikiLLM/log.md` usando el formato `## [YYYY-MM-DD] ingest/update | Descripción corta del cambio`.

Tu responsabilidad es mantener la wiki como una base de conocimiento coherente y actualizada, cruzando referencias entre archivos `.md` cuando sea útil.

---

## Workflow: Mantenimiento de WikiLLM

### 1. Fase de Evaluación
Identificar si se trata de una nueva ingestión de conocimiento, una actualización de funcionalidad existente o una revisión de salud (lint).

### 2. Ejecución según la Acción
- **Ingestión**: analiza la fuente -> sintetiza -> crea/actualiza en `WikiLLM/wiki/` -> registra en `WikiLLM/index.md` -> añade entrada `ingest` en `WikiLLM/log.md`.
- **Actualización**: identifica la página afectada en `WikiLLM/wiki/` -> actualiza reflejando el nuevo estado -> añade entrada `update` en `WikiLLM/log.md`.
- **Mantenimiento (Linting)**: verifica enlaces en `WikiLLM/index.md`, elimina huérfanos y contradicciones -> añade entrada `lint` en `WikiLLM/log.md`.

### 3. Verificación Final
- Nunca modificar archivos dentro de `WikiLLM/raw/` (son de solo lectura).
- Usar rutas relativas adecuadas y mantener formato técnico y conciso.
