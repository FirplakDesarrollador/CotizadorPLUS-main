# W2936-SM desde hoja real

## Fuente primaria

El usuario adjunto una hoja real titulada:

```text
W2936-SM MBLE SUP COC 2 PUERTAS 2 ENTREPANOS
```

La referencia corresponde a un mueble superior `W` de 29" de largo, 36" de alto
y 12" de profundidad, con sistema de frente `SM`/gola, dos puertas y dos
entrepanos.

Esta integracion siguio el protocolo de [patron_integracion_tipologias.md](patron_integracion_tipologias.md),
con una salvedad importante: `SM` no se modelo como tipo nuevo. Segun la wiki
previa de [variantes_frente_gola_sm.md](variantes_frente_gola_sm.md), `SM` es
una variante transversal de sistema de frente. Por eso la solucion correcta fue
mantener el tipo base `W` y activar la variable `gola=1`.

## Despiece confirmado

La hoja real pide estas piezas:

| Pieza | Cantidad | Largo mm | Ancho mm | Espesor | Canto |
| --- | ---: | ---: | ---: | ---: | --- |
| BASE - R16L B | 1 | 706.6 | 304.8 | 15 | 2 largos color, 0.45 |
| TAPA - R16L B | 1 | 706.6 | 304.8 | 15 | 2 largos color, 0.45 |
| SIDE R - R16L B | 1 | 889.0 | 304.8 | 15 | 2 largos y 2 anchos color, 0.45 |
| SIDE L - R16L B | 1 | 889.0 | 304.8 | 15 | 2 largos y 2 anchos color, 0.45 |
| RAIL TRASERO P | 2 | 706.6 | 80.0 | 15 | 2 largos blanco, 0.45 |
| SHELF P | 2 | 705.6 | 266.7 | 15 | 2 largos y 2 anchos blanco, 0.45 |
| DOOR C | 2 | 930.25 | 365.1 | 18 | 2 largos y 2 anchos color, 1 |
| BACKING F | 1 | 873.0 | 720.6 | 6 | sin canto |

## Correccion posterior: el lateral va 1" mas corto

La transcripcion original de esta hoja registraba `SIDE = 914.4mm` (36") y
`BACKING = 898.4mm`, tomando el alto nominal como si fuera el corte del lateral.

Confirmado con el usuario: **en un `W` con `SM` el lateral se corta 1" menos que
el alto nominal**. Para `W2936-SM` (A=36") el lateral es 35" = 889mm; esa pulgada
la ocupa la gola. El backing sigue al lateral, no al nominal, y conserva su misma
holgura de 16mm: `A-1.62992` = 873.0mm. Sin ese ajuste el backing quedaria 9.4mm
mas alto que el lateral, imposible de armar.

Las tablas de arriba ya estan corregidas. La regla vive en
`0048_w_sm_lateral_una_pulgada_menos.sql` y solo aplica a la rama con gola: un `W`
con manija conserva `lateral = A`.

## Formulas aplicadas

El tipo `W` ya tenia carcasa, cantidad de puertas, cantidad de entrepanos y
herrajes funcionales. La migracion `0045_w_sm_hoja_real.sql` solo agrego ramas
condicionales cuando `gola=1`:

- `entrepano.formula_largo = L - 2*TC - gola*0.03937`, que resta 1 mm solo en
  `SM`.
- `frente.formula_ancho = gola ? A+0.62402 : A-RV`, que da puerta de
  930.25 mm de alto para `A=36`.
- `fondo.formula_largo = gola ? L-0.62992 : L-TC`.
- `fondo.formula_ancho = gola ? A-1.62992 : A-0.59`.
  (`0047` corrigio los ejes que 0045 habia invertido -- ver
  [ejes_fondo_backing.md](ejes_fondo_backing.md); `0048` lo ato al lateral)
- `lateral.formula_largo = gola ? A-1 : A` (`0048`).
- `entrepano.formula_largo = L-2*TC-0.03937` y `fondo.formula_largo = L-0.62992`
  (`0049`: la holgura de 1mm es estructural y no depende de gola; ver
  [holgura_1mm_estructura.md](holgura_1mm_estructura.md))
- Orden HDR del tipo `W`: BASE/TAPA, SIDE, RAIL, SHELF, DOOR, BACKING.

Con `gola=0`, `W` conserva su comportamiento anterior.

## Herrajes y precio

La fila `W2936-SM` del Excel CEMA vigente
`Simulacion muebles CEMA (10-09-2026).xlsx` aparece en `Costos Muebles` y
`Precio` con costo de herrajes COP 11.600. Esa cifra corresponde exactamente a
dos bisagras de COP 5.800 y cero manijas.

El motor quedo ajustado para que `gola=1` excluya herrajes con rol `manija`,
pero conserve bisagras y otros herrajes funcionales. Esto evita cobrar las dos
manijas `MANIJA415` que lleva un `W` normal.

## Superficies actualizadas

- Simulador: al seleccionar `W`, la profundidad se inicializa en 12"; el selector
  de sistema de frente ya envia `gola=1` para Gola/SM.
- Cotizaciones: `recalcularGrupo()` agrega el sufijo comercial `-SM` cuando la
  linea tiene `sistemaFrente='gola'`, por ejemplo `W2936-SM`.
- HDR: el modo manual permite escoger sistema de frente, arma el titulo
  `W2936-SM` y muestra puertas con orientacion de hoja real, es decir alto x
  ancho (`930.25 x 365.1`) aunque internamente el motor conserve el eje
  horizontal primero.
- Supabase: `0045_w_sm_hoja_real.sql` fue aplicada en la base real y luego
  verificada consultando las formulas de `cot_piezas_plantilla`.
- Visualizacion: la puerta de `W` con gola mide `A+15.85mm`, mas que la carcasa.
  Ese sobrante es el agarre inferior del superior, asi que la escena lo cuelga
  **por debajo de la base** y deja el canto superior a ras de la tapa. Ver
  [visualizacion_gola_voladizo.md](visualizacion_gola_voladizo.md).

## Validacion

Se valido la migracion contra datos leidos desde Supabase con `L=29`, `A=36`,
`P=12`, `TC=15mm`, `RV=3.2mm`, `gola=1`, `n_puertas=2` y `n_entrepanos=2`.
El resultado reproduce la hoja:

| Pieza motor | Cantidad | Largo mm | Ancho mm |
| --- | ---: | ---: | ---: |
| base_tapa | 2 | 706.6 | 304.8 |
| lateral | 2 | 889.0 | 304.8 |
| refuerzo_trasero | 2 | 706.6 | 80.0 |
| entrepano | 2 | 705.6 | 266.7 |
| frente | 2 | 365.1 | 930.25 |
| fondo | 1 | 720.6 | 873.0 |

Tambien se agrego `tests/w-sm.test.ts` para cubrir geometria, ausencia de
manijas y no-regresion de `W` con manija. TypeScript y ESLint focal pasaron.
El runner `tsx --test` no alcanzo a ejecutar por un error del entorno en Windows
(`uv_os_get_passwd ENOMEM`), no por una falla de aserciones.
