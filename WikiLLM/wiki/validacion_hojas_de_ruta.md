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

## 10. Estado de implementación (2026-09-08)

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| Constante interior `L − 2×espesor` | Corregido y **aplicado** | `0028`, `engine.geoVars()` |
| Ancho de base según fondo | Corregido y **aplicado** | `0028` |
| Reveal de ancho de puerta | Corregido (universal) y **aplicado** | `0028` |
| Reveal de alto de puerta | Corregido en W/BFD/SBFD/SVFD y **aplicado** | `0028` |
| Reparto de frentes DB-2S | Corregido y **aplicado** | `0028` |
| Reparto de frentes DB-2/3/4 | Corregido (faltaba el reveal) y **aplicado** | `0028` |
| Modificador `gola` | Implementado y **aplicado** | `0028`, UI |
| Modificador `removible` | Implementado en 5 familias y **aplicado** | `0030`, UI |
| Modificador `abierto` | Ya existía (`modoFrentes`) | — |
| Variante `-F9` (fondo 9mm) | Absorbida por `TB` y **aplicado** | `0028` |
| Alias métricos `I…` | `pref_metrico` y **aplicado** | `0029` |
| 29 tipologías nuevas | Generadas, validadas y **aplicadas** | `0029` |
| Rieles DB (`refuerzo_trasero`/`_delantero`) a 82,55mm en vez de 80mm | Corregido en el tipo `DB` preexistente y **aplicado** (0028/0029 no lo tocaban: las nuevas tipologías ya nacieron en 80mm, pero el `DB` original nunca se re-apuntó) | `0031` |
| `refuerzo_horizontal` sin renombrar a `refuerzo_delantero` (perdía el ajuste 3→2 con gola) | Renombrado y con el ajuste de gola aplicado | `0031` |
| `trasero_gaveta` de tipologías parejas (DB-2/3/4) en 68mm en vez de 183mm | Corregido y **aplicado** — confirmado contra `DB24-2` (L=24): `L-4.607`=492,58mm, `183/25.4`=183mm, exacto | `0031` |
| **Bug de motor**: `derivarVars()` resolvía reglas en una sola pasada, dependiente del orden de llegada; `alto_frente_pequeno` depende de `alto_frente_pequeno_base` y `cotizar.ts` consulta `cot_reglas_config` **sin `ORDER BY`** — cualquier cotización DB-1S/DB-2S podía tronar con `ReferenceError` si Supabase devolvía las filas en otro orden | Corregido: `derivarVars()` ahora resuelve en varias pasadas, reintentando lo bloqueado por dependencia, sin importar el orden de entrada | `src/lib/engine.ts` |
| Ancho de riel/refuerzo a 82,55mm (3.25 in) en ~23 tipos (B, BBL, BBLFD, BFD, BOMH, DV, DVE, OVPC, PC, PCFD, SBFD, SV, SVFD, TW, UB, UBFD, UDV, UW, V, VFD, VPC, W, WBL) | Corregido a 80mm (3.14961 in) en **todo el catálogo**, no solo DB — confirmado universal contra `gola_perfil`, las 29 tipologías generadas desde hojas reales y la regla §3.3 del protocolo Firplak, y **aplicado** | `0032` |
| Largo de `trasero_gaveta` (`L-3.427`) sin corregir en B, DV, DVE, PCFD, UB, UDV, V (mismo defecto que tenía DB antes de 0031) | Corregido a `L-4.607` y **aplicado** — coincide con lo que ya traen de forma independiente los tipos generados desde hojas reales (POD, UV, BMW, UDB: `L-4.6063`). No se tocó BBL (`L-30.427`, esquinero ciego) ni KD (`L-2.4311`, kit de cajones): geometría distinta | `0032` |
| Reveal de alto de puerta en UBFD/VFD/WBL (mismo patrón exacto que W/BFD/SBFD/SVFD, solo que 0028 no las incluyó en su lista) | Corregido (`A`→`A-RV`) y **aplicado** | `0032` |
| `BFD.refuerzo_delantero` seguía en 82,55mm para módulos ≥12" — tenía una fórmula condicional (`L<12 ? 5 : 3.25`) que `0032` no detectó por buscar coincidencia exacta con `'3.25'`, no una subcadena. Único caso así en todo el catálogo (confirmado con `LIKE '%3.25%'`) | Corregido a `L<12 ? 5 : 3.14961` y **aplicado**; la rama `L<12 ? 5` (módulos angostos) no se tocó — valor distinto, sin relación con este defecto | `0033` |
| **Bug de precio**: con `margenOverride` activo (proyecto o línea con margen manual), `construirFilaLinea` guardaba `res.precioCop` a secas sin importar `conHerrajes` — un módulo con herrajes y uno sin herrajes quedaban costando exactamente lo mismo, porque `precioCop` del motor nunca incluye herraje (solo `precioConHerrajesCop` los suma) | Corregido: la selección de precio (`precioUnitario()`, ahora en `module-groups.ts`) usa siempre `conHerrajes ? precioConHerrajesCop : precioCop`, sin la rama "unificada" | `src/lib/cotizaciones.ts`, `src/lib/module-groups.ts` |
| `n_cajones`/`dbTipo`/`nbarras`/etc. de un módulo DB se quedaban pegados al cambiar de Tipo sin cerrar "Agregar mueble" (el formulario no se remonta entre módulos, a propósito, para heredar configuración) — un módulo sin gavetas agregado justo después de un DB-1S heredaba `n_cajones=3`, inflando fantasma el costo de riel/barras una vez arreglado el punto anterior | Corregido: `handleTipoChange` limpia `npuertas/ncajones/nentrepanos/zocalo/nbarras/dbTipo/rielCodigo/pcfdConfig` cada vez que cambia el Tipo (no en cada módulo agregado, solo al cambiar de tipo) | `AddLineForm.tsx`, `CotizadorForm.tsx` |
| Verificación pedida: ¿los herrajes de DB (ej. `DB18-S`) coinciden con el Excel en cantidad y costo? | **Confirmado exacto, sin cambios de código.** Reproduciendo `prepararCotizacion()`+`calcularMueble()` contra la fila real de `'Costos Muebles'` del Excel CEMA para `DB18-1s` (L=18,A=30,P=24, `n_cajones=3,n_cajones_pequenos=1,n_barras=2`): pata×4=$7.948, tornillo×16=$368, manija×3=$22.350, riel×3=$149.120,40, barra×2=$19.600 → total $199.386,40, **igual al centavo** a la columna J del Excel. Para `DB18-2s` (`n_cajones_pequenos=2,n_barras=1`): total $189.586,40, también exacto. Los dos bugs de arriba (margen y fuga de `n_cajones`) eran justamente lo que rompía esta cuenta — ya resueltos, no queda nada pendiente en las cantidades/costos de herraje de DB cuando se usa el selector "Tipología DB" (que fija `n_cajones`+`n_cajones_pequenos`+`n_barras` juntos, en `AddLineForm.tsx` y `CotizadorForm.tsx`) | — (verificación, sin migración) |
| Cartón de empaque (`consumibles.carton`) cobrado en variantes "abiertas" (`O*`, `modoFrentes='sin_frentes'`) que en el Excel traen `Costo Carton=0` | El resto del catálogo ya cerraba 99.3% exacto contra el Excel; corregido `cartonUnd=0` también con `modo==='sin_frentes'`, no solo con `usaCarton=false` | `src/lib/engine.ts` (sin migración, no depende de datos) |
| Desperdicio de tablero (15%) uniforme en toda tipología | **Confirmado ya correcto** por arquitectura (un único loop sin rama por tipo) y empíricamente contra 8 tipologías reales | — (verificación, sin cambios) |
| `BACKING` de DB (`fondo`: `largo=A`/`ancho=L-TC`, daba 762×442.2mm) vs. hoja real `DB18-1S` (760×441.2mm) | Corregido a `largo=A-0.07874`/`ancho=L-0.62992` (A−2mm / L−16mm), confirmado contra `UDB`/`USVFD`/`UVFD` que ya usaban esa fórmula. Con esto las 18 piezas de esa hoja cierran exactas | `0034` |
| Alto de puerta (`A` sin reveal) en `B`/`UB`/`V`, mismo patrón de `frente` que BFD/SBFD/SVFD/UBFD/VFD/W/WBL pero sin el `-RV` | ⚠️ **`0036` quedó mal — ver fila siguiente.** Se aplicó `A-RV` tomando "altura del mueble − 3.2mm" como regla general de muebles de puertas; vale para Full Door (BFD/SBFD), pero `B`/`UB`/`V` llevan cajón + puerta y la puerta no ocupa el alto completo | `0036` |
| Regresión de `0036`: la puerta de `B`/`UB`/`V` no es `A-RV` | Desmentido por la hoja real `B12-FE`: su `DOOR` mide **603,2mm**, no 758,8mm. Los tres tipos tienen `n_cajones=1`, así que el alto se reparte entre puerta y frente de gaveta: `603,2 + 3,2 + 152,4 + 3,2 = 762 = A`. **Corregido en `0039`** junto con el frente de gaveta (van atados: si el frente ocupa alto real, la puerta no puede ser del alto completo) | `0039` |
| Piezas que no cobraban tablero (auditoría de todo el catálogo) | 7 piezas reales con `rol_tablero` NULL o una dimensión en `0`: el `frente_cajon` de `B`/`UB`/`V`/`BBL` (área cero — el tablero del frente de gaveta nunca se cobró, solo su canto) y los refuerzos `refuerzo_vert_bisagras` de `BBL`/`BBLFD` y `refuerzo_profundidad` de `BBL` (medidas reales de 80mm de ancho, pero sin rol y sin canto: costo cero absoluto). Corregidas. **No se tocaron** las 5 entradas de solo-canto intencionales: `PCFD.frente_canto_puertas_op`/`frente_canto_gavetas_op` (el área ya la carga entera `frente_area_op`, darles rol duplicaría el frente), `PCFD.frente_delgado_informativo_op`, `SV.canto_lavamanos` y `UW.gola_canto` (codifican longitud de canto, no son tableros) | `0039` |
| Tipo nuevo `B-FE` (1 cajón + 1 puerta, riel full extension) | Creado desde la hoja real `B12-FE`: 16 piezas, las 15 medidas con 0,00mm de diferencia, canto y espesores idénticos. Caja de gaveta en **madera** (laterales der/izq de 100×500, contraparche, fondo de gaveta) dimensionada al `RIELFE500` de 500mm, a diferencia de `B` que usa caja metálica con riel Tandem | `0037` |
| Tipos nuevos `UB-FE` y `V-FE` | Misma estructura de `B-FE` (verificado contra la misma hoja), con lo propio de cada familia: `UB-FE` hereda de `UB` la variante `removible` (base a `P-TC` + refuerzos de 140mm y 120,75mm, y se agregó `'UB-FE'` a `PREFS_CON_REMOVIBLE`); `V-FE` hereda de `V` la categoría `vanity`. Las tres son **tipologías nuevas**: `B`, `UB` y `V` quedaron intactas (10, 12 y 10 piezas, sin cambios) | `0038` |
| Alto del frente de gaveta de las FE: 6" en B-FE/V-FE, 5,5" en UB-FE | Especificado por el usuario y verificado: `B-FE`/`V-FE` a A=30" dan frente 152,4mm + puerta 603,2mm; `UB-FE` a **A=28¾"** (el alto propio de la línea U) da frente 139,7mm + puerta 584,15mm. En los tres la pila cierra exacta contra `A` con la misma fórmula `A - n_cajones*alto_frente_gaveta - (n_cajones+1)*RV` — solo cambia la regla `alto_frente_gaveta` | `0038` |

Validación end-to-end (piezas y reglas reales leídas de Supabase, corridas por `calcularMueble()`) contra los ejemplos de la conversación:

- `DB24-2` (L=24, A=30, P=24): `trasero_gaveta` da 492,58 × 183,01mm (real: 492,6 × 183mm), rieles a 80,01mm, `frente` a 377,80mm ×2 — todo dentro de 0,02mm.
- `DB15-1S` (L=15, A=30, P=24): total de piezas activas (Σcant) = **18**, igual al conteo físico de Firplak.
- `SBFD30` (L=30, A=30, P=24, tras `0032`): `refuerzo_trasero` a 80,01mm (antes 82,55mm), `frente` 2×(377,80×758,80mm) con reveal correcto en ambos lados.

### UDV1228¾-2S — tres gavetas mixtas de línea U (2026-09-21)

La hoja `UDV1228 3/4-2S MBLE INF BAÑO 3 GAVETAS PEQUEÑA CARB2` confirma 18
piezas físicas a `L=12″`, `A=28¾″`, `P=21″`: base 274,8×509,4mm, laterales
730,25×533,4mm, tres rails delanteros y dos traseros de 274,8×80mm, tres
bases de gaveta de 199,8×441mm, dos traseros de 187,8×68mm, uno de
187,8×183mm, dos frentes de 139,7×301,6mm, uno de 441,25×301,6mm y BACKING
728,25×288,8mm. `0058_udv_gavetas_mixtas_hoja_real.sql` convierte la
tipología UDV en paramétrica por `n_cajones_pequenos`, corrige la base de
gaveta y el fondo. Regresión: `tests/udv1228-2s-hoja-real.test.ts`.

**Aplicación:** `0056_uvfd_puertas_por_ancho.sql`,
`0057_svfd36_hoja_real.sql` y `0058_udv_gavetas_mixtas_hoja_real.sql` fueron
aplicadas en Supabase el 2026-09-22. Una consulta posterior confirmó la regla
`n_cajones_pequenos=0` de UDV y todas las fórmulas esperadas de UVFD, SVFD y
UDV.

### Pendiente tras `0032`: ancho de `trasero_gaveta` en familias legado

`0032` corrigió el **largo** de `trasero_gaveta` en B/DV/DVE/PCFD/UB/UDV/V, pero dejó su **ancho** (alto de la pieza, hoy `2.6875 in` = 68mm) sin tocar. A diferencia del largo — que es un offset geométrico universal —, si esa altura debe ser 68mm (cajón corto, como en los tipos generados `POD`/`UV`/`BMW`) o 183mm (cajón estándar, como `trasero_gaveta_grande` de DB) es específico de cada familia y no hay una hoja de ruta puntual por tipo para confirmarlo. ~~Tampoco se tocó el alto de frente (`A` sin reveal) de `B`, `UB` ni `V`~~ — **resuelto en `0036`** (2026-09-10): el usuario confirmó la regla general "todos los muebles de puertas... la altura es la altura del mueble - 3.2mm", aplicable también a `B`/`UB`/`V` (mismo patrón de pieza `frente` que BFD/SBFD/etc., solo con `formula_ancho='A'` en vez de `'A-RV'`). La sospecha anterior de que `B` necesitaba una fórmula propia (`~A-158.8mm`) resultó ser un caso distinto: esa cifra viene de un `B` **híbrido** con cajón + puerta compartiendo el alto (ej. `B12`, ver §5.3 de `arquitectura_frontend.md` — el `frente` de la puerta ahí mide 301,6mm de 758,8mm totales, porque una gaveta se lleva el resto), no del `B` de solo puertas. Ese caso híbrido **sigue sin resolver** — la plantilla actual de `B` no reparte el alto entre puerta(s) y gaveta(s) cuando conviven; `formula_ancho='A-RV'` solo es correcto cuando `B` no tiene cajones.

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

### SVFD36 — mueble inferior lavamanos de dos puertas (2026-09-21)

La hoja de ruta compartida (`SVFD36 MBLE INF LVM 2 PUERTAS CARB2`) confirma
la plantilla para `L=36″`, `A=30″`, `P=21″`: base 884,4×509,4mm, dos laterales
762×533,4mm, un refuerzo delantero 884,4×96mm, dos refuerzos traseros
884,4×80mm, dos puertas 758,8×454mm y fondo 760×898,4mm. La plantilla previa
solo difería en el refuerzo delantero (127mm) y el fondo (899,4×762mm).
`0057_svfd36_hoja_real.sql` los corrige a 96mm y a `A−2mm` × `L−16mm`,
respectivamente. Regresión: `tests/svfd36-hoja-real.test.ts` cubre las nueve
piezas físicas de la hoja.

La visualización usa esos ejes en sentido inverso (`ancho` sobre X y `largo`
sobre Z). La migración `0059_svfd_fondo_visualizacion_ejes.sql` marca
`intercambiar=true` para el fondo SVFD, con regresión en
`tests/visualizacion.test.ts` para comprobar 898,4mm de ancho y 760mm de alto.

### DB33-4 — cajonera de cuatro gavetas (2026-09-22)

La hoja `DB33-4 MBLE INF COC 4 GAVETAS CARB2` confirma: base 808,2×585,6mm,
cuatro rieles delanteros y dos traseros de 808,2×80mm, cuatro fondos de gaveta
733,2×492mm, cuatro traseros de 721,2×68mm, frentes 187,7×835mm y BACKING
760×822,2mm. La migración `0063_db4_frente_hoja_real.sql` corrige el alto de
frente DB-4 de 187,3 a 187,7mm; `0062` ya había corregido sus traseros a 68mm.

### UW1336 — superior de una puerta y tres entrepaños (2026-09-22)

La hoja `UW1336 MBLE SUP COC 1 PUERTA 3 ENTREPAÑOS OPEN SHELF CARB2` confirma
base/tapa 300,2×304,8mm, laterales 914,4×304,8mm, dos rails traseros
300,2×80mm, un estante superior 300,2×281,8mm, dos estantes interiores
299,2×266,7mm, puerta 715,22×327mm y BACKING 898,4×314,2mm. `0067` reemplaza
la geometría heredada de UW y añade las piezas que faltaban. `0068` excluye las
dos filas de gola heredadas que no existen en la hoja. La migración `0069` activa
UW después de esta validación, por solicitud del usuario, para poder revisarla en
el Simulador. `0070` corrige los ejes del BACKING para conservar el largo de
898,4mm y el ancho de 314,2mm, y configura el estante superior como fijo: 8
tarugos y ningún soporte.

La referencia usa un largo exterior de 13in (330,2mm), aunque base, tapa, rails
y shelf 0 terminan en 300,2mm por el descuento de 30mm de los laterales. `0071`
resta esos 30mm y corrige los ejes restantes: shelves interiores 299,2mm,
puerta 715,22×327mm y BACKING 898,4×314,2mm.

### Montaje visual UW1336

La migración `0072` guarda coordenadas explícitas para evitar la distribución
automática: la puerta se ancla arriba (`Z=A-H`), el shelf superior fijo queda a
`TC+198,15mm` desde la base interna, y el BACKING se coloca delante de los rails
traseros (`Y=P-TC-TB`).

### OW3018 — superior abierto de 18 mm (2026-09-23)

La hoja `OW3018 MBLE SUP COC SIN PUERTAS` agrega la tipología `OW`, activa y
sin puertas ni herrajes. A 30×18×12in, `0076` reproduce siete piezas:
base 726×304,8mm, tapa 726×304,8mm, dos laterales 457,2×304,8mm, dos rails
traseros 726×80mm, un shelf 726×266,7mm y BACKING 435,2×740mm. La carcasa de
18mm usa canto visible de 1mm cuando la hoja lo indica, mediante
`forceCalibre`. `0077` fija los descuentos de 36mm y habilita nuevamente el
cartón. `0078` sustituye la BASE profunda de una hoja anterior por la base de
profundidad completa y añade el shelf móvil con cuatro soportes, delante del
fondo en la visualización.

`0079` conecta el shelf a la regla transversal `n_entrepanos`: OW3018 conserva
un entrepaño por defecto, pero cualquier ajuste de la cantidad actualiza el
despiece, los cuatro soportes por shelf y su distribución visual.

`0073` reserva además una holgura de 40mm debajo del shelf 0 fijo y distribuye
los entrepaños interiores en el espacio restante, para que no queden solapados
ni visualmente pegados.

`0074` ubica ambos entrepaños por delante del BACKING (`Y=P-TC-TB-D`), de modo
que su borde trasero llega a la cara frontal del fondo sin atravesarlo.

Para configuraciones UW de dos puertas, `0075` calcula el ancho de cada frente
como `(L-n_puertas×3,2mm)/n_puertas`. Esto conserva la puerta única de UW1336
(327mm) y monta dos puertas lado a lado cuando la regla define `n_puertas=2`.

### Pendientes

- Las migraciones `0028`/`0029`/`0030`/`0031` **ya están aplicadas** en Supabase
  I+D (2026-09-08).
- Las plantillas generadas no traen herrajes, tarugos ni soportes: las hojas de
  ruta no los modelan como pieza y hay que completarlos por familia.
- La puerta **embutida** (`A − 2×TC`) de BFD/SBFD sigue sin modelar; conviene
  tratarla como variante de frente junto a `gola`.
- `PL` (35 SKUs) y `SC` (9) no generaron plantilla: sus piezas no traen fórmula.
- `BACKING` de **DB**: **resuelto** con la hoja de ruta real de `DB18-1S` (`0034_db_backing_real.sql`). El `rol_tablero='fondo'` ya era correcto (el preset de DB ya apunta ese rol a un tablero de 6mm, coincide con el "Espesor" de la hoja) — lo que estaba mal eran las fórmulas: `largo=A` (daba 762mm) y `ancho=L-TC` (daba 442.2mm) vs. la hoja real, 760mm y 441.2mm. Corregido a `largo=A-0.07874` (A−2mm) y `ancho=L-0.62992` (L−16mm) — confirmado independiente contra `UDB`/`USVFD`/`UVFD` (tipologías generadas por `scripts/generar_tipologias.py` directo de hojas reales de familias de cajones emparentadas), que ya traían exactamente esa misma fórmula. Con este fix las **18 piezas** de la hoja `DB18-1S` cierran contra el motor (17 ya cerraban antes; BACKING era la única con 1-2mm de más). Regresión: `tests/db-backing.test.ts`. Pendiente: confirmar si `A-2mm`/`L-16mm` sigue firme en otro tamaño de DB (solo se tiene un dato real, L=18"); y si el mismo patrón aplica a `BACKING` fuera de la familia DB (B/W/BFD/etc. no se auditaron en esta ronda).
- Ancho de `refuerzo_trasero`/`refuerzo_delantero` para familias **fuera de
  DB** (W, BFD, etc.) no se auditó en esta ronda — solo se corrigió DB.
