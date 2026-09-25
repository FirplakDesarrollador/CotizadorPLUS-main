# Auditoría del catálogo activo (60 tipos)

Barrido end-to-end de los 60 tipos `activo = true`: se corre `calcularMueble()` real con el
`preset_default` y una medida de prueba (30″×30″×24″; los `superior` a 14″ de alto y 12″ de
fondo) y se marcan los resultados anómalos. Cruza el estado de Supabase contra el motor, no
contra el Excel — es un chequeo de coherencia interna del catálogo.

**Resultado: 39 tipos limpios, 21 con anomalía, 0 errores duros.** Ninguna fórmula lanza, ningún
costo sale NaN.

## 1. Dimensiones negativas (corregido en el motor)

`BBL` (esquinero ciego) escribe su gaveta con fórmulas que solo tienen sentido por encima de
~31″: `base_gaveta = L-30.70`, `trasero_gaveta = L-30.427`, `refuerzo_horizontal` y
`frente_cajon = L-27.75`. Por debajo de esa medida el largo daba negativo y, como el motor hacía

```ts
const area = cant * lIn * aIn * IN2CM * IN2CM;
```

el área negativa **restaba** tablero y canto: un BBL de 24″ salía más barato que uno de 33″.
Medido a L=24: −152 cm² en refuerzo, −837 cm² en base de gaveta, −111 cm² en trasero y −145 cm²
en el frente.

Corregido acotando ambas dimensiones a cero en `engine.ts`, no parcheando cada fórmula: una
dimensión negativa nunca es física, significa que esa pieza no aplica a esa medida, y la pieza
debe aportar cero en vez de descontar. Cubierto por `tests/dimension-negativa.test.ts`.

`WPC` también aparecía con un frente negativo, pero ahí es artefacto de la medida de prueba: su
frente inferior es `A-36.87598`, o sea que WPC es una alacena **alta** (A > 36,9″) y evaluarla a
14″ de alto no tiene sentido. No es un defecto de la plantilla.

## 2. Veinte tipos activos cotizaban con $0 de herrajes (7 corregidos con evidencia)

> **Actualización**: de los 20, **7 se corrigieron** contra el Excel CEMA en
> `0043_herrajes_tipos_sin_plantilla.sql` y **1 resultó no ser defecto**. Quedan 12
> pendientes. El apartado original se conserva abajo porque explica por qué no se podía
> arreglar en bloque.

La columna **"Costo hardware"** de la hoja `Costos Muebles` del Excel CEMA da el costo de
herrajes por SKU real, y con los precios unitarios del catálogo descompone de forma única:

| Bloque | Composición | Valor |
|---|---|---|
| Base carcasa de piso | `4 × PATA10AJUST (1.987) + 16 × TORNILLO858 (23)` | **8.316** |
| Puerta completa | `BISAGRAPAR (5.800) + MANIJA415 (7.450)` | **13.250** |
| Riel | `RIELFE500` / `RIELTANDEM` | 31.064 / 49.706,8 |
| Barra | `BARRAEST` | 9.800 |

Control: `BFD9` del Excel = 21.566 = 8.316 + 13.250. Exacto.

Con eso, siete tipos quedaron determinados sin margen de interpretación:

| Tipo | Evidencia | Plantilla aplicada |
|---|---|---|
| `UVFD` | 21.566 (1 puerta) / 34.816 (2 puertas) | copia de `VFD` |
| `USVFD` | su gemelo `USBFD2428 3/4` = 34.816 | copia de `SVFD` |
| `UV` | 78.723 y 91.973 exactos | copia de `V` + `n_cajones = 1` |
| `UDB` | 7 SKUs exactos, barras incluidas | copia de `DB` + `n_puertas = 0`, `n_cajones = 3` |
| `POD` | 31.064 / 49.707 = un riel y nada más | solo `riel` + `n_cajones = 1` |
| `DD` | 31.064 = un riel | solo `riel` + `n_cajones = 1` |
| `WER` | 26.500 = 2 puertas sin patas | copia de `W` |

El reparto de barras de `UDB` coincide **exactamente** con `DB_TIPOLOGIAS` de
`src/lib/muebles.ts` — 1 gaveta → 1 barra, 3 iguales → 0, `-1s` → 2, `-2s` → 1 — lo que
confirma que `UDB` es la cajonera `DB` de la línea U y comparte su fórmula de barra.

**`DF` (frente de gaveta suelto) no era un defecto**: el Excel le asigna 0 de hardware, así
que su plantilla vacía es correcta.

Las reglas nuevas son **geometría-neutra**: se verificó que ninguna pieza de `UV`, `UDB`,
`POD`, `DD` ni `WER` referencia `n_cajones` o `n_puertas`, así que cambian el conteo de
herrajes sin mover una sola medida de corte. `USVFD` y `UVFD` sí usan `n_puertas` en el
ancho de su frente, y justamente por eso a ellos no se les tocó ninguna regla: siguen con
la global por `L`, que es la que reproduce los dos valores del Excel.

Verificado con el motor real contra los 8 montos del Excel: **los 8 coinciden al peso.**

### Segunda tanda: el maestro de herrajes del Excel

La hoja **`costos unitarios`** del mismo libro trae la lista de precios de herrajes del
simulador. Todos los que ya estaban en `cot_herrajes` coinciden (bisagra 5.800, manija 7.450,
pata 1.987, tornillo 23, Tandem 49.706,8, barra 9.800, riel FE 31.064, Bonuit MAX 57.000)
**salvo uno**:

> `DISPOSITIVO PUSH TO OPEN IMAN HBM237-02` = **8.032**, contra los 5.600 del catálogo.

Es el mismo código HBM237-02 ya sembrado, o sea el mismo herraje con el precio viejo — el
mismo patrón que el riel full extension en `0040`. Confirmado con cuatro filas que cierran
al peso solo con 8.032:

| SKU | Excel | Descomposición |
|---|---|---|
| `WPC24 3/44924-PUSH-2S` | 19.632 | 2 bisagras + 1 push |
| `WPC2461 1/2-18MM` | 55.328 | 4 bisagras + 4 push |
| `PCFD219525 1/2-4OP-PUSH` | 234.807 | 2 bis + patas/torn + 4 Tandem + 2 push |
| `PCFD34 1/28416 1/2-2OP` | 146.994 | 4 bis + patas/torn + 2 Tandem + 2 push |

Las dos de `PCFD` las reproduce **exacto la plantilla que ya existía**, sin tocarla: el único
dato equivocado era el precio. Corregido en `0044_push_real_y_herrajes_superiores.sql`.

La misma migración resuelve tres tipos más con la plantilla de `W` (bisagra = `n_puertas`,
manija = `n_puertas + n_cajones`, sin patas):

- **`SLOC`** y **`WLD`** tienen exactamente el mismo juego de piezas que `W` y su ancho de
  frente ya se escribe `(L-n_puertas*RV)/n_puertas`, o sea que la geometría del propio tipo
  ya asume `n_puertas` puertas. Es el caso de `WER`, que validó exacto en 0043.
- **`KF`** sí está en el Excel y con muchas filas: 13.250 con 1 puerta (`KF-B12`, `KF-BFD9`),
  26.500 con 2 (`KF-B24`, `KF-B30`, `KF-BFD30`, `KF-W3030`). Los `KF-*` que aparecen en 0 son
  huecos de la fuente, no una regla — `KF-SBFD30` está en 0 y `KF-SBFD36` en 26.500.

Validación con el motor real: **10 de 10 casos coinciden al peso**, incluidas las cuatro
regresiones de 0043.

### Los 9 que siguen pendientes

`SBAS`, `WPC`, `SDB`, `KD`, `BLS`, `BMW`, `CC`, `CLV`, `DFE`.

- **`SBAS`** El Excel fija el herraje de puerta basculante en 63.000 ("Brazo AIR SE PUSH
  NGR 500-1400"), confirmado 3 veces (`TW321524-SM` = 63.000, `TW4612…-SM` = 126.000 por
  2 puertas, `KF-TW2512-SM` = 63.000). Pero `SBAS` declara **tres** piezas `frente` de
  `cant=1` y `n_puertas` daría 2: no se puede saber si son 2 o 3 brazos sin la hoja de ruta.
  Encima conviven dos variantes: las filas `TW-WLM` llevan solo bisagras (8.700 / 11.600 /
  17.400 = 1,5 / 2 / 3 pares).
- **`WPC`** Sus dos filas dan conteos de bisagra incompatibles (2 bisagras + 1 push para
  "1 puerta"; 4 y 4 para "4 puertas") y la plantilla declara 5 piezas de frente. El bisagrado
  depende del alto, que el catálogo no modela.
- **`SDB`** El Excel dice "1 gaveta 2 puertas"; la plantilla tiene 22 piezas y 5 frentes de
  gaveta. Fuente y plantilla describen muebles distintos.
- **`KD`** Un solo dato (`KD-DB26-2-SM` = 127.330 = patas + 2 riel + 2 barra) y encima con
  patas, cosa rara en un kit.
- **`BLS`** La fuente se contradice: `BLS36` = 35.682 con observación "Sin herraje",
  `BLS36-RS-SMG` = 0, `BLS40-RS-SM` = 403.132 (torno esquinero 372.000 y/o condimentero
  161.000).
- **`BMW`** Solo descompone `-SM-FE` (39.380 = patas + 1 riel FE); el resto lleva accesorios
  de horno no identificables.
- **`CC`**, **`CLV`**, **`DFE`** Fuera del Excel, o solo con herraje de clóset (tubo 7.950 +
  soporte 348) en combinaciones que no cierran.

### Nombre comercial confirmado de `TW`

En el Excel **todas** las filas `TW` son de puerta basculante ("1 puerta basculante",
"2 puerta basculante"…). El nombre anterior del catálogo, "Mueble superior esquinero
(Transition Wall)", fue corregido por decisión de producto en `0106`: `TW` se presenta como
**Mueble superior puerta abatible**. El cambio es solo descriptivo y no altera piezas,
reglas ni herrajes.

## 2-bis. Apartado original: por qué no se podía arreglar en bloque

`engine.ts` no tiene fallback de herrajes:

```ts
for (const hp of (inp.herrajesPlantilla || [])) { ... }
```

Plantilla vacía ⇒ costo de herrajes cero. Hay 20 tipos `activo = true` con piezas de puerta o
gaveta y **ninguna fila** en `cot_herrajes_plantilla`, y como la lista de tipos de la UI filtra
por `activo = true` (`cotizar.ts`), todos son seleccionables hoy:

| Familia | Tipos |
|---|---|
| Línea U | `UDB`, `USVFD`, `UV`, `UVFD` |
| Superiores | `SBAS`, `SLOC`, `WER`, `WLD`, `WPC` |
| Inferiores | `BLS`, `BMW`, `DD`, `POD`, `SDB` |
| Clóset | `CC`, `CLV`, `DFE` |
| Kits/sueltos | `DF`, `KD`, `KF` |

**Ninguno ha sido usado en una cotización real** (las únicas líneas guardadas sin herrajes son
`PN`, `F` y `TK`, que correctamente no llevan). Es un riesgo latente, no un daño ya hecho.

### Por qué no se arregló en bloque

La plantilla de herrajes del catálogo se escribe contra las variables `n_puertas` / `n_cajones`
(`bisagra = n_puertas`, `riel = n_cajones`, `manija = n_puertas + n_cajones`). Pero estos 20
tipos —generados por `scripts/generar_tipologias.py` desde hojas reales— **codifican las
cantidades en la propia pieza**, no en reglas:

- `UDB` tiene 3 frentes de gaveta (`cant` 2 + 1), pero la regla global es `n_cajones = 0`, así que
  un `riel = n_cajones` daría **cero rieles**.
- `WPC` tiene 5 piezas de frente (2 + 2 + 1); `n_puertas` daría 2.
- `WER` tiene dos frentes de 1 unidad con anchos distintos (esquinero); `n_puertas` coincide en 2
  solo por casualidad a L ≥ 24″.
- Ninguno de los 20 tiene reglas propias de `n_patas` / `n_puertas` / `n_cajones`.

Arreglarlo bien exige decidir, por tipo, el conteo real de puertas y gavetas y qué herraje lleva
cada uno (el basculante `SBAS` necesita pistón, no bisagra normal; el giratorio `BLS` su
mecanismo; los kits `KD`/`KF` puede que deliberadamente no lleven). Eso es criterio de producto,
no algo deducible del esquema — queda abierto y explícitamente **no** inferido.

## 3. Herrajes duplicados en UW (corregido)

`UW` tenía dos filas `bisagra` idénticas y dos `manija` (una con `n_puertas + n_cajones`, otra con
`n_puertas`). Como el motor suma todas las filas sin deduplicar por rol, un UW de 2 puertas
cotizaba 4 pares de bisagra y 4 manijas. Corregido en
`0042_uw_herrajes_duplicados.sql`, conservando `n_puertas + n_cajones` (la fórmula de `W` y `WBL`).
`UW` está `activo = false`, así que no había cotizaciones afectadas. Era el único tipo del catálogo
con filas duplicadas por rol.

## 4. Cosas que parecían defecto y no lo son

- **`VDF`** sale sin piezas en un `left join`, pero está `activo = false`: es un tipo vacío inerte,
  no un tipo roto.
- **Cinco piezas con `rol_tablero` nulo** (`PCFD.frente_canto_*_op`, `PCFD.frente_delgado_informativo_op`,
  `SV.canto_lavamanos`, `UW.gola_canto`) siguen siendo deliberadas: codifican longitud de canto o
  son documentales, y darles rol duplicaría área. Ver `0039_piezas_sin_tablero.sql`.
- **Las reglas globales** (`tipo_mueble_id is null`) cubren `n_patas = 4`, `n_puertas` por `L`,
  `n_cajones = 0`, `n_entrepanos` por `A`, `zocalo` y `removible`, así que la *geometría* de los 20
  tipos sin herrajes sí resuelve bien. El hueco es solo la plantilla de herrajes, que es la única
  de las tres tablas por tipo sin fallback global.

## Cómo reproducir

El script de auditoría no vive en el repo (es de un solo uso): importa `calcularMueble` de
`src/lib/engine.ts`, baja el catálogo por REST con `SUPABASE_SERVICE_ROLE_KEY`, arma un `CalcInput`
por tipo igual que `prepararCotizacion()` en `cotizar.ts` y marca `costoHerrajes === 0` con piezas
de frente, `costoMadera === 0`, no-finitos y dimensiones negativas. Se corre con
`npx tsx --env-file=.env`. Ojo con los nombres de campo del despiece: son `largoIn` / `anchoIn`,
no `largo` / `ancho` — usarlos mal da 60 falsos positivos de "NaN".

Relacionado: [Motor de Cálculo](motor_calculo.md), [Esquema de Base de Datos](esquema_base_datos.md),
[Validación contra hojas de ruta](validacion_hojas_de_ruta.md).
