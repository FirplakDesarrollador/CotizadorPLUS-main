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
superior. `frente_izq` y `frente_der` quedan inmediatamente debajo de su cara
inferior mediante `z=A-80-H`.
