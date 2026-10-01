# `DB18-1S` desde hoja real

## Fuente

Hoja de producción **"HRJ DB18-1S · MUEBLE INF COC 3 GAVETAS 1 PEQUEÑA CARB2"**,
con `L=18"`, `A=30"`, `P=24"` (457.2 × 762 × 609.6 mm). `DB-1S` son 3 gavetas de
las cuales 1 es pequeña (`n_cajones=3`, `n_cajones_pequenos=1`).

## Resultado del cruce

**La estructura de piezas de `DB` era correcta.** Las 18 filas de la hoja se
agrupan en 10 piezas del motor y todas salieron con la cantidad y las medidas
esperadas, incluido el reparto asimétrico de frentes y traseros entre la gaveta
pequeña y las dos grandes.

| Pieza (hoja) | Motor | Cant | Medida |
| --- | --- | ---: | ---: |
| BASE | `base` | 1 | 427.2 × 585.6 |
| SIDE R/L | `lateral` | 2 | 762 × 609.6 |
| RAIL DELANTERO | `refuerzo_delantero` | 3 | 427.2 × 80 |
| RAIL TRASERO | `refuerzo_trasero` | 2 | 427.2 × 80 |
| FONDO GAVETA SUP/CENTRAL/INF | `base_gaveta` | 3 | 352.2 × 492 |
| TRASERO CAJON SUP | `trasero_gaveta_pequena` | 1 | 340.2 × 68 |
| TRASERO CAJON CENTRAL/INF | `trasero_gaveta_grande` | 2 | 340.2 × 183 |
| FRENTE GAVETA SUP | `frente_gaveta_pequena` | 1 | 152.4 × 454 |
| FRENTE GAVETA CENTRAL/INF | `frente_gaveta_grande` | 2 | 300 × 454 |
| BACKING | `fondo` | 1 | 760 × 441.2 |

Los tres rieles delanteros (uno por gaveta, vía `(n_cajones)-gola`) contra dos
traseros fijos salieron correctos sin tocar nada.

## Lo único corregido

`base_gaveta` usaba `L-4.13`, que da **352.298 mm** donde la hoja pide **352.2**.
`4.13386"` = 105 mm exactos. `DB` era el **único tipo del catálogo** que
conservaba el valor truncado: `B` (corregido en 0052), `POD`, `UDB` y `UV` ya
usaban `L-4.13386`. Lo alinea `0053_db_base_gaveta_precision.sql`.

## Diferencia que no se persiguió

`frente_gaveta_grande` da **300.00 mm** y la hoja dice **300.08**. La fórmula
reparte el alto restante entre las gavetas grandes:

```text
(A - n_cajones*RV - n_cajones_pequenos*alto_frente_pequeno) / (n_cajones - n_cajones_pequenos)
(762 - 3×3.2 - 152.4) / 2 = 300.0 mm
```

Para que diera 300.08 el reveal tendría que ser 3.1467 mm en vez de 3.2, un valor
que no aparece en ninguna otra parte del catálogo y que el resto de la hoja
contradice: el largo de los frentes es `454 = L - 3.2`, confirmando `RV = 3.2`.

Son 80 micras, por debajo de cualquier tolerancia de corte, así que se trata como
redondeo de la hoja y no se toca. Queda anotado por si aparece en más hojas.

## `n_barras = -1` no es un defecto

Al cruzar los datos aparece `n_barras = -1` entre las variables. Es un
**centinela** que significa "sin fijar": la regla global lo pone en `-1` y la
plantilla de herrajes lo guarda explícitamente,

```text
n_barras >= 0 ? n_barras : (n_cajones <= 2 ? n_cajones : 0)
```

de modo que nunca produce una cantidad negativa. El formulario lo sobreescribe
cuando el usuario elige una tipología de cajonera.

## Cobertura

`tests/db18-hoja-real.test.ts` fija las 10 piezas contra la hoja, comprueba que la
base de gaveta resta 105 mm exactos en cualquier medida, y verifica que el reparto
de frentes siga la tipología: con `DB-3` (tres gavetas iguales) los tres frentes
se reparten el alto y no se corta ni el frente ni el trasero de gaveta pequeña.

Ver también [b_hoja_real.md](b_hoja_real.md), donde apareció la misma imprecisión.
