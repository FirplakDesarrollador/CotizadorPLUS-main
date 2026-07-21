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
| `BBLFD` | 1 puerta, 1 frente falso, 1 entrepaño, sin cajones | 4 patas; admite override a 2 puertas; manija excluible para variantes `-SM` |
| `BBL` | 1 puerta, 1 cajón, medio entrepaño | 4 patas, 1 par de bisagras, 2 manijas y 1 par de rieles |

Ambos tipos son muebles inferiores, usan margen `muebles`, cartón y cuatro etiquetas. `permite_agrupacion=false` porque su geometría esquinera no puede participar en la fusión lineal de módulos.

## Geometría común

- Laterales: `2 × A × P`.
- Base: `(L - 1.18) × (P - 0.9)`.
- Refuerzos traseros: `2 × (L - 1.18) × 3.25`.
- Refuerzo vertical de bisagras: `A × 3.25`, informativo y sin rol de tablero porque el Excel no lo suma al costo de madera.
- Fondo: `(L - 0.59) × A`.

`BBLFD` añade refuerzo delantero parcial `(L - 27.75) × 3.25`, un entrepaño completo y dos clases de frente:

- Puerta: `((L - P) / n_puertas) × A`, multiplicada por `n_puertas`.
- Frente falso: `P × A`.

La profundidad `P` define directamente la longitud del paño ciego. El vano restante `L - P` se divide por igual entre las puertas, por lo que una o dos puertas más el frente falso cierran exactamente el largo `L` sin un override dimensional adicional.

`BBL` añade dos refuerzos horizontales del vano útil, medio entrepaño, base y trasero de gaveta descontando el tramo ciego, y el canto adicional del frente de cajón. Los rieles se integran con el mismo catálogo seleccionable usado por los muebles `DB`.

## Disponibilidad

`getCotizadorData()` obtiene los tipos activos directamente desde `cot_tipos_mueble`; no se requiere una lista hardcodeada en el frontend. Al quedar `activo=true`, `BBLFD` y `BBL` aparecen automáticamente en el Simulador y en Agregar mueble de una cotización.
