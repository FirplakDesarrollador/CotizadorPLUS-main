# Schema de WikiLLM

Esta aplicación utiliza una base de conocimiento (Wiki) gestionada por el LLM en el directorio `WikiLLM/`, siguiendo la arquitectura descrita en https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f.

## Estructura
- `WikiLLM/raw/`: Fuentes crudas e inmutables (documentos, imágenes, pdfs).
- `WikiLLM/wiki/`: Archivos markdown generados y mantenidos por el LLM.
- `WikiLLM/index.md`: Catálogo y tabla de contenidos de la wiki.
- `WikiLLM/log.md`: Registro cronológico y bitácora de cambios en la wiki.

## Operaciones Obligatorias
Cada vez que realices una mejora, cambio, corrección o ingestión de información nueva sobre el funcionamiento de la app:
1. **Actualiza o Crea Páginas Wiki:** Ve a `WikiLLM/wiki/` y crea una nueva página Markdown o actualiza las existentes con la nueva síntesis o información técnica que hayas descubierto/implementado.
2. **Actualiza el Índice:** Añade la nueva página o actualiza la descripción en `WikiLLM/index.md`.
3. **Añade al Log:** Añade una entrada al final de `WikiLLM/log.md` usando el formato `## [YYYY-MM-DD] ingest/update | Descripción corta del cambio`.

Tu responsabilidad es mantener la wiki como una base de conocimiento coherente y actualizada, cruzando referencias entre archivos `.md` cuando sea útil.
