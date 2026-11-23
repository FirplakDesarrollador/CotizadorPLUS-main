# Mesones de cocina y baño: lógica de PB Shore y propuesta para Cotizador PLUS

> **Estado:** cálculo de mesones implementado en Cotizador PLUS. Las secciones 1 a 7 documentan el Excel original.
> **Fuente:** `CONTENEDORES/pb shore.xlsx` — hojas `Summary`, `Mesones` y `Cabinets`.
> **Fecha:** 2026-11-23.

---

## 0. Resumen

El Excel determina los mesones en tres pasos:

1. **Área real** = suma de anchos de muebles bajos × profundidad + backsplash.
2. **Suplementos** por configuración de planta, isla, waterfall y muros laterales, para lo que no está sobre un mueble.
3. **Cantidades lineales/unitarias**: pies pulidos, perforaciones y huecos.

El resultado es una **estimación comercial en sqft y pies lineales**, no un despiece ni un plano de corte.

En Cotizador PLUS se puede aplicar porque ya existen secciones, anchos reales por módulo, cantidad de unidades por sección, materiales, TRM, márgenes, versiones, PDF e instalación. Lo que no existe es la **planta** (paredes, esquinas, islas, voladizos), que debe seguir siendo una entrada manual con valores sugeridos.

---

## 1. Dónde vive la lógica

| Hoja | Papel |
|---|---|
| `Summary` (filas 20-31 y 52-65) | Entradas por tipología de unidad, cálculo de áreas/pies lineales y precios |
| `Mesones` (filas 2-20) | Catálogo de costos: material por m², empaque, pulido, perforaciones, márgenes y TRM |
| `Cabinets` (filas 33-34 y 46-56) | Anchos reales de los muebles bajos (`BL/BM` cocina, `BN/BO` baño) y parámetros de lavaplatos/estufa |

---

## 2. Entradas del modelo (una fila por tipología de unidad)

En `Summary!B20:T20` están los campos de entrada; en la fila 21 el ejemplo y en la 22 los totales. Todo se multiplica por `T` = cantidad de unidades de esa tipología (80 en el ejemplo).

| Campo | Celda | Qué alimenta |
|---|---|---|
| Configuración | `D` | `Cocina lineal` / `Cocina en L` / `Cocina en U`. Solo se usa como heurística de esquinas |
| Baños por unidad | `E` | Total baños = `E × T` (no se usa para área) |
| Islas / penínsulas | `F` | Total islas = `F × T` |
| Largo de isla/península | `G` | Voladizo y waterfall |
| "Over Reach" lateral | `H` | Franja lateral de la isla |
| "Over Hang" frontal | `I` | Voladizo frontal de la isla |
| Muros laterales cocina / baño | `J`, `K` | Franjas de 3" + backsplash en el muro |
| Cantos pulidos cocina / isla / baño | `L`, `M`, `N` | Cantidad de retornos/cantos expuestos (no metros) |
| Waterfalls isla / cocina | `O`, `P` | 0/1/2 paneles de 36" de alto |
| Estufa / cooktop / lavaplatos | `Q`, `R`, `S` | Conteos y huecos |
| Unidades | `T` | Multiplica todo |
| Espesor cocina / baño | `X`, `Y` | Activa el suplemento de canto de 1,5" |
| Profundidad cocina / baño | `Z`, `AA` | 25,5" y 22,5" |
| Altura backsplash cocina / baño | `AB`, `AC` | 4" |

Además hay interruptores en `F44:F51`: incluir mesones, origen `US`/`COL`, fabricación, perforaciones en instalación, perforaciones pulidas.

---

## 3. Cómo se determina la medida

Todas las fórmulas están en pulgadas y convierten a sqft dividiendo entre 144, o a pies lineales dividiendo entre 12.

### 3.1 Mesón de cocina

La medida real sale de los **anchos de los muebles bajos**:

```
BM = ancho del SKU × cantidad × unidades        (Cabinets!BL × M × V)
AI = (Σ BM) × (Z + 4 si espesor 1,5") / 144
   + (Σ BM) × AB / 144
```

Es decir: largo real = suma de anchos de muebles bajos de cocina; área = largo × profundidad + largo × altura de backsplash. Solo entran los SKU cuya ubicación en el catálogo de precios sea `Mueble inferior Cocina` (`BK`). Quedan fuera superiores, alacenas, pantries, fillers, paneles y zócalos.

Sobre eso, el Summary suma otros bloques (`AD`, `AE`, `AG`, `AH`):

| Bloque | Fórmula legible | Qué representa |
|---|---|---|
| `AD` | `(Z+3) × T × Z / 144` según configuración (1 "pierna" en L, 2 en U) + backsplash ×2/×4 + isla + waterfalls + franja lateral | Suplemento por configuración, isla y waterfall |
| `AE` | `J×3×Z + J×AB×Z` por unidad | Muro lateral de cocina: franja de 3" + backsplash usando la profundidad como largo |
| `AG` | `Q × 30 × AB` | Backsplash detrás de la estufa (30" de ancho) |
| `AH` | `S × 24 × Z + S × 24 × AB` | Mesón sobre lavaplatos + su backsplash (24" de ancho) |
| `AI` | Σ anchos de muebles bajos × profundidad + backsplash | **El área real del mesón** |

Y el total:

```
AK = (AD + AE + AG + AH + AI) × 1,05     ← 5 % de desperdicio
AL = (AJ + AF) × 1,05                    ← baño
AM = AK + AL
AN = AM / T                              ← sqft por unidad
```

### 3.2 Mesón de baño

```
BO = ancho del SKU × cantidad × unidades        (solo "Mueble inferior Baño")
AJ = (Σ BO) × (AA + 4 si espesor 1,5") / 144 + (Σ BO) × AC / 144
AF = K×3×AA + K×AC×AA                            ← muros laterales
AL = (AJ + AF) × 1,05
```

**Ojo:** si en `Cabinets` no hay vanities cargados como `Mueble inferior Baño`, `AJ` da 0 y el baño queda solo con las franjas de muro. En el libro de PB Shore pasa exactamente eso: `AJ = 0` y `AL = 183,75 sqft` para 80 unidades, es decir 2,3 sqft/unidad para dos baños. Es un subcálculo evidente.

### 3.3 Islas, penínsulas y waterfalls

```
Voladizo frontal     = G × I × T / 144
Waterfall isla       = (Z + I) × 36 × O × T / 144
Waterfall cocina     = P × Z × 36 × T / 144
Franja lateral isla  = H × (Z+3) × T / 144
Suplemento 1,5"      = franjas de 4" alrededor de la isla o del waterfall
```

El waterfall siempre se estima con 36" de alto y con la profundidad (o profundidad + voladizo) como ancho. No se descuenta el hueco de la isla ni se comprueba que el panel quepa en la losa.

### 3.4 Cantos pulidos (pies lineales)

```
AO (cocina) = [ L×(Z+AB) + 27×(0/2/3 según configuración)
              + J×(Z+AB) + Q×(2Z+30) + S×24×2
              + M×(I+Z) + 2H ] × T
              + 2 × Σ BM
            todo / 12

AP (baño)  = [ N×(AA+AC) + K×(AA+AC) ] × T + 2 × Σ BO , / 12
```

- `L/M/N` son **cantidad de cantos o retornos expuestos**, no longitud.
- El término `2 × Σ ancho` cuenta dos veces el ancho de todos los muebles bajos (frente y trasero).
- El `27 × 2` en L y `27 × 3` en U es una tolerancia de esquina.
- El pulido solo se cobra cuando el origen es `COL` (maquila). Si es `US`, `F59/F60 = 0` porque la losa ya viene pulida.

### 3.5 Perforaciones

No se restan del área: se cobran como unidades.

```
AZ (cocina)   = Σ de muebles con prefijo "SB"  → 1 hueco por fregadero
BA (baño)     = Σ de muebles con prefijo "SV"  → 1 hueco por lavamanos
```

En el ejemplo son 240 huecos de cocina (3 por unidad) y 0 de baño. El hueco se cobra una sola vez: en fábrica si `F49 = No` (25 USD c/u) o en instalación si `F49 = Si`, nunca en ambos.

---

## 4. Ejemplo real del libro (80 unidades)

| Concepto | Total | Por unidad |
|---|---|---|
| Cocina (`AK`) | 4.572,97 sqft | 57,16 sqft |
| Baño (`AL`) | 183,75 sqft | 2,30 sqft |
| Total (`AM`) | 4.756,72 sqft | **59,46 sqft** |
| Pulido cocina (`AO`) | 4.603,33 ft | 57,54 ft |
| Pulido baño (`AP`) | 706,67 ft | 8,83 ft |
| Costo mesones (sin instalar) | 81.631,83 USD | 1.020,40 |
| Precio mesones (sin instalar) | 127.410,06 USD | 1.592,63 |
| Costo instalado | 105.415,42 USD | 1.317,69 |
| Precio instalado | 164.000,21 USD | 2.050,00 |
| Margen resultante | — | 35,9 % |

Desglose de la cocina: `AI` aporta 40,56 sqft/unidad, `AD` 6,89, `AH` 4,92, `AE` 1,24 y `AG` 0,83. El `AD` es un 12 % del área de cocina; no es despreciable, y su definición geométrica no está documentada.

---

## 5. Cadena de precios

La hoja `Mesones` tiene dos cadenas de suministro.

### 5.1 Origen US (`Mesones US`, filas 17-20)

| Concepto | Costo | Precio |
|---|---|---|
| Suministro | 9,90 USD/sqft (Quartz) | costo / (1 − 0,3599) = 15,47 |
| Producción | 6,00 USD/sqft | costo / (1 − 0,3585) = 9,35 |
| Pulido | 0 | 0 (ya viene pulido) |
| Perforación | 25 USD/hueco | 39,00 |
| Instalación | 5 USD/sqft | 7,69 |

### 5.2 Origen COL / maquila (`Mesones Colombia`)

| Concepto | Fórmula |
|---|---|
| Costo sqft COP | `(costo m² + empaque m²) / 10,76` |
| Costo sqft USD | `/ TRM 4.000` |
| Precio FPK sqft | `costo / (1 − 0,50)` → margen FPK 50 % |
| Pulido | `costo m COP / 3,28 / TRM` → precio con margen 30 % |
| Perforación pulida | 50.000 COP → 12,5 USD costo → 17,86 precio |
| Perforación no pulida | 30.000 COP → 7,5 USD costo → 10,71 precio |

Luego el `Summary` aplica **otro margen por concepto** (≈35-36 %) para llegar al precio de venta. Es decir, en COL hay dos márgenes encadenados (FPK + cotización) y en US uno solo. Ese punto hay que definirlo bien si se traslada a la app.

---

## 6. Qué se tiene en cuenta

- Configuración de planta: lineal, L o U.
- Profundidad y espesor del mesón.
- Altura de backsplash.
- Islas y penínsulas: largo, voladizo frontal, voladizo lateral.
- Waterfalls: 0, 1 o 2, con 36" de alto.
- Muros laterales: franja de 3" + backsplash.
- Estufa, cooktop y lavaplatos: anchos fijos de 30" y 24".
- Cantidad de baños y de unidades.
- Cantos pulidos y esquinas.
- Perforaciones de fregadero y lavamanos, pulidas o no.
- Desperdicio fijo del 5 %.
- Suplemento de canto cuando el espesor es 1,5".
- Origen del material (US o COL/maquila), fabricación y momento de las perforaciones.
- Márgenes por concepto, TRM y empaque.
- Peso para contenedores (`3,71 lb/sqft`, 22.500 lb/contenedor).

---

## 7. Puntos débiles que **no** conviene copiar tal cual

1. **El largo de la cocina no se mide.** Para L y U usa `(profundidad + 3")` como longitud de una "pierna", no el largo real. En una cocina de 15 ft la estimación se queda corta o se solapa con el área de muebles.
2. **Posible doble conteo `AD` + `AI`.** `AD` suma un tramo de `(Z+3)` por configuración y `AI` ya suma todos los anchos de muebles bajos. No hay documentación de qué representa exactamente `AD`; en el ejemplo añade 551 sqft (11,6 % de la cocina). Hay que validarlo antes de replicarlo.
3. **Baño dependiente de vanities cargados.** Si no existen en `Cabinets`, el área de baño colapsa a las franjas de muro (2,3 sqft/unidad en el ejemplo). En Cotizador PLUS hay secciones y tipologías de baño: el cálculo debe partir de ellas.
4. **Esquineros.** Sumar anchos de muebles bajos ignora el solape de esquina (BBL, BLS, etc.). En L/U el área de la esquina no es `ancho × profundidad` dos veces.
5. **Cantos pulidos inflados.** `2 × Σ ancho` cobra frente y trasero de todos los muebles, aunque el trasero esté contra muro. En el ejemplo son 2.640 de 4.603 ft (57 % del pulido).
6. **Anchos fijos de electrodomésticos.** 30" de estufa y 24" de lavaplatos están escritos en el código; no salen de la cotización.
7. **No descuenta huecos del área.** El fregadero y la estufa se cobran aparte, pero el tablero no se reduce.
8. **Desperdicio plano del 5 %.** No considera formato de losa, veta, nesting ni merma real.
9. **Bug de mayúsculas en la configuración.** `AD` busca `"Cocina lineal"` y `AO` busca `"Cocina Lineal"`. Si el usuario selecciona `Cocina lineal`, el pulido se calcula como si fuera U (3 esquinas en vez de 0). Es un error latente en la hoja.
10. **Rango de filas inconsistente.** `AI` suma `Cabinets!47:1364` y `AO` suma solo `47:470`. Con más de 423 muebles, el pulido omite líneas.
11. **Claves de material distintas entre orígenes.** US usa `GRANITO`/`QUARZTONE`; COL usa `QUARZTONE BLANCO POLAR`, `GRANITO GRIS CONCRETO`, etc. Un `VLOOKUP` con la clave del otro origen devuelve `#N/A`.
12. **Faltan costos en la tabla COL.** Mármol Crema Marfil y los seis sinterizados no tienen costo de material, pulido ni perforación: sus precios dan 0.
13. **TRM inconsistente.** `Mesones!R4 = 4.000` y `Cabinets!G38 = 3.100`. El precio final del mesón puede quedar desalineado con el resto de la cotización.
14. **Márgenes dispersos.** `K54 = 35,99 %`, `K55 = 35,7 %`, `K56 = 35,85 %`, `K81 = 35 %`… están escritos celda a celda y no salen de un parámetro único.
15. **Supuesto de unidades idénticas.** Una fila por tipología × `T` funciona si todas las unidades son iguales. Si hay variantes por unidad, hay que abrir filas.

---

## 8. Implementación en Cotizador PLUS

- En cada área, **+ Agregar mesón** toma el largo de los muebles inferiores y vanities: ancho en pulgadas por cantidad de línea. Excluye superiores, torres PC, paneles, fillers, zócalos y adicionales. El servidor vuelve a leer las líneas al guardar. La medida es una suma lineal por unidad del área.
- El dishwasher agrega su ancho al mesón y al backsplash, con 24 pulgadas editables. El Range agrega su ancho al backsplash, con 30 pulgadas editables. El Cooktop agrega una perforación de fábrica sin reducir el área de material. Las otras perforaciones se ingresan por separado.
- La isla o península agrega su propia superficie, con largo y voladizos frontal y lateral. Si sus muebles están en la misma área, se pueden seleccionar para excluir sus anchos del tramo principal. Las cascadas de isla y de cocina/baño se cuentan por separado y usan la profundidad de su tramo y la altura configurable.
- Cada muro lateral agrega una franja de 3 pulgadas y el retorno del backsplash. Cada canto lateral pulido del tramo principal usa la profundidad más la altura del backsplash; cada canto de la isla usa la profundidad más el voladizo frontal. En el espesor reforzado se agrega la franja de refuerzo. Se convierte a ft² y se aplica merma.
- El libro original confirma los 4.572,96875 ft² de cocina y 183,75 ft² de baño para 80 unidades. La cocina incluye 551,04167 ft² del bloque AD, que mezcla una aproximación de esquinas con voladizos. En el baño, AJ queda en cero. El valor de PB Shore es una referencia comercial histórica. El formulario nuevo usa el ancho de los muebles registrados y las medidas indicadas para la isla.
- **Materiales-Parámetros → Mesones** separa Colombia y USA. La carga inicial de `src/lib/mesones.ts` sale de `Mesones!A4:O13` y `A19:D20`; el mármol y los seis sinterizados tienen costo de material pendiente. Al guardar, el catálogo y los parámetros se persisten juntos en `cot_parametros.mesones`. La cotización usa la TRM del proyecto, con las conversiones 10,76 ft²/m² y 3,28 ft/m del libro.
- En Colombia, el costo real de suministro incluye material y empaque. El margen interno FPK se aplica al suministro y el de maquila al pulido y las perforaciones, antes de los márgenes comerciales. USA aplica los márgenes comerciales. Las tarifas iniciales comerciales son las de cocina de `Summary`. El descuento de la cotización se aplica al resultado comercial.
- Cada cálculo se persiste como una línea sin tipología, con `config.clasificacionPdf = 'mesones'`. Guarda las medidas, la tarifa, los parámetros y el resultado usado. El total persistido es por unidad del área y las repeticiones se aplican una sola vez en la cabecera y en el PDF. Las líneas se conservan al versionar y quedan fuera del motor, HDR y optimizador. FIRPLAK, CEMA y la vista general imprimen material, origen, medidas, cantidad, superficie y valor en un bloque propio. En CEMA el subtotal calculado tiene prioridad cuando hay líneas guardadas.
- Instalación, logística y arancel quedan en el flujo de Entrega de la cotización. El campo de perforaciones del formulario corresponde a las cobradas en fabricación. El catálogo se actualiza para cálculos nuevos; las líneas guardadas conservan el precio aprobado en su cotización.

## 9. Verificación

- Comprobación de tarifas del libro, fórmulas en ambas monedas, refuerzo, merma, cálculo de repeticiones y guardado con un cliente de base de datos en memoria.
- Dos generaciones independientes en Chromium de FIRPLAK, CEMA y general con datos de prueba y CSS de impresión. El texto coincidió en ambas pasadas. Se renderizaron las páginas y se cotejaron material, origen, 80 unidades, 1.176 ft² y valores COP/USD. En CEMA el valor manual legado quedó fuera del subtotal al existir mesones guardados.
- La auditoría de solo lectura antes y después de los cambios arrojó cero diferencias de totales y los mismos nueve hallazgos previos (ocho referencias sin catálogo y un grupo inválido). Las pruebas de mesones no escribieron en la base compartida.

En la actualización del largo automático se comprobó el formulario en Chrome con acciones simuladas, la derivación y el guardado con datos de prueba, y dos PDF de cada plantilla con dishwasher, Range, isla y cascadas. La auditoría de solo lectura siguió registrando los mismos nueve hallazgos previos y cero diferencias de totales.

## 10. Enlaces relacionados

- [Protocolo de cotizaciones y PDF](protocolo_pdf_cotizaciones.md)
- [Motor de cálculo](motor_calculo.md)
- [Consumo de materiales: unidades y merma](consumo_materiales.md)
- [Entrega, Incoterm e instalación](entrega_cotizaciones.md)
- [Esquema de base de datos](esquema_base_datos.md)
- [Sistema de Calidad y Trinquete (Ratchet)](sistema_calidad_ratchet.md)
