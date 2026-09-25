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
- [Cajoneras DB con gavetas mixtas](wiki/db_gavetas_mixtas.md) - Piezas diferenciadas por posición (pequeña/grande) para tipologías `DB-1S`/`DB-2S` y `DB2-1OP` (gaveta oculta interior), fórmulas de frentes exteriores/interiores y variables `n_cajones_pequenos`/`n_cajones_ocultos`.
- [Interpretación espacial DB en tres vistas](wiki/interpretacion_espacial_db.md) - Reconstrucción de siete referencias reales, nombres y planos de piezas, fórmulas contrastadas, gaveta interior y límites de las hipótesis de montaje.
- [Muebles esquineros ciegos BBL](wiki/muebles_bbl.md) - Análisis del Excel CEMA y plantillas paramétricas `BBLFD`/`BBL` disponibles en Supabase.
- [Torres PCFD con gavetas ocultas](wiki/muebles_pcfd_gavetas_ocultas.md) - Variantes `STANDARD`/`2OP`/`4OP`, fórmulas CEMA y uso paramétrico de cajones y entrepaños.
- [Variantes de frente Gola SM](wiki/variantes_frente_gola_sm.md) - Investigación de códigos `SM`/`SMG`, refuerzos por familia y modelo recomendado como opción transversal de frentes.
- [W2936-SM desde hoja real](wiki/w_sm_hoja_real.md) - Integracion verificada de `W` con sistema de frente `SM`: formulas condicionales, ausencia de manijas, HDR y carga en Supabase.
- [Codificación comercial de módulos](wiki/codificacion_comercial_modulos.md) - Fuente única `codigoComercial()`: orden de segmentos, qué tipos llevan el alto (familia W + PN) y sistema de medida por superficie.
- [Voladizo de la puerta con gola](wiki/visualizacion_gola_voladizo.md) - Por qué el sobrante de una puerta `SM` cuelga bajo la base en la visualización, y por qué en un mueble base tendría que ir arriba.
- [DB18-1S desde hoja real](wiki/db_hoja_real.md) - Cruce de  contra la hoja: la estructura ya era correcta; solo la base de gaveta estaba 0.1mm larga.
- [B12 desde hoja real](wiki/b_hoja_real.md) - Cruce de las 10 piezas de `B` contra la hoja de producción: tres medidas corregidas cuyo valor correcto ya estaba en las variantes FE.
- [Consumo de materiales: unidades y merma](wiki/consumo_materiales.md) - Tablero en m² y canto en metros lineales; por qué sus mermas son distintas y cómo se reconstruye el consumo desde el despiece.
- [Holgura de 1mm sobre la estructura](wiki/holgura_1mm_estructura.md) - Por qué entrepaños y fondos se cortan 1mm más pequeños, qué tipos ya la tenían y el alcance aplicado en `0049`.
- [Ejes del fondo (backing)](wiki/ejes_fondo_backing.md) - `largo`/`ancho` son ejes geométricos atados a `intercambiar`, no "el mayor primero": el defecto que giraba 90° el backing de `W` con gola y la auditoría de los 44 tipos.
- [Riesgos e incoherencias del Excel CEMA](wiki/riesgos_excel_cema.md) - Auditoría estructural del libro fuente: margen por fila, 10 filas que mezclan USD y COP, recargo quemado, doble fuente de canto y demás defectos a resolver antes de migrar.
- [Auditoría de precio SBFD30](wiki/auditoria_precio_sbfd30.md) - Conciliación Excel CEMA vs Cotizador PLUS: dónde viven margen/TRM en el Excel, efecto del `config_default` del proyecto sobre el preset, y método para correr `engine.ts` fuera de la app.
- [Validación contra hojas de ruta](wiki/validacion_hojas_de_ruta.md) - Estudio de 1.937 hojas de ruta reales: DSL de fórmulas de producción, constante interior por espesor, reglas de reparto de frentes DB, modificadores transversales (`O`/`R`/`SM`/`F9`), tipologías sin mapear y errores detectados en la fuente.
- [Auditoría del catálogo activo](wiki/auditoria_catalogo_activo.md) - Barrido end-to-end de los 60 tipos activos con el motor real: dimensiones negativas que restaban tablero, 20 tipos que cotizan sin herrajes, herrajes duplicados en UW y qué anomalías son falsos positivos.
- [Cadena de precio: Excel CEMA vs. app](wiki/cadena_precio_excel_vs_app.md) - Correspondencia fórmula por fórmula de la hoja `Precio` contra `engine.ts`/`cotizar.ts`: parámetros de la columna T, recargo del 10% de CEMA, márgenes equivalentes y defectos de ambos lados.

- [Patron para integrar nuevas tipologias](wiki/patron_integracion_tipologias.md) - Protocolo permanente basado en `B-FE`: crear tipos independientes desde hojas reales, validar geometria/precio, respetar codigos comerciales y documentar migraciones.
- [Visualización y agrupación de familias FE](wiki/visualizacion_familias_fe.md) - Corrección geométrica 3D (fondo de gaveta, frentes mixtos y cajón superior) y homologación continua para B-FE, UB-FE y V-FE.

## Entorno de Desarrollo
- [Dependencias del Proyecto](wiki/dependencias_proyecto.md) - Stack tecnológico (Next.js, React, Zustand, Supabase client).

## Fuentes (Raw)
*(Aún no hay fuentes raw)*

- [Comparación PRUEBA 1](wiki/comparacion_prueba1.md) - Consumos del listado frente a plantillas vigentes, diferencias e inconsistencia DB19-1s/DB12-1s.
