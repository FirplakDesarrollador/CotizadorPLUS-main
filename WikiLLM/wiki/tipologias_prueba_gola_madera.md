# Tipologías nuevas de Prueba Tipologías

La migración `0081_tipologias_prueba_gola_madera.sql` incorpora cuatro
tipologías paramétricas independientes de las familias existentes `BFD`, `OW`
y `W`. No las actualiza ni reutiliza sus plantillas.

| Prefijo nuevo | Código de ejemplo | Regla propia |
| --- | --- | --- |
| `BFD-SM` | `BFD16-SM` | Un entrepaño y refuerzo GOLA de madera adicional. Conserva patas y bisagras de BFD, sin manijas. |
| `OW-MO` | `OW2425-MO` | Sin puertas ni entrepaños; base de profundidad `P + 130 mm` y BACKING añadido. |
| `W-SM` | `W3436-SM` | Sin manijas; usa únicamente las piezas de la hoja WXXXX-SM y conserva bisagras W. |
| `W-SM-PUSH` | `W332124-SM-PUSH` | Sin manijas; usa las piezas de su hoja y agrega un Push To Open por puerta. |
| `W-SM-LOC` | `W3436-SM-LOC` | Variante independiente del W-SM vigente, sin entrepaños en ninguna altura. |
| `SBFD-SM` | `SBFD16-SM` | Variante independiente de BFD-SM, sin entrepaño. Conserva Gola de madera, puertas y herrajes funcionales. |
| `SB-SM` | `SB30-SM` | Inferior con frente falso, puertas inferiores y Gola de madera, según la hoja SB30-SM. |

## Prioridad de reglas PLUS

- Las puertas SM inferiores con B en el prefijo usan `A - 30 mm`; las demás
  puertas usan la regla PLUS de `A - RV` (3,2 mm).
- Base y tapa cuentan ocho tarugos por pieza.
- Los entrepaños se calculan con las reglas vigentes por altura, quedan delante
  del fondo y usan soportes.
- Los descuentos usan `TC` y `TB` del perfil de material activo, no constantes
  de 15 o 6 mm.
- El sufijo comercial de una tipología se mantiene al final: las medidas se
  insertan antes de `-SM`, `-MO` o `-SM-PUSH`.

`SBFD-SM` se copia desde la plantilla vigente de `BFD-SM`, por lo que conserva
las fórmulas dependientes de `TC`, `TB` y `RV`, así como el montaje visual
confirmado del refuerzo delantero y la Gola. La migración excluye la pieza
`entrepano` y fija `n_entrepanos = 0`; no genera soportes de entrepaño.

`W-SM-LOC` se copia desde la plantilla vigente de `W-SM`, de modo que conserva
el corte de laterales, puerta, fondo y sus coordenadas visuales. Excluye la
pieza `entrepano` y fija `n_entrepanos = 0`, independientemente del alto.

`SB-SM` se modela desde la hoja SB30-SM: el frente falso ocupa la parte
superior, las puertas quedan debajo y no hay entrepaños. Para una referencia de
30 × 30 × 24 pulgadas, reproduce base 732 × 585,6 mm, laterales 762 × 609,6 mm,
puertas 579,6 × 377,8 mm, frente falso 122,4 × 758,8 mm y fondo 760 × 746 mm.
Como las demás SM inferiores, no tiene manijas y usa Gola de madera explícita.

En el montaje de `SB-SM`, `0090_sb_sm_bajar_refuerzos_gola.sql` baja el
refuerzo delantero 30 mm y baja 132,4 mm tanto el rail horizontal como la
Gola de madera, manteniendo esta última en contacto con los frentes.

La referencia de ensamble posterior sustituyó ese ajuste con `0091`: el
refuerzo delantero se ubica vertical en la parte superior; el
`refuerzo_horizontal` pasa a vertical y solapa 20 mm con él; la
`gola_madera` queda horizontal, justo debajo y contra los frentes.

`0092_sb_sm_refuerzo_delantero_contacto_frente.sql` fija el refuerzo delantero
en `y = 0`, en contacto con la cara posterior de los frentes sin atravesarlos.

## Corrección de puerta W-SM

`0085_w_sm_puerta_hoja_real.sql` alinea la puerta independiente `W-SM` con la
hoja real: su alto es `A + 15,85 mm`. La corrección posterior `0086` define el
lateral con largo igual al alto nominal `A` y el fondo con holgura de 16 mm
(`A - 0,62992″`). La puerta se ancla en la parte superior de la carcasa; por
eso el excedente de su altura se visualiza por debajo de los laterales, como el
agarre inferior de la Gola.

La migración `0087_w_sm_fondo_y_entrepanos_montaje.sql` sitúa el fondo en
`y = P - TC - TB`, por delante de los refuerzos traseros. Cada entrepaño inicia
en `y = P - TC - TB - D`, por lo que su borde posterior coincide con la cara
anterior del fondo y no lo atraviesa.

Las reglas de configuración se guardan exclusivamente contra el ID de cada
nuevo tipo, por lo que no afectan ninguna otra tipología.

## Montaje visual BFD-SM

La migración `0083_bfd_sm_montaje_refuerzo_gola.sql` conserva los cortes y
define únicamente el ensamble visual de las piezas propias de esta tipología:

- `refuerzo_delantero` queda vertical (plano XZ), a 20 mm detrás de la cara
  posterior de los frentes.
- `gola_madera` queda horizontal, contra los frentes (`y = 0`) y su borde
  superior toca el borde inferior del refuerzo delantero.
