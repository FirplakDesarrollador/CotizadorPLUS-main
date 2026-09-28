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
| `WSM` | `WSM93614` | Superior independiente de 14 in: laterales `A-1`, puerta de alto nominal `A` y geometría propia de la hoja WSM93614. |
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

En el Simulador, `DB-2S-SM`, `DB-2-SM` y `DB-3-SM` aparecen agrupadas bajo
`DB-SM — Cajoneras con Gola de madera`. El selector `Tipología DB-SM` cambia
entre los tres tipos reales, por lo que cada variante conserva sus propias
plantillas, reglas, herrajes, código comercial y montaje. Este selector es
independiente del selector histórico `Tipología DB`; no modifica las familias
`DB`, `UDB` ni `UDV`.

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

`0104_wsm.sql` crea `WSM` sin modificar `W-SM`. Para la referencia de 9 × 36
× 14 pulgadas reproduce base/tapa 192,6 × 355,6 mm, laterales 889 ×
355,6 mm, dos refuerzos traseros de 192,6 × 80 mm, dos entrepaños de 191,6
× 311,5 mm, una puerta de 914,4 × 225,4 mm y fondo de 867 × 206,6 mm.
Su código comercial incluye siempre ancho, alto y profundidad. Al seleccionarla
en Simulador, cotizaciones o HDR, la profundidad se inicializa en 14 pulgadas
(35,56 cm o 355,6 mm según la unidad activa). La migración está aplicada en
el proyecto Supabase conectado desde el 25 de septiembre de 2026.

## Montaje visual BFD-SM

La migración `0083_bfd_sm_montaje_refuerzo_gola.sql` conserva los cortes y
define únicamente el ensamble visual de las piezas propias de esta tipología:

- `refuerzo_delantero` queda vertical (plano XZ), a 20 mm detrás de la cara
  posterior de los frentes.
- `gola_madera` queda horizontal, contra los frentes (`y = 0`) y su borde
  superior toca el borde inferior del refuerzo delantero.

## Familia DB-SM-FE

La migración `0108_db_sm_fe.sql` incorpora la familia comercial `DB-SM-FE`.
La familia existe solo como encabezado en los selectores de Simulador,
Cotizaciones y HDR; las filas calculables de `cot_tipos_mueble` son
`DB-2S-SM-FE`, `DB-2-SM-FE` y `DB-3-SM-FE`. La convención comercial inserta
la medida inmediatamente después de DB: `DB12-2S-SM-FE`.

La fuente primaria es el PDF `DB12-2S-SM-FE MBLE INF COC 3 GAVETAS 2
PEQUENAS HDR V2001 .pdf`, de 12 x 30 x 24 pulgadas. La plantilla es
paramétrica en el ancho: caja y Golas usan `L-30 mm`, traseros y contraplacas
`L-86 mm`, fondos de gaveta `L-72 mm` y frentes `L-3,2 mm`. Las alturas y
profundidades de las cajas quedan fijas: laterales de 500 mm; gavetas pequeñas
de 100/80 mm (lateral/trasero) y grandes de 200/180 mm. Los fondos de gaveta
son de 508 mm de profundidad.

Los roles de tablero son `caja` para carcasa/Gola, `refuerzo` para cajas de
gaveta, `frente` para frentes de 18 mm y `fondo` para piezas de 6 mm. No hay
manijas, bisagras, barras ni soportes. Cada tipo usa cuatro patas, dieciseis
tornillos y un `RIELFE500` por gaveta. `permite_agrupacion=false` y todas las
piezas usan montaje local porque no existe una hoja agrupada.

La migración `0109_db_sm_fe_tarugos_gavetas.sql` asigna cuatro tarugos a cada
`gola_madera`, `trasero_gaveta*` y `contraparche*`: dos en el extremo derecho
y dos en el izquierdo. El conteo se multiplica por la cantidad física de cada
plantilla, por lo que respeta automáticamente las variantes de dos y tres
gavetas.

La migración transversal `0110_gola_madera_tarugos_sm.sql` homologa la misma
regla para todas las piezas `gola_madera` de tipologías SM. La auditoría previa
en Supabase encontró nueve tipologías: `BFD-SM`, `SB-SM`, `SBFD-SM` y las tres
DB-SM-FE ya tenían cuatro tarugos; se corrigieron `DB-2S-SM`, `DB-2-SM` y
`DB-3-SM`, que todavía tenían cero.

La migración `0111_tarugos_piezas_gaveta_grande.sql` fija seis tarugos por
pieza en todos los `trasero_gaveta_grande` y `contraparche_grande`: tres en el
lado derecho y tres en el izquierdo. El alcance por nombre exacto incluye `DB`,
`DB-2S-SM`, `UDV` y las tres variantes `DB-SM-FE`. Esta regla reemplaza el
conteo anterior de cuatro tarugos en las piezas grandes FE; las piezas pequeñas
conservan cuatro.

La migración `0112_db_3_sm_fe_gavetas_pequenas.sql` corrige `DB-3-SM-FE` para
que sus tres cajas iguales sean pequeñas. El despiece usa seis
`lateral_gaveta_pequena` de 500 x 100 mm, tres `trasero_gaveta_pequena` de
L-86 x 80 mm y tres `contraparche_pequeno` de L-86 x 100 mm. Traseros y
contraparches conservan cuatro tarugos por pieza, dos en cada lado, y la regla
`n_cajones_pequenos=3` lleva la misma geometría a la visualización.

La visualización reutiliza el montaje validado de la familia DB-SM: refuerzos
delanteros verticales, Golas horizontales contra los frentes y el segundo par
anclado bajo la ultima base del bloque superior. Para las variantes iguales,
los frentes conservan el reparto vertical de `DB-2-SM` y `DB-3-SM`; sus cajas
FE usan las dimensiones confirmadas de la gaveta grande.

En el montaje de cada caja, `trasero_gaveta` se alinea por su borde superior
con los `lateral_gaveta`. Cuando el lateral mide 100/200 mm y el trasero
80/180 mm, la diferencia de 20 mm queda debajo del trasero; no se reparte ni
se deja en la parte superior.

El trasero y el contraparche se montan dentro del vano definido por los dos
laterales y se asignan secuencialmente a su propia gaveta. La `base_gaveta`
queda 13 mm por encima del borde inferior de los laterales y atraviesa el plano
del contraparche. Esta relación se calcula por gaveta, evitando que los tres
contraparches o traseros se acumulen en el nivel superior.

En `DB-2S-SM-FE`, la primera caja pequeña deja una luz de 3,2 mm bajo el borde
inferior de la `gola_madera` superior. La segunda caja pequeña se ubica 13 mm
más alta dentro del bloque para que el borde inferior de sus laterales quede
justo sobre el `refuerzo_delantero` inferior. Laterales, trasero, contraparche
y base se desplazan conjuntamente y conservan entre sí todas sus relaciones
de ensamble; la caja grande inferior permanece en su posición.

La migración fue aplicada al Supabase configurado el 2026-09-28. La lectura
posterior confirmó 15/11/11 plantillas de piezas, 9/8/8 reglas y tres herrajes
por tipo. `DB12-2S-SM-FE` reproduce sus 28 piezas físicas y todos los cortes
de la hoja con diferencia máxima de 0,02 mm.
