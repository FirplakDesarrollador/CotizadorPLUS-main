# Torres PC, PCFD, VPC y PCFD-MO

`PC`, `PCFD`, `VPC` y `PCFD-MO` exigen `TK` en Simulador y Cotizaciones. Admite
cero y define la altura estructural `A - TK` de laterales, fondo y frentes.

`PC` y `VPC` exigen `PUERTA_SUP`. El número horizontal es una puerta bajo 24
pulgadas y dos desde 24. El nivel superior mide `PUERTA_SUP - RV`; el inferior
usa `A - TK - PUERTA_SUP - RV`.

En `PC`, `n_entrepanos = 5` expresa el total funcional. La tercera pieza de
`base_tapa` actúa como entrepaño fijo, por lo que la pieza `entrepano` tiene
cantidad fija `4` (cuatro ajustables). En la visualización, las puertas
inferiores comienzan en `TK` y las superiores se anclan arriba con la luz `RV`;
el orden de las filas de la plantilla no altera sus niveles.

En `PCFD`, `base_tapa_division` tiene cantidad `3`: base, división fija y tapa,
todas con el mismo corte y ubicadas por delante del fondo. `entrepano` usa
`n_entrepanos - 1`; en la configuración estándar quedan cuatro móviles más la
división fija. Las configuraciones OP también descuentan esa división para no
duplicar el entrepaño estructural.

La migración `0218_torres_tk_puerta_sup_pcfd_mo.sql` crea `PCFD-MO`. `MO`
define un hueco central abierto entre dos entrepaños fijos. Las zonas de puerta
superior e inferior se controlan con `PUERTA_SUP`: la superior mide
`PUERTA_SUP - RV` y la inferior `A - TK - PUERTA_SUP - MO - 2*TF - RV`.
`MO` es la luz libre entre las caras internas de los dos entrepaños fijos; las
puertas llegan a esos puntos conservando `RV`. Los dos fijos usan rol `frente`,
por lo que reciben el tablero y espesor elegidos para los frentes (por ejemplo,
18 mm). No hereda rieles ni push de PCFD-OP.

Aunque `entrepano_fijo` usa rol `frente`, el despiece conserva su orientación
horizontal: largo `L-2*TC` (732 mm en un módulo de 762 mm) y ancho `P-0.9`.
La visualización reparte los tres entrepaños móviles con uno en la zona superior
y dos uniformemente en la zona inferior; ninguno queda adosado al vano MO.

El ancho de `base_tapa` y `entrepano_fijo` usa `P - 0.70866 - TB`: descuenta
18 mm de retiro más el espesor real del fondo. Con `P = 609,6 mm` y fondo de
6 mm, ambas piezas miden 585,6 mm de ancho; cambiar el espesor del fondo vuelve
a calcular la medida.
