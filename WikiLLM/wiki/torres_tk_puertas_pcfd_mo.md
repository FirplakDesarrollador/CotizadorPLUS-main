# Torres PC, PCFD, VPC y PC-MO

## Distribución PC revisada (2026-11-12)

En el montaje de PC, el centro del fijo (`base_tapa`, segunda de tres piezas)
coincide con el centro de la junta entre puertas: `A-PUERTA_SUP-RV/2`, en mm.
No se coloca a la mitad de la carcasa cuando PUERTA_SUP cambia.
Los cuatro móviles se distribuyen dentro de las zonas separadas por el fijo.
La zona superior aplica los umbrales de altura del catálogo (hasta 16 pulgadas:
0; hasta 24: 1; hasta 36: 2; mayor: 3), contando el fijo y descontándolo del
número de móviles superiores. Por ejemplo, con PUERTA_SUP de 36 pulgadas hay
un móvil superior y tres inferiores, además del fijo. Las cantidades y cortes
se conservan; las medidas del motor ya llegan normalizadas a pulgadas.

Regresiones: `tests/pc-entrepanos-visualizacion.test.ts`, alturas 15/24/36/40.
Esta corrección afecta al montaje compartido por Simulador y Cotizaciones.
Las variantes SM/SMG están implementadas; véanse las
[cotas, copias y verificaciones](pc_bmw_bomh_sm_smg.md).

`PC`, `PCFD`, `VPC`, `OVPC` y `PC-MO` exigen `TK` en Simulador y Cotizaciones. Admite
cero y define la altura estructural `A - TK` de laterales, fondo y frentes.

Sus códigos comerciales contienen largo, alto y profundidad y terminan con el
TK separado por un espacio, por ejemplo `PC309624-MO TK4` (prefijo actual PC, tras el renombre de la migración 0261).

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

La migración `0218_torres_tk_puerta_sup_pcfd_mo.sql` crea `PC-MO`. `MO`
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
