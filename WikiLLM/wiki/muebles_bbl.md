# Muebles esquineros ciegos BBL

## Fuente y alcance

La fuente es `Simulación muebles CEMA (1).xlsx`, principalmente las filas 2451–2513 de `Costos Muebles` y sus despieces homólogos en `madera`. Se identificaron 59 referencias Blind Base:

- `BBLFD`: 57 referencias de puerta completa, con anchos de 30 a 47 pulgadas, alto estándar de 30 pulgadas y fondos de 18 o 24 pulgadas.
- `BBL`: 2 referencias con un cajón (`BBL48-1C` y `BBL39-1C-D14 7/8`), ambas de 30 pulgadas de alto y 24 de fondo.

Los sufijos de los códigos (`D`, `I`, `L`, `R`, `SM`, `SMG`, `CB`, `AW`) describen mano de apertura, manija/gola o acabado. No constituyen una carcasa distinta. Por eso la base de datos usa dos tipos paramétricos, no 59 filas de tipo duplicadas.

## Modelo en la base de datos

La migración `db/migrations/0022_muebles_bbl.sql` deja activos y disponibles:

| Prefijo | Configuración base | Reglas |
| --- | --- | --- |
| `BBLFD` | 1 `door`, 1 `blind door` fijo, 1 `shelf`, sin cajones | 4 patas; `Door` y mano `L/R` obligatorios |
| `BBL` | 1 puerta, 1 cajón, medio entrepaño | 4 patas, 1 par de bisagras, 2 manijas y 1 par de rieles |

Ambos tipos son muebles inferiores, usan margen `muebles`, cartón y cuatro etiquetas. `permite_agrupacion=false` porque su geometría esquinera no puede participar en la fusión lineal de módulos.

## Geometría BBLFD-D-L/R

Desde `0119`, `BBLFD` fue reemplazada completamente por la hoja de ruta
`BBLFD42-D17 7/8D/I`. En Simulador y Cotizaciones aparecen dos controles solo
para este tipo: `Door` (medida en la unidad activa, acepta fracción imperial) y
mano `L/R`, donde `L` son bisagras izquierdas y `R` bisagras derechas. El código
se construye como `BBLFD<largo>-D<Door><mano>`; por ejemplo
`BBLFD42-D17 7/8R`.

En los selectores, `BBLFD` es una excepción de presentación: se muestra solo
el `nombre_es` completo (`BBLFD-D-L/R — Mueble inferior esquinero 1 puerta`)
para evitar duplicar el prefijo como `BBLFD — BBLFD-D-L/R`.

Piezas vigentes:

- `base`: `(L - 2TC) × (P - 18 mm - TB)`, con 8 tarugos (4 por lado).
- Dos piezas `lateral`: `A × P`, separadas internamente para conservar sus cantos distintos.
- `refuerzo_delantero`: `(L - 2TC) × 100 mm`, con 4 tarugos (2 por lado).
- `refuerzo_vertical`: `(A - 2TC) × 100 mm`, con 4 tarugos (2 por lado).
- Dos piezas `refuerzo_trasero`: `(L - 2TC) × 80 mm`, cada una con 4 tarugos (2 por lado).
- `entrepano`: `(L - 2TC - 1 mm) × (P - 150,8 mm)`.
- `blind door`: `A × (L - Door - 3,2 mm)`, nombre reservado para la puerta fija.
- `frente`: `(A - 3,2 mm) × Door`, siempre una unidad.
- `fondo`: `(A - 2 mm) × (L - 16 mm)`.

En la visualización, la mano decide qué frente ocupa cada lado. El
`refuerzo_vertical` se orienta en el plano YZ, perpendicular a los frentes, con
100 mm de profundidad y centrado sobre la junta entre `blind door` y `frente`.
Va desde la base hasta la cara inferior del refuerzo delantero horizontal de
100 mm; su posición cambia con `L/R`.

El valor `Door` se convierte a pulgadas antes de entrar al motor de fórmulas,
pero se conserva en la unidad del proyecto para generar el código. La mano se
persiste en `config.doorHand` y `Door` en `config.door`, por lo que sobreviven a
edición, duplicado, recálculo e HDR.

## Geometría histórica de BBL y base anterior

- Laterales: `2 × A × P`.
- Base: `(L - 1.18) × (P - 0.9)`.
- Refuerzos traseros: `2 × (L - 1.18) × 3.25`.
- Refuerzo vertical de bisagras: `A × 3.25`, informativo y sin rol de tablero porque el Excel no lo suma al costo de madera.
- Fondo: `(L - 0.59) × A`.

La geometría paramétrica anterior de `BBLFD` basada en `(L-P)/n_puertas` quedó
obsoleta y no debe restaurarse. Las reglas siguientes describen únicamente `BBL`.

`BBL` añade dos refuerzos horizontales del vano útil, medio entrepaño, base y trasero de gaveta descontando el tramo ciego, y el canto adicional del frente de cajón. Los rieles se integran con el mismo catálogo seleccionable usado por los muebles `DB`.

## Disponibilidad

`getCotizadorData()` obtiene los tipos activos directamente desde `cot_tipos_mueble`; no se requiere una lista hardcodeada en el frontend. Al quedar `activo=true`, `BBLFD` y `BBL` aparecen automáticamente en el Simulador y en Agregar mueble de una cotización.
