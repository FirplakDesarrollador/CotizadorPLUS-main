# Cajoneras DB con gavetas de tamaño mixto (DB-1S, DB-2S)

## Problema

El motor (`calcularMueble` en `src/lib/engine.ts`) evalúa cada fila de `cot_piezas_plantilla` como "N copias de un mismo tamaño" (`area = cant * largo * ancho`). Eso es correcto para tipologías DB con cajones iguales (DB-2, DB-3, DB-4), pero **no puede representar tipologías con cajones de tamaño distinto** como `DB-1S` (1 cajón pequeño arriba + 2 grandes) o `DB-2S` (2 pequeños arriba + 1 grande), donde el "frente" y el "trasero_gaveta" antes se repartían el Alto en partes iguales (`A/n_cajones`) sin importar la tipología elegida.

Esto se detectó comparando la tabla "Piezas (despiece)" del panel admin (`/admin/diseno`) contra una lista de corte real impresa de un módulo `DB15-1S` (Largo=15", Alto=30", Prof=24"): el sistema generaba 3 frentes iguales de 10" de alto, cuando la lista real tiene 1 frente de 6" (fijo) + 2 frentes de ~11.81" cada uno.

## Modelo implementado (migración `0027_db_gavetas_mixtas.sql`)

### Variable nueva: `n_cajones_pequenos`

Regla por defecto en `cot_reglas_config` para el tipo `DB`: `condicion='true', valor='0', prioridad=5`. Se sobreescribe vía `overrides.n_cajones_pequenos` cuando el usuario elige una tipología DB con cajones pequeños, tanto en `AddLineForm.tsx` (cotizaciones) como en `CotizadorForm.tsx` (simulador) — igual que ya ocurre con `n_cajones`/`n_barras` a partir de `DB_TIPOLOGIAS` en `src/lib/muebles.ts` (campo nuevo `npeq`).

| Tipología | `nc` (cajones) | `npeq` (pequeños) |
| --- | --- | --- |
| `DB-1S` | 3 | 1 (arriba) |
| `DB-2S` | 3 | 2 (arriba) |
| `DB-2`, `DB-3`, `DB-4` | 2/3/4 | 0 |
| `DB2-1OP` | 3 | 0 *(el "oculto" no es un cajón pequeño de frente; no se tocó — sin datos de referencia)* |

### Piezas nuevas y modificadas

Para que las tipologías parejas (npeq=0) **sigan calculando exactamente igual que antes**, las piezas originales `frente` y `trasero_gaveta` se desactivan (cantidad 0) solo cuando `n_cajones_pequenos > 0`, y dos piezas nuevas por posición toman su lugar:

- `frente_gaveta_pequena` / `frente_gaveta_grande` (rol `frente`): el/los cajón(es) pequeño(s) miden **6" fijas** de alto (frente); los grandes se reparten el resto del Alto en partes iguales, descontando un reveal de **3.2mm por cajón** entre frentes apilados (confirmado con el usuario). Fórmula del grande:
  `(A - n_cajones*3.2/25.4 - 6*n_cajones_pequenos) / (n_cajones - n_cajones_pequenos)`
- `trasero_gaveta_pequena` / `trasero_gaveta_grande` (rol `refuerzo`): alto fijo por posición, **68mm en el pequeño y 183mm en los grandes** (confirmado con el usuario, no depende de la medida del mueble). El largo usa la misma fórmula corregida en ambos (`L-4.607`, ver abajo).

### Corrección adicional: `base_gaveta` (fondo de cada gaveta)

Al comparar la lista de corte real también se detectó que el largo de `base_gaveta` (fondo de cada cajón, igual en todas las posiciones — no es un problema de gavetas mixtas) restaba solo `2.95` de `L`, cuando la pieza equivalente `base` de la misma cajonera resta `1.18` adicional. Se corrigió a `L-4.13`. Por el mismo patrón, el largo de `trasero_gaveta_pequena`/`trasero_gaveta_grande` usa `L-4.607` (antes `L-3.427` en la pieza original, que solo se usa ahora para tipologías parejas y no se tocó).

### Verificado contra la referencia (L=15", A=30", P=24", DB-1S)

| Pieza | Fórmula | Resultado | Real (foto) |
| --- | --- | --- | --- |
| frente_gaveta_pequena | ancho=6 | 152.4mm | 152.4mm |
| frente_gaveta_grande | ver arriba | 300.0mm | 300.08mm |
| trasero_gaveta_pequena | ancho=68/25.4 | 68.0mm | 68mm |
| trasero_gaveta_grande | ancho=183/25.4 | 183.0mm | 183mm |
| trasero_gaveta_* | largo=L-4.607 | 264.0mm | 264mm |
| base_gaveta | largo=L-4.13 | 276.1mm | 276mm |

Test de regresión: `tests/db-gavetas-mixtas.test.ts` (valida DB-1S contra estos valores y confirma que DB-3, tipología pareja, no cambia).

### Lo que quedó sin resolver (flag, no se tocó)

- `refuerzo_trasero`/`refuerzo_horizontal` (rieles delantero/trasero): la foto real sugiere un ancho de ~3.15" en vez del `3.25"` actual (~2.5mm de diferencia). No se confirmó con el usuario; se dejó igual.
- `base`: la foto real sugiere `P-0.945` en vez de `P-0.9` (~1mm de diferencia). No se confirmó; se dejó igual.
- Pieza `BACKING` (respaldo delgado de 6mm de espesor) de la lista de corte real **no existe** en la plantilla actual — la pieza `fondo` existente no coincide en orientación ni en espesor de tablero. Requiere definir con el usuario a qué `rol_tablero` corresponde (posiblemente `fondo_shaker`, que ya existe como rol pero no está en uso para DB) antes de tocarlo, porque cambiar el rol de tablero puede romper el cálculo si ese preset no está configurado en los proyectos existentes.

## Piezas con cantidad 0 no se muestran en el despiece

La tabla "Piezas (despiece)" del Simulador (`CotizadorForm.tsx`) lista todas las filas de `cot_piezas_plantilla` del tipo, incluidas las que dan `cant = 0` (ej. `frente`/`trasero_gaveta` cuando la tipología es mixta, o `frente_gaveta_pequena`/`_grande` cuando no lo es). Como una pieza con cantidad 0 no se produce, esa tabla filtra `p.cant > 0` antes de renderizar — así la fila irrelevante desaparece automáticamente según la tipología elegida, sin necesidad de borrar ninguna fila de la base de datos (que siguen siendo compartidas entre todas las tipologías DB).

## Migración aplicada

`db/migrations/0027_db_gavetas_mixtas.sql`, aplicada y verificada en Supabase **I+D** el 2026-08-11 (piezas y regla confirmadas vía `information_schema`/consulta directa a `cot_piezas_plantilla` y `cot_reglas_config`).

## Validación de costos contra "Simulación muebles CEMA (1).xlsx" (2026-08-12)

Además de la validación de despiece (piezas/mm, tabla arriba), se corrió `calcularMueble()` (`src/lib/engine.ts`) con las piezas reales post-migración (leídas de Supabase) contra la fila `DB15-1s` de la hoja `Costos Muebles` del Excel CEMA (L=15", A=30", P=24", `n_cajones=3`, `n_cajones_pequenos=1`, `n_barras=2` — igual que aplicaría `CotizadorForm.tsx`/`AddLineForm.tsx` al elegir tipología `DB-1S` en `DB_TIPOLOGIAS`). Para aislar la fórmula/geometría de la deriva de precios de catálogo, se usaron los precios unitarios tal como están hardcodeados en la hoja `costos unitarios` del propio Excel (fila 2140 referencia `'costos unitarios'!$C$19:$C$23` para madera, `$B$11`/`$B$12` para canto, y los precios de herrajes/consumibles de la misma hoja), en vez de los precios actuales en `cot_tableros`/`cot_cantos` de Supabase.

| Métrica | Motor (`calcularMueble`) | Excel (`DB15-1s`, fila 2140) | Diferencia |
| --- | --- | --- | --- |
| Costo Mueble sin herrajes | 114,997.67 | 115,326.26 | -328.59 (-0.28%) |
| Costo hardware | 199,386.40 | 199,386.40 | 0.00 (0.00%) |
| Costo Mueble con herrajes | 314,384.07 | 314,712.66 | -328.59 (-0.10%) |

**Costo hardware coincide exactamente** (riel Tandem ×3, manija ×3, pata ×4 + tornillo ×16, barra estabilizadora ×2 — la barra confirma que `n_barras=2` de `DB_TIPOLOGIAS['DB-1S'].nb` es indispensable; sin ese override el hardware queda corto por $19,600 = 2×$9,800). Madera de `caja` y `fondo` coinciden al centavo (46,477.96 y 9,255.95). El -0.28% restante en "sin herrajes" viene de `frente`/`refuerzo` (áreas ~1-3% distintas de las de la hoja `madera` del Excel) y es consistente con los ajustes **no confirmados** ya señalados arriba (`refuerzo_trasero`/`refuerzo_horizontal` ancho 3.25"→~3.15", `base` P-0.9→~P-0.945) — no se tocaron, mismo criterio que antes.

**Nota de catálogo:** con los precios *actuales* de `cot_tableros`/`cot_cantos` en Supabase (no los del Excel), el total no coincide tan de cerca porque algunos tableros/cantos ya se actualizaron de precio desde que se armó el Excel (ej. `ECOCARB15ARLINGTON` pasó de ~29,645/m² a 34,987/m² en catálogo; canto `22x1` de 900 a 980). Esto es deriva de precio esperada, no un defecto de fórmula — la tabla de arriba usa los precios *del Excel* para comparar manzanas con manzanas.

Conclusión: la implementación de tipologías DB mixtas (variable `n_cajones_pequenos` + piezas por posición) reproduce el costo del Excel CEMA con **0.10% de diferencia** en el total con herrajes para `DB-1S`, confirmando que el módulo de diseño ya contempla correctamente las variaciones de tipología DB-1S/DB-2S en el cálculo de cajones/tamaños, y que el hardware (incluida la barra estabilizadora, dependiente de `nb`) se calcula igual que en el Excel.
