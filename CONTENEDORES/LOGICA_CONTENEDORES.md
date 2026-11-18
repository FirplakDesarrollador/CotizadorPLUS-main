# Lógica de contenedores de transporte — Cotizador PLUS

**Fecha:** 2026-11-17
**Alcance:** análisis de los libros `CONTENEDORES/pb shore.xlsx` y `CONTENEDORES/Simulación muebles CEMA 17_11.xlsx`, y diseño de la implementación en la pestaña **Cotizaciones**.
**Restricción:** este documento no modifica el aplicativo. No se crea ni se modifica ninguna página de `WikiLLM/`.

---

## 1. Resumen ejecutivo

1. La cifra **Delivery → Container qty** del libro PB SHORE **no** se calcula con la regla de “un contenedor por cada 60 unidades”. Esa regla original se refería a viviendas y queda retirada del aplicativo (sección 6).
2. La cifra oficial sale del **peso total de tablero** de la cotización:

   ```text
   Contenedores = ROUNDUP(Peso total / 22.500 kg, 0)
   ```

3. El peso se estima **solo con tablero**, a partir del despiece: área neta × espesor × densidad (720 kg/m³) × un factor de ajuste.
4. Validación con PB SHORE: **33 líneas de módulos × 80 repeticiones = 33.189,47 kg → 2 contenedores**.
5. La app ya tiene **todos** los insumos para replicarlo: `breakdown.maderaPorRol[].cm2`, el `codigo` de tablero, `cot_tableros.espesor_mm` y —sobre todo— las cantidades de la cotización.
6. Las **unidades no se digitan**: se derivan de la propia cotización multiplicando la cantidad de cada módulo por las veces que se repite su área (`cantidad de la línea × cantidad del área`). Si un mueble aparece 2 veces en una cocina que va 20 veces, son 40 unidades de ese mueble.
7. Por lo tanto **no hace falta campo nuevo ni migración**: solo falta la **presentación** del resultado (UI y PDF). Todo se resuelve sin tocar precios, geometría ni los cálculos existentes.

---

## 2. Fuentes y mapa de celdas

### 2.1 `Simulación muebles CEMA 17_11.xlsx`

Es la base de ingeniería y costos por SKU. Las hojas relevantes:

| Hoja | Contenido |
|---|---|
| `madera` | Despiece y áreas por familia de tablero. `AZ = 0,15` (15 % de desperdicio). Columnas `AM`, `AO`, `AQ`, `AS`, `AU`, `AW`, `AY` son áreas en m². |
| `canto y otros` | Cantos, herrajes y consumibles. No interviene en el peso. |
| `Costos Muebles` | Costo unitario por SKU. No interviene en el peso. |
| `Precio` | Precio de venta por SKU. No interviene en el peso. |

### 2.2 `pb shore.xlsx`

Es la plantilla comercial. La sección **Delivery** está en `Summary`:

| Celda | Contenido / fórmula | Valor en PB SHORE |
|---|---|---:|
| `Summary!A35` | `Delivery` | — |
| `Summary!A36` | `Incoterm` | — |
| `Summary!C36` | `FOB` | — |
| `Summary!A37` | `Container qty` | — |
| `Summary!C37` | `='Lista de chequeo'!D56` | **2** |
| `Lista de chequeo!B56` | `Cantidad Contenedores` | — |
| `Lista de chequeo!D56` | `=Summary!$BL$22` | **2** |
| `Summary!BL22` | `=ROUNDUP(SUM(BL21:BL21),0)` | **2** |
| `Summary!BL21` | `=BJ21/22500` | **1,475087** |
| `Summary!BJ21` | `=SUMIF(Cabinets!$C$47:$C$1364,Summary!$C$21,Cabinets!$AG$47:$AG$1364)` | **33.189,47 kg** |
| `Cabinets!AG47` | Peso del SKU (ver fórmula abajo) | — |
| `Cabinets!W47` | `=V47*M47` (unidades × cantidad) | **80** |
| `Summary!T21` | Cantidad de unidades del proyecto | **80** |
| `Summary!U21` | `=E21*T21` (baños totales) | **160** |
| `Summary!V21` | `=F21*T21` (islas totales) | **80** |

Cadena completa:

```text
Summary!C37 = 'Lista de chequeo'!D56
'Lista de chequeo'!D56 = Summary!BL22
Summary!BL22 = ROUNDUP(SUM(BL21:BLn), 0)
Summary!BL21 = BJ21 / 22500
Summary!BJ21 = SUMAR.SI(Cabinets!C:C, Summary!C21, Cabinets!AG:AG)
```

### 2.3 Fórmula del peso por SKU (`Cabinets!AG47`)

```text
AG47 = (
         VLOOKUP(G47, madera!D:AM, 36) * 0,0055   ' fondo/backing, m²
       + VLOOKUP(G47, madera!D:AO, 38) * 0,0055   ' fondo puertas, m²
       + VLOOKUP(G47, madera!D:AQ, 40) * 0,015    ' balance 15 mm, m²
       + VLOOKUP(G47, madera!D:AS, 42) * 0,018    ' color 18 mm, m²
       + VLOOKUP(G47, madera!D:AU, 44) * 0,018    ' polar 18 mm, m²
       + VLOOKUP(G47, madera!D:AW, 46) * 0,015    ' polar 15 mm, m²
       + VLOOKUP(G47, madera!D:AY, 48) * 0,015    ' color 15 mm, m²
       ) * 720 * W47 * 0,85
```

---

## 3. Fórmula oficial y equivalencia

### 3.1 Fórmula del libro

```text
Peso_SKU_kg = [ Σ (Área_m²_con_desperdicio × Espesor_m) ] × 720 kg/m³ × 0,85
Peso_total_kg = Σ Peso_SKU_kg × cantidad_módulos
Contenedores = ROUNDUP(Peso_total_kg / 22.500 kg, 0)
```

### 3.2 Interpretación de constantes

| Constante | Valor | Interpretación |
|---|---:|---|
| Espesores | `0,0055 / 0,015 / 0,018` | Espesor en metros del tablero de cada familia. `0,0055` aproxima el fondo de 6 mm (y el de puertas de 9 mm). |
| Densidad | `720` | kg/m³ de tablero de melamina/MDP. |
| Desperdicio | `0,15` | Las áreas de `madera` ya vienen multiplicadas por `1,15`. |
| Factor de ajuste | `0,85` | Se aplica sobre el área con desperdicio. |
| Equivalencia neta | `1,15 × 0,85 = 0,9775` | El peso final es ≈ 97,75 % del peso del área neta. |
| Capacidad | `22.500` | kg operativos por contenedor (22,5 t). |
| Redondeo | `ROUNDUP` | Siempre hacia arriba; no se fracciona un contenedor. |

### 3.3 Fórmula recomendada para la app

La app guarda **área neta** en `breakdown.maderaPorRol[].cm2`. Para reproducir el libro sin depender del desperdicio de precios de cada proyecto:

```text
kg_línea = Σ ( cm2 / 10.000 ) × ( espesor_mm / 1.000 ) × 720 × 0,9775
kg_línea_total = kg_línea × cantidad_línea
kg_área = kg_línea_total × cantidad_área
contenedores = techo( Σ kg_área / 22.500 )
```

- `0,9775` es el equivalente exacto de `1,15 × 0,85`.
- No se suma empaque: la instrucción es **“solo como se calcula ahora”**.
- No se suman herrajes, cantos ni consumibles.
- La densidad es **720 por defecto**; no requiere campo nuevo en el catálogo (se puede permitir override opcional por tablero).

---

## 4. Validación numérica con PB SHORE

- `Summary!T21 = 80` viviendas (repeticiones del apartamento tipo).
- `Cabinets` tiene **33 líneas** de módulos por vivienda (filas 47 a 79).
- Peso total: **33.189,4668 kg**.
- Peso por vivienda: **414,8683 kg**.
- Módulos totales si se derivan las unidades: `33 × 1 × 80 = 2.640` → **12,5718 kg por módulo**.
- `33.189,4668 / 22.500 = 1,475087` → `ROUNDUP` = **2 contenedores**.
- Ocupación de 2 contenedores: **73,75 %** de 45.000 kg.
- Capacidad por peso: **54,23 viviendas/contenedor**.
- Regla de 60 viviendas: `80 / 60 = 1,33` → 2. **Coincide, pero no es la fórmula** y la app no la implementa.
- Si el proyecto tuviera exactamente 60 viviendas: `60 × 414,8683 = 24.892,10 kg` → **2 contenedores**, mientras la regla de 60 diría 1. El peso manda.

### 4.1 Detalle por línea (kg por vivienda)

| # | SKU | kg/u | # | SKU | kg/u |
|---:|---|---:|---:|---|---:|
| 1 | SBFD33 | 27,83 | 18 | F830 | 1,96 |
| 2 | BFD15 | 19,73 | 19 | TK5 1/496 | 4,12 |
| 3 | BFD15 | 19,73 | 20 | BFD24 | 26,05 |
| 4 | DB15-1s | 23,67 | 21 | BFD24 | 26,05 |
| 5 | W3614 | 14,83 | 22 | PN24 7/835 | 7,17 |
| 6 | W2430 | 20,51 | 23 | PN24 7/835 | 7,17 |
| 7 | W3330 | 26,54 | 24 | PN49 1/235 | 14,26 |
| 8 | W2730 | 22,52 | 25 | TK5 1/496 | 4,12 |
| 9 | W2730 | 22,52 | 26 | SBFD36 | 29,49 |
| 10 | W3013 | 12,21 | 27 | F630 | 1,47 |
| 11 | W1530 | 14,48 | 28 | PN21 7/834 | 6,17 |
| 12 | PN24 7/835 | 7,17 | 29 | TK4 1/296 | 3,53 |
| 13 | PN12 7/830 | 3,16 | 30 | SBFD36 | 29,49 |
| 14 | PN12 7/814 | 1,47 | 31 | F630 | 1,47 |
| 15 | PN1717 | 2,36 | 32 | PN21 7/834 | 6,17 |
| 16 | F830 | 1,96 | 33 | TK4 1/296 | 3,53 |
| 17 | F830 | 1,96 | | **Total** | **414,87** |

> La suma de los valores redondeados da 414,87 kg por vivienda; el valor exacto es 414,8683.

---

## 5. Qué se tiene en cuenta y qué no

### Sí se tiene en cuenta

1. Cantidad real de módulos: `cantidad_línea × cantidad_área`.
2. Área neta del despiece de cada pieza, por rol y por tablero.
3. Espesor real del tablero asignado al rol.
4. Densidad del tablero (720 kg/m³).
5. Factor de ajuste 0,9775 sobre área neta (equivalente a 1,15 × 0,85 del libro).
6. Peso total del proyecto.
7. Capacidad de 22.500 kg por contenedor.
8. Redondeo hacia arriba.
9. **Unidades del proyecto derivadas** de la propia cotización: `Σ (cantidad_línea × cantidad_área)`. No se digitan ni se guardan aparte.
10. Peso promedio por unidad = peso total / unidades derivadas.
11. Rangos sanos del checklist: ≈16 muebles por unidad y 40–60 ft² de mesón por unidad (opcional, fuera de alcance).

### No se tiene en cuenta

- **Herrajes**: manijas, bisagras, rieles, patas, barras. El peso del libro es solo tablero.
- **Cantos, tornillos, tarugos, pegante y consumibles.**
- **Empaque, cartón, esquineros y estibas.** La nota del libro solo aclara que los muebles van *single-packed* y los fillers/paneles/zócalos van *bulk-packed*. No se suma nada por empaque.
- **Volumen.** No hay control volumétrico. El criterio es peso porque el despacho es RTA.
- **Mesones.** Tienen su propio cálculo independiente:
  `Summary!F58 = ROUNDUP(((F54+F55)*3,71)/22500, 0)` → 1 contenedor aparte. No se debe mezclar con el de muebles.
- **Márgenes, precios, TRM, aranceles.**
- **“Truck loads (20 kitchens)”** (`Summary!BK`), que es otra logística: `T21/20` y se usa para el delivery en Miami a $580 por tráiler. No son contenedores.

---

## 6. La regla de 60 unidades: por qué no se implementa

Texto exacto del comentario en `Lista de chequeo!B56`:

> “Tiene sentido esta cifra. Regla general es 1 contenedor por cada 60 unidades. En caso de decimales se aproxima hacia arriba.”

Lectura del libro:

```text
control_unidades = techo(unidades_vivienda / 60)
```

- En el libro, esas “unidades” son **viviendas/apartamentos** (`Summary!T21 = 80`), no módulos. `80 / 60 = 1,33` → 2, que coincide con el peso.
- Pero la app **no registra viviendas** en ningún campo: `cot_cocinas.cantidad` es la repetición de un área (cocina, baño, isla…), no el número de apartamentos. Un proyecto con cocina ×20 y baño ×40 tiene 60 repeticiones de área y probablemente 20 viviendas.
- Al pasar a unidades derivadas del usuario (módulos reales = 2.640 en PB SHORE), la regla de 60 daría 44 contenedores frente a 2 por peso. Compararla sería peor que no mostrarla.

Decisión: **la regla de 60 se retira como control activo** de la UI y del PDF. Queda documentada aquí como antecedente del libro. El único criterio es el peso:

```text
contenedores = techo(peso_total_kg / 22.500)
```

Motivo de fondo: el libro ya demuestra que la regla subestima. Con 60 viviendas de este mismo apartamento (`60 × 414,8683 = 24.892,10 kg`) la regla diría 1 contenedor y el peso exige 2. El peso manda.

---

## 7. Modelo de datos actual de Cotizador PLUS

| Dato del libro | Equivalente en la app |
|---|---|
| `Summary!T21` (viviendas) | Equivalente conceptual: **unidades derivadas** = `Σ (cantidad_línea × cantidad_área)`. No hay campo manual ni migración. |
| `Cabinets!M` (cantidad del módulo) | `cot_cotizacion_lineas.cantidad` |
| `Cabinets!V` (repetición de la unidad) | `cot_cocinas.cantidad` |
| `Cabinets!G` (SKU) | `codigo_modulo` / `pref` |
| `Cabinets!C` (unidad) | `cot_cocinas.nombre` / `cantidad` |
| Áreas por familia | `breakdown.maderaPorRol[]` → `{ rol, codigo, cm2 }` |
| Espesor | `cot_tableros.espesor_mm` |
| Peso | **No existe**; se calcula |
| Densidad | **No existe** en el catálogo; se usa 720 por defecto |
| Contenedores | **No existe**; se calcula |
| Mesones | La app no cotiza mesones |

Ventajas del `breakdown`:

- `maderaPorRol[].cm2` es área **neta** y ya incluye la cantidad de piezas de la línea.
- `maderaPorRol[].codigo` es el tablero realmente usado al calcular la línea.
- Las líneas agrupadas guardan su propio `breakdown`; sumar líneas no duplica piezas.
- Las líneas históricas conservan su despiece aunque cambie el catálogo.

---

## 8. Diseño de la solución

### 8.1 Función pura

Archivo nuevo: `src/lib/contenedores.ts`.

```ts
export type TableroPeso = {
  codigo: string;
  espesor_mm: number | null;
  densidad_kg_m3?: number | null;
};

export type MaderaRol = { rol: string; codigo: string; cm2: number };

export type LineaPeso = {
  cantidad: number;              // piezas de este módulo dentro del área
  breakdown?: { maderaPorRol?: MaderaRol[] } | Record<string, unknown> | null;
  clasificacion?: 'mueble' | 'herrajes_otros';
};

export type AreaPeso = {
  nombre: string;
  cantidad: number;              // veces que se repite el área (cocina ×20)
  lineas: LineaPeso[];
};

export type ParametrosContenedores = {
  capacidadKg: number;   // 22.500
  densidadKgM3: number;  // 720
  factorPeso: number;    // 0,9775
};

export type DetalleAreaContenedores = {
  area: string;
  repeticiones: number;          // cantidad del área
  unidades: number;              // Σ(cantidad_línea) × repeticiones
  pesoKg: number;
  pesoPorUnidadKg: number | null;
};

export type ResultadoContenedores = {
  pesoTotalKg: number;
  pesoPorUnidadKg: number | null;   // kg promedio por módulo
  unidadesTotales: number;          // derivadas, nunca digitadas
  contenedores: number;
  ocupacionPct: number;
  capacidadKg: number;
  advertencias: string[];
  detallePorArea: DetalleAreaContenedores[];
};

export function calcularContenedores(
  areas: readonly AreaPeso[],
  tableros: readonly TableroPeso[],
  parametros?: Partial<ParametrosContenedores>,
): ResultadoContenedores;
```

Reglas:

- `Math.ceil` solo al final.
- `unidadesTotales` **se deriva**: `Σ_áreas (cantidad_área × Σ_líneas cantidad_línea)`. Nunca se recibe como parámetro ni se lee de `config_default`.
- Normalización de cantidades: `undefined`/`null`/`NaN` → **1** (el default que usa la app al crear líneas); `0` → **0**; negativas → **0**. Nunca valores negativos ni `NaN` en el resultado.
- Ejemplo canónico: un módulo con `cantidad = 2` en un área con `cantidad = 20` aporta **40 unidades**.
- `capacidadKg <= 0` → `contenedores = 0` y advertencia; no dividir por cero.
- `unidadesTotales = 0` → `pesoPorUnidadKg = null`; no inventar promedios.
- Si falta `espesor_mm` para un código, advertir y omitir esa fila; nunca asumir 0.
- Si una línea no tiene `maderaPorRol`, advertir “línea sin despiece” y omitirla del peso; nunca inventar.
- `breakdown` llega tipado como `Record<string, unknown>` desde las líneas de la UI: validar con `Array.isArray(breakdown?.maderaPorRol)` y descartar filas cuyo `cm2` no sea un número finito > 0.
- Si `clasificacion === 'herrajes_otros'`, excluirla del peso **y del conteo**: las líneas de herrajes/otros no son muebles. Es lo mismo que ya hace `separarPropuesta` con `propuesta.muebles`.
- `densidad_kg_m3` por tablero tiene prioridad sobre la densidad global.

### 8.2 Derivación de unidades (sin campo manual)

No se agrega ningún campo. Las unidades salen de la cotización tal como está guardada:

```text
unidades_área   = Σ (cot_cotizacion_lineas.cantidad)        // piezas por área
unidades_totales = Σ (unidades_área × cot_cocinas.cantidad) // repetibilidad del área
```

- `cot_cocinas.cantidad` es la repetición del área, y `Number(cantidad ?? 1)` es el patrón ya usado en `separarPropuesta`, `imprimir/page.tsx` y `recalcularTotalesCotizacion`.
- Ejemplo del usuario: un mueble con `cantidad = 2` en una cocina con `cantidad = 20` → **40 unidades** de ese mueble; si en esa cocina hay 10 líneas, las unidades del área son `20 × Σ` y no `20`.
- Las líneas **agrupadas** (`grupo_id`) tienen `cantidad = 1` por regla del motor; se cuentan como una unidad cada una y no se usa el consolidado del grupo.
- Los **herrajes/otros** no cuentan: no son muebles y `propuesta.muebles` ya los separa.
- No se toca `ProjectDefaults`, ni `ProjectConfigPanel`, ni `config_default`, ni se crea migración. `config_default.unidades` **no existe y no debe crearse**. Si una cotización vieja tuviera una clave `unidades`, se ignora.
- El valor es **derivado y volátil**: si el usuario cambia la cantidad de una línea o de un área, las unidades y los contenedores se recalculan solos. No hay nada que “desincronizar”.

### 8.3 UI: “Características del proyecto”

- En la sección `CARACTERÍSTICAS DEL PROYECTO` de `CotizacionDetalleClient`, después de `ProjectConfigPanel`, renderizar un nuevo `EntregaPanel`.
- El panel es **solo lectura** (no tiene inputs):
  - Unidades del proyecto (derivadas) y su fórmula visible en texto pequeño.
  - Peso estimado total (kg).
  - Peso promedio por unidad (kg).
  - Capacidad por contenedor (22.500 kg).
  - Contenedores (entero).
  - Ocupación (%).
  - Desglose por área (repeticiones, unidades, kg) en una tabla compacta y opcional.
- Nota fija: “Estimación con tablero. No incluye herrajes, empaque ni mesones.”
- El cálculo se hace en el cliente con `cocinas` + `tableros`; no se agrega una consulta nueva.
- Implementación sugerida (las líneas de la UI se tratan como `LineaPropuesta` para reutilizar el clasificador existente):

```ts
import { esHerrajeOtroAdicional, type LineaPropuesta } from '@/lib/propuesta-cotizacion';

const logistica = useMemo(() => calcularContenedores(
  cocinas.map((cocina) => {
    const lineas = cocina.lineas as unknown as LineaPropuesta[];
    return {
      nombre: cocina.nombre,
      cantidad: Number(cocina.cantidad ?? 1),
      lineas: lineas.map((linea) => ({
        cantidad: Number(linea.cantidad ?? 1),
        breakdown: linea.breakdown,
        clasificacion: esHerrajeOtroAdicional(linea) ? 'herrajes_otros' : 'mueble',
      })),
    };
  }),
  tableros,
), [cocinas, tableros]);
```

- No duplicar `esHerrajeOtroAdicional` ni reimplementar la detección de herrajes con prefijos.

### 8.4 PDF: sección “Entrega”

Debe existir en las dos plantillas:

- **CEMA**: página/sección titulada `DELIVERY` (el PDF CEMA está en inglés).
- **FIRPLAK**: página/sección titulada `Entrega` en español y `Delivery` en inglés.

Contenido mínimo:

| Campo | Texto ES | Texto EN |
|---|---|---|
| Unidades | Unidades del proyecto | Project units |
| Peso total | Peso estimado | Estimated weight |
| Peso por unidad | Peso promedio por unidad | Average weight per unit |
| Capacidad | Capacidad por contenedor | Container capacity |
| Contenedores | Contenedores | Containers |
| Ocupación | Ocupación | Occupancy |
| Nota | Estimación con tablero. No incluye herrajes, empaque ni mesones. | Estimate based on board weight. Excludes hardware, packaging and countertops. |

- Las unidades impresas son las **derivadas**; nunca un valor digitado.
- Si `unidadesTotales = 0` (cotización sin líneas), mostrar `0` y omitir el peso por unidad.
- No mostrar precios en esta sección.
- No alterar las secciones existentes ni los invariantes de cotizaciones/PDF.
- En CEMA, los números de página actuales son fijos; al insertar la página hay que **recalcularlos** para que no se dupliquen ni salten.

### 8.5 Flujo de datos en el PDF

En `src/app/cotizaciones/[id]/imprimir/page.tsx`:

1. `propuesta.muebles` ya trae las áreas con líneas y `breakdown`, y ya excluye herrajes/otros.
2. `tablerosDeProyecto()` ya se llama para las especificaciones.
3. Calcular una sola vez:

```ts
const logistica = calcularContenedores(
  propuesta.muebles.map((area) => ({
    nombre: area.nombre,
    cantidad: Number(area.cantidad ?? 1),   // repeticiones del área
    lineas: area.lineas.map((linea) => ({
      cantidad: Number(linea.cantidad ?? 1), // piezas del módulo en el área
      breakdown: linea.breakdown,
      clasificacion: esHerrajeOtroAdicional(linea) ? 'herrajes_otros' : 'mueble',
    })),
  })),
  await tablerosDeProyecto(),
);
```

- No se pasa `unidadesProyecto`: se deriva dentro de la función a partir de `area.cantidad` y `linea.cantidad`.
- No se lee `cabecera.config_default.unidades` ni ninguna otra fuente externa.
- `propuesta.muebles` ya excluye herrajes/otros, así que las unidades del PDF coinciden con las de la UI.

4. Pasarlo como `logistica` a `CemaProposalData` y `FirplakProposalData`.
5. Renderizar un componente compartido `EntregaPdf` en `DetallesProyecto.tsx`.

---

## 9. Decisiones cerradas

| # | Decisión | Implementación |
|---|---|---|
| 1 | **Densidad:** usar 720 kg/m³ por defecto. | Constante `DENSIDAD_KG_M3 = 720`. No agregar campo al catálogo en esta entrega. Se permite override opcional por tablero en el tipo. |
| 2 | **Unidades: derivadas, nunca manuales.** | `unidades = Σ (cantidad_línea × cantidad_área)`. Sin campo nuevo, sin `config_default.unidades`, sin migración, sin input editable. |
| 3 | **PDF:** sección “Entrega” con la información de contenedores. | Nueva sección/página en CEMA y FIRPLAK, y bloque visible en la sección “Características del proyecto” de la UI. |
| 4 | **Empaque:** solo como se calcula ahora. | No sumar empaque, herrajes, cantos ni consumibles. Fórmula de tablero + 0,9775 + 22.500 kg. |

---

## 10. Casos borde

1. **Cotización vacía** → 0 unidades, 0 kg, 0 contenedores, sin excepción ni división por cero.
2. **Área sin líneas** → aporta 0 unidades y 0 kg; no romper el desglose.
3. **`cantidad` de línea ausente o nula** → tratar como **1**, igual que `separarPropuesta` (`Number(linea.cantidad ?? 1)`). **`cantidad = 0`** → aporta **0** (no se inventan piezas). Negativas → 0.
4. **`cantidad` de área ausente o nula** → tratar como **1**. **`cantidad = 0`** → el área no aporta nada.
5. **Cantidades decimales** (p. ej. 2,5) → respetar el valor guardado; las unidades resultantes pueden ser decimales y se muestran con un decimal. No redondear a la fuerza.
6. **Unidades = 0** → `pesoPorUnidadKg = null`; el resto del cálculo sigue.
7. **Línea sin `breakdown`** → advertencia y exclusión del peso; la línea **sí cuenta** como unidad, porque existe en la cotización.
8. **Tablero sin espesor** → advertencia y exclusión de esa fila de peso.
9. **Tablero no encontrado** → advertencia y exclusión de esa fila de peso.
10. **Línea de herrajes/otros** → excluida del peso **y del conteo**.
11. **Módulos agrupados** → cada línea del grupo tiene `cantidad = 1`; se suman sin usar el consolidado del grupo.
12. **Proyecto histórico** → usar el `breakdown` guardado; no recalcular precios ni despieces.
13. **Redondeo** → solo al final. Nunca redondear kg por línea.
14. **Capacidad 0 o negativa** → 0 contenedores y advertencia.
15. **Áreas con repeticiones distintas** (cocina ×20, baño ×40) → cada área aporta sus propios `unidades_área × repeticiones`; no se busca un multiplicador único del proyecto.
16. **Clave `unidades` residual en `config_default`** de datos antiguos → se ignora por completo; la fuente de verdad son las líneas.

---

## 11. Pruebas y vectores

### 11.1 Fórmula

| Caso | Entrada | Esperado |
|---|---|---|
| 1 m², 15 mm, 720, factor 1 | `cm2 = 10000`, `espesor = 15`, `densidad = 720`, `factor = 1` | `10,8 kg` |
| 1 m², 15 mm, 720, factor 0,9775 | `cm2 = 10000`, `espesor = 15`, `densidad = 720`, `factor = 0,9775` | `10,557 kg` |
| 1 m², 18 mm, 720, factor 0,9775 | `cm2 = 10000`, `espesor = 18`, `densidad = 720`, `factor = 0,9775` | `12,6684 kg` |
| 1 m², 6 mm, 720, factor 0,9775 | `cm2 = 10000`, `espesor = 6`, `densidad = 720`, `factor = 0,9775` | `4,2228 kg` |

### 11.2 PB SHORE

Fixture con las 33 líneas de la sección 4.1, `cantidad = 1` por línea y `cantidad_área = 80`:

- `pesoTotalKg = 33.189,47` (±1 %).
- `unidadesTotales = 2.640` (33 × 1 × 80).
- `pesoPorUnidadKg = 12,5718` (±1 %) → kg promedio por módulo.
- `contenedores = 2`.
- `ocupacionPct = 73,75` (±1 %).
- Sin advertencias de datos faltantes.

> Nota: 414,87 kg es el peso **por vivienda** del libro (33 módulos), no el peso por módulo. La app ya no maneja el concepto de vivienda, así que el indicador que publica es **kg por módulo**. El peso total y los contenedores no cambian en absoluto.

### 11.3 Casos de control (derivación de unidades)

| Caso | Entrada | Esperado |
|---|---|---|
| **Ejemplo del usuario** | 1 línea con `cantidad = 2`, área con `cantidad = 20` | `unidadesTotales = 40` |
| Misma área, 10 líneas de 2 piezas | `Σ cantidad_línea = 20`, área `cantidad = 20` | `unidadesTotales = 400` |
| Áreas con repeticiones distintas | cocina ×20 con 12 piezas; baño ×40 con 6 piezas | `unidadesTotales = 240 + 240 = 480` |
| `cantidad` de línea ausente | `cantidad = undefined`, área ×20 | cuenta como 1 → 20 unidades |
| `cantidad` de línea en 0 | `cantidad = 0`, área ×20 | aporta 0 unidades (no se inventan piezas) |
| `cantidad` de área ausente | línea ×3, área `undefined` | área cuenta como 1 → 3 unidades |
| Peso del ejemplo (1 m², 18 mm) | 40 unidades × 12,6684 kg | `pesoTotalKg = 506,736`, `contenedores = 1` |
| 60 viviendas equivalentes | `60 × 414,8683 = 24.892,10 kg` | `contenedores = 2` (el peso manda; ya no hay control de 60) |
| Una vivienda equivalente | `414,8683 kg` | `contenedores = 1` |
| Proyecto vacío | sin áreas | `unidadesTotales = 0`, `pesoTotalKg = 0`, `contenedores = 0`, `pesoPorUnidadKg = null` |
| Línea sin despiece | 1 línea sin `maderaPorRol`, área ×20 | `unidadesTotales = 20`, peso 0, advertencia “línea sin despiece” |
| Herrajes/otros | 1 línea `herrajes_otros`, área ×20 | excluida de unidades y de peso |
| Sin unidades | cotización sin líneas | `unidadesTotales = 0`, `pesoPorUnidadKg = null`, sin `Infinity` ni `NaN` |

### 11.4 Regresión

- `npm run quality:plan` antes de implementar.
- `npm run quality:gate` con **exit code 0**.
- `npm run quality:gate:full` si se toca el PDF.
- `npm run quality:learn` sin hallazgos `HIGH` sin resolver.

---

## 12. Prompt final para Codex

> Copiar desde aquí hasta el final del bloque.

```text
ROL
Eres un agente de implementación en el repositorio CotizadorPLUS
(Next.js 16.2.6, React 19, TypeScript, Supabase, Tailwind, Zustand).

LEE PRIMERO
1. AGENTS.md completo.
2. node_modules/next/dist/docs/ para cualquier patrón de Next.js 16 que uses.
3. src/lib/engine.ts, src/lib/cotizaciones.ts, src/lib/propuesta-cotizacion.ts.
4. src/app/cotizaciones/[id]/CotizacionDetalleClient.tsx,
   src/app/cotizaciones/[id]/ProjectConfigPanel.tsx  (solo lectura: NO se modifica),
   src/app/cotizaciones/[id]/imprimir/page.tsx,
   src/app/cotizaciones/[id]/imprimir/CemaPrintEditor.tsx,
   src/app/cotizaciones/[id]/imprimir/FirplakPrintEditor.tsx,
   src/app/cotizaciones/[id]/imprimir/DetallesProyecto.tsx.

TAREA
Implementar el cálculo y la presentación de la cantidad de contenedores de
transporte de una cotización, usando exclusivamente los datos reales de la
cotización. No modificar precios, geometría, motores de cálculo, breakdowns,
ni los invariantes de cotizaciones/PDF.

REGLA DE NEGOCIO YA VALIDADA
El libro CONTENEDORES/pb shore.xlsx calcula:
  peso_sku_kg = Σ(área_m²_con_15%_desperdicio × espesor_m) × 720 kg/m³ × 0,85
  contenedores = ROUNDUP(Σ peso_sku_kg / 22500, 0)
Equivalencia con área neta:
  1,15 × 0,85 = 0,9775
La app guarda área neta en breakdown.maderaPorRol[].cm2, por lo tanto:
  kg_linea = Σ (cm2 / 10000) × (espesor_mm / 1000) × 720 × 0,9775
  kg_linea_total = kg_linea × cantidad_linea
  kg_area = kg_linea_total × cantidad_area
  contenedores = Math.ceil(kg_total / capacidadKg)
La regla “1 contenedor por cada 60 unidades” del libro se refiere a VIVIENDAS
(Summary!T21 = 80), no a módulos. La cotización no registra viviendas, así que
esa regla NO se implementa ni se muestra. El único criterio es el peso.

UNIDADES DEL PROYECTO: DERIVADAS, NUNCA MANUALES
Las unidades se calculan desde las cantidades ya guardadas en la cotización:
  unidades_por_area = Σ (cot_cotizacion_lineas.cantidad)      // piezas en el área
  unidades_totales  = Σ (unidades_por_area × cot_cocinas.cantidad)
Ejemplo obligatorio: un mueble con cantidad 2 en una cocina que se repite 20
veces aporta 40 unidades. Si esa cocina tiene 10 líneas, el área aporta
20 × Σ(cantidades), no 20.
- NO crear campo `unidades` en ProjectDefaults ni en config_default.
- NO crear migración.
- NO leer `config_default.unidades` (si existe en datos viejos, ignorarlo).
- NO pedirle el dato al usuario en ningún formulario.

DECISIONES CERRADAS DEL USUARIO
1. Densidad: 720 kg/m³ por defecto. No agregar campo al catálogo de tableros
   en esta entrega. Permitir override opcional por tablero en el tipo.
2. Unidades: DERIVADAS de la cotización (cantidad_línea × cantidad_área).
   Nada manual, nada persistido, nada editable.
3. PDF: agregar una sección titulada “Entrega” (ES) / “Delivery” (EN) en CEMA
   y FIRPLAK, con la información de contenedores. También debe verse en la
   sección “Características del proyecto” de la UI.
4. Empaque: no sumar nada. Solo la fórmula actual: tablero, factor 0,9775,
   capacidad 22.500 kg. No sumar herrajes, cantos ni consumibles.

CREAR
1. src/lib/contenedores.ts
   Tipos exactos:
   - TableroPeso = { codigo: string; espesor_mm: number | null;
                     densidad_kg_m3?: number | null }
   - MaderaRol = { rol: string; codigo: string; cm2: number }
   - LineaPeso = { cantidad: number;
                   breakdown?: { maderaPorRol?: MaderaRol[] }
                              | Record<string, unknown> | null;
                   clasificacion?: 'mueble' | 'herrajes_otros' }
   - AreaPeso = { nombre: string; cantidad: number; lineas: LineaPeso[] }
                  // cantidad = repeticiones del área
   - ParametrosContenedores = { capacidadKg: number; densidadKgM3: number;
                                factorPeso: number }
   - DetalleAreaContenedores = { area: string; repeticiones: number;
                                 unidades: number; pesoKg: number;
                                 pesoPorUnidadKg: number | null }
   - ResultadoContenedores = { pesoTotalKg: number;
                               pesoPorUnidadKg: number | null;
                               unidadesTotales: number;
                               contenedores: number;
                               ocupacionPct: number;
                               capacidadKg: number;
                               advertencias: string[];
                               detallePorArea: DetalleAreaContenedores[] }
   Función:
   calcularContenedores(areas, tableros, parametros?) : ResultadoContenedores
   Constantes exportadas:
   - CAPACIDAD_CONTENEDOR_KG = 22500
   - DENSIDAD_TABLERO_KG_M3 = 720
   - FACTOR_PESO_NETO = 0.9775
   NO exportar ni usar constante de 60 unidades: la regla fue retirada.

2. tests/contenedores.test.ts
   Pruebas obligatorias:
   - 1 m², 15 mm, 720, factor 1 => 10,8 kg.
   - 1 m², 15 mm, 720, factor 0,9775 => 10,557 kg.
   - 1 m², 18 mm, 720, factor 0,9775 => 12,6684 kg.
   - 1 m², 6 mm, 720, factor 0,9775 => 4,2228 kg.
   - Derivación: 1 línea cantidad 2, área cantidad 20 => unidadesTotales 40.
   - Derivación: 10 líneas con Σ cantidad = 20, área cantidad 20 => 400.
   - Derivación: cocina ×20 con 12 piezas + baño ×40 con 6 piezas => 480.
   - Cantidad de línea undefined => cuenta 1. Cantidad de área undefined => 1.
   - Cantidad de línea 0 => aporta 0 unidades y 0 kg (sin inventar piezas).
   - Fixture PB SHORE: 33 líneas cantidad 1, área cantidad 80
     => 33.189,47 kg, unidadesTotales 2.640, pesoPorUnidadKg 12,5718,
        ocupación 73,75 %, contenedores 2.
   - 60 viviendas equivalentes: 24.892,10 kg => 2 contenedores.
   - 1 vivienda equivalente: 414,8683 kg => 1 contenedor.
   - Cotización vacía => 0 contenedores, 0 unidades, sin división por cero.
   - Sin unidades (cotización sin líneas) => pesoPorUnidadKg null, nunca NaN.
   - Línea sin breakdown => advertencia, cuenta unidades, no lanza excepción.
   - Tablero sin espesor => advertencia y omisión de la fila.
   - Línea herrajes_otros => excluida de unidades y de peso.
   - Módulos agrupados => suma de líneas sin doble conteo.
   - Capacidad <= 0 => 0 contenedores y advertencia.

IMPLEMENTACIÓN DE LA FUNCIÓN
- Mapear tableros por código.
- Normalizar cantidades: undefined/null/NaN => 1; 0 => 0; negativas => 0.
  Nunca devolver unidades o kg negativos, NaN o Infinity.
- Derivar unidades primero:
  * unidadesArea = Σ cantidad de líneas de la clase 'mueble'.
  * unidadesTotales += unidadesArea × cantidad_area.
- Para cada área y línea:
  * Si clasificacion === 'herrajes_otros', continuar (ni peso ni unidades).
  * Validar breakdown: Array.isArray(breakdown?.maderaPorRol) y descartar filas
    con cm2 no finito o <= 0.
  * Si no hay maderaPorRol, advertencia “Línea sin despiece” y continuar con
    el peso; las unidades ya se contaron.
  * Para cada fila: buscar tablero por codigo; si no existe o espesor_mm no es
    numérico > 0, advertencia y continuar.
  * densidad = tablero.densidad_kg_m3 ?? parametros.densidadKgM3.
  * kg += (cm2/10000) * (espesor/1000) * densidad * factorPeso
          * cantidad_linea * cantidad_area.
- pesoTotalKg = suma de kg_area.
- contenedores = capacidadKg > 0 ? Math.ceil(pesoTotalKg / capacidadKg) : 0.
- ocupacionPct = contenedores > 0 ? (pesoTotalKg / (contenedores *
  capacidadKg)) * 100 : 0.
- pesoPorUnidadKg = unidadesTotales > 0 ? pesoTotalKg / unidadesTotales : null.
- No redondear kg por línea; solo presentar con 2 decimales.
- No lanzar excepción por datos faltantes; devolver advertencias.

DERIVACIÓN DE UNIDADES (SUSTITUYE AL CAMPO MANUAL)
- NO tocar ProjectConfigPanel.tsx ni ProjectDefaults.
- NO agregar `unidades` a config_default ni a la tabla cot_cotizaciones.
- La única fuente es la jerarquía ya existente:
  cot_cocinas.cantidad (repeticiones) y cot_cotizacion_lineas.cantidad (piezas).
- En CotizacionDetalleClient las áreas llegan en `cocinas`; usar
  Number(cocina.cantidad ?? 1) y Number(linea.cantidad ?? 1), exactamente
  igual que separarPropuesta e imprimir/page.tsx.
- Si algún día se requiere editar cantidades, se edita la línea o el área;
  las unidades y los contenedores se recalculan solos.

UI “CARACTERÍSTICAS DEL PROYECTO”
- Crear src/app/cotizaciones/[id]/EntregaPanel.tsx.
- Props: resultado: ResultadoContenedores. Sin inputs, sin callbacks de edición.
- Mostrar en solo lectura:
  Unidades del proyecto (derivadas), Peso estimado, Peso promedio por unidad,
  Capacidad por contenedor, Contenedores, Ocupación.
- Mostrar la fórmula en texto pequeño:
  “Unidades = cantidad de cada módulo × veces que se repite su área”.
- Mostrar advertencias en un bloque visible.
- Nota fija: “Estimación con tablero. No incluye herrajes, empaque ni mesones.”
- En CotizacionDetalleClient, calcular el resultado con useMemo a partir de
  cocinas y tableros, clasificando cada línea con esHerrajeOtroAdicional
  (importado de src/lib/propuesta-cotizacion.ts). Las líneas de la UI se
  tratan como LineaPropuesta con un cast, porque su LineaConfig local no
  declara `material`. No reimplementar la detección de herrajes.
- Dependencias del useMemo: [cocinas, tableros]. No memoizar por línea.
- Renderizar EntregaPanel dentro de la sección CARACTERÍSTICAS DEL PROYECTO,
  después de ProjectConfigPanel, de modo que sea visible al expandirla.
- No agregar ningún input al panel ni a ProjectConfigPanel.

PDF “ENTREGA” / “DELIVERY”
- Crear un componente compartido EntregaPdf en DetallesProyecto.tsx.
  Props: resultado: ResultadoContenedores; idioma: 'es' | 'en'.
- Contenido mínimo:
  Unidades del proyecto, Peso estimado, Peso promedio por unidad,
  Capacidad por contenedor, Contenedores, Ocupación.
- Nota: “Estimación con tablero. No incluye herrajes, empaque ni mesones.”
  / “Estimate based on board weight. Excludes hardware, packaging and
  countertops.”
- Si unidadesTotales = 0: mostrar 0 y omitir el peso por unidad. Nunca
  “por definir”: el dato ya no es manual.
- CEMA: nueva sección/página titulada “DELIVERY”, después de
  “TECHNICAL SPECIFICATIONS”. Recalcular los números de página para que no
  se dupliquen ni salten.
- FIRPLAK: nueva sección/página titulada “Entrega” o “Delivery” según idioma,
  después de “Especificaciones” y antes de “Herrajes incluidos”.
- No mostrar precios en esta sección.
- En imprimir/page.tsx:
  * Calcular una sola vez `logistica` con propuesta.muebles (ya excluye
    herrajes/otros) y tablerosDeProyecto(). Sin tercer argumento.
  * No leer cabecera.config_default?.unidades.
  * Pasar `logistica` a CemaProposalData y FirplakProposalData.
  * No crear consultas adicionales por línea.

TIPOS DE LOS EDITORES
- Agregar `logistica: ResultadoContenedores` a CemaProposalData y
  FirplakProposalData.
- Importar el tipo desde src/lib/contenedores.ts.
- No cambiar la forma en que se calculan totales, precios, materiales,
  herrajes ni programación.

REGLAS DE ORO
- No modificar engine.ts, cotizar.ts, group-engine.ts ni las plantillas de
  precios.
- No recalcular breakdowns ni reescribir líneas.
- No usar volumen de mueble armado.
- No sumar empaque, herrajes, cantos ni consumibles.
- No usar lb; todo en kg.
- No hardcodear 720 o 22500 en más de un lugar.
- No usar .skip ni debilitar pruebas.
- No incrementar docs/quality/baseline.json.
- No crear ni modificar páginas de WikiLLM (instrucción explícita del usuario
  para esta entrega).
- No crear campos de unidades, ni inputs, ni migraciones: las unidades se
  derivan de la cotización.

VERIFICACIÓN
1. npm run quality:plan
2. npm run quality:impact
3. npm run quality:gate  (debe terminar con exit code 0)
4. npm run quality:gate:full si se modificó el PDF.
5. npm run quality:learn y resolver o justificar hallazgos HIGH.

CRITERIOS DE ACEPTACIÓN
- Contenedores = techo(peso total / 22.500).
- Unidades = Σ (cantidad_línea × cantidad_área). Ejemplo: 2 piezas en un área
  que se repite 20 veces => 40 unidades; sin ningún input manual.
- PB SHORE: 33 líneas cantidad 1, área 80 => 33.189,47 kg, 2.640 unidades,
  12,5718 kg por unidad, ocupación 73,75 %, 2 contenedores.
- Cambiar la cantidad de una línea o de un área actualiza unidades, pesos y
  contenedores sin pasos adicionales.
- La sección “Entrega” aparece en el PDF CEMA y FIRPLAK.
- La sección “Características del proyecto” muestra el bloque de entrega sin
  campos editables.
- No existe la clave config_default.unidades en el código nuevo.
- No existe ningún control basado en 60 unidades.
- Las cotizaciones sin breakdown no rompen la página; muestran advertencia.
- quality:gate termina con exit code 0.
```

---

## 13. Anexo: notas de implementación

- `maderaPorRol[].cm2` ya incluye `cant` de las piezas; no multiplicar otra vez por `cant`.
- `maderaPorRol[].codigo` puede repetirse entre roles; el mapa por código es suficiente para el espesor.
- En líneas agrupadas, cada línea tiene su propio `breakdown`; el consolidado del grupo no debe usarse para el peso.
- En el PDF, `propuesta.muebles` ya excluye herrajes/otros; en la UI hay que excluirlos explícitamente.
- Las plantillas CEMA y FIRPLAK comparten `DetallesProyecto.tsx`; centralizar allí el bloque de entrega evita duplicar textos.
- El PDF CEMA está en inglés; el FIRPLAK cambia según `idioma`.
- No tocar la numeración de páginas existente sin recalcularla; es un punto típico de regresión.

### 13.1 Unidades derivadas: trampas concretas

- **No** multiplicar la cantidad del área dos veces. El patrón correcto es uno solo:
  `Σ_áreas [ cantidad_área × Σ_líneas (cantidad_línea) ]`. Si se reutiliza un total ya multiplicado (por ejemplo el `total` monetario de la cocina) se duplica la repetición.
- **No** usar `propuesta.adicionales.length` ni el número de áreas como “unidades”: son cosas distintas.
- **No** contar `kitchens` (`Σ cantidad_área`) como unidades. Ese número ya existe en el PDF CEMA con otro significado (cantidad de cocinas) y no debe reemplazar al conteo de módulos.
- **No** confundir `cantidad_línea` (piezas del módulo en el área) con `cantidad_área` (veces que se repite el área). El ejemplo 2 × 20 = 40 usa las dos.
- **Peso por unidad** en la app es kg por **módulo**. El libro hablaba de kg por **vivienda** (33 módulos). Los dos números son válidos, pero deben etiquetarse distinto: “Peso promedio por unidad” (app) frente a “peso por vivienda” (libro). No rotular el valor de la app como 414,87 kg.
- Si el usuario cambia cantidades, no hay caché que invalidar: el resultado se recalcula en `useMemo` (UI) y en cada render del servidor (PDF). No persistir el resultado.
