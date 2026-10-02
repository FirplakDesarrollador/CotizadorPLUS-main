# BOV24 desde hoja real

La hoja `HRJ BOV24 SMG Expocamacol` confirma un mueble de 24×30×24 pulgadas
con cinco renglones y siete piezas físicas: una base, dos laterales, dos rails
traseros, un rail delantero y un frente de horno.

| Pieza interna | Cantidad | Largo × ancho (mm) | Rol |
|---|---:|---:|---|
| `base` | 1 | 579,6 × 594,6 | `caja` |
| `lateral` | 2 | 762 × 609,6 | `caja` |
| `refuerzo_trasero` | 2 | 579,6 × 80 | `refuerzo` |
| `refuerzo_delantero` | 1 | 579,6 × 80 | `caja` |
| `frente` | 1 | 758,8 × 606,4 | `frente` |

Las fórmulas paramétricas son `L-2*TC` para los elementos interiores,
`P-TC` para la profundidad de la base, `A-RV` para el largo del frente y
`L-RV` para su ancho. En ambos ejes del frente, `RV` equivale a 3,2 mm. Los
dos rails traseros se representan como instancias independientes: uno sobre la
base y otro al ras superior. El rail delantero queda arriba y el frente de
horno cubre el alto exterior descontando el reveal superior de 3,2 mm.

La migración `0158_bov24_hoja_real.sql` sustituye las dos filas ambiguas
llamadas `base` de la plantilla anterior por este despiece confirmado. La
prueba `tests/bov24-hoja-real.test.ts` valida medidas, cantidad física y escena.
