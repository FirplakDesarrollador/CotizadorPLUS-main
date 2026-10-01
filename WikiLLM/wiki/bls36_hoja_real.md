# BLS36 desde hoja de producción

## Fuente y alcance

La hoja `BLS36 MBLE INF COC LAZY SUSAN 2 PUERTAS 1 ENTREPANO CARB2`
reemplaza la plantilla histórica de `BLS`, que mezclaba piezas de varias
referencias. La migración `0131_bls36_hoja_real.sql` reconstruye la tipología
sin heredar esa mezcla.

La referencia nominal es 36×30×24in y produce once piezas físicas:

- base de 914,4×914,4mm;
- lateral derecho e izquierdo de 747×609,6mm, con cantos cortos distintos;
- refuerzo delantero superior de 884,4×200mm;
- refuerzo delantero central de 289,8×80mm;
- refuerzo trasero de 747×177,8mm;
- fondos izquierdo y derecho de 788,7×747mm en tablero de caja de 15mm;
- un entrepaño de 757,6×757,6mm;
- dos puertas iguales de 758,8×279,4mm en frente de 18mm.

## Decisiones de catálogo

`BLS` queda activa, no agrupable, con dos puertas, un entrepaño, cero gavetas y
cuatro patas. Los dos fondos usan rol `caja`, no `fondo`, porque la hoja exige
15mm y no el tablero delgado habitual del backing. No se agregan herrajes Lazy
Susan: la fuente de precios existente es contradictoria y la hoja suministrada
solo confirma el despiece de tableros.

El nombre de catálogo ya incluye el prefijo y se presenta sin duplicarlo en los
selectores: `BLS — Mueble inferior esquinero Lazy Susan`.

La regla global vigente para cantos de refuerzos se conserva: todos los
refuerzos llevan canto en ambos lados largos, aun cuando la columna de canto
blanco de la hoja solo explicita algunos bordes adicionales.

## Montaje visual validado con IGES

El archivo `BLS36.iges` contiene once sólidos nombrados y confirma que BLS no se
debe representar como una caja rectangular convencional. La migración
`0132_bls36_visualizacion_iges.sql` conserva intacto el despiece y parametriza
la visualización con estas relaciones:

- planta esquinera con base cuadrada de 914,4 mm;
- laterales y respaldos en alas perpendiculares;
- refuerzos delanteros perpendiculares en el entrante;
- dos puertas a 90 grados entre sí;
- refuerzo trasero diagonal a 45 grados;
- entrepaño a 200 mm sobre la base.

El visor admite giros no ortogonales para representar el refuerzo diagonal. El
entrepaño se mantiene como aproximación rectangular basada en su medida de
corte, porque el esquema visual representa paneles por cajas y no contornos BREP.

Las puertas se muestran cerradas: la hoja horizontal inicia en `L-282,6 mm` y
la perpendicular en `2L/3+TF`; ambas se encuentran junto al rincón conservando
la holgura de 3,2 mm. El refuerzo trasero se apoya en el fondo izquierdo y se
dirige hacia la esquina posterior a `+45°`. Su origen compensa tanto el ancho
como el espesor proyectados con `sqrt(1/2)`, manteniéndolo dentro del perímetro.
