# Índice de WikiLLM

Este es el catálogo de todo el conocimiento almacenado en la wiki.

## Entidades y Conceptos
- [Cotizador PLUS Overview](wiki/cotizador_plus_overview.md) - Descripción general de la aplicación Cotizador PLUS.
- [Agrupación de módulos](wiki/plan_agrupacion_modulos.md) - Reglas para fabricar, calcular, simular, identificar y cotizar módulos unidos por grupos.

## Arquitectura Técnica
- [HDR: Buscar/Crear y Seguimiento](wiki/hdr_buscar_seguimiento.md) - Búsqueda por nombre en cotizaciones, secciones reorganizadas y plantilla Excel manual de Seguimiento/Códigos sin cantidades.
- [Apertura L/R de superiores de una puerta](wiki/apertura_superiores_una_puerta.md) - Selección obligatoria en W-SM/WLD/WSM, sufijo comercial y alerta para 26 muebles existentes sin apertura.
- [Instrucciones R…L en HDR](wiki/hdr_instrucciones_ranura.md) - Indicaciones de carcasa con fondo por familia/espesor y cuatro nombres de gavetas FE, sin cambios geométricos.
- [BOV interno y BOV-SMG](wiki/bov_frente_interno_smg.md) - Frente interno sin holguras, base hasta el refuerzo, 73 mm superiores en SMG y conversión verificada de Condominio V.
- [Materiales delgados sin canto](wiki/cantos_por_espesor.md) - Regla universal por espesor real de 4,5/5,5/6/9 mm, sin calibre ni costo; recálculo y protección de resultados históricos.
- [HDR consolidada y Excel continuo](wiki/hdr_excel_consolidado.md) - Cantidades editables, módulos repetidos entre áreas, tabla Excel y excepciones DB/DB-FE de la migración 0249.
- [Consumos en la página HDR](wiki/hdr_consumos.md) - Selector de cotización propio, buscador de muebles, desperdicio de tablero sobre la medida neta, cantidad editable por mueble (por defecto 1) y consumo discriminado por rol y código de tablero (m²), calibre de canto (m lineal) y consumible (unidades), reconciliado fila a fila con la tabla Materiales del Simulador, con conteo de muebles, unidades y piezas.
- [Puertas, orientación y cantos de carcasa](wiki/puertas_cantos_orientacion.md) - Umbral en tres unidades, ejes de frentes, cantos solo en largos, migración 0248 y recálculo verificado.
- [Tablero Gaveta de 15 mm en DB](wiki/tablero_gaveta_db.md) - Material separado en simulador y cotizaciones, referencias elegibles de rieles y barras, aplicación histórica y auditoría.
- [Pipeline CEFI y cotizaciones](wiki/pipeline_cotizaciones.md) - Registro con opción Desconocido, referencias navegables de Cotizador PLUS, oportunidades con RLS, importación histórica y dashboard único.
- [Ayuda, valores y desarrollo](wiki/ayuda_valores_y_desarrollo.md) - Guías contextuales en el encabezado, resumen financiero privado, estado En desarrollo con avisos Resend y compatibilidad de materiales al agrupar módulos.
- [DB-FE paramétrica](wiki/db_fe.md) - Copia de la DB vigente con cajas de gaveta FE y riel RIELFE500; seis variantes internas, persistencia y pruebas.
- [Ordenar secciones de una cotización](wiki/orden_secciones_cotizacion.md) - Arrastre y flechas para cocinas, closets y baños; persistencia atómica, permisos, manejo de errores y orden en el resumen PDF/Excel.
- [Fondos del color del frente en abiertos](wiki/fondos_color_abiertos.md) - Alcance OW y otros abiertos, fondo real de 6 mm, validación de catálogo, consumo/costo y evidencia del OW de ELEVEN.
- [Inferiores B, OW-MO y programación opcional](wiki/inferiores_b_ow_mo_programacion_pdf.md) - Dimensiones variables en códigos B, fondo de OW-MO del color del frente e interruptor persistido de programación FIRPLAK/CEMA y aplicación a cotizaciones existentes.
- [Material de tipologías abiertas](wiki/materiales_tipologias_abiertas.md) - OBFD, OBFD-SM, OSBFD-SM y OW usan el frente global en caja/refuerzos; aplicación histórica limitada, respaldo y recálculo.
- [Reglas de fabricación y edición individual](wiki/reglas_fabricacion_y_edicion_individual.md) - Profundidades de entrepaños y excepciones B, canto de frente en abiertos, selecciones individuales persistentes y dimensiones no estándar en códigos DB.
- [Frentes DB-2S con gola SM/SMG](wiki/frentes_db_2s_gola.md) - Dos golas de 30 mm, reparto de dos frentes pequeños y uno grande, variantes FE/SF, aplicación a cotizaciones y ejemplos de 780/785 mm.
- [Nombres comerciales y paneles PN](wiki/nombres_comerciales_modulos.md) - Dimensiones no estándar, PN con sufijo de 15 mm según frente, nombres con notas y reconstrucción consistente en simulador, cotizaciones, HDR y exportaciones.
- [Cálculos automáticos del catálogo de tableros](wiki/calculos_automaticos_catalogo_tableros.md) - Área derivada del formato y sincronización bidireccional entre precio y precio por m² en altas y ediciones de tableros.
- [Mejora de UX en tabla de catálogos](wiki/ux_catalogo_materiales_parametros.md) - Barra de scroll horizontal visible, columna sticky, editor inline responsivo y adaptado sin scroll, y acciones de fila accesibles.
- [Descripción de una línea contra el despiece](wiki/descripcion_linea_vs_despiece.md) - Por qué `n_entrepanos` no describe el mueble: 47 de 81 tipos no coincidían, y la deuda equivalente en puertas y gavetas.
- [Líneas de material suelto](wiki/lineas_material_suelto.md) - Tablero, canto o herraje cobrados sin módulo: unidades, margen por tipo, clasificación en Herrajes / otros del PDF y exclusión en HDR y Optimizador.
- [Protocolo de cotizaciones y PDF](wiki/protocolo_pdf_cotizaciones.md) - Clasificación y agrupación de adicionales sin precios en el detalle, materiales por área closet, reparación histórica y doble verificación de impresión.
- [Motor de Cálculo](wiki/motor_calculo.md) - Algoritmo core, reglas matemáticas, consumibles, soportes por entrepaño, cálculo grupal y recálculo masivo por lotes con precarga de catálogo (`engine.ts` y `cotizar.ts`).
- [Optimizador de corte](wiki/optimizador_corte.md) - Plan de corte de una cotización: condiciones de planta, lista de piezas, plan día por día, esquemas de corte con desperdicio, m², tableros y número de cortes, y fases pendientes. Incluye comparación con repositorios de GitHub (packingsolver, OpenCutList, gdrr-2bp).
- [Arquitectura Frontend](wiki/arquitectura_frontend.md) - Rutas Next.js, encabezado y menú de usuario, Zustand, cotizaciones con constructora/comprador, materiales, herrajes, unidades, dimensiones y búsqueda por color.
- [Sistema de Undo/Redo](wiki/sistema_undo_redo.md) - Historial temporal de estados, captura de atajos de teclado y notificaciones.
- [Versiones de cotizaciones](wiki/versiones_cotizaciones.md) - Snapshots persistentes manuales, inmutables, nombre obligatorio, orden cronológico y restauración transaccional limpia sin respaldos automáticos.
- [Plantilla de propuesta CEMA](wiki/plantilla_propuesta_cema.md) - Selección automática, campos precargados/editables, persistencia y composición imprimible basada en la propuesta comercial CEMA.
- [Sistema de Calidad y Trinquete (Ratchet)](wiki/sistema_calidad_ratchet.md) - Sistema de calidad modular basado en impacto (lanes), compuerta de trinquete de deuda (Ratchet) y módulo consultivo continuo quality:learn.

## Infraestructura de Datos

- [Preferencias de herrajes y BOV](wiki/preferencias_herrajes_bov.md) - Persistencia de exclusiones individuales, corrección del DB65, patas/tornillos BOV y auditoría de cotizaciones existentes.
- [Esquema de Base de Datos](wiki/esquema_base_datos.md) - Tablas, políticas, comprador y configuración persistente de cotizaciones en Supabase.
- [Clientes de Supabase y la frontera de RLS](wiki/clientes_supabase_rls.md) - Cuándo `createClient()` respeta RLS y cuándo devuelve el cliente elevado; el `catch` demasiado ancho de v1.0.3 y su corrección.
- [Rieles de Cajón DB](wiki/rieles_db.md) - Catálogo de tipos de riel para muebles DB, mecanismo de override y archivos modificados.
- [Cajoneras DB con gavetas mixtas](wiki/db_gavetas_mixtas.md) - Normalización de traseros por medida (`pequena` 68 mm / `grande` 183 mm) para DB-1S, DB-2S, DB-2, DB-3 y DB-4; incluye `DB2-1OP`, frentes y variables de configuración.
- [Interpretación espacial DB en tres vistas](wiki/interpretacion_espacial_db.md) - Reconstrucción de siete referencias reales, nombres y planos de piezas, fórmulas contrastadas, gaveta interior y límites de las hipótesis de montaje.
- [Muebles esquineros ciegos BBL](wiki/muebles_bbl.md) - Análisis del Excel CEMA y plantillas paramétricas `BBLFD`/`BBL` disponibles en Supabase.
- [BBLFD-D-L/R-SM](wiki/bblfd_d_lr_sm.md) - Variante Blind Door inferior con montante A−TC, refuerzos delanteros divididos y Gola de madera.
- [Torres PCFD con gavetas ocultas](wiki/muebles_pcfd_gavetas_ocultas.md) - Variantes `STANDARD`/`2OP`/`4OP`, fórmulas CEMA y uso paramétrico de cajones y entrepaños.
- [Torres TK, puertas divididas y PC-MO](wiki/torres_tk_puertas_pcfd_mo.md) - TK obligatorio, PUERTA SUP en PC/VPC y PC-MO con vano central y entrepaños fijos. Distribución PC: fijo centrado en la junta y regla superior contando el fijo.
- [Variantes de frente Gola SM](wiki/variantes_frente_gola_sm.md) - Investigación de códigos `SM`/`SMG`, refuerzos por familia y modelo recomendado como opción transversal de frentes.
- [W2936-SM desde hoja real](wiki/w_sm_hoja_real.md) - Integracion verificada de `W` con sistema de frente `SM`: formulas condicionales, ausencia de manijas, HDR y carga en Supabase.
- [W-MO-HOOD](wiki/w_mo_hood.md) - Tipología superior derivada de UW con medidas MO/HOOD, base profunda de OW-MO, vano inferior abierto y puertas limitadas por el entrepaño fijo.
- [WBL-D-L/R-SM Blind Door](wiki/wbl_blind_door_sm.md) - Tipología superior independiente con puerta paramétrica en fracciones, apertura L/R, Blind Door fijo y regla común de entrepaños.
- [Codificación comercial de módulos](wiki/codificacion_comercial_modulos.md) - Fuente única `codigoComercial()`: orden de segmentos, alto por tipología, profundidad en superiores y gaveteros DFE.
- [Voladizo de la puerta con gola](wiki/visualizacion_gola_voladizo.md) - Por qué el sobrante de una puerta `SM` cuelga bajo la base en la visualización, y por qué en un mueble base tendría que ir arriba.
- [DB18-1S desde hoja real](wiki/db_hoja_real.md) - Cruce de  contra la hoja: la estructura ya era correcta; solo la base de gaveta estaba 0.1mm larga.
- [B12 desde hoja real](wiki/b_hoja_real.md) - Cruce de las 10 piezas de `B` contra la hoja de producción: tres medidas corregidas cuyo valor correcto ya estaba en las variantes FE.
- [BLS36 desde hoja real](wiki/bls36_hoja_real.md) - Reconstrucción del esquinero Lazy Susan: once piezas, dos puertas, un entrepaño y respaldos de 15 mm.
- [BLS-RS-SM sin entrepaño](wiki/bls_rs_sm.md) - Variante del esquinero Lazy Susan que conserva el despiece BLS excepto por la eliminación del entrepaño.
- [SBFD-SMG](wiki/sbfd_smg.md) - Lavaplatos de dos puertas con gola metálica, despiece certificado y montaje basado en IGES.
- [SBFD sin gola, refuerzo 128 mm](wiki/sbfd_sin_gola_refuerzo_128.md) - Reactivación de SBFD como copia de SBFD-SM sin gola, refuerzo pegado a los frentes y puerta con reveal de 3,2 mm.
- [BFD-SMG](wiki/bfd_smg.md) - Mueble inferior de dos puertas con gola metálica, entrepaño, fondo de 6 mm y mecanizado frontal 27 × 73 mm.
- [DB-SMG](wiki/db_smg.md) - Tres familias comerciales de cajoneras con gola metálica (base, FE y SF), doce tipologías y mecanizado lateral 27 × 73 mm.
- [BMW-1 y BMW-1-FE](wiki/bmw_1_hoja_real.md) - Mueble inferior para microondas y su variante con caja de gaveta de madera y riel full extension.
- [BOMH-1 y BOMH-1-FE](wiki/bomh_1_horno_parametrico.md) - Mueble inferior para medio horno con hueco paramétrico y variantes de gaveta Tandem o grande Full Extension.
- [BOV24 desde hoja real](wiki/bov24_hoja_real.md) - Referencia histórica y agrupación; geometría de frente sustituida por la regla BOV interno/BOV-SMG del 2026-11-07.
- [Consumo de materiales: unidades y merma](wiki/consumo_materiales.md) - Tablero en m² y canto en metros lineales; por qué sus mermas son distintas y cómo se reconstruye el consumo desde el despiece.
- [Holgura de 1mm sobre la estructura](wiki/holgura_1mm_estructura.md) - Por qué entrepaños y fondos se cortan 1mm más pequeños, qué tipos ya la tenían y el alcance aplicado en `0049`.
- [Ejes del fondo (backing)](wiki/ejes_fondo_backing.md) - `largo`/`ancho` son ejes geométricos atados a `intercambiar`, no "el mayor primero": el defecto que giraba 90° el backing de `W` con gola y la auditoría de los 44 tipos.
- [Riesgos e incoherencias del Excel CEMA](wiki/riesgos_excel_cema.md) - Auditoría estructural del libro fuente: margen por fila, 10 filas que mezclan USD y COP, recargo quemado, doble fuente de canto y demás defectos a resolver antes de migrar.
- [Auditoría de precio SBFD30](wiki/auditoria_precio_sbfd30.md) - Conciliación Excel CEMA vs Cotizador PLUS: dónde viven margen/TRM en el Excel, efecto del `config_default` del proyecto sobre el preset, y método para correr `engine.ts` fuera de la app.
- [Validación contra hojas de ruta](wiki/validacion_hojas_de_ruta.md) - Estudio de 1.937 hojas de ruta reales: DSL de fórmulas de producción, constante interior por espesor, reglas de reparto de frentes DB, modificadores transversales (`O`/`R`/`SM`/`F9`), tipologías sin mapear y errores detectados en la fuente.
- [Tipologías abiertas BFD y SBFD](wiki/tipologias_abiertas_bfd_sbfd.md) - Clones OBFD/OSBFD y variantes SM que conservan la configuración de origen y excluyen únicamente las piezas de frente.
- [Auditoría del catálogo activo](wiki/auditoria_catalogo_activo.md) - Barrido end-to-end de los 60 tipos activos con el motor real: dimensiones negativas que restaban tablero, 20 tipos que cotizan sin herrajes, herrajes duplicados en UW y qué anomalías son falsos positivos.
- [Cadena de precio: Excel CEMA vs. app](wiki/cadena_precio_excel_vs_app.md) - Correspondencia fórmula por fórmula de la hoja `Precio` contra `engine.ts`/`cotizar.ts`: parámetros de la columna T, margen global ponderado del proyecto y defectos resueltos.

- [Patron para integrar nuevas tipologias](wiki/patron_integracion_tipologias.md) - Protocolo permanente basado en `B-FE`: crear tipos independientes desde hojas reales, validar geometria/precio, respetar codigos comerciales y documentar migraciones.
- [Visualización y agrupación de familias FE](wiki/visualizacion_familias_fe.md) - Corrección geométrica 3D (fondo de gaveta, frentes mixtos y cajón superior) y homologación continua para B-FE, UB-FE y V-FE.

- [Plantilla de propuesta FIRPLAK](wiki/plantilla_propuesta_firplak.md) - Selección automática, datos de cotización, campos editables, imágenes originales y documento imprimible FIRPLAK.
- [Propuesta impresa en inglés](wiki/propuesta_ingles.md) - Botón Print / PDF (English), parámetro lang=en, glosario de ebanistería y textos editables en inglés de FIRPLAK.

## Entorno de Desarrollo
- [Dependencias del Proyecto](wiki/dependencias_proyecto.md) - Stack tecnológico (Next.js, React, Zustand, Supabase client).

## Fuentes (Raw)
*(Aún no hay fuentes raw)*

- [Comparación PRUEBA 1](wiki/comparacion_prueba1.md) - Consumos del listado frente a plantillas vigentes, diferencias e inconsistencia DB19-1s/DB12-1s.

- [Precios CEMA 23_09 frente a PLUS](wiki/precios_cema2309.md) - Comparación de tableros, cantos, herrajes y referencias sin equivalencia exacta.
- [Sincronización Mat_2309](wiki/sincronizacion_mat_2309.md) - Catálogo de tableros sincronizado con Mat_2309 y verificación de precios.
- [Tipologías Prueba Gola de madera](wiki/tipologias_prueba_gola_madera.md) - Tipologías paramétricas SM, familias DB-SM/FE y nomenclatura de traseros por altura.

- [Comparativo PB SHORE PRUEBA frente a HDR](wiki/comparativo_pb_shore_prueba.md) - Auditoría de 20 módulos: piezas, tablero y canto netos frente a las HDR PDF y consumos con suplementos.

- [Comparación Query App 2-10](wiki/comparacion_query_app_2_10.md) - Muestra por tipología y variantes: cantidades de piezas, cantos, entrepaños superiores y cobertura frente al catálogo activo.

- [Nombre del PDF de cotización](wiki/nombre_pdf_cotizacion.md) - Nombre sugerido con proyecto y fecha local de generación en todas las plantillas.
- [Dashboard de cotizaciones y ubicación](wiki/dashboard_cotizaciones.md) - País/ciudad, filtros compartibles, agregados SQL con RLS, gráficas SVG, tabla paginada y exportación CSV.
- [TW/W-SM-HOOD](wiki/tw_w_sm_hood.md) - Superiores de una/dos puertas, carcasa Alto−HOOD y frente falso extendido a 30 mm bajo las puertas, según IGES y tabla.
- [Copiar sección de cotización](wiki/copiar_seccion_cotizacion.md) - Copia inmediata con grupos, muebles, adicionales y precios, transacción y RLS.

- [SVFDH y SVFDH-SMG](wiki/svfdh.md) - Clones SVFD con dimensiones visibles y frente SMG reducido 30 mm.
- [Validación de entrepaños en HDR](wiki/hdr_validacion_entrepanos.md) - Contraste de configuraciones guardadas con reglas actuales, revisión previa a exportar y auditoría de 837 módulos.

- [PC, BMW y BOMH SM/SMG](wiki/pc_bmw_bomh_sm_smg.md) - Doce copias; fijos iguales a bases, gavetas pequeñas FE/Tandem, profundidad FE, frentes BOMH y contornos SMG corregidos; catálogo BBL/BBLFD y recálculo autorizado de dos líneas históricas PC-MO.
