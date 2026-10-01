# WBL-D-L/R-SM — mueble superior Blind Door

## Alcance

`WBL-D-L/R-SM` es una tipología superior independiente. Su geometría proviene
de la hoja de producción `WBL3840 D22 7/8L-SM`; no copia ni deriva piezas de la
tipología histórica `WBL`.

En todos los selectores se presenta una sola vez como
`WBL-D-L/R-SM — Mueble superior Blind Door`; el prefijo no se vuelve a anteponer
al nombre descriptivo almacenado.

El formulario exige dos parámetros debajo de las medidas generales:

- `Puerta`: ancho nominal del frente móvil; acepta decimales y fracciones
  imperiales como `22 7/8`.
- `Apertura`: mano `L` o `R`, usada para ubicar la puerta móvil y el panel fijo.

El código comercial sigue el patrón
`WBL<largo><alto>-D<Puerta><L/R>-SM`. Para la referencia fuente produce
`WBL3840-D22 7/8L-SM`.

## Piezas paramétricas

Para `L=38in`, `A=40in`, `P=12in` y `Puerta=22 7/8in`:

- base y tapa: `L−30mm × P` = 935,2 × 304,8mm;
- dos laterales: `A × P` = 1016 × 304,8mm;
- dos refuerzos traseros: `L−30mm × 80mm` = 935,2 × 80mm;
- entrepaños: `L−31mm × P−38,1mm` = 934,2 × 266,7mm;
- puerta móvil: `Puerta−3,2mm × A+15,85mm` = 577,83 × 1031,85mm;
- `Blind Door`: `L−Puerta × A+19,05mm` = 384,18 × 1035,05mm;
- fondo: `A−16mm × L−16mm` = 1000 × 949,2mm.

`Blind Door` es el nombre fijo de esa pieza. Las demás usan la nomenclatura
normalizada del catálogo. El fondo queda delante de los refuerzos traseros y
los entrepaños terminan en la cara frontal del fondo.

## Reglas

La tipología tiene una puerta móvil, ningún cajón ni pata y no incluye manija;
solo cobra el par de bisagras correspondiente. No permite agrupación física.

Aplica la regla compartida de entrepaños superiores:

- hasta 17in: 0;
- de más de 17in hasta 27in: 1;
- de más de 27in hasta 40in: 2;
- más de 40in: 3.

La migración idempotente `0129_wbl_d_lr_sm.sql` crea y activa el tipo, sus
plantillas, reglas y herraje en Supabase.
