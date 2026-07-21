# Índice de WikiLLM

Este es el catálogo de todo el conocimiento almacenado en la wiki.

## Entidades y Conceptos
- [Cotizador PLUS Overview](wiki/cotizador_plus_overview.md) - Descripción general de la aplicación Cotizador PLUS.
- [Agrupación de módulos](wiki/plan_agrupacion_modulos.md) - Reglas implementadas para fabricar, calcular, identificar y cotizar módulos unidos por grupos.

## Arquitectura Técnica
- [Motor de Cálculo](wiki/motor_calculo.md) - Algoritmo core, evaluación de reglas matemáticas e integración backend (`engine.ts` y `cotizar.ts`).
- [Arquitectura Frontend](wiki/arquitectura_frontend.md) - Rutas Next.js, gestión de estado Zustand y componentes de interfaz.
- [Sistema de Undo/Redo](wiki/sistema_undo_redo.md) - Historial temporal de estados, captura de atajos de teclado y notificaciones.

## Infraestructura de Datos
- [Esquema de Base de Datos](wiki/esquema_base_datos.md) - Estructura de tablas y políticas en Supabase (prefijo `cot_`).
- [Rieles de Cajón DB](wiki/rieles_db.md) - Catálogo de tipos de riel para muebles DB, mecanismo de override y archivos modificados.
- [Muebles esquineros ciegos BBL](wiki/muebles_bbl.md) - Análisis del Excel CEMA y plantillas paramétricas `BBLFD`/`BBL` disponibles en Supabase.

## Entorno de Desarrollo
- [Dependencias del Proyecto](wiki/dependencias_proyecto.md) - Stack tecnológico (Next.js, React, Zustand, Supabase client).

## Fuentes (Raw)
*(Aún no hay fuentes raw)*
