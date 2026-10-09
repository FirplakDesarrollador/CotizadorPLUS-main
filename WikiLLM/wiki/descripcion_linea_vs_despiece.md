# La descripción de una línea contra el despiece real

## El defecto

`construirFilaLinea()` armaba la descripción de una línea con las **variables de
regla** del motor:

```ts
+ (res.vars.n_puertas    ? ` · ${res.vars.n_puertas} puerta(s)` : '')
+ (res.vars.n_cajones    ? ` · ${res.vars.n_cajones} gaveta(s)` : '')
+ (res.vars.n_entrepanos != null ? ` · ${res.vars.n_entrepanos} entrepaño(s)` : '')
```

`n_entrepanos` no describe el mueble: es una **regla global por altura** que
aplica a todo tipo sin excepción.

| Condición | `n_entrepanos` |
| --- | ---: |
| `A <= 16` | 0 |
| `A <= 24` | 1 |
| `A <= 36` | 2 |
| resto | 3 |

Una tipología usa ese valor solo si su pieza `entrepano` lo declara en
`formula_cantidad`. Muchas no lo hacen: lo tienen fijo, o no tienen la pieza.

## Alcance medido

Se evaluaron los **81 tipos activos** con el motor real sobre nueve juegos de
medidas, comparando `n_entrepanos` contra la suma de piezas `entrepano*` del
despiece.

| | |
| --- | ---: |
| Tipos evaluados | 81 |
| **Tipos donde la descripción no coincidía** | **47** |
| Tipos sin ninguna pieza de entrepaño | 36 |
| …de esos, los que aun así anunciaban entrepaños | **25** |

Ejemplos, todos reproducibles en la pestaña Cotizaciones:

| Tipo | Decía | Tiene | Por qué |
| --- | ---: | ---: | --- |
| `B`, `BFD` | 2 | **1** | su `entrepano` es `formula_cantidad: '1'`, fijo |
| `SBFD`, `BOV`, `BT`, `UVFD` | 2–3 | **0** | no tienen pieza de entrepaño |
| `AL` | 2 | **5** | alacena, cinco estantes fijos |
| `WPC` | 2 | **6** | torre, seis estantes |
| `VPC` | 2 | **5** | |
| `UW` | 0 | **1** | lleva `entrepano_fijo`, que la variable ignora |
| `WLD` | 2 | 2 | **correcto**: su pieza sí declara `n_entrepanos` |

`WLD` es la excepción que explicaba la confusión: sus filas sí cuadraban, lo que
hacía parecer que el contador funcionaba.

## La corrección

`contarEntrepanos()` (`muebles.ts`) suma las piezas `entrepano*` del despiece que
el motor acaba de calcular, y la descripción usa eso. Verificado tras el cambio:
**0 discrepancias en los 81 tipos**.

Cuenta también `entrepano_fijo` (`UW`, `BMW-1`, `BOMH-1` y sus variantes FE): es
una pieza más de la hoja de corte, con su material y su canto.

El contador se **omite cuando es cero**, igual que ya ocurría con puertas y
gavetas, en lugar de anunciar `· 0 entrepaño(s)`.

## Deuda conocida: el mismo defecto en puertas y gavetas

La misma comparación sobre los otros dos contadores:

| Contador | Tipos donde no coincide |
| --- | ---: |
| `n_puertas` contra piezas de puerta | **45** |
| `n_cajones` contra bases de gaveta | **12** |

**No se corrigieron.** El encargo era sobre entrepaños, y a diferencia de estos,
"qué pieza es una puerta" no es evidente: el motor usa el mismo nombre `frente`
para una puerta y para la cara de una gaveta, y `nombrePieza()` ya arrastra esa
distinción en otra capa. Definirlo bien es su propio análisis, no un efecto
colateral de este.

## Las líneas ya guardadas

La descripción se recalcula al editar una línea o al recalcular la cotización, de
modo que las existentes conservan el texto anterior hasta entonces. No se hizo
migración: a diferencia de los elementos planos (ver `0182`), aquí el valor
correcto no se puede derivar en SQL — hay que correr el motor por línea.

## Cobertura

`tests/muebles.test.ts` cubre `contarEntrepanos` con seis casos: la suma simple,
`entrepano_fijo`, el módulo sin entrepaños, las cantidades cero o negativas, que
no confunda `soporte_entrepano` con un estante, y el redondeo de cantidades
fraccionarias que aparecen al agrupar módulos.
