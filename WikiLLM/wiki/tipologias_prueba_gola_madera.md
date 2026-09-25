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
| `DB-2S-SM` | `DB26-2S-SM` | Cajonera independiente 2S con dos gavetas pequeñas, una grande y Gola superior/inferior. |
| `DB-2-SM` | `DB26-2-SM` | Variante con dos gavetas grandes iguales, Gola superior/intermedia y sin manijas. |
| `DB-3-SM` | `DB26-3-SM` | Variante con tres gavetas iguales; segundo par refuerzo/Gola entre la segunda y tercera. |

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

`DB-2S-SM` reutiliza las fórmulas DB para dos gavetas pequeñas y una grande,
con `gola = 1` y sin manijas. Para `DB26-2S-SM` reproduce la guía: base
630,4 × 585,6 mm; laterales 762 × 609,6 mm; fondos de gaveta 555,4 × 492 mm;
traseros 543,4 × 68/68/183 mm; frentes 173,9/173,9/351 × 657,2 mm y fondo
760 × 644,4 mm. Mantiene un par de barras para el trasero de 183 mm.
Los traseros pequeños llevan un canto largo blanco; el trasero grande, un
canto largo y dos anchos blancos, según `0094_db_2s_sm_cantos_traseros.sql`.
En el Simulador, esta tipología fuerza `gola = 1` aunque el selector global
conserve el valor de un módulo anterior. Así siempre salen dos
`refuerzo_delantero`, dos perfiles Gola y los frentes en el orden de corte de
la hoja (alto × ancho), sin depender de una selección manual adicional.
La migración `0095_db_2s_sm_frentes_orden_hoja.sql` conserva internamente los
ejes de los frentes como ancho del módulo × alto del frente, porque el
despiece ya los presenta como alto × ancho. Evita así una doble inversión en
la tabla y en el montaje.
`0096_db_2s_sm_gola_y_frentes_exactos.sql` nombra estas piezas
`gola_madera`, igual que los demás SM, y fija el reparto de los 53,6 mm de
las dos golas: 13,4 mm por cada frente pequeño y el saldo en el grande. Para
DB26 muestra exactamente 173,9 / 173,9 / 351 mm.
El montaje específico `0097_db_2s_sm_montaje_refuerzos_gola.sql` representa
los dos `refuerzo_delantero` en plano XZ, verticales y a 20 mm detrás de los
frentes. Las dos `gola_madera` usan el plano XY, horizontales y con `y = 0`;
por tanto tocan los frentes sin modificar su corte.
`0098_db_2s_sm_posicion_pares_gola.sql` separa los dos pares por niveles:
uno arriba del mueble y otro debajo de la segunda gaveta desde arriba. Cada
Gola queda inmediatamente bajo su refuerzo correspondiente.
El generador de montaje también refuerza esta geometría para `DB-2S-SM`: no
permite que una configuración heredada de DB vuelva a intercambiar los planos
de `refuerzo_delantero` y `gola_madera`.
Desde `0099_db_2s_sm_anclaje_base_gaveta.sql`, el segundo par no se ubica con
una fórmula proporcional: queda anclado al borde inferior de la segunda
`base_gaveta`; el refuerzo toca ese borde por debajo y la Gola toca el borde
inferior del refuerzo, ambas sobre sus caras frontales respectivas.

`0100_db_2_sm.sql` deriva `DB-2-SM` de esa tipología y conserva carcasa,
herrajes, dos refuerzos y dos Golas. Cambia a `n_cajones=2` y
`n_cajones_pequenos=0`, por lo que genera dos gavetas grandes con frentes de
351 × 657,2 mm en `DB26-2-SM`; el segundo par refuerzo/Gola se ancla bajo la
base de la gaveta superior para separar visualmente ambos niveles. La migración
está aplicada en el proyecto Supabase conectado desde el 25 de septiembre de
2026; la tipología está activa y disponible para sesiones autenticadas.
`0101_db_2_sm_frente_unico.sql` elimina las plantillas especializadas
`frente_*`: como ambas gavetas son iguales, el despiece muestra únicamente
`frente`, con cantidad 2.
`0102_db_2_sm_trasero_unico.sql` aplica el mismo criterio a los traseros: deja
solo `trasero_gaveta`, cantidad 2 y 183 mm de alto, conservando el canto de la
pieza grande (1 largo y 2 anchos).

`0103_db_3_sm.sql` deriva `DB-3-SM` de la variante unificada: mantiene una
sola fila `frente`, `base_gaveta` y `trasero_gaveta`, cada una con cantidad 3.
Los tres frentes se reparten por igual y los traseros miden 183 mm. El segundo
par refuerzo/Gola se ancla bajo la segunda base, entre la segunda y tercera
gaveta. La migración está aplicada en el proyecto Supabase conectado desde el
25 de septiembre de 2026.

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
