# Índice de WikiLLM

Este es el catálogo de todo el conocimiento almacenado en la wiki.

## Entidades y Conceptos
- [Cotizador PLUS Overview](wiki/cotizador_plus_overview.md) - Descripción general de la aplicación Cotizador PLUS.
- [Agrupación de módulos](wiki/plan_agrupacion_modulos.md) - Reglas para fabricar, calcular, simular, identificar y cotizar módulos unidos por grupos.

## Arquitectura Técnica
- [Motor de Cálculo](wiki/motor_calculo.md) - Algoritmo core, evaluación de reglas matemáticas e integración backend (`engine.ts` y `cotizar.ts`).
- [Arquitectura Frontend](wiki/arquitectura_frontend.md) - Rutas Next.js, gestión de estado Zustand y componentes de interfaz.
- [Sistema de Undo/Redo](wiki/sistema_undo_redo.md) - Historial temporal de estados, captura de atajos de teclado y notificaciones.
- [Versiones de cotizaciones](wiki/versiones_cotizaciones.md) - Snapshots persistentes, numeración, restauración transaccional y respaldo automático.

## Infraestructura de Datos
- [Esquema de Base de Datos](wiki/esquema_base_datos.md) - Estructura de tablas y políticas en Supabase (prefijo `cot_`).
- [Rieles de Cajón DB](wiki/rieles_db.md) - Catálogo de tipos de riel para muebles DB, mecanismo de override y archivos modificados.
- [Cajoneras DB con gavetas mixtas](wiki/db_gavetas_mixtas.md) - Piezas diferenciadas por posición (pequeña/grande) para tipologías `DB-1S`/`DB-2S`, fórmulas de frente/trasero de gaveta y variable `n_cajones_pequenos`.
- [Interpretación espacial DB en tres vistas](wiki/interpretacion_espacial_db.md) - Reconstrucción de siete referencias reales, nombres y planos de piezas, fórmulas contrastadas, gaveta interior y límites de las hipótesis de montaje.
- [Muebles esquineros ciegos BBL](wiki/muebles_bbl.md) - Análisis del Excel CEMA y plantillas paramétricas `BBLFD`/`BBL` disponibles en Supabase.
- [Torres PCFD con gavetas ocultas](wiki/muebles_pcfd_gavetas_ocultas.md) - Variantes `STANDARD`/`2OP`/`4OP`, fórmulas CEMA y uso paramétrico de cajones y entrepaños.
- [Variantes de frente Gola SM](wiki/variantes_frente_gola_sm.md) - Investigación de códigos `SM`/`SMG`, refuerzos por familia y modelo recomendado como opción transversal de frentes.
- [Validación contra hojas de ruta](wiki/validacion_hojas_de_ruta.md) - Estudio de 1.937 hojas de ruta reales: DSL de fórmulas de producción, constante interior por espesor, reglas de reparto de frentes DB, modificadores transversales (`O`/`R`/`SM`/`F9`), tipologías sin mapear y errores detectados en la fuente.
- [Cadena de precio: Excel CEMA vs. app](wiki/cadena_precio_excel_vs_app.md) - Correspondencia fórmula por fórmula de la hoja `Precio` contra `engine.ts`/`cotizar.ts`: parámetros de la columna T, recargo del 10% de CEMA, márgenes equivalentes y defectos de ambos lados.

## Entorno de Desarrollo
- [Dependencias del Proyecto](wiki/dependencias_proyecto.md) - Stack tecnológico (Next.js, React, Zustand, Supabase client).

## Fuentes (Raw)
*(Aún no hay fuentes raw)*
