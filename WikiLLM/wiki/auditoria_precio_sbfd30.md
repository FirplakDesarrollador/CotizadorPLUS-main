# Auditoría de precio SBFD30 — Excel CEMA vs Cotizador PLUS

Caso de referencia para conciliar una diferencia de precio entre el Excel
`Simulación muebles CEMA (1).xlsx` y el simulador. Sirve como plantilla del
método: **antes de sospechar del motor, hay que igualar los tres parámetros que
viven fuera de él** (materiales del preset, margen y TRM).

## 1. El caso

| | Excel | Cotizador PLUS |
|---|---|---|
| Costo sin herrajes (COP) | 136.010,04 | 108.020,84 |
| Margen | 0,57 | 0,50 |
| TRM | 3.650 | 3.200 |
| **Precio USD sin herrajes** | **86,66** | **67,51** |

> Las cifras de §1 y §3 son la foto **anterior** a la alineación de precios del
> 2026-09-04 (§5.1). Con el catálogo ya corregido, ese mismo escenario da
> 108.089,55 COP → **67,56 USD**: el tablero de caja del proyecto subió $38/m².
> Las conclusiones no cambian; el orden de magnitud de cada factor tampoco.

## 2. Dónde vive cada parámetro en el Excel

La hoja `Precio` es la que produce el precio. Sus constantes están en la
**fila 1**, no en una hoja de parámetros:

- `Precio!$T$1 = 0,57` → **MARGEN MUEBLES**. Es 57%, **no 50%**.
- `Precio!$V$1 = 3650` → **TRM**.
- `Precio!$T$2 = 0,52` → margen fillers. `Precio!$T$23` → margen hardware.

Cadena de fórmulas para la fila 700 (`SBFD30`):

```
I700 = 'Costos Muebles'!I700         (costo sin herrajes)
J700 = I700/(1-$T$1)                 (precio COP sin herrajes)
K700 = J700/$V$1                     (precio USD sin herrajes)  ← los 86,66
Z700 = K700/(1-10%)                  (PRECIO TOTAL SIN HERRAJES) ← 96,29
```

`K` es el precio **antes** del recargo del 10% de CEMA; `Z` es el que lo
incluye. El motor tiene ese recargo desactivado (`recargo_extra = 0` y el
bloque `recF` comentado en `engine.ts`), así que el número comparable con el
simulador es `K`, no `Z`.

Las tarifas unitarias no salen de la hoja `Materiales` sino de
`costos unitarios`: filas 3-6 (tableros, columna `F` = COP/m²), filas 11-12
(cantos). La hoja `Materiales` es el catálogo de compra, no lo que consume el
cálculo.

## 3. Descomposición de la diferencia

Puente multiplicativo verificado al centavo (86,66 → 67,51):

| Paso | Factor | USD | Δ |
|---|---|---|---|
| Excel (base) | | 86,66 | |
| 1. Costo motor vs Excel (mismos materiales) | ×1,00617 | 87,19 | +0,53 |
| 2. Materiales: preset CEMA → preset del proyecto | ×0,78934 | 68,83 | **−18,37** |
| 3. Margen 57% → 50% | ×0,86000 | 59,19 | **−9,64** |
| 4. TRM 3.650 → 3.200 | ×1,14063 | 67,51 | **+8,32** |

El grueso **no es el margen ni el motor: son los materiales del preset**.
El proyecto en que se cotizó (`cot_cotizaciones.config_default`) sustituye los
cuatro roles por tableros mucho más baratos:

| Rol | Preset CEMA (default app) | $/m² | Preset del proyecto | $/m² |
|---|---|---|---|---|
| caja | ECOCARB15COLOR | 35.609 | CHIRHCARB15BLANCO AMERICANO | 26.041 |
| refuerzo | ECOCARB15ARLINGTON | 29.645 | CHIRHCARB15BLANCO AMERICANO | 26.041 |
| frente | ECOCARB18COLOR | 48.530 | PRICARB18COLOR | 46.885 |
| fondo | PRICARB6CANDELARIA (POLAR) | 28.858 | CHIRHCARB4BLANCO AMERICANO | 12.900 |

El fondo cae a menos de la mitad y la caja un 27%. Un `config_default` de
proyecto **pisa el perfil de preset global**, así que dos simulaciones del
mismo SKU en proyectos distintos no son comparables sin revisar ese campo.

### El formulario no puede reproducir el preset del Excel

`CotizadorForm.tsx:481-490` renderiza un único selector "caja / refuerzos" que
escribe los dos roles a la vez (`setPreset((p) => ({ ...p, caja: v, refuerzo: v }))`).
El Excel, en cambio, usa **tableros distintos** para esos dos roles: caja =
Balance 15mm ($35.609/m²) y refuerzo = Polar 15mm ($29.645/m²). El
`preset_default` de la BD sí los distingue (`ECOCARB15COLOR` /
`ECOCARB15ARLINGTON`), pero en cuanto el usuario toca el selector los iguala y
ya no hay forma de volver a separarlos desde el simulador. Efecto en el
SBFD30: +$86 COP (el refuerzo pasa de ARLINGTON a COLOR). Es pequeño aquí
porque el refuerzo es solo 0,14 m², pero impide la conciliación exacta.

## 4. La geometría del motor sí reproduce el Excel

Todas las áreas del despiece coinciden con la hoja `madera` fila 700:

| Pieza | Excel (cm²) | Motor (cm²) |
|---|---|---|
| laterales | 9.290,304 | 9.290,30 |
| base/tapa | 4.295,101 | 4.295,10 |
| refuerzo vertical delantero | 929,676 | 929,68 |
| refuerzos traseros | 1.208,578 | 1.208,58 |
| puertas/frentes | 5.806,440 | 5.806,44 |
| fondo | 5.692,25 | 5.692,25 |

Detalle de lectura: las columnas `Area … en metros cuadrados` de la hoja
`madera` **ya traen incorporado el 15% de desperdicio** (`AP700 = suma de áreas
crudas × 1,15`), mientras el motor lo aplica como multiplicador aparte. Al
comparar áreas hay que comparar contra las columnas crudas (`J`, `L`, `N`, `T`,
`Z`), no contra las agregadas, o se concluye erróneamente que el fondo difiere.

El costo de herrajes coincide exacto: $34.816 en ambos.

## 5. Desalineación de catálogo — corregida el 2026-09-04

Con materiales idénticos quedaba un residuo de +838,79 COP (+0,62%) por dos
causas. La primera ya está resuelta en la BD:

- ~~`ECOCARB15ARLINGTON` a $34.987/m² en la BD contra $29.645/m² en el Excel
  (+18,02%, +742,46 COP)~~ → **corregido**: `precio_real` 156.224 → 132.371 y
  `precio_m2` 34.987 → 29.645. En la misma pasada se alinearon los otros
  4 tableros del catálogo que diferían (ver §5.1).
- **Pendiente**: longitud de canto `19x0,45`: 1.238,26 cm (motor) vs
  1.214,26 cm (Excel, `BS700 + BU700`) → +96,01 COP, o sea +$0,06 USD. El
  canto de frentes `22x1` coincide exacto (497,2 cm). Los dos precios de canto
  (`22x1` = 980, `19x0,45` = 400) están alineados al peso.

Tras la corrección, el SBFD30 con el preset real del Excel da **$86,72 contra
$86,66** — los 6 centavos son exclusivamente ese canto.

### 5.1 Alineación del catálogo `cot_tableros` con la hoja `Materiales`

Fuente: `Materiales!J` (Precio real) ÷ `Materiales!G` (Área), redondeado a
entero, que es la convención con que la BD ya guardaba `precio_m2`. Estado
previo: 48 tableros, 36 coincidían, 5 diferían, 7 no existen en el Excel.
Los cinco corregidos:

| Código | precio_real | precio_m2 | Δ |
|---|---|---|---|
| ECOCARB18ARLINGTON | 144.043 → 175.524 | 32.259 → 39.309 | **+21,9 %** |
| ECOCARB15ARLINGTON | 156.224 → 132.371 | 34.987 → 29.645 | −15,3 % |
| CHIRHCARB18H4001 MD133 DARK | 84.575 → 81.056 | 27.726 → 26.572 | −4,2 % |
| CHIRHCARB18H002 YM002 BLANCO | 85.658 → 83.719 | 28.081 → 27.445 | −2,3 % |
| CHIRHCARB15BLANCO AMERICANO | 79.320 → 79.436 | 26.003 → 26.041 | +0,1 % |

`area_m2`, `precio` y `descuento` ya coincidían en las cinco filas; solo se
tocó `precio_real` y `precio_m2`. **`ECOCARB18ARLINGTON` sube 21,9%**, así que
encarece todo mueble que lo use — conviene contrastarlo con compras. Los 7
tableros sin fila en el Excel (`CHIRHCARB4BLANCO AMERICANO`,
`CHIRHCARB18BLANCO AMERICANO`, los `…183`, `CHICARB18…`,
`CHI4,5CARBH002…`) quedan sin referencia y no se tocaron.

Verificación posterior: 41 coinciden, **0 difieren**.

### 5.2 Verificación completa contra `Simulación muebles CEMA (2).xlsx` (2026-09-08)

Cotejo de las cinco pestañas de **Materiales-Parámetros** contra el Excel (2).
**Cero diferencias de valor en todo lo comparable.**

| Pestaña | BD | Resultado |
|---|---|---|
| Tableros | 48 | 41 idénticos en `area_m2`, `precio`, `descuento`, `precio_real` y `precio_m2`; 7 sin fila en el Excel |
| Cantos | 7 | 7/7 exactos |
| Herrajes | 18 | 15 con referencia en el Excel, todos exactos; 3 sin fila |
| Perfiles de material | 1 | los 4 roles coinciden con el bloque `costos unitarios!G4:H8` |
| Parámetros | — | todos coinciden salvo `recargo_extra` (desactivado a propósito) |

Dónde vive cada catálogo en el Excel (2):

- **Tableros** → `Materiales` filas 3-74 (72 refs). `precio_m2` = `J`/`G`.
- **Cantos** → `Materiales` filas 79-85 (7 refs), precio en la columna `C`.
  Bloque nuevo respecto al (1), donde los cantos solo estaban en
  `costos unitarios`.
- **Herrajes** → `costos unitarios` filas 19-110, columna `B`.
- **Perfil de material** → `costos unitarios` `G4:H8` (Material Frentes /
  Caja / refuerzos y entrepaños / Fondo / Fondo Shaker).
- **Parámetros** → `Precio!$T$1` `$T$23` `$V$1`; desperdicio en `madera!AZ`.

**Las asimetrías son de cobertura, no de valor.** La BD es un subconjunto
curado: 31 referencias del Excel no están cargadas (ARKOPA, TURQUIA, la línea
`PRIRH*`/`PRIST*`, `UNKPVC*` y las 9 `LAMCARB*` de LAMINATES) y 7 de la BD no
existen en el Excel (`CHIRHCARB4BLANCO AMERICANO`,
`CHIRHCARB18BLANCO AMERICANO`, los `…183`, `CHICARB18…`, `CHI4,5CARBH002…`).
Los 3 herrajes sin referencia son altas propias del cotizador —
`BARRAESTMCTO`, `SLIMBOXALTO`, `SLIMBOXBAJO`, todos de Madecentro; se buscaron
sus importes (11.800 / 48.250 / 28.700) en todas las hojas del libro sin
ninguna coincidencia. `PUSHOPENHBM237` sí está: `costos unitarios` fila 105,
$5.600.

Único parámetro divergente: `recargo_extra` = 0 en la BD contra el 10% que el
Excel lleva quemado en `W`/`Z`. Es deliberado (§6), y es inocuo porque el
motor ni siquiera lee ese parámetro.

## 6. La cadena de precio, fórmula por fórmula

Ambos sistemas usan **margen sobre precio** (`precio = costo / (1 − m)`), no
markup sobre costo, y ambos tratan mueble y herraje como dos cadenas separadas
con márgenes distintos que solo se suman al final.

| Concepto | Excel (hoja `Precio`, fila N) | Motor (`engine.ts`) |
|---|---|---|
| Costo mueble | `I = 'Costos Muebles'!I` | `costoSinHerrajes` |
| Precio COP mueble | `J = I/(1-$T$1)` | `precioCop = costoSinHerrajes/(1-margen)` |
| Precio USD mueble | `K = J/$V$1` | `precioUsd = precioCop*descF/trm` |
| Costo herraje | `L = 'Costos Muebles'!J` | `costoHerrajes` |
| Precio COP herraje | `M = L/(1-$T$23)` | `precioHerrajesCop = costoHerrajes/(1-margenHerraje)` |
| Precio USD herraje | `N = M/$V$1` | `precioHerrajesUsd = precioHerrajesCop*descF/trm` |
| Total sin herrajes | `Z = K/(1-10%)` | — (sin equivalente) |
| Total con herrajes | `W = K/(1-10%) + N` | `precioConHerrajesUsd = (precioCop+precioHerrajesCop)*descF/trm` |
| Margen efectivo | `Y = 1-(X/W)`, `AB = 1-(AA/Z)` | — (no se calcula) |

Constantes del Excel, todas en la **fila 1-27 de la columna T** de `Precio`
(no hay hoja de parámetros): `$T$1` muebles 0,57 · `$T$2` fillers 0,52 ·
`$T$12` Pn y TK 0,50 · `$T$23` **hardware 0,35** · `$T$24` MP 0,10 ·
`$T$25` Panel Closet 0,50 · `$T$26-27` Panel Closet Perf 0,52. TRM en `$V$1`.

Reparto real de las 7.027 filas por celda de margen referenciada en `J`:
5.733 usan `$T$1`, 1.030 `$T$12`, 250 `$T$2`, 4 `$T$24` (tipo "Adicional") y
**10 filas no llevan margen** (`J = I`, tipos Lavamanos/Lavarropas/Lavaplatos/
Bañera: son productos de reventa que entran a costo). La columna `M` usa
`$T$23` en las 7.027 filas sin excepción.

### Diferencias de fórmula respecto al motor

1. **El recargo del 10% está quemado en el Excel** (`W` y `Z` literalmente
   dicen `/(1-10%)`) y aplica **solo a la parte de mueble, nunca al herraje**.
   En el motor está desactivado (`recargo_extra = 0`, bloque `recF` comentado).
   Por eso `precioConHerrajesUsd` da 101,87 donde el Excel `W` da 110,96.
2. **Catálogo de márgenes incompleto**: `cot_parametros.margenes` solo tiene
   `muebles`/`fillers`/`pn_tk` (+ `margen_herraje`). Faltan MP 0,10, Panel
   Closet 0,50 y Panel Closet Perf 0,52, y no existe el caso "sin margen".
3. **El override de margen del proyecto solo mueve una categoría**:
   `cotizar.ts:94` aplica `margenOverride` únicamente si
   `tipo.margen_key === 'muebles'`; fillers y paneles conservan el suyo. El
   Excel no tiene override — cambiar `$T$1` mueve las 5.733 filas de muebles.
4. **El motor no calcula el margen efectivo** (`Y`/`AB` del Excel), que es el
   margen real de la venta una vez mezclados mueble (57%) y herraje (35%).

### Dos defectos detectados en la cadena del app

- **`cotizaciones.ts:158-160`** — cuando la línea trae `margenOverride`,
  `usarUnificado` se activa y se persiste `res.precioCop` aunque
  `conHerrajes` sea `true`. El comentario dice "precioCop ya consolidado",
  pero `engine.ts:281` calcula `precioCop = costoSinHerrajes/(1-margen)`: no
  incluye herraje. Resultado: **el herraje se factura en cero**. En el SBFD30
  son 216.041,68 COP en vez de 269.604,76 (−19,9%). Solo se dispara si se
  escribe un margen en la línea o en el proyecto; con el campo vacío
  (`margen: ""`) el override queda `undefined` y toma la rama correcta.
- **`engine.ts:281-293`** — el descuento (`descF`) se aplica a los campos USD
  pero **no** a los COP. Con 10% de descuento, `precioUsd*TRM` da 194.437,51
  mientras `precio_unit_cop` guarda 216.041,68. Los totales COP y USD de la
  cotización dejan de ser consistentes entre sí.

## 7. Formalización matemática

**Definición de margen.** Ambos sistemas definen el margen sobre el *precio*,
no sobre el costo: `m = (P − C)/P`. Despejando, `P = C/(1 − m)`. El
equivalente en markup sobre costo es `k = m/(1 − m)` (m=0,57 → k=132,56%).

**No linealidad.** `dP/dm = C/(1−m)² = P/(1−m)`, así que la elasticidad es
`(dP/P)/dm = 1/(1−m)`: con m=0,57 un punto porcentual de margen mueve el
precio **2,33%**; con m=0,35 solo 1,54%. Cambiar entre dos márgenes escala el
precio por `(1−m₁)/(1−m₂)` — de 57% a 50% es ×0,86 exacto, independiente del
costo.

**Los recargos componen, no suman.** El `/(1-10%)` del Excel es una segunda
etapa de margen sobre precio encadenada a la primera:
`P = C/[(1−T1)(1−r)]`, con margen efectivo `m_ef = 1 − (1−T1)(1−r)`.
Para T1=0,57 y r=0,10 da **0,613**, que es exactamente el valor de la columna
`AB` (MARGEN 2 SIN HERRAJES) — confirma la lectura. No es 0,57+0,10=0,67.

**Margen mezclado.** Con componentes de costo `Cᵢ` y márgenes `mᵢ`,
`P = Σ Cᵢ/(1−mᵢ)` y el margen resultante es
`1 − m_mix = (Σ Cᵢ) / (Σ Cᵢ/(1−mᵢ))`: el complemento del margen mezclado es la
**media armónica de los complementos, ponderada por costo**. En el SBFD30
(mueble 0,613 con $136.010 y herraje 0,35 con $34.816) da 0,578218, idéntico a
la columna `Y` del Excel. El motor no expone este valor.

**Descomposición de la brecha.** Como la cadena es un producto de factores, el
cociente de precios se factoriza en tres términos independientes:

```
P_app / P_excel = (C_app/C_excel) · [(1−m_excel)/(1−m_app)] · (TRM_excel/TRM_app)
                = 0,794212 · 0,860000 · 1,140625 = 0,779073
```

En logaritmos los aportes son aditivos: costo −0,2304 (+92,3%), margen −0,1508
(+60,4%), TRM +0,1316 (−52,7%). El costo domina; la TRM es el único término que
empuja hacia arriba.

**Margen implícito.** Despejando `m` para que el motor reprodujera los 86,66
USD: con los materiales del proyecto haría falta m=0,610; con materiales CEMA
y TRM 3.200, m=0,507; con materiales CEMA y TRM 3.650, **m=0,567** — a 0,003
del 0,57 del Excel, que es justo el residuo de costo del §5.

## 8. Método de verificación

`engine.ts` no depende de Next ni de Supabase, así que se puede ejecutar fuera
de la app contra los datos reales:

1. Cargar `src/lib/engine.ts` con `jiti` (está en `node_modules`; `tsx` no).
2. Leer catálogos y parámetros por REST de Supabase con la service-role key.
3. Llamar `calcularMueble()` armando el `CalcInput` igual que
   `prepararCotizacion()` en `cotizar.ts` — ojo con que el preset efectivo sale
   de `cot_preset_perfiles` (el marcado `es_default`), no de
   `cot_parametros.preset_default`, y que el `config_default` del proyecto lo
   pisa encima.
4. Barrer combinaciones de preset × margen × TRM hasta reproducir el número
   observado; el ajuste exacto identifica la configuración usada.

Ver [motor_calculo.md](motor_calculo.md) y
[validacion_hojas_de_ruta.md](validacion_hojas_de_ruta.md).
