# Holgura de 1 mm sobre la estructura

## La regla

Las piezas que entran **dentro** de la carcasa —el entrepaño entre los laterales y
el fondo contra la estructura— se cortan 1 mm más pequeñas que la medida teórica.
Sin esa holgura no entran.

`0.03937"` = 1 mm. Como `TC` = 15 mm, la diferencia entre `L-TC` (L−15 mm) y
`L-0.62992` (L−16 mm) es exactamente ese milímetro.

## No era un caso aislado de `W`

El detonante fue el despiece de un `W` con manija: entrepaño 706.6 mm y fondo
721.6 × 899.4 mm, cuando debían ser 705.6 y 720.6 × 898.4.

Al auditar el catálogo apareció que la holgura **ya existía** en los tipos
validados más recientemente contra hojas reales, y que `W` era el inconsistente:

| Pieza | Tipos que ya la tenían | `W` antes |
| --- | --- | --- |
| entrepaño | `B-FE`, `UB-FE`, `V-FE` → `L-2*TC-0.03937` | `L-2*TC-gola*0.03937` — solo con gola |
| fondo | `S`, `SA`, `SBAS`, `SLOC`, `SMO` → `A-0.62992` / `L-0.62992` | `L-TC` / `A-0.59` — 15 mm |

`0045_w_sm_hoja_real.sql` había introducido el 1 mm del entrepaño **condicionado a
`gola`**, porque lo dedujo de una hoja de `W2936-SM`. La holgura no depende del
sistema de frente: es estructural.

## Alcance aplicado (`0049`)

Decidido con el usuario tras presentar el alcance de cada opción:

**Entrepaño — los 22 tipos que usaban `L-2*TC`** pasan a `L-2*TC-0.03937`:
`AL`, `B`, `BBL`, `BBLFD`, `BFD`, `BMW`, `CC`, `CLV`, `OVPC`, `PC`, `PCFD`,
`SBAS`, `UB`, `UBFD`, `UW`, `V`, `VFD`, `VPC`, `W`, `WBL`, `WCC`, `WPC`.
En `W` además deja de depender de `gola` (con gola el valor no cambia).

**Fondo — los 4 superiores de pared que usaban 15 mm** (`W`, `TW`, `UW`, `WBL`)
pasan a 16 mm, quedando alineados con `S`/`SA`/`SBAS`/`SLOC`/`SMO`.

En `W` el ancho conserva su rama de gola, porque con `SM` el fondo sigue al
lateral —que se corta 1" más corto— en vez del alto nominal:
`gola ? A-1.62992 : A-0.62992`. Ver [w_sm_hoja_real.md](w_sm_hoja_real.md).
El largo queda sin condición porque ambas ramas coinciden en `L-0.62992`.

Los ejes se conservan: `largo` es el horizontal (base `L`) y `ancho` el vertical
(base `A`), que es lo que exige `intercambiar=false`. Ver
[ejes_fondo_backing.md](ejes_fondo_backing.md).

## Despiece resultante de `W2936`

| Pieza | Con manija | Con `SM` |
| --- | ---: | ---: |
| base_tapa | 706.6 × 304.8 | 706.6 × 304.8 |
| lateral | 914.4 × 304.8 | **889.0** × 304.8 |
| refuerzo_trasero | 706.6 × 80.0 | 706.6 × 80.0 |
| entrepaño | **705.6** × 266.7 | **705.6** × 266.7 |
| frente | 365.1 × 911.2 | 365.1 × 930.3 |
| fondo | **720.6 × 898.4** | **720.6 × 873.0** |

## Tipos que quedaron fuera a propósito

Los que modelan el entrepaño o el fondo con **medidas constantes** en vez de
expresiones en `L`/`A` no se tocaron, porque su despiece se tomó de una hoja a un
ancho concreto y la holgura ya está incorporada en el número:

- `BLS` — entrepaños de `29.82677` y `34.77953`
- `WER` — entrepaño de `22.00000`
- `SDB` — fondo de `16.62992 × 17.36220`
- `BMW` — fondo de `9.50079`

Estos tres aparecen como falsos positivos en cualquier auditoría que los pruebe a
anchos que no fabrican; ver la nota de `SDB` en
[ejes_fondo_backing.md](ejes_fondo_backing.md).

## Verificación

Auditoría empírica sobre el catálogo real (60 tipos, 348 escenas: 3 juegos de
medidas × `gola` 0/1): fondos y entrepaños dentro de la carcasa, sin dimensiones
inválidas, sin excepciones.

`tests/w-sm.test.ts` cubre la holgura en la rama con manija (entrepaño 705.6,
fondo 720.6 × 898.4) además del caso `SM`.

## Impacto en cotizaciones guardadas

La holgura reduce el área, así que el costo baja de forma marginal (en `W2936`,
unos 0.001 m² entre entrepaños y fondo). Las 47 líneas guardadas conservan su
precio hasta que su cotización se recalcule, momento en que `recalcularGrupo()`
las vuelve a costear con las fórmulas nuevas.
