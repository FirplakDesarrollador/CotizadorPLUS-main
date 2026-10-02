# BOMH-1 con hueco de horno paramétrico

## Fuente y alcance

`BOMH-1` se reconstruyó desde la hoja `BOMH36-1 MBLE INF COC MEDIO HORNO 1
GAVETA`. Usa `BMW-1` solo como guía estructural; no modifica su tipo, piezas,
reglas ni herrajes. El código comercial inserta el largo tras la familia: a 36
pulgadas produce `BOMH36-1`.

El nombre visible único en todos los selectores es `BOMH-1 Mueble inferior
medio horno`; los formularios no anteponen nuevamente el prefijo.

La tipología heredada `BOMH — Base para microondas` fue eliminada del catálogo
después de comprobar que no tenía líneas de cotización asociadas. `BOMH-1` es
la única tipología BOMH disponible.

## Despiece de referencia

La carcasa conserva base de 884,4×585,6 mm, dos laterales de 762×609,6 mm, un
refuerzo delantero y dos traseros de 884,4×80 mm, y un `entrepano_fijo` igual a
la base. La gaveta inferior usa `base_gaveta` de 809,4×492 mm,
`trasero_gaveta` de 797,4×183 mm y `frente_gaveta` de 332,8×911,2 mm. El fondo
inferior mide 332,8×898,4 mm.

## Hueco libre del horno

El Simulador y el formulario de cotizaciones muestran, debajo de las medidas
generales, `Largo libre del horno` y `Alto libre del horno`. La explicación
aclara que deben corresponder al espacio libre requerido por el fabricante para
empotrar el equipo. Los valores iniciales derivados de la hoja son 219,2×153,2
mm y se convierten con la unidad seleccionada.

`frente_izq` y `frente_der` conservan siempre `horno_alto` como alto y calculan
simétricamente su ancho físico con `((L-RV)-horno_largo)/2`. Las fórmulas se
guardan con los ejes de presentación de frentes del motor y el montaje las gira
al plano frontal. Así, la distancia libre
entre ambas piezas coincide siempre con `horno_largo`. El servidor rechaza
valores no positivos, un largo que no deje ancho para los laterales o un alto
igual o mayor al mueble.

## Herrajes y montaje

Declara una gaveta, cero puertas, un entrepaño fijo y cuatro patas. Incluye riel
Tandem, una manija, cuatro patas y dieciséis tornillos. La gaveta y el fondo se
montan en la parte inferior; los frentes laterales del horno quedan sobre el
entrepano fijo y separados por el hueco paramétrico.

El `refuerzo_delantero` conserva el corte `L-30 mm` × 80 mm, pero se monta de
canto en el plano frontal `XZ`, entre los laterales y contra la esquina
superior. El borde inferior de `frente_izq` y `frente_der` queda en `z=339,2
mm`: 3,2 mm de separación sobre el borde superior del `frente_gaveta`, que
ocupa desde 3,2 hasta 336 mm. Si `horno_alto` cabe en el espacio restante se
conserva; si lo excede, la fórmula limita el alto de ambos frentes al vano entre
`z=339,2mm` y la cara inferior del refuerzo superior (`A-80mm`). Esto reproduce
la fachada continua de referencia sin bloquear el cálculo ni crear solapes.

En planta, ambos frentes quedan dentro de la carcasa: `frente_izq` usa `x=TC`,
`frente_der` usa `x=L-TC-W` y los dos usan `y=0`. Así respetan el espesor de
los laterales, alinean su cara exactamente con el borde frontal y permanecen
debajo del refuerzo delantero.

El `refuerzo_delantero` pertenece al rol de tablero `frente`, no a `refuerzo`.
Por ello usa el mismo material seleccionado para los frentes y su espesor
efectivo es 18 mm cuando el tablero frontal configurado es de 18 mm. Su canto
permanece en calibre `22x1`.

## Variante BOMH-1-FE

`BOMH-1-FE` es una tipología independiente y conserva exactamente la carcasa,
el hueco paramétrico del horno, los tres frentes, el refuerzo delantero de
material frontal, el entrepaño y el fondo de `BOMH-1`. Para 36 pulgadas su
código comercial es `BOMH36-1-FE`.

La única sustitución es la caja de la gaveta inferior, que usa las reglas de
gaveta grande con riel Full Extension: dos `lateral_gaveta_grande` de 500×200
mm, `trasero_gaveta_grande` de `L-86 mm` × 180 mm, `contraparche_grande` de
`L-86 mm` × 200 mm y `base_gaveta` de 508 mm × `L-72 mm` en fondo de 6 mm.
El trasero lleva enchape en ambos lados largos y seis tarugos; el contraparche
también lleva seis tarugos. El herraje cambia exclusivamente de `RIELTANDEM` a
`RIELFE500`; conserva la manija, patas y tornillos de BOMH-1.
