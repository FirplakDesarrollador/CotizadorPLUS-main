# Validación sistemática contra hojas de ruta de producción

## Fuente

`Hojas de ruta 2.xlsx` (export de la lista de SharePoint del sitio
`FPKFabricademuebles`): **17.876 piezas en 1.937 hojas de ruta**, con fechas de
creación entre 2023-03 y 2026-08. Una fila por pieza, con `DESCRIPCION SKU`,
`LETRA`, `PIEZA`, `LARGO`, `ANCHO`, enchapes por lado, `Canto`, `Espesor` y —
lo más importante — una columna **`Formula`**.

Herramienta: [`scripts/validar_hojas_ruta.py`](../../scripts/validar_hojas_ruta.py).

## 1. El DSL de la columna `Formula`

Cada hoja de ruta trae, por pieza, la derivación paramétrica que usó el
diseñador. Es el equivalente de producción de `cot_piezas_plantilla`:

En esta formulación (antigua) el **mueble** tiene tres dimensiones —
`L` = **Largo**, `A` = **Ancho**, `P` = **Profundo** — y la **pieza** solo tiene
dos: Largo y Ancho. Cada token declara de *cuál de las tres dimensiones del
mueble* proviene el Largo o el Ancho de la pieza. La forma es
`<pieza>x<mueble>{offset}<mueble>y<pieza>`: la relación se enuncia dos veces,
de ida y de vuelta.

| Token | Significado |
| --- | --- |
| `LxL{-30}LyL` | Largo(pieza) ← Largo(mueble) − 30 mm |
| `LxA{0}AyL` | Largo(pieza) ← **Ancho**(mueble) |
| `AxP{-24}PyA` | Ancho(pieza) ← Profundo(mueble) − 24 mm |
| `AxL[0,4958]LyA` | Ancho(pieza) ← Largo(mueble) × 0,4958 |

`{}` es offset aditivo en milímetros, `[]` es factor multiplicativo, la coma es
separador decimal. Hay 620 fórmulas distintas construidas con este vocabulario,
presentes en 16.272 de las 17.876 filas.

### Falso amigo con el cotizador

La app usa las mismas tres letras pero expande `A` como **Alto**. Es solo la
palabra: la correspondencia física es 1:1 y no hay que reordenar nada.

| Hoja de ruta | Cotizador | Dimensión física |
| --- | --- | --- |
| `L` Largo | `L` Largo | horizontal (frente) |
| `A` **Ancho** | `A` **Alto** | vertical |
| `P` Profundo | `P` Profundidad | fondo |

Verificado sobre las 419 hojas `W`/`UW`/`OW` cuyo SKU codifica las dos medidas
(`W3014` = 30 × 14): el `L` recuperado coincide con el primer número en 418/419
casos y el `A` recuperado con el segundo en **419/419**. En el resto de esta
página, "alto" se usa en sentido físico (la vertical), que es el `A` de ambos
sistemas.

**Consecuencia metodológica:** como cada pieza aporta una ecuación sobre L, A o
P, el conjunto de piezas de una hoja queda *sobredeterminado*. Se puede
recuperar por consenso el Largo/Ancho/Profundo del mueble y marcar como
sospechosa cualquier
pieza que no concuerde, sin necesidad de conocer de antemano la tipología. Esa
es la base de las tres validaciones de este estudio.

Precisión confirmada para DB (2026-09-10): los **142 laterales de las 71 hojas DB**
usan `AxP{0}PyA` y miden 609,6 mm de profundidad. Allí P es la profundidad del
lateral; con frente sobrepuesto de 18 mm, la profundidad exterior interpretada
es **627,6 mm = P + 18**, no P. La afirmación anterior de que P ya incluía el
frente era incorrecta para estas DB. No extrapolar esa convención a otras
familias sin revisar sus fórmulas. Ver [interpretación espacial DB](interpretacion_espacial_db.md).

## 2. Calidad de la fuente

De las 1.832 hojas con fórmula, **1.796 (98,0 %) son internamente coherentes**:
todas sus piezas apuntan al mismo módulo con menos de 0,6 mm de dispersión. La
fuente es confiable como *ground truth* para validar el motor.

| Resultado | Hojas |
| --- | --- |
| Coherentes (0 conflictos) | 1.796 |
| Desvío ≤ 3 mm (redondeo de factores) | 17 |
| Desvío 3–25 mm | 3 |
| Desvío > 25 mm (error real) | 16 |
| Sin fórmulas (muebles de línea LVM, nombre comercial) | 105 |

Los 16 casos graves están listados en la sección 6.

## 3. Hallazgo crítico: la constante interior es `L − 2 × espesor`

El descuento de las piezas horizontales interiores (base, tapa, rails,
refuerzos) **no es una constante**: es exactamente dos veces el espesor del
lateral.

| Espesor estructural | Constante observada | Filas |
| --- | --- | --- |
| 15 mm | `L − 30` | 4.968 |
| 18 mm | `L − 36` | 641 |
| 25 mm | `L − 50` | 2 |
| 30 mm | `L − 60` | 4 |

`L − 31` (78 filas) es un **artefacto legado de 2023**: ese año se repartía
46 % / 44 % contra `L − 30`, y desde 2024 prácticamente desaparece. No debe
tomarse como referencia.

**Impacto en el cotizador.** `cot_piezas_plantilla` tiene `L-1.18` (= L − 30 mm)
codificado en 57 plantillas y **ninguna fórmula referencia el espesor del
tablero**; `engine.ts` solo usa `espesor_mm` para elegir el calibre del canto,
nunca en la geometría. Es decir, todo mueble cotizado con carcasa de 18 mm
recibe las piezas interiores **6 mm más largas de lo que producción va a
cortar**.

Y la exposición está creciendo: la carcasa de 18 mm pasó de 2 % de las hojas en
2024 a **33 % en 2026** (163 hojas, 10,9 % del acumulado histórico).

Corrección recomendada: sustituir las constantes por una variable de espesor
estructural (`TC`, que ya existe en el motor de agrupación — ver
[motor_calculo.md](motor_calculo.md) §3) y expresar `L - 2*TC`, `L - TC`, etc.

## 4. Tipología DB: reglas confirmadas y una regla equivocada

Las 71 hojas DB (A = 762 mm / 30" en todas) permiten contrastar dimensiones de
corte de las gavetas. No aportan todas las cotas de montaje. La
[reconstrucción espacial](interpretacion_espacial_db.md) distingue medidas
documentadas de posiciones inferidas.

### 4.1 Confirmado contra `0027_db_gavetas_mixtas.sql`

| Pieza | Hoja de ruta | Migración 0027 | Estado |
| --- | --- | --- | --- |
| `frente_gaveta_pequena` (DB-1S) | 152,4 mm | `6` in = 152,4 mm | exacto |
| `frente_gaveta_grande` (DB-1S) | 300,1 mm | 300,0 mm | 0,1 mm |
| `trasero_gaveta_pequena` alto | 68 mm | `68/25.4` | exacto |
| `trasero_gaveta_grande` alto | 183 mm | `183/25.4` | exacto |
| `trasero_gaveta` largo | `L−117` mm | `L-4.607` in = L−117,0 mm | exacto |
| `base_gaveta` largo | `L−105` mm | `L-4.13` in = L−104,9 mm | 0,1 mm |

El trabajo de la migración 0027 queda **validado de forma independiente** sobre
decenas de hojas, no solo sobre el `DB15-1S` que se usó para deducirla.

### 4.2 Defecto: DB-2S usa otra regla, no "6 pulgadas fijas"

`0027` aplica la misma regla a toda tipología mixta: el cajón pequeño mide 6" y
los grandes reparten el resto. **Eso solo es cierto para DB-1S.**

Las hojas DB-2S siguen una **rejilla de 4 unidades**: el alto útil se divide en
4 partes iguales, las dos gavetas pequeñas toman 1 unidad cada una y la grande
toma 2.

```text
unidad = (A − 4 × 3,2) / 4 = (762 − 12,8) / 4 = 187,3 mm
DB-2S  = 187,3 / 187,3 / 377,8      (377,8 = 2 × 187,3 + 3,2)
suma   = 752,4 = A − 3 × 3,2        cierre exacto
```

Comprobado en `DB16-2S`, `DB30-2S`, `DB18-2s-S18MM` y `DB24-2s-S18MM`, que
cierran con 0,0 mm de error.

Lo que produce hoy la fórmula de `0027` para un DB-2S:

| | Pequeñas | Grande |
| --- | --- | --- |
| Fórmula actual (0027) | 152,4 mm | 447,6 mm |
| Hoja de ruta real | 187,3 mm | 377,8 mm |
| **Error** | **−34,9 mm** | **+69,8 mm** |

### 4.3 Tabla de reparto de frentes por tipología (A = 762 mm)

| Tipología | Frentes (mm) | Regla |
| --- | --- | --- |
| DB-1S | 152,4 / 300,1 / 300,1 | pequeña fija 6", grandes reparten el resto |
| DB-2S | 187,3 / 187,3 / 377,8 | rejilla de 4 unidades (1u / 1u / 2u) |
| DB-3 | 250,8 × 3 | reparto parejo |
| DB-4 | 187,7 × 4 | reparto parejo |
| DB-2 | 377,8 × 2 | reparto parejo |

`DB-2` (2 gavetas) y `DB-4` (4 gavetas) aparecen en producción y conviene
verificar que `n_cajones` los admita en las reglas de la app.

## 5. Variaciones transversales (no son tipologías nuevas)

El punto más importante para el modelo de datos: buena parte de los "prefijos
desconocidos" son **modificadores del mismo mueble base**, no familias nuevas.
Confirmado con pares exactos de igual medida.

### `O…` = abierto (sin puertas)

`OBFD30` es idéntico a `BFD30` **menos las dos puertas**. Nada más cambia. Es
exactamente el concepto `modoFrentes = sin frentes` que ya existe en la app.
Afecta a `OW` (20), `OB`, `OBFD`, `OSBFD`, `ODB`, `OVAN`, `OVANS`, `OVFDE`,
`OPCFD`.

### `…R` = removible

`USVFDR3028` vs `USVFD3028`: sí cambia la estructura — rails delanteros y
traseros más anchos (139,3 y 120,75 mm frente a 80 mm), base más profunda y
fondo reorientado. Es una variante estructural real que necesita modificadores
propios. Afecta a `USVFDR` (16), `USBFDR` (9), `UBR` (5), `UDBR` (3), `UBFDR`
(3).

### `SM` / `SMG` = gola

195 hojas (10,1 %) y 101 con la pieza `GOLA` explícitamente despiezada. Esto
aporta la evidencia de despiece que faltaba en
[variantes_frente_gola_sm.md](variantes_frente_gola_sm.md), que hasta ahora
solo tenía el maestro CEMA:

- En DB, `SM` **agrega 2 piezas `GOLA`** de `(L−30) × 80 × 15 mm` y **baja los
  `RAIL DELANTERO` de 3 a 2**. Neto: +1 pieza de ese perfil.
- La gola consume **53,6 mm del alto disponible para frentes**, repartidos
  proporcionalmente: 13,4 mm por unidad de rejilla. Un DB-2S SM pasa de
  187,3 / 187,3 / 377,8 a **173,9 / 173,9 / 351,0** (−13,4 / −13,4 / −26,8).
  Un DB-2 SM pasa de 377,8 × 2 a 351,0 × 2.
- La constante 53,6 mm es estable en las 25 hojas SM revisadas,
  independientemente del ancho del mueble y de la tipología de gavetas.

### `-F9` = fondo de 9 mm

Cambia el `BACKING` de 6 a 9 mm **y** reduce el ancho de la base en 3 mm.
La regla que cierra en ambos casos es `ancho_base = P − 18 − espesor_fondo`
(6 mm → P−24; 9 mm → P−27). Hoy la app trata el fondo como un rol de tablero
sin efecto geométrico sobre la base.

### `I…` = nomenclatura métrica

`IP` ya está registrado en la app como el equivalente métrico de `BFD`
(migración 0020). Los datos muestran que la línea completa existe: `IC` (10,
cajonera → DB), `ILVP` (3, lavaplatos → SBFD), `IEC` (2, esquinero), `IBR`,
`IHFC`. Son candidatos a llenar `pref_metrico` en `cot_tipos_mueble` en lugar
de crear tipos nuevos.

## 6. Errores detectados en las hojas de ruta

Estos son defectos de la fuente, no del cotizador. Vale la pena devolverlos a
Diseño de producto.

### 6.1 Seis hojas DB-2S con el frente inferior equivocado

`DB19-2S`, `DB20-2S`, `DB24-2S` (y su duplicado `HRJ DB24-2S`), `DB33-2S` y
`DB34-2S` traen el frente inferior en **300,1 mm**, que es el valor de la
tipología *1S*. Con 187,3 / 187,3 / 300,1 la pila suma 674,7 mm contra 752,4 mm
de alto útil: **faltan 77,7 mm**. Las hojas 2S que sí cierran (`DB16-2S`,
`DB30-2S`, `DB18-2s-S18MM`, `DB24-2s-S18MM`) usan 377,8 mm. Es un copia-pega
desde el patrón 1S.

### 6.2 `DB12-2S` incompleta

Solo tiene 15 piezas: falta el frente central, el frente inferior y el
`BACKING`.

### 6.3 `W2128` con piezas de un mueble de 15"

`BASE`, `TAPA` y `RAIL TRASERO` miden 350 mm, que corresponde a `L − 31` con
L = 381 mm (15"). El mueble es de 21" (533,4 mm): esas tres piezas quedan
**152,4 mm cortas**.

### 6.4 Fórmulas mal escritas (no afectan la medida)

`W3014`, `W3015`, `W3015-F9` y `HRJ W3015` tienen el `BACKING` con
`LxA{-16}AyL LxL{-16}LyL`: dos tokens escribiendo sobre `L` y ninguno sobre `A`.
Debería ser `AxL{-16}LyA`. Las medidas registradas son correctas; lo que está
mal es la anotación de la fórmula.

### 6.5 Otras hojas incoherentes

`BBLDBFD57 5/8-2D9 5/8-2-SMG` (411 mm), `MBLE SUP COCINA GEOS 210X60CM MODULO
LOCERO` (393 mm), `MBLE INF COCINA GEOS 210X60 MODULO CAJONES` (236 mm),
`HRJ BOV24 4/5` (200 mm), `HRJ AL53183 Z10` (100 mm en la gola vertical),
`HRJ BBLFD42-D14 7/8D` (79 mm en la puerta ciega), `BFD24-F9`,
`USVFDR3928 3/4-F9`, `B19`, `HRJ UDV1028 3/4-1S` (25,4 mm en el trasero
inferior).

## 7. Puertas: la app no descuenta el reveal

En las hojas, una puerta doble mide `(L − 2 × 3,2) / 2` de ancho y `A − 3,2` de
alto. Los factores `[0,4958]`, `[0,49475]`, `[0,495]`… que aparecen en el DSL
son esa misma fórmula precalculada para cada ancho concreto: para L = 762 mm da
377,8 mm, y 377,8 / 762 = 0,49580 exacto.

La plantilla de la app usa `formula_largo = 'L/n_puertas'` y
`formula_ancho = 'A'`, sin reveal. Cada puerta sale **3,2 mm más ancha y 3,2 mm
más alta** que la de producción.

Excepción: los superiores `W` no siguen `A − 3,2` (en `UW2838` la puerta es
`A − 199,18`), así que la regla del alto debe definirse por familia.

## 8. Cobertura de tipologías

Familias mapeadas en `cot_tipos_mueble` con respaldo de datos: `W` (400),
`PN` (210), `BFD` (123), `B` (116), `UW` (80), `F` (78), `DB` (71), `SBFD` (42),
`D` (44), `PC` (25), `SVFD` (23), `UB` (21), `UBFD` (18), `BBLFD` (16),
`UDV` (15), `V` (14), `R` (12), `TK` (9), `TW` (9), `DV` (5), `SV` (4),
`OVPC` (3), `WBL` (3), `VFD` (2), `PCFD` (1), `VPC` (1). Sin datos en esta
fuente: `BOMH`, `DVE`, `VDF`, `CARTON`, `NA`.

### Familias con volumen real y sin mapear

| Prefijo | SKUs | Qué es |
| --- | --- | --- |
| `USVFD` | 36 | Sink vanity línea U — la línea U está mapeada solo parcialmente |
| `S`, `SA`, `SLOC`, `SMO`, `SBAS`, `SEC` | 43 | Superiores especiales: locero, microondas abierto, basculante, esquinero |
| `CC`, `WCC`, `CLV`, `CDB`, `CTK`, `SC`, `DFE`, `CLCOR` | 60 | **Línea completa de clósets**, sin ninguna representación en la app |
| `BOV`, `BMW`, `IHFC` | 13 | Muebles de horno y microondas (`BOMH` existe pero sin datos) |
| `UV`, `UVFD`, `UDB`, `USBFD` | 20 | Resto de la línea U |
| `WLD`, `WER`, `WSMMD`, `TWBL`, `WPC` | 12 | Variantes de superiores |
| `POD`, `SDB`, `DD` | 12 | Módulos de cajón sueltos / adicionales |
| `AL` | 6 | Alacenas |
| `BLS` | 2 | Lazy Susan (esquinero giratorio) |

### Piezas sueltas y kits

`PL` (35, panel), `FL` (16, filler), `KF` (11, kit de frentes), `SC` (9),
`BT` (5, base-tapa), `DF` (6, frente de gaveta), `LD`/`LI` (4, laterales),
`E` (2, entrepaño), `Z` (2, zócalo), `KD` (2, kit de cajones), `WD`, `BK`.

Son SKUs de repuesto o de kit, no muebles. Confirman comercialmente el concepto
`modoFrentes = solo kit de frentes` que ya modela la app y sugieren que también
se venden piezas estructurales sueltas.

### Fuera de alcance paramétrico

Las 105 hojas sin fórmula corresponden a la línea LVM/local con nombre
comercial (`MUEBLE MACAO`, `Mueble Rayo`, `Van Gogh`, `Da vinci`, `Lipa`,
`COCINA GEOS`, `CUBO`…). No se derivan de L/A/P y no encajan en el modelo
paramétrico del cotizador.

## 9. Prioridades sugeridas

1. **Espesor en las fórmulas** (§3) — afecta al 33 % de la producción 2026 y a
   toda la geometría interior, no a una tipología.
2. **Regla de frentes DB-2S** (§4.2) — error de hasta 69,8 mm en una tipología
   que ya está en producción.
3. **Reveal de puertas** (§7) — 3,2 mm sistemáticos en todas las familias con
   puerta.
4. **Modificadores transversales** (§5) — modelar `abierto`, `removible`,
   `gola` y `fondo 9mm` como modificadores evita crear ~25 tipos duplicados.
5. **Línea de clósets** (§8) — 60 SKUs sin ninguna representación; es producto
   nuevo, no una corrección.
6. Devolver a Diseño de producto los errores de §6.

## Referencias

- [db_gavetas_mixtas.md](db_gavetas_mixtas.md) — tipologías DB mixtas.
- [variantes_frente_gola_sm.md](variantes_frente_gola_sm.md) — análisis previo
  de `SM`, ahora con evidencia de despiece.
- [motor_calculo.md](motor_calculo.md) — `TC` como espesor físico de caja.
- [esquema_base_datos.md](esquema_base_datos.md) — `cot_piezas_plantilla`,
  `pref_metrico`.

---

## 10. Estado de implementación (2026-08-24)

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| Constante interior `L − 2×espesor` | Corregido | `0028`, `engine.geoVars()` |
| Ancho de base según fondo | Corregido | `0028` |
| Reveal de ancho de puerta | Corregido (universal) | `0028` |
| Reveal de alto de puerta | Corregido en W/BFD/SBFD/SVFD | `0028` |
| Reparto de frentes DB-2S | Corregido | `0028` |
| Reparto de frentes DB-2/3/4 | Corregido (faltaba el reveal) | `0028` |
| Modificador `gola` | Implementado | `0028`, UI |
| Modificador `removible` | Implementado en 5 familias | `0030`, UI |
| Modificador `abierto` | Ya existía (`modoFrentes`) | — |
| Variante `-F9` (fondo 9mm) | Absorbida por `TB` | `0028` |
| Alias métricos `I…` | `pref_metrico` | `0029` |
| 29 tipologías nuevas | Generadas y validadas | `0029` |

### Variables geométricas del motor

`geoVars()` en `src/lib/engine.ts` inyecta en toda fórmula de pieza y de regla:

| Variable | Significado |
| --- | --- |
| `RV` | Reveal entre frentes: 3,2 mm (0,12598 in) |
| `TC` | Espesor del tablero de rol `caja`, en pulgadas |
| `TF` | Espesor del tablero de rol `frente` |
| `TB` | Espesor del tablero de rol `fondo` |

Cualquier punto que evalúe fórmulas debe construir el contexto con `geoVars()`
— también `group-engine.ts` — o una fórmula con `TC` lanza `ReferenceError`.

### Generador de tipologías

`scripts/generar_tipologias.py` traduce el despiece real a plantillas de la app
y se auto-valida reaplicándolas sobre las hojas de su familia. El catálogo de
familias es curado: excluye las ya mapeadas (borraría su plantilla con herrajes
y `modo_agrupacion`), los modificadores (`O…`, `…R`, `WSM`) y los alias métricos.

Regenerar con:

```bash
python scripts/generar_tipologias.py "Hojas de ruta 2.xlsx" --out db/migrations/0029_tipologias_nuevas.sql
```

### Pendientes

- Las migraciones `0028`/`0029`/`0030` **no están aplicadas**.
- Las plantillas generadas no traen herrajes, tarugos ni soportes: las hojas de
  ruta no los modelan como pieza y hay que completarlos por familia.
- La puerta **embutida** (`A − 2×TC`) de BFD/SBFD sigue sin modelar; conviene
  tratarla como variante de frente junto a `gola`.
- `PL` (35 SKUs) y `SC` (9) no generaron plantilla: sus piezas no traen fórmula.
