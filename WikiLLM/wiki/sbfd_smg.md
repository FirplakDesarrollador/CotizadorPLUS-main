# SBFD-SMG: lavaplatos con gola metálica

`SBFD-SMG` es una tipología inferior independiente reconstruida desde la hoja
de corte suministrada para `SBFD38 SMG` y el montaje `HRJ SBFD33 SMG.iges`.
No deriva el despiece de `SBFD-SM`: SMG usa gola metálica y no incorpora la
pieza de tablero `gola_madera`.

## Despiece paramétrico

Para `L=38 in`, `A=30 in`, `P=24 in`, caja de 15 mm y frente de 18 mm:

| Pieza | Cantidad | Fórmula | Resultado (mm) |
|---|---:|---|---:|
| Base | 1 | `(L−2·TC) × (P−18 mm−TB)` | 935,2 × 585,6 |
| Laterales | 2 | `A × P` | 762 × 609,6 |
| Riel delantero | 1 | `(L−2·TC) × 80 mm` | 935,2 × 80 |
| Rieles traseros | 2 | `(L−2·TC) × 80 mm` | 935,2 × 80 |
| Puertas | 2 | `((L−2·RV)/2) × (A−30 mm)` | 479,4 × 732 |
| Fondo (6 mm) | 1 | `(A−2 mm) × (L−16 mm)` | 760 × 949,2 |

La tipología no tiene entrepaño. Conserva patas, tornillos y bisagras
de `SBFD-SM`, sin manijas. El catálogo actual no contiene una referencia de
herraje para el perfil de gola metálica; no se inventa código ni precio.

## Código comercial y visualización

Con caja de 15 mm el código es `SBFD<ancho>-SMG`. Si la caja seleccionada es de
18 mm, el segmento completo pasa a `SMG18`: `SBFD<ancho>-SMG18`. El montaje de
base, laterales, riel delantero, dos rieles traseros y puertas queda marcado
como confirmado contra el IGES. El hueco de 30 mm sobre las puertas representa
el sistema SMG.

La vista lateral del IGES determina la orientación: el riel delantero es una
placa horizontal de 80 mm de profundidad situada bajo la cara superior y
retirada 27 mm desde el frente (`plano=XY`, `y=27`, `z=A−TC`); los dos rieles
traseros son verticales, pegados al borde
posterior, uno abajo y otro arriba. La base queda horizontal abajo y las puertas
ocupan desde la base hasta 30 mm antes del borde superior. La base aplica la
misma resta de SBFD (`P-0.70866-TB`) y el fondo estándar de 6 mm se monta en
plano XZ inmediatamente después de la profundidad de la base.

Cada lateral conserva su corte nominal `A × P`, pero lleva un mecanizado pasante
en la esquina frontal superior para recibir la gola metálica: **27 mm de
profundidad × 73 mm de alto**. La vista lateral representa el perfil cóncavo del
rebaje; el mecanizado no altera el consumo rectangular del tablero.

Implementación: migraciones `0197_sbfd_smg.sql`,
`0198_sbfd_smg_riel_delantero_horizontal.sql` y
`0199_sbfd_smg_base_y_fondo.sql`, más la corrección
`0200_sbfd_smg_mecanizado_laterales.sql` y el retiro del refuerzo en
`0201_sbfd_smg_retirar_refuerzo_delantero.sql`. Regresiones:
`tests/sbfd-smg.test.ts` y `tests/module-groups.test.ts`.

## Agrupación física

Desde `0230_agrupacion_smg.sql`, esta familia y su variante -SF admiten
agrupación con las reglas existentes. Véase [agrupación SMG](plan_agrupacion_modulos.md#agrupación-smg-2026-10-30).
Se conserva su ausencia de entrepaño y gola de madera.
