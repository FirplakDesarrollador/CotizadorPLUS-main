---
description: Ejecuta el flujo completo del sistema de calidad por impacto, validando desde el plan y trinquete (gate) hasta la auditoría continua (learn).
---

# Workflow: Sistema de Calidad y Trinquete (/quality)

Este workflow guía el ciclo de validación obligatorio de calidad previo a cualquier commit, PR o entrega de código, garantizando cero regresiones mediante análisis de impacto, trinquete de deuda (*Ratchet*) y auditoría consultiva.

---

## Pasos Operativos

### 1. Planificación de Impacto (Costo 0)
Inspecciona el `git diff` actual para determinar qué capacidades (*lanes*) fueron modificadas y qué pruebas corresponden.

```powershell
npm run quality:plan
```

* **Evaluación**:
  - Si el diagnóstico indica impacto segmentado (ej. `lane:grouping` o `lane:pricing-db`), el gate validará solo esas pruebas.
  - Si indica `lane:core-transversal` o archivos huérfanos, escalará automáticamente a la suite completa.
  - Si el árbol está limpio (`git status`), no se requieren pruebas de impacto.

---

### 2. Validación de Compuerta (Quality Gate)
Ejecuta la verificación estricta de trinquete (Typescript `tsc` + ESLint `eslint` + Tests Unitarios).

* **Para cambios locales / pre-commit**:
```powershell
npm run quality:gate
```

* **Para releases, cambios transversales o merges hacia DEV/main**:
```powershell
npm run quality:gate:full
```

> [!CAUTION]
> El comando debe terminar obligatoriamente con **exit code 0**.
> Si falla:
> 1. Revisa la violación reportada (`[REGRESIÓN]`, `[TRINQUETE LINTER]` o `[TRINQUETE TYPESCRIPT]`).
> 2. Corrige el código de producción. **PROHIBIDO usar `.skip` o relajar aserciones**.
> 3. Vuelve a ejecutar este paso hasta obtener aprobación verde.

---

### 3. Auditoría Consultiva y Aprendizaje (Quality Learn)
Audita la última corrida, analiza latencias y detecta posibles brechas de cobertura o diseño arquitectónico.

```powershell
npm run quality:learn
```

* **Criterio de Resolución Obligatorio**:
  - Revisa el reporte en `.tmp/quality/learn-report.json`.
  - Si existen hallazgos de severidad `HIGH` (ej: nueva lógica en `src/lib/` sin test unitario asociado), **no se puede dar por concluida la tarea** sin crear la prueba correspondiente o justificar técnicamente la excepción.

---

### 4. Actualización de Línea Base (Ratchet Update - Opcional)
Si la tarea limpió deuda técnica histórica (por ejemplo, se eliminaron errores de `any` en el linter o se arregló uno de los 4 tests históricamente fallidos):

```powershell
npm run quality:baseline:update
```

> [!NOTE]
> El script valida que la deuda total **solo disminuya**. Nunca permitirá inflar el número de errores permitidos.

---

### 5. Resumen de Salida
Reporta al usuario de forma sintética:
- Capacidades / lanes validados.
- Estado de la compuerta de trinquete (exit code 0).
- Estado del diagnóstico consultivo de `quality:learn`.
