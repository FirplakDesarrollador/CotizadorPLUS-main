---
name: Manage WikiLLM
description: Workflows, reglas y pasos estándar para ingerir nueva información, actualizar documentación existente y mantener el índice y log de la base de conocimiento WikiLLM.
---

# Manage WikiLLM Workflow

Esta skill define el proceso estricto para interactuar con el directorio `WikiLLM/` en este proyecto. WikiLLM es la base de conocimiento centralizada y es tu responsabilidad mantenerla impecable.

## 1. Cuándo activar esta skill
- Cuando descubres un nuevo patrón, resuelves un bug importante o implementas lógica fundamental de negocio de la app.
- Cuando el usuario te pide ingerir un nuevo documento o fuente de información.
- Tras crear o actualizar una funcionalidad core (para documentar su arquitectura o estado actual).

## 2. Ingest Workflow (Nueva Información o Documentos Raw)
Al ingerir conocimiento o un nuevo documento base:
1. **Analiza y Sintetiza:** Comprende la información nueva y extrae el "know-how" clave.
2. **Crea o Actualiza una Página Wiki:** Escribe un archivo markdown de síntesis en `WikiLLM/wiki/`. Usa encabezados claros. Haz referencia a los documentos raw de `WikiLLM/raw/` si aplica.
3. **Actualiza `index.md`:** 
   - Añade el enlace a la nueva página wiki bajo la categoría correcta en `WikiLLM/index.md`.
   - **Formato:** `- [Título](wiki/archivo.md) - Descripción corta.`
4. **Actualiza `log.md`:**
   - Añade una entrada **al final** del archivo `WikiLLM/log.md`.
   - **Formato:** `## [YYYY-MM-DD] ingest | Descripción corta de lo que se ingirió.`

## 3. Update Workflow (Tras Cambios de Código o Correcciones)
Cuando cambias o mejoras algo en la aplicación:
1. **Localiza la Página Relevante:** Encuentra el archivo en `WikiLLM/wiki/` que describe esa funcionalidad.
2. **Aplica los Cambios:** Actualiza el markdown para reflejar la realidad del sistema, eliminando flujos u operaciones obsoletas.
3. **Actualiza `log.md`:**
   - Añade una entrada **al final** de `WikiLLM/log.md`.
   - **Formato:** `## [YYYY-MM-DD] update | Descripción del cambio realizado.`
   - *Nota:* No hace falta modificar `index.md` a menos que hayas renombrado el archivo wiki o su propósito haya cambiado radicalmente.

## 4. Lint Workflow (Chequeo de Salud de la Wiki)
Cuando el usuario te pida revisar la wiki o como iniciativa propia de mantenimiento:
1. Asegúrate de que todos los enlaces en `index.md` dirigen a archivos que realmente existen en `WikiLLM/wiki/`.
2. Busca páginas huérfanas en `WikiLLM/wiki/` que no estén listadas en `index.md` y agrégalas.
3. Verifica contradicciones o información desactualizada entre páginas.
4. Registra la revisión en `log.md` usando: `## [YYYY-MM-DD] lint | Revisión de consistencia. Se encontraron/arreglaron X problemas.`

## Reglas Inquebrantables
- **Rutas:** Siempre usa rutas relativas al enlazar archivos dentro de la Wiki (ej. `wiki/mi_pagina.md` desde el index).
- **Inmutabilidad Raw:** NUNCA modifiques ni borres un archivo dentro de `WikiLLM/raw/`. Solo se leen.
- **Enfoque:** Las páginas de la wiki deben ser concisas, altamente técnicas y enfocadas en la síntesis. No pegues bloques inmensos de código a menos que sea un patrón arquitectónico crítico.
