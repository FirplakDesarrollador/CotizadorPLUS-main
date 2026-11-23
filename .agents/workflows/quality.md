---
description: Alias heredado que redirige al protocolo universal /desplegar (.agents/skills/desplegar/SKILL.md).
---

# Workflow `/quality` (Alias de `/desplegar`)

Este workflow ha sido unificado en el protocolo canónico **`/desplegar`** definido en `.agents/skills/desplegar/SKILL.md`.

Lee y ejecuta exactamente `.agents/skills/desplegar/SKILL.md`:
- Sin argumentos → flujo completo directo (`/desplegar`: trae `origin/DEV`, corre calidad y correcciones, commit/push rama actual, merge `DEV`, merge `main` + verificación en Vercel).
- Con subcomando → `/desplegar plan | impact | quick | gate | full | learn | release`.
