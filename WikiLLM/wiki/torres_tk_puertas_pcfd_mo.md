# Torres PC, PCFD, VPC y PCFD-MO

`PC`, `PCFD`, `VPC` y `PCFD-MO` exigen `TK` en Simulador y Cotizaciones. Admite
cero y define la altura estructural `A - TK` de laterales, fondo y frentes.

`PC` y `VPC` exigen `PUERTA_SUP`. El número horizontal es una puerta bajo 24
pulgadas y dos desde 24. El nivel superior mide `PUERTA_SUP - RV`; el inferior
usa `A - TK - PUERTA_SUP - RV`.

La migración `0218_torres_tk_puerta_sup_pcfd_mo.sql` crea `PCFD-MO`. `MO`
define un hueco central abierto entre dos entrepaños fijos. Las zonas de puerta
superior e inferior reparten la altura restante y cada frente mide
`(A - TK - MO) / 2 - RV`. No hereda rieles ni push de PCFD-OP.
