# Instrucciones para Gemini CLI y Modelos Gemini

Sigue íntegramente las instrucciones canónicas definidas en `AGENTS.md` y el protocolo universal `/desplegar` definido en `.agents/skills/desplegar/SKILL.md`.

## Resumen obligatorio
- **Reglas del repositorio**: ver `AGENTS.md` (Next.js, sistema modular de calidad, trinquete de deuda, WikiLLM).
- **Comando `/desplegar`**: al recibir `/desplegar` (sin argumentos ejecuta el flujo completo sin preguntar: traer `origin/DEV` → calidad/correcciones → commit/push rama actual → merge `DEV` → merge `main` + verificación Vercel; también acepta `plan`, `impact`, `quick`, `gate`, `full`, `learn`, `release`), lee y ejecuta estrictamente `.agents/skills/desplegar/SKILL.md`.
- **Autorización**: invocar `/desplegar` es autorización directa; fuera de `/desplegar`, no ejecutes `impact`, `quick`, `gate`, `full` ni operaciones git/red sin orden del usuario.
- **Sincronización**: tras modificar `.agents/skills/desplegar/SKILL.md` o `AGENTS.md`, ejecuta `npm run skills:sync` y verifica con `npm run skills:check` y `npm run skills:validate`.
