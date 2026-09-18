# `B12` desde hoja real

## Fuente

Hoja de producción **"B12 · MUEBLE INF COC 1 GAVETA 1 PUERTA 1/2 ENTREPAÑO
CARB2"**, con `L=12"`, `A=30"`, `P=24"` (304.8 × 762 × 609.6 mm).

## Resultado del cruce

De las 10 piezas, **7 ya coincidían al milímetro**: lateral, base, los dos rieles
delanteros, los dos traseros, el trasero de gaveta, la puerta y el frente de
gaveta. Tres arrastraban aproximaciones antiguas.

| Pieza (hoja) | `B` antes | Hoja | Diferencia |
| --- | ---: | ---: | ---: |
| SHELF | `P*0.5` = 304.8 | **300** | 4.8 mm |
| PIEZA CAJON | `L-2.95` = 229.9 | **199.8** | 30.1 mm |
| BACKING | `L-TC`/`A` = 289.8 × 762 | **760 × 288.8** | 1 y 2 mm |

## El valor correcto ya existía en el catálogo

Lo relevante del hallazgo es que **en los tres casos la fórmula correcta ya estaba
en otros tipos** — las variantes FE y las cajoneras, creadas más tarde desde hojas
reales. `B` simplemente se quedó atrás:

| Pieza | Fórmula correcta | Quién ya la tenía |
| --- | --- | --- |
| entrepaño ancho | `11.81102` (300 mm) | `B-FE`, `UB-FE`, `V-FE` |
| base_gaveta largo | `L-4.13386` (L − 105 mm) | `UDB` |
| fondo | `A-0.07874` / `L-0.62992` | `B-FE`, `DB`, `UDB`, `UB-FE`, `V-FE` |

Es el mismo patrón que apareció con la holgura de 1 mm
([holgura_1mm_estructura.md](holgura_1mm_estructura.md)): los tipos validados
recientemente traen la geometría buena y los tipos base conservan la vieja.

`DB` usaba `L-4.13` para la base de gaveta, 0.1 mm largo frente al `L-4.13386` de
`UDB`. Se corrigió después contra la hoja de `DB18-1S`; ver
[db_hoja_real.md](db_hoja_real.md).

## Decisiones tomadas

**El entrepaño es constante, no media profundidad.** La hoja lo titula
"1/2 ENTREPAÑO" y la fórmula lo aproximaba como `P*0.5`. Confirmado con el
usuario que son 300 mm fijos, igual que en las variantes FE: un `B` de otra
profundidad conserva el entrepaño de 300 mm.

**El fondo cambió de eje.** Al pasar el largo a base `A`, hubo que voltear
`visualizacion.intercambiar` a `true`; si no, la escena construiría el panel
girado 90°. Ver [ejes_fondo_backing.md](ejes_fondo_backing.md). Verificado en tres
medidas (12", 24" y 36") que el respaldo cabe dentro del lateral y queda vertical.

**Alcance inicial: solo `B`.** Después se propagó a `UB` y `V` en `0054` tras
auditar el catálogo (ver abajo).

## Propagación a `UB` y `V`

La auditoría posterior cruzó las tres fórmulas contra los 60 tipos. `UB` y `V`
resultaron **análogos exactos de `B`**: arrastran las tres fórmulas antiguas y sus
propias variantes `UB-FE`/`V-FE` ya traen la geometría validada — la misma
relación que `B` tenía con `B-FE` antes de que la hoja de `B12` dirimiera cuál era
buena. Ninguno de los dos tiene líneas de cotización guardadas, así que
`0054_ub_v_geometria_como_b.sql` no recosteó nada. `B`, `UB` y `V` quedan
idénticos en las tres piezas.

### Lo que sigue rezagado, a propósito

| Fórmula antigua | Tipos | Por qué se dejan |
| --- | --- | --- |
| entrepaño `P*0.5` | `BBL` | Esquinero ciego, sin variante FE que lo respalde |
| base_gaveta `L-2.95` | `DV`, `DVE`, `PCFD`, `UDV` | Sin variante FE; ninguno tiene hoja |
| fondo `L-TC`/`A` | `BBL`, `BBLFD`, `BFD`, `BOMH`, `SBFD`, `SV`, `SVFD`, `UBFD`, `VFD`, `DV`, `DVE`, `UDV` | Sin variante FE. `SBFD` y `BFD` además suman 15 líneas guardadas |

`L-TC`/`A` no es necesariamente incorrecto: es la fórmula de 12 tipos y solo se
sabe que estaba mal en `B` porque una hoja lo demostró. Propagar el cambio sin
hoja sería convertir una corrección en una suposición.

## Cobertura

`tests/b12-hoja-real.test.ts` fija las 10 piezas contra la hoja, comprueba que las
tres medidas corregidas no vuelvan a su valor anterior, y verifica que la
geometría escale con la medida del mueble — con el entrepaño como única constante.

La comparación se hace sobre el par de medidas sin importar el orden, porque la
hoja lista la mayor primero mientras el motor usa ejes geométricos; ver
[ejes_fondo_backing.md](ejes_fondo_backing.md).

## Efecto en costo

Las tres piezas encogen, así que un `B` sale marginalmente más barato. Las líneas
`B` ya guardadas conservan su precio hasta que se recalcule su cotización.
