# Motor de Cálculo (Engine)

El cálculo financiero de la cotización está centralizado en el backend. Su objetivo es replicar con precisión de centavos la lógica de un Excel maestro (CEMA). 

## 1. Núcleo Algorítmico (`src/lib/engine.ts`)
Este archivo es totalmente agnóstico del framework y de Supabase. Funciona como una función pura `calcularMueble` que toma entradas (dimensiones, reglas, plantillas) y devuelve un `Breakdown` completo de costos.

**Características principales:**
- **Evaluador de Expresiones (`evalExpr`):** Ejecuta fórmulas de base de datos dinámicamente usando una whitelist de caracteres y `new Function()`.
- **Derivación de Variables:** Interpreta reglas dependientes del tipo de mueble (ej. cuántos herrajes se necesitan para una altura determinada).
- **Procesamiento de Tableros y Cantos:** Calcula las áreas (en `cm2`) multiplicadas por el factor de desperdicio del proyecto, y el perímetro total considerando aristas para el tapacantos.
- **Desperdicio de tablero = neto + 15%, sin excepción:** `costoMadera` (línea ~250 de `engine.ts`) es `(cm2 * (1 + desperdicio) / 10000) * precio_m2`, en un único loop sobre `areaPorRol` que no distingue tipo de mueble ni rol de tablero (caja/frente/fondo/refuerzo). Como no hay ninguna rama por `tipo_mueble_id`, es arquitectónicamente imposible que una tipología reciba un desperdicio distinto al parámetro activo — que hoy es el global `cot_parametros.desperdicio_madera = 0.15` (15%), porque `CotizarInput.tarifaMadera` (override por proyecto/línea) existe en el tipo y en `cotizaciones.ts`, pero ninguna pantalla de la UI lo setea todavía. Verificado el 2026-09-10 corriendo `calcularMueble()` contra Supabase real para B/W/DB/BFD/SBFD/PCFD/PN/TK: los 8 dieron neto×1.15 exacto en cada rol de tablero. Regresión: `tests/desperdicio-tablero.test.ts`.
- **Herrajes y Consumibles:** Calcula el consumo exacto de componentes estructurales y accesorios basándose en la configuración del mueble.
- **Cartón de empaque (`consumibles.carton`):** `cartonUnd = round(((max1*2*IN2CM/200) * (max2*2*IN2CM/130)) * 10) / 10`, tomando las DOS dimensiones más grandes del mueble (la más chica no entra en la cuenta — confirmado contra el Excel: un BFD9 y un DB18-1s, con A/P iguales pero L muy distinto, dan el mismo costo de cartón). Precio unitario `cot_herrajes.CARTON = 6886` (`selector_key='carton'`). Verificado el 2026-09-10 contra las 5.639 filas con L/A/P numéricos de `'Costos Muebles'` (Excel CEMA): 99.3% exacto a menos de $1. Los ~36 mismatches encontrados eran 100% filas `O*` (abierto/sin puertas — `OB`, `OBFD`, `OSBFD`, `OSVFD`, `OV`, `OW`, `ODB`, `OBBLFD`, `OPC`), donde el Excel trae `Z=0` pero la fórmula no distinguía el modo — **corregido**: `cartonUnd=0` también cuando `modoFrentes==='sin_frentes'` (una carcasa sin puertas no se empaca en cartón). `usaCarton=false` del tipo sigue anulándolo igual que antes. Regresión: `tests/carton-abierto.test.ts`. Queda 1 fila suelta (`USVR3328 3/4`, alto atípico de 28.75") con ~$689 de diferencia, dato aislado sin patrón — no se tocó.
- **Cadena de Precios:** Aplica la cadena contable: Costo Base -> Margen -> Conversión de Moneda (TRM). *Nota: Los recargos del cliente fueron desactivados del motor.*

## 2. Capa de Integración (`src/lib/cotizar.ts`)
Este archivo actúa como puente entre la base de datos y el motor de cálculo. Se ejecuta estrictamente en el servidor (`import 'server-only'`).

**Flujo de Ejecución (`cotizar`):**
1. Recibe los inputs de la vista del simulador (`CotizarInput`).
2. Obtiene de Supabase todas las tablas necesarias en paralelo (piezas, reglas, tableros, cantos, herrajes).
3. Construye los objetos de parámetros que espera el `engine.ts` (resolviendo presets y overrides).
4. Invoca `calcularMueble()` y devuelve el `Breakdown` al frontend.

El simulador combinado llama `cotizarGrupoConsolidado()` mediante una Server Action con la lista completa de `CotizarInput`. La validación ocurre antes de confirmar un módulo, por lo que una incompatibilidad no altera la última lista ni el último resultado válidos.

**Carga de Datos (`getCotizadorData`):**
Provee al frontend con toda la metadata necesaria para construir la interfaz (tipos de mueble, tableros habilitados, herrajes filtrados por rol), asegurando que la UI esté sincronizada con la Base de Datos en tiempo real.

## 3. Cálculo de grupos físicos

La agrupación se implementa en `src/lib/group-engine.ts` como una transformación previa del mismo `CalcInput` que usa el cálculo individual. No existe una segunda cadena de precios: cada integrante se vuelve a calcular con su participación física y conserva su margen, descuento, herrajes y consumibles locales.

- Para `n` módulos se contabilizan `n + 1` laterales. Si los módulos en una unión tienen la misma altura, el descuento se reparte por mitades (0.5 cada uno); si tienen alturas diferentes, el lateral que se quita es el del mueble con menor altura (descuento de 1.0 al mueble más bajo y 0.0 al más alto).
- Las piezas con `modo_agrupacion = continua` usan `formula_largo_grupo`, con `LG` como largo total del grupo y `TC` como espesor físico de caja. La base/tapa/refuerzos usan `LG-(2*TC)` y el fondo ranurado usa `LG-TC`.
- `refuerzo_delantero` y `refuerzo_horizontal` se homologan mediante `clave_fusion = refuerzo_frontal`; se conserva la mayor cantidad estructural requerida por los integrantes y cada pieza atraviesa el grupo completo.
- Los entrepaños, componentes de cajón, frentes y herrajes permanecen locales. Las piezas internas cuyo largo depende de `L` reciben el espacio liberado por los laterales: `TC/2` en módulos extremos y `TC` en módulos intermedios. Los frentes no cambian. No se admiten piezas que recorran solo una parte del grupo.
- Antes de calcular se validan profundidad (tolerancia 0,5 mm; las alturas pueden diferir), materiales/espesores estructurales, canto de caja, espesor de frente, margen, cantidad unitaria y largo máximo del tablero.
- El costo de las piezas continuas se reparte en proporción al ancho; los divisores interiores se reparten por mitades cuando la altura es idéntica o al mueble correspondiente si difiere. El resultado sigue siendo un precio individual por línea y el grupo almacena además su subtotal y breakdown estructural.
- Las participaciones usan complemento en la última línea para sumar exactamente una unidad pese a la aritmética binaria. Los importes se cierran a dos decimales y cualquier residuo se asigna determinísticamente al último módulo; por ello el subtotal almacenado coincide con la suma de líneas.

## 4. Consolidación para el simulador

`src/lib/group-result.ts` transforma las asignaciones internas de `GroupCalculation.lineas` en un único `CotizarGrupoResult`. No recalcula precios ni introduce otra cadena financiera: suma los valores conciliados del motor y agrupa el detalle físico.

- Piezas: clave compuesta por nombre, rol y dimensiones; las participaciones fraccionarias de una pieza continua vuelven a sumar su cantidad física total.
- Tableros: agrupados por rol y código.
- Cantos: agrupados por calibre y precio.
- Herrajes: agrupados por rol, código y precio. Cada módulo puede incluirlos o excluirlos de forma independiente.
- Consumibles: sumados por selector.
- Resumen estructural: cantidad de módulos, largo exterior, laterales/divisiones, uniones y claves de piezas continuas.

El frontend recibe únicamente el consolidado; los precios individuales permanecen como detalle interno del algoritmo de reparto. El simulador no persiste grupos en Supabase: la sesión combinada reside en Zustand/localStorage. Editar, eliminar o reordenar confirma una nueva lista válida y vuelve a ejecutar el mismo cálculo grupal.
