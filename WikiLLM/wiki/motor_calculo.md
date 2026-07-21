# Motor de Cálculo (Engine)

El cálculo financiero de la cotización está centralizado en el backend. Su objetivo es replicar con precisión de centavos la lógica de un Excel maestro (CEMA). 

## 1. Núcleo Algorítmico (`src/lib/engine.ts`)
Este archivo es totalmente agnóstico del framework y de Supabase. Funciona como una función pura `calcularMueble` que toma entradas (dimensiones, reglas, plantillas) y devuelve un `Breakdown` completo de costos.

**Características principales:**
- **Evaluador de Expresiones (`evalExpr`):** Ejecuta fórmulas de base de datos dinámicamente usando una whitelist de caracteres y `new Function()`.
- **Derivación de Variables:** Interpreta reglas dependientes del tipo de mueble (ej. cuántos herrajes se necesitan para una altura determinada).
- **Procesamiento de Tableros y Cantos:** Calcula las áreas (en `cm2`) multiplicadas por el factor de desperdicio del proyecto, y el perímetro total considerando aristas para el tapacantos.
- **Herrajes y Consumibles:** Calcula el consumo exacto de componentes estructurales y accesorios basándose en la configuración del mueble.
- **Cadena de Precios:** Aplica la cadena contable: Costo Base -> Margen -> Conversión de Moneda (TRM). *Nota: Los recargos del cliente fueron desactivados del motor.*

## 2. Capa de Integración (`src/lib/cotizar.ts`)
Este archivo actúa como puente entre la base de datos y el motor de cálculo. Se ejecuta estrictamente en el servidor (`import 'server-only'`).

**Flujo de Ejecución (`cotizar`):**
1. Recibe los inputs de la vista del simulador (`CotizarInput`).
2. Obtiene de Supabase todas las tablas necesarias en paralelo (piezas, reglas, tableros, cantos, herrajes).
3. Construye los objetos de parámetros que espera el `engine.ts` (resolviendo presets y overrides).
4. Invoca `calcularMueble()` y devuelve el `Breakdown` al frontend.

**Carga de Datos (`getCotizadorData`):**
Provee al frontend con toda la metadata necesaria para construir la interfaz (tipos de mueble, tableros habilitados, herrajes filtrados por rol), asegurando que la UI esté sincronizada con la Base de Datos en tiempo real.

## 3. Cálculo de grupos físicos

La agrupación se implementa en `src/lib/group-engine.ts` como una transformación previa del mismo `CalcInput` que usa el cálculo individual. No existe una segunda cadena de precios: cada integrante se vuelve a calcular con su participación física y conserva su margen, descuento, herrajes y consumibles locales.

- Para `n` módulos se contabilizan `n + 1` laterales. Los extremos reciben un lateral exterior más la mitad del divisor contiguo; los módulos intermedios reciben las dos mitades de sus divisores.
- Las piezas con `modo_agrupacion = continua` usan `formula_largo_grupo`, con `LG` como largo total del grupo y `TC` como espesor físico de caja. La base/tapa/refuerzos usan `LG-(2*TC)` y el fondo ranurado usa `LG-TC`.
- `refuerzo_delantero` y `refuerzo_horizontal` se homologan mediante `clave_fusion = refuerzo_frontal`; se conserva la mayor cantidad estructural requerida por los integrantes y cada pieza atraviesa el grupo completo.
- Los entrepaños, componentes de cajón, frentes y herrajes permanecen locales. Las piezas internas cuyo largo depende de `L` reciben el espacio liberado por los laterales: `TC/2` en módulos extremos y `TC` en módulos intermedios. Los frentes no cambian. No se admiten piezas que recorran solo una parte del grupo.
- Antes de calcular se validan altura y profundidad (tolerancia 0,5 mm), materiales/espesores estructurales, canto de caja, espesor de frente, margen, cantidad unitaria y largo máximo del tablero.
- El costo de las piezas continuas se reparte en proporción al ancho; los divisores interiores se reparten por mitades. El resultado sigue siendo un precio individual por línea y el grupo almacena además su subtotal y breakdown estructural.
- Las participaciones usan complemento en la última línea para sumar exactamente una unidad pese a la aritmética binaria. Los importes se cierran a dos decimales y cualquier residuo se asigna determinísticamente al último módulo; por ello el subtotal almacenado coincide con la suma de líneas.
