# SBFD: copia de SBFD-SM sin gola, refuerzo de 128 mm

## Origen y alcance

`SBFD` existía en el catálogo pero estaba inactiva desde la migración `0194`,
que retiró `F`, `OILVP` e `ILVP` (los alias métricos de `OSBFD` y `SBFD`).
La migración `0266_sbfd_sin_gola_refuerzo_128.sql` la reactiva conservando su
identidad (`id`, `pref = SBFD`, `pref_metrico = ILVP`) y reemplaza su
configuración por una copia curada de `SBFD-SM`.

`SBFD-SM` permanece intacta: sigue con gola de madera, refuerzo delantero de
80 mm y puerta `A−30 mm`.

## Cambios aplicados sobre la copia

| Elemento | SBFD-SM | SBFD |
|---|---|---|
| Gola de madera | 1 pieza `gola_madera` de 80 mm | Sin pieza |
| Refuerzo delantero | 80 mm, `y = 20` | **128 mm** (`128/25.4`), `y = 0` |
| Puerta | `A−30/25.4` | **`A−RV`** (3,2 mm arriba) |
| Manijas | No cotiza | Sí, `MANIJA415` por puerta |
| Entrepaño | Sin entrepaño | Sin entrepaño |
| Cajones | 0 | 0 |
| Patas | 4 (5 si `L > 36`) | Igual |

El refuerzo queda **inmediatamente detrás de los frentes**: en el montaje la
cara posterior de la puerta está en el plano frontal de la carcasa (`y = 0`)
y el refuerzo arranca en ese mismo plano, sin la separación de 20 mm de
`SBFD-SM`. Su canto superior remata en `A` y su alto es de 128 mm.

Se copian las reglas, piezas y herrajes de `SBFD-SM` y después se aplican las
excepciones anteriores. Las reglas copiadas son `gola = 0`, `n_cajones = 0`,
`n_entrepanos = 0`, `n_puertas` (1 si `L < 24`, 2 si `L ≥ 24`) y `n_patas`.

## Despiece de referencia

Para `SBFD 30 × 30 × 24 in` con caja de 15 mm y frente de 18 mm:

| Pieza | Cantidad | Resultado (mm) |
|---|---:|---:|
| Base | 1 | 732,0 × 585,6 |
| Laterales | 2 | 762,0 × 609,6 |
| Refuerzo delantero | 1 | 732,0 × **128,0** |
| Refuerzos traseros | 2 | 732,0 × 80,0 |
| Puertas | 2 | 377,8 × **758,8** |
| Fondo (6 mm) | 1 | 760,0 × 746,0 |

## Catálogo cotizable

`SBFD` se excluía también por su alias métrico `ILVP` en
`TIPOLOGIAS_NO_COTIZABLES` (`src/lib/cotizar.ts`). Se retiró `ILVP` de esa
lista defensiva para que la fila reactivada aparezca en Simulador y
Cotizaciones. `OILVP` (alias de `OSBFD`) se conserva inactiva.

## Verificación

- Respaldo previo de tipos, piezas, reglas y herrajes de `SBFD` y `SBFD-SM`
  en `.tmp/backup-sbfd-0264.json`.
- Ensayo completo en transacción revertida antes de aplicar; las guardas de la
  migración comprueban seis piezas, ausencia de `gola_madera`, refuerzo de
  128 mm con `y = 0`, puerta `A-RV`, manija y regla `n_entrepanos = 0`.
- Migración aplicada y registrada como `sbfd_sin_gola_refuerzo_128`
  (versión `20261113161935`).
- `tests/sbfd.test.ts` cubre el despiece, las manijas, la ausencia de gola y
  la posición del refuerzo contra la cara posterior de la puerta.
- `tests/tipologias-inactivas.test.ts` actualizado: `ILVP` deja de estar en la
  exclusión compartida y `SBFD` se reactiva.
