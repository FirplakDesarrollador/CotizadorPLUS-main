# BMW-1 desde hoja de producción

## Fuente y código comercial

La tipología `BMW-1` se reconstruyó desde la hoja `BMW36-1 MBLE INF COC
MICROONDAS 1 GAVETA`. Es independiente de `BMW`. El largo se inserta después
de la familia y antes del sufijo de cantidad: para 36 pulgadas el código es
`BMW36-1`.

La tipología histórica `BMW` fue eliminada porque conservaba medidas aproximadas
(`582,6`, `803,4`, `193,3`, entre otras) y podía confundirse con la nueva
plantilla validada. No tenía líneas de cotización asociadas al eliminarla;
`BMW-1` es la única tipología BMW del catálogo.

La referencia nominal mide 36×30×24 pulgadas y produce doce piezas físicas:

- base de 884,4×585,6 mm;
- dos laterales de 762×609,6 mm;
- un refuerzo delantero y dos traseros de 884,4×80 mm;
- un `entrepano_fijo` de 884,4×585,6 mm;
- `base_gaveta` de 809,4×492 mm y `trasero_gaveta` de 797,4×68 mm;
- `frente_gaveta` de 220,13×911,2 mm;
- frente inferior de 535,47×911,2 mm;
- fondo de 241,33×898,4 mm.

Los nombres de producción se normalizan al vocabulario del motor: `BASE` a
`base`, `SIDE R/L` a `lateral`, `RAIL` a `refuerzo_*`, `FONDO GAVETA` a
`base_gaveta`, `TRASERO CAJON` a `trasero_gaveta`, `FRENTE GAVETA` a
`frente_gaveta` y `BACKING` a `fondo`.

## Reglas y herrajes

BMW-1 declara una gaveta, cero puertas, un entrepaño fijo y cuatro patas. Su
plantilla de herrajes incluye un par de riel Tandem (`RIELTANDEM`), una manija
`MANIJA415`, cuatro patas `PATA10AJUST` y dieciséis tornillos `TORNILLO858`.
No incluye bisagras porque el panel inferior se identifica como `FRENTE`, no
como puerta, en la fuente.

## Montaje inferior

La gaveta es inferior. Su frente comienza a 3,2 mm de la base y termina a
223,33 mm; el frente grande ocupa el tramo superior desde 226,53 mm. La
`base_gaveta` y el `trasero_gaveta` se vinculan a esa ranura inferior.

El `entrepano_fijo` tiene exactamente la misma medida que la base: `L-30 mm` por
`P-24 mm` (884,4×585,6 mm en BMW36-1). Se centra en la junta de los frentes:
el frente de gaveta termina a 223,33 mm, el frente superior inicia a 226,53 mm
y el centro queda a 224,93 mm; por ello su base visual es
`z=224,93-H/2`. En profundidad ocupa el espacio entre frentes y fondo mediante
`y=P-D`.

El `refuerzo_delantero` se monta en la esquina frontal superior (`y=0`,
`z=A-H`), con su cara superior al ras del alto nominal. No se monta junto al
`entrepano_fijo`; la vista lateral de referencia marca como destino el extremo
superior azul.

La fuente mezcla tableros de 15 y 18 mm. El cotizador conserva los roles
semánticos habituales (`caja`, `refuerzo`, `frente`, `fondo`); el espesor y el
precio efectivos provienen del perfil de materiales seleccionado, como en el
resto de tipologías.

## Variante BMW-1-FE

`BMW-1-FE` conserva sin cambios la carcasa, el `entrepano_fijo`, el fondo
inferior y los dos frentes de `BMW-1`. Su código comercial coloca el largo tras
la familia: a 36 pulgadas produce `BMW36-1-FE`.

La única sustitución corresponde a la gaveta. En lugar del conjunto Tandem de
`BMW-1`, usa la caja de madera de `B-FE`: dos laterales de 100×500 mm, trasero
`L-86 mm` × 80 mm, contraparche `L-86 mm` × 100 mm y fondo de 6 mm
`L-72 mm` × 492 mm. El herraje cambia exclusivamente de `RIELTANDEM` a
`RIELFE500`; conserva la manija, cuatro patas y dieciséis tornillos de BMW-1.
La gaveta sigue montada en el tramo inferior, debajo del entrepaño fijo.
