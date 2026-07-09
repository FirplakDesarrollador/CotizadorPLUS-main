<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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

Este flujo de trabajo define los pasos exactos a seguir para garantizar que la base de conocimiento (WikiLLM) se mantenga estructurada, actualizada y coherente, cumpliendo con las directrices del proyecto. Puede ser invocado al añadir nuevos componentes, refactorizar partes clave o simplemente al querer documentar algo nuevo.

### 1. Fase de Evaluación
**Identificar el tipo de acción:** ¿Se trata de una nueva ingestión de conocimiento, una actualización de una funcionalidad existente, o una revisión de salud (lint)?

### 2. Ejecución según la Acción

#### A. Ingestión (Nueva Información)
1. **Analizar la fuente:** Lee y procesa el nuevo documento (desde `raw/`) o la nueva información descubierta en el código.
2. **Sintetizar:** Extrae los conceptos clave, arquitectura o patrones de diseño relevantes.
3. **Crear / Actualizar:** Escribe un nuevo documento Markdown en `WikiLLM/wiki/` (o actualiza de forma sustancial uno existente) con la información sintetizada.
4. **Registrar en el Índice:** Agrega la nueva página bajo la categoría correspondiente en `WikiLLM/index.md` con su enlace relativo y una breve descripción (ej. `- [Título](wiki/nombre.md) - Descripción`).
5. **Log de Actividad:** Añade una entrada al final de `WikiLLM/log.md` usando el formato `## [YYYY-MM-DD] ingest | <Descripción corta>`.

#### B. Actualización (Cambios o Correcciones)
1. **Identificar archivo afectado:** Busca en `WikiLLM/wiki/` la página que documenta la funcionalidad que acaba de ser modificada.
2. **Modificar contenido:** Actualiza la información para reflejar el nuevo estado de la aplicación, eliminando detalles, rutas o lógicas obsoletas.
3. **Log de Actividad:** Añade una entrada al final de `WikiLLM/log.md` usando el formato `## [YYYY-MM-DD] update | <Descripción del cambio>`. *(No modifiques index.md a menos que el nombre o propósito de la página haya cambiado radicalmente).*

#### C. Mantenimiento (Linting)
1. **Verificar enlaces:** Revisa que todos los enlaces en `WikiLLM/index.md` apunten a archivos `.md` existentes.
2. **Identificar huérfanos:** Busca archivos en `WikiLLM/wiki/` que no estén referenciados en `index.md` y agrégalos.
3. **Resolver conflictos:** Verifica y corrige posibles contradicciones leyendo e iterando a través de los distintos documentos de la wiki.
4. **Log de Actividad:** Añade una entrada al final de `WikiLLM/log.md` usando el formato `## [YYYY-MM-DD] lint | <Resumen de problemas arreglados>`.

### 3. Verificación Final
- Asegurarse de que no se haya modificado ningún archivo dentro de `WikiLLM/raw/` (son de solo lectura).
- Comprobar que todas las referencias cruzadas entre páginas usen rutas relativas adecuadas.
- Validar que el formato se mantenga técnico, conciso y libre de fragmentos excesivamente grandes de código puro (a menos que sean esenciales para explicar un patrón).

