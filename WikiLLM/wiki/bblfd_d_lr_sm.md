# BBLFD-D-L/R-SM

`BBLFD-D-L/R-SM` es una tipología inferior independiente basada en la plantilla
vigente `BBLFD-D-L/R`. Conserva base, laterales, refuerzos traseros, entrepaño,
Blind Door, fondo, reglas, patas, tornillos y bisagras. Al integrar Gola de
madera no incluye manija.

## Cambios estructurales

- `refuerzo_vertical`: largo `A-TC`, 80 mm de profundidad y cuatro tarugos.
- `refuerzo_delantero` horizontal del lado Blind Door: largo
  `L-door-RV/4-1,5TC`; termina en la cara del montante vertical.
- Segundo `refuerzo_delantero`: 80 mm de alto por `door+RV/4-1,5TC`, vertical en
  plano XZ, a 20 mm del frente y con cuatro tarugos.
- `gola_madera`: `door+RV/4-1,5TC` × 80 mm, horizontal bajo el segundo refuerzo,
  con cuatro tarugos y apoyada en `y=0` contra la cara interna del frente.
- Puerta móvil `frente`: alto `A-30 mm` y ancho `door-RV`.

El descuento `1,5TC` mide desde la cara interior del lateral hasta la cara del
montante: un calibre corresponde al lateral y medio calibre al montante
centrado en la junta. Los dos tramos no se solapan con `refuerzo_vertical`.
La Blind Door usa `L-door-RV/2`: descuenta solo 1,6 mm porque su otro extremo
queda alineado con el lateral. La junta con el frente móvil es por tanto de
1,6 mm; el lado exterior de la puerta móvil conserva su retiro de 3,2 mm.

La mano L/R invierte las posiciones: la pareja refuerzo vertical de 80 mm +
Gola ocupa siempre el lado de la puerta móvil, mientras el refuerzo horizontal
de 80 mm ocupa el lado del Blind Door. El código comercial es
`BBLFD<largo>-D<Door><L/R>-SM`.
