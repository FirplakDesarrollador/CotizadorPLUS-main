# Informe: optimizadores de corte en GitHub y qué aplicar al Cotizador PLUS

Fecha: 2026-10-14. Punto de partida y plan para corregir y mejorar `src/lib/corte/`
(`guillotina.ts`, `reparto.ts`, `plan-corte.ts`, `secuencia.ts`).

## 1. Resumen

- Se analizaron 7 repositorios. El de referencia es **packingsolver** (MIT, C++ con WebAssembly para navegador).
  Resuelve exactamente nuestro problema: guillotina de 3 etapas, espesor de sierra, refilado, veta y sobrante en la última lámina.
- **Medición con las mismas piezas** (sección 3): packingsolver nunca usó más láminas que nuestro optimizador
  y en 4 de 6 casos usó menos. En el proyecto grande ahorra 4 láminas y baja el número de patrones distintos
  de 30 a 12 en el fondo, lo que favorece cortar en pila.
- **Defecto concreto de nuestro acomodo:** en el frente de 18 mm del proyecto pequeño usamos 6 láminas
  (25,2 % de desperdicio) donde el óptimo demostrado es 5 (10,2 %). La causa más probable es que solo
  acomodamos por franjas, sin apilar piezas en columnas (brecha 1).
- **Recomendación principal:** hacer una prueba de concepto con packingsolver (WebAssembly en un Web Worker) como
  motor de acomodo por material y día, y dejar nuestro `reparto.ts` encima. En paralelo, cerrar las brechas
  de nuestro código que hacen falta de todos modos: validador, banco de pruebas, Web Worker y reparto.

## 2. Repositorios analizados

| Repositorio | ★ | Lenguaje / licencia | Qué aporta |
|---|---:|---|---|
| fontanf/packingsolver | 300 | C++ + WASM / MIT | Solver de referencia en guillotina (reto ROADEF 2018 de corte de vidrio). Portafolio de algoritmos, cotas, versión en navegador con Web Worker |
| lairdubois/opencutlist (SketchUp) | 612 | Ruby + C++ / GPL-3 | Mismo dominio (carpintería). Su motor actual ("Packy") es packingsolver; el anterior probaba hasta 864 combinaciones por lámina |
| juj/RectangleBinPack | 996 | C++ / dominio público | Heurísticas clásicas de guillotina: elección del espacio libre y regla de división |
| JeroenGar/gdrr-2bp | 48 | Rust / MIT | Heurística "goal-driven ruin & recreate" (EJOR 2022), estado del arte en guillotina con láminas |
| jasonrhansen/cut-optimizer-2d | 33 | Rust / MIT-Apache | Espesor de sierra, dirección de veta, algoritmo genético por láminas |
| secnot/rectpack | 564 | Python / Apache | Catálogo de órdenes de entrada y reglas de selección de lámina |
| RajwanYair/WoodworkingShop | 21 | TypeScript / MIT | Optimizador de muebles en TS con Web Worker y reportes de veta |

## 3. Medición: packingsolver contra nuestro optimizador

Mismas piezas, sin repartir en días (todo el proyecto junto). Parámetros: lámina 2440 × 1830, sierra 4,4 mm,
refilado 5 mm por lado, 3 etapas, giro permitido.
- **Nuestro optimizador:** `esquemasDesdeLista` con la configuración actual.
- **packingsolver:** objetivo "minimizar láminas", 30 s como máximo por material.

| Proyecto · material | Piezas | Nuestro: láminas · desperdicio · patrones | packingsolver: láminas · desperdicio · patrones | Cota | Tiempo |
|---|---:|---|---|---:|---:|
| Pequeño · caja 15 mm | 467 | 20 · 8,78 % · 20 | 20 · 8,78 % · 20 | 19 | 30 s |
| Pequeño · frente 18 mm | 99 | **6 · 25,20 %** · 6 | **5 · 10,24 %** · 5 (óptimo demostrado) | 5 | < 1 s |
| Pequeño · fondo 6 mm | 48 | 5 · 9,38 % · 5 | 5 · 9,39 % · 5 (óptimo demostrado) | 5 | < 1 s |
| Grande · caja 15 mm | 2.802 | 118 · 7,23 % · 46 | **116 · 5,63 %** · 53 | 111 | 30 s |
| Grande · frente 18 mm | 594 | 31 · 13,13 % · 20 | **30 · 10,24 %** · 22 | 28 | 30 s |
| Grande · fondo 6 mm | 288 | 30 · 9,38 % · 30 | **29 · 6,26 % · 12** | 28 | 30 s |
| **Total pequeño** | | **31** | **30** | | |
| **Total grande** | | **179** | **175** | | |

Observaciones de la medición:
- **Objetivo "con sobrante":** con `bin-packing-with-leftovers`, el que deja el sobrante en la última lámina,
  packingsolver no devolvió solución en la caja del proyecto pequeño ni en materiales grandes dentro de 10–30 s.
  Con `bin-packing` sí resolvió todo. Hay que reportarlo al autor o usar `bin-packing` y reordenar las láminas después.
- **Orientación libre del primer corte:** con `first_stage_orientation: any` fue más lento y no terminó los
  casos grandes en 10 s. Con orientación fija (vertical) sí.
- **Cotas y parada temprana:** packingsolver calcula cotas más fuertes que la nuestra (19, 111, 28) y para en
  cuanto demuestra el óptimo.

## 4. Brechas de nuestro optimizador frente a esos repositorios

| # | Hoy en Cotizador PLUS | Buena práctica observada | Fuente |
|---|---|---|---|
| 1 | Acomodo solo por **franjas**: las piezas van lado a lado y el alto que sobra sobre las piezas bajas se pierde | Guillotina de 3 etapas con **columnas apiladas** dentro de la franja (1.er corte la franja, 2.º la columna, 3.º la pieza), o lista de **rectángulos libres** con regla de división | packingsolver (non-exact), RectangleBinPack, cut-optimizer-2d |
| 2 | Franjas siempre en la misma dirección | Probar la **orientación del primer corte** por lámina | packingsolver, OpenCutList |
| 3 | 20 heurísticas fijas + aleatorias por material | **Portafolio**: órdenes de entrada × elección de espacio × regla de división × apilado (hasta 864 combinaciones en OpenCutList), con **búsqueda por haz lámina por lámina** que conserva las mejores N | OpenCutList, RectangleBinPack, rectpack |
| 4 | Criterio: menos láminas y luego la última lámina más vacía | **Valorar el sobrante por área²** (premia un sobrante grande y castiga fragmentos); en cut-optimizer-2d, la calidad de cada lámina es `uso^(2 + 0,01 · nº de espacios libres)` | gdrr-2bp, cut-optimizer-2d, packingsolver |
| 5 | No controla tiras finas | **Ancho mínimo de desperdicio**: no dejar retazos que la sierra no puede cortar | packingsolver (`minimum_waste_length`) |
| 6 | Los patrones iguales se detectan después de acomodar | **Generar patrones a propósito** y repetirlos en múltiplos de la pila (4 en 15 mm, 3 en 18 mm); agrupar piezas iguales en "superpiezas" para alinear cortes | packingsolver (generación de columnas), OpenCutList (superbox) |
| 7 | Recocido sobre el orden de entrada | **Destruir y reconstruir con meta**: meta = mejor − 1 lámina, vaciar las láminas peor aprovechadas y reinsertar; aceptación *Late Acceptance Hill Climbing* | gdrr-2bp |
| 8 | Tope de iteraciones | **Búsqueda continua (anytime)**: haz cuyo ancho se duplica (1, 2, 4…) hasta agotar el tiempo, publicando cada mejora | packingsolver |
| 9 | Un solo hilo, en el hilo de la pantalla (no hay ningún Web Worker en `src/`) | **Web Worker** con progreso, botón detener y mejor solución hasta el momento; varios hilos que comparten la mejor | packingsolver WASM, gdrr-2bp, WoodworkingShop |
| 10 | Cota = área ÷ área útil | **Cotas más fuertes** (funciones duales factibles) para demostrar el óptimo y parar antes | packingsolver |
| 11 | Validación implícita | **Validador de soluciones** en pruebas y en desarrollo: sin solapes, sierra y refilado respetados, guillotina factible, piezas completas | gdrr-2bp, packingsolver |
| 12 | Sin inventario de retazos | **Retazos como láminas de menor costo** (láminas de varios tamaños): base para reutilizar sobrantes entre días | packingsolver, OpenCutList |
| 13 | La secuencia de cortes se modela aparte | **Árbol de cortes** como salida (nodo, padre, etapa): la secuencia sale exacta del acomodo | packingsolver |
| 14 | Pocas instancias de prueba | **Banco de instancias** fijo y seguimiento del % de desperdicio en la integración continua | packingsolver, gdrr-2bp |
| 15 | `reparto.ts`: la opción `exactoMax` está declarada pero no se usa (no hay enumeración exacta) y no tiene movimientos dirigidos por material ni destruir y reconstruir | Enumeración completa con poda en espacios pequeños; vecindarios destruir-reconstruir | gdrr-2bp, prompt de reparto |

## 5. Plan recomendado

| Paso | Qué | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Validador de soluciones** + **banco de instancias** (los dos proyectos de referencia y 3 cotizaciones reales) en `lane:cutting` | Sin esto no se puede medir ni comparar ningún cambio | Bajo |
| 2 | **Prueba de concepto con packingsolver en WebAssembly** dentro de un Web Worker: sierra 4,4 mm, refilado 5 mm, 3 etapas, `oriented` según la veta, objetivo `bin-packing` y reordenar las láminas para dejar el sobrante en la última. Requiere las cabeceras COOP/COEP en Next para los hilos (`SharedArrayBuffer`) | Ya ganó en la medición (−1 lámina en el pequeño, −4 en el grande) y aporta cotas y parada al demostrar el óptimo | Medio |
| 3 | Si la prueba no se adopta: **columnas apiladas en la franja + orientación del primer corte** en `guillotina.ts` | Es la causa más probable de las 6 láminas en lugar de 5 | Medio |
| 4 | **Criterio de sobrante** (área², fragmentos, ancho mínimo de desperdicio) en `mejorQue()` | Alinea el acomodo con el criterio de planta | Bajo |
| 5 | **Web Worker y multihilo** para el reparto por días; terminar `exactoMax` y agregar destruir-reconstruir en `reparto.ts` | La búsqueda hoy congela la pantalla y deja margen sin explorar | Medio |
| 6 | **Patrones repetidos para la pila** y **árbol de cortes** como salida | Menos pasadas de sierra y secuencia exacta | Alto |
| 7 | **Retazos como inventario** cuando se decida reutilizar sobrantes entre días | Única vía para acercarse al desperdicio de "todo junto" sin cortar por lotes | Medio |

## 6. Reproducir la medición
- Datos de entrada: piezas por material de los dos proyectos de referencia
  (B12×6, B30×4, BFD15×4, BFD36×3, SBFD30×2, DB19-1s×3, DB24-2s×2, DB30-2×3, DB12-3×2, DB20-4×2, UW1236×4,
  UW3036×3, W1236×4, W3036×4, W302024×2, y ese mismo proyecto × 6), con preset PRICARB 15/18/6.
- packingsolver: `pip install packingsolver`, módulo `packingsolver.rectangleguillotine`, medidas en décimas de mm
  (enteros), `set_cut_thickness(44)`, trims de 50 por lado, `set_number_of_stages(3)`, `Objective.BinPacking`,
  `time_limit = 30`.

## 7. Estado tras la implementación (2026-10-14)

Implementado: brechas 1 (columnas), 2 (orientación), 3 parcial (mochila + portafolio), 4 parcial (sobrante en la última lámina y datos de sobrante), 9 (Web Worker para el plan), 11 (validador) y 14 (banco de instancias en `tests/fixtures/corte-referencia.json` y `scripts/corte-benchmark.ts`), más la corrección secuencial de valores. Resultado: igual a packingsolver en los dos proyectos (30 y 175 láminas). Pendiente: 5 (ancho mínimo de desperdicio), 6 (patrones repetidos para la pila), 7 (destruir-reconstruir), 10 (cotas más fuertes), 12 (retazos), 13 (árbol de cortes), 15 (enumeración exacta en `reparto.ts`) y multihilo del reparto.
