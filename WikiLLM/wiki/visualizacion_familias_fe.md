# Visualización y agrupación de familias FE (B-FE, UB-FE, V-FE)

Esta página documenta la corrección geométrica del visor 3D y la homologación para agrupación física de las tipologías con gaveta de madera y riel Full Extension (`B-FE`, `UB-FE`, `V-FE`).

## Problemas corregidos en el visor 3D

1. **`fondo_gaveta` suelto fuera del mueble:**
   En las plantillas FE, el piso del cajón de madera se denomina `fondo_gaveta`. La regla de inferencia automática solo reconocía `base_gaveta` y `pieza_cajon`, catalogando a `fondo_gaveta` como pieza `suelto` y proyectándola fuera de la escena a $X = L + 40\text{ mm}$. Se actualizó `inferirMontaje()` en `visualizacion-config.ts` para reconocer `fondo_gav`.
2. **Gaveta flotando en el centro vertical:**
   En muebles mixtos (1 gaveta + 1 puerta), el cálculo de ranuras centraba los frentes de gaveta sobre el alto total del mueble (`innerH`). Se condicionó en `visualizacion.ts` para que cuando existan puertas inferiores (`doors.length > 0`), los frentes de gaveta inicien en el tope superior (`z = A - gap - alto_frente`), descansando la puerta en la base inferior (`z = foot`).
3. **Falso desdoblamiento por contraparche:**
   El `contraparche` (subfrente de madera del cajón) se interpretaba erróneamente como un frente interior embutido (`frente_interior`), provocando que el visor dividiera el cajón en dos gavetas ocultas (lógica de `DB2-1OP`). Se restringió el desdoblamiento a gavetas ocultas reales (`vars.n_cajones_ocultos > 0` o piezas con nombre `ocult`/`interior`).
4. **Centrado horizontal de piezas del cajón:**
   Se garantizó que `base_gaveta`, `trasero_gaveta` y `frente_interior` se ubiquen centradas con $X = (L - W) / 2$ entre los laterales del cajón.

## Agrupación física continua y piezas con grano girado

1. **Homologación estructural:**
   En la migración `0055_visualizacion_agrupacion_fe.sql`, `B-FE`, `UB-FE` y `V-FE` adoptaron:
   - `lateral`: `lateral_compartido`
   - `base`: `continua` (`clave_fusion: 'base'`, `formula_largo_grupo: 'LG-(2*TC)'`)
   - `refuerzo_delantero`: `continua` (`clave_fusion: 'refuerzo_frontal'`, `formula_largo_grupo: 'LG-(2*TC)'`)
   - `refuerzo_trasero`: `continua` (`clave_fusion: 'refuerzo_trasero'`, `formula_largo_grupo: 'LG-(2*TC)'`)
   - `fondo`: `continua` (`clave_fusion: 'fondo'`, `formula_largo_grupo: 'LG-TC'`)
2. **Piezas continuas con grano girado (`group-engine.ts`):**
   A partir de la migración `0052`, el fondo de `B` tiene `formula_largo = 'A-0.07874'` y `formula_ancho = 'L-0.62992'`. El motor asumía que la sección constante transversal entre módulos siempre era `ancho`. Si `formula_ancho` depende de $L$, variaba entre módulos de distinto ancho. Se actualizó `group-engine.ts` para que identifique piezas con dimensión longitudinal en el ancho (`!/\bL\b/.test(formula_largo) && /\bL\b/.test(formula_ancho)`), comparando el alto como sección constante y aplicando `formula_largo_grupo` a la dimensión adecuada.

## Migración aplicada

* `db/migrations/0055_visualizacion_agrupacion_fe.sql`:
  - Habilita `permite_agrupacion = true` en `B-FE`, `UB-FE`, `V-FE`.
  - Configura el despiece continuo homologado con `B`, `UB` y `V`.
  - Asigna metadatos `visualizacion` confirmados a las 13 piezas.
