# BFD-SMG: mueble inferior con gola metálica

`BFD-SMG` se reconstruye desde la hoja de producción BFD24-SMG. Es un mueble
inferior de dos puertas con un entrepaño, fondo estándar de 6 mm y gola metálica.
No incluye gola de madera ni manijas.

## Despiece de referencia

Para `L=24 in`, `A=30 in`, `P=24 in`, caja de 15 mm y frente de 18 mm:

| Pieza | Cantidad | Resultado (mm) |
|---|---:|---:|
| Base | 1 | 579,6 × 585,6 |
| Laterales | 2 | 762 × 609,6 |
| Refuerzo delantero | 1 | 579,6 × 80 |
| Rieles traseros | 2 | 579,6 × 80 |
| Entrepaño | 1 | 578,6 × 558,8 |
| Puertas | 2 | 732 × 301,6 |
| Fondo de 6 mm | 1 | 760 × 593,6 |

Los laterales conservan el corte nominal `A × P` y reciben un mecanizado pasante
frontal-superior de **27 × 73 mm**. El refuerzo delantero es horizontal, está
bajo la cara superior y comienza 27 mm detrás del frente. El fondo se representa
en plano XZ y el entrepaño en plano XY.

## Código comercial

La combinación estándar produce `BFD<ancho>-SMG`. Cuando caja y frentes son de
18 mm, el segmento se compacta como `BFD<ancho>-SMG18`.

Implementación: `0202_bfd_smg.sql`. Regresiones: `tests/bfd-smg.test.ts` y
`tests/module-groups.test.ts`.

## Agrupación física

Desde `0230_agrupacion_smg.sql`, esta familia y su variante -SF admiten
agrupación con las reglas existentes. Véase [agrupación SMG](plan_agrupacion_modulos.md#agrupación-smg-2026-10-30).
Se conservan los mecanizados de 27 × 73 mm y el refuerzo frontal retirado 27 mm.
