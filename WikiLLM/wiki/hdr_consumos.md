# Consumos en la página HDR

## Qué es

Sección **Consumos** al pie de `/hdr`, debajo de «Buscar por tipo y medidas». Resume el
consumo de los muebles de una cotización, en las unidades que compra producción:
**tablero en m²**, **canto en metro lineal** y **consumibles en unidades**, siempre
**discriminados** — por **rol y código** de tablero, por **calibre** de canto y por
**tipo** de consumible, nunca en una cifra única —, con **cantidad editable por
mueble** (por defecto 1) y **conteo de muebles, unidades y piezas**.

Archivos:

| Archivo | Rol |
| --- | --- |
| `src/app/hdr/consumos.ts` | Lógica pura (cálculo y filtro), sin React: se puede probar con `node:test`. |
| `src/app/hdr/HdrConsumos.tsx` | Componente cliente: selector de cotización, buscador de muebles, desperdicio y tabla. |
| `src/app/hdr/HdrBuscador.tsx` | Único punto de montaje: `<HdrConsumos cotizaciones={cotizaciones} />` al final del JSX. |
| `tests/hdr-consumos.test.ts` | Trece pruebas; mapeado a `lane:frontend` en `quality/manifest.json`. |

No toca el motor, el PDF, el Excel ni el optimizador: es una vista de solo lectura.

## Selector de cotización propio

**La sección tiene SU selector de cotización, independiente del de «Generar desde una
cotización guardada» de arriba.** Elegir una aquí no carga ni mueve las HDR de arriba, y
al revés: son dos `Combobox` con su propio estado (`cotizacionId` local, no compartido).

Al elegir una cotización se llama `modulosDeCotizacionAction(id)` y se pasa por
`consolidarModulosHdr()`, el mismo par de pasos que la parte superior — misma fuente,
mismo redondeo, misma consolidación. Se puede quitar con «— Quitar cotización —»
(`allowEmpty`), que deja la sección en su estado vacío.

## Fuente de datos

Los mismos `ModuloHDR[]` que alimentan las tablas HDR:

1. `modulosDeCotizacionAction(id)` recalcula cada línea con las fórmulas actuales.
2. `consolidarModulosHdr()` fusiona despieces equivalentes entre áreas y deja en cada
   fila la **cantidad total** (`cantidad × repeticionesArea`).

Consecuencias heredadas de esa fuente (y deseadas):

- **Solo muebles.** Las líneas de material suelto (tablero, canto o herraje cobrados
  sin módulo) quedan fuera, igual que en HDR y Optimizador — ver
  [líneas de material suelto](lineas_material_suelto.md).
- **Grupos físicos una sola vez.** Un `GRUPO A + B` es una fila con sus piezas
  compartidas contadas una vez, como en la tabla HDR.
- **Los módulos con error no aportan consumo** (no tienen despiece), pero se cuentan en
  `conError` y se avisa en pantalla: la omisión nunca es silenciosa.

## Dos búsquedas

| Campo | Qué filtra |
| --- | --- |
| **Cotización** | Qué muebles cargan en la sección (selector propio). |
| **Buscar mueble** | Qué muebles de los cargados se listan. |

El filtro de muebles usa `normalizarBusqueda()` (quita tildes, minúsculas) y la regla de
**todas las palabras, en cualquier orden**, igual que el `Combobox` de cotizaciones. El
heno es `código + descripción + área + pref`, así que «panel norte», «db12» o
«COCINA sur» encuentran su mueble. Vacío = lista completa.

Encima de la tabla se imprime el recuento pedido: **`N muebles · M unidades · P piezas`**
(`filas.length`, suma de las **cantidades editadas** y suma de `piezas` de las filas
listadas, es decir del subconjunto filtrado, no de la cotización entera).

Cada fila es **un mueble individual** (código, descripción completa, área, cantidad,
piezas): **no se suman totales de la cotización**.

## Discriminación: por rol + código, por calibre y por consumible

`consumos.ts` replica el desglose del motor **con las mismas filas y el mismo orden
que la tabla «Materiales» del Simulador**, para que ambos se puedan comparar directamente:

- **Tableros → por ROL + código.** Cada entrada de `maderaPorRol` es una fila: caja y
  refuerzo pueden compartir tablero (`PRIRH15CONSTRUCTOR`) y **siguen siendo dos filas**,
  porque son dos partidas del desglose. Se descartan las entradas con `cm2 <= 0`.
  *(Antes se agrupaba solo por código y Consumos no cuadraba fila a fila con el
  Simulador: 4,135 m² en una sola línea en vez de 2,638 + 1,497.)*
- **Cantos → por calibre**, con la grafía del catálogo (`19x0,45`, `22x1`…). Se
  descartan las de `metros <= 0`.
- **Consumibles → por tipo**, desde `cantidadesConsumibles` (tarugos, soportes, cartón,
  etiquetas), solo los `> 0`, en unidades y con el nombre del Simulador.

Cada entrada es una línea dentro de su celda:

```text
Tableros por rol y código (m²)   Cantos por calibre (m)   Consumibles
caja PRIRH15CONSTRUCTOR 2,638    19x0,45 · 20,82          Tarugos 24
refuerzo PRIRH15CONSTRUCTOR 1,497 22x1 · 5,42              Soportes 8
frente PRICARB18CANDELARIA 0,854                            Cartón 1,2
fondo CHICARB4,5H002 0,831                                  Etiquetas 4
```

El tipo `ConsumoMueble` **no tiene campos lumped**: no existe `m2Tableros` ni
`metrosCanto` a nivel de mueble, solo los arreglos `materiales[]`, `cantos[]` y
`consumibles[]`. Así una cifra única no puede volver a la UI por accidente (la prueba
lo fija con `'m2Tableros' in filas[0] === false`).

## Cantidad editable (siempre arranca en 1)

La columna **Cantidad** es un input por fila, claveado por `lineaId`
(`cantidades: Record<lineaId, string>` en el componente). **El valor por defecto es 1,
nunca la cantidad de la cotización**: contar dos veces el mismo mueble es una decisión
del usuario, no algo que se herede en silencio.

- `parseCantidad()` (en `consumos.ts`, pura y testeada) convierte el texto del input:
  vacío, texto o negativo → **1**; coma decimal → número (`2,5`); `0` explícito → **0**
  (mueble fuera del consumo, sin `NaN`).
- `calcularConsumos(..., cantidades)` usa `cantidades[lineaId] ?? 1`: **sin entrada hay
  una unidad**, con o sin cantidad en la cotización.
- El `input` es `type="text" inputMode="decimal"` a propósito: en `type="number"` el
  navegador vacía el valor si se escribe coma, que es la grafía local, y la fila
  volvería a 1 al perder el foco.
- Al salir del campo (`onBlur`) el texto se reescribe con `parseCantidad`, así que un
  `abc` o un campo vacío se normaliza a `1` visible, no solo en el cálculo.
- `ConsumoMueble.cantidadCotizacion` (`cantidad × repeticionesArea`) se conserva solo
  como `title` del input —«En la cotización: N»— para dar contexto sin condicionar el
  cálculo.

La línea de recuento (`N muebles · M unidades · P piezas`) suma estas cantidades
editadas, no las de la cotización.

## Desperdicio del tablero

Campo **Desperdicio tableros (%)**, acotado a 0–100 (`normalizarDesperdicio`, que
también acepta coma decimal y convierte `NaN` en 0).

```text
m² [rol·código] = (Σ cm2 de ese rol y código / 10000) × cantidad_de_la_fila × (1 + % / 100)
m  [calibre]    = Σ metros de ese calibre × cantidad_de_la_fila     ← el % NO se aplica
unid [consumible] = cantidadesConsumibles[tipo] × cantidad_de_la_fila ← el % NO se aplica
piezas          = Σ round(piezas.cant > 0) × cantidad_de_la_fila
```

`cantidad_de_la_fila` es la que se edita en la tabla y que **arranca en 1** (ver
arriba), no la de la cotización.

Dos reglas que vienen de [consumo de materiales](consumo_materiales.md):

- **Se parte de `cm2` (neto), no de `m2`.** `m2` ya trae la merma del proyecto
  (`desperdicio_madera`, 15% por defecto); usarla encima del % propio sería merma
  doble. El valor por defecto del campo es `0`, así que sin escribir nada se ve el neto.
- **El canto y los consumibles no reciben el porcentaje.** La merma del canto son
  5 cm por arista (y 8 cm por refuerzo), ya sumados dentro de `metros`; los consumibles
  son conteos de unidades, sin merma.

El `title` de cada línea muestra `<neto> m² netos + <n>%`, la misma convención que usa
el Simulador, para poder verificarlo sin salir de la pantalla.

### Reconciliación con el Simulador

La tabla **Materiales** del Simulador (`ResultadoView`, en `CotizadorForm.tsx`) muestra
`m2De(m) = m.m2`, es decir **el neto ya con la merma del proyecto (15%)**. Consumos
arranca en **0%** y por eso, por defecto, muestra el neto (~13% menos).

**Ambos son correctos y cuadran exactamente** al escribir en Consumos el mismo % de la
merma del proyecto: con `15`, Consumos reproduce la columna «Cantidad» del Simulador
**fila por fila**. Verificado contra la base real con el módulo `W96.27867-SM-PUSH`
(Condominio V, n_entrepanos=2):

| Fila | Simulador | Consumos @15% | Consumos @0% |
| --- | --- | --- | --- |
| caja `PRIRH15CONSTRUCTOR` | 2,638 | 2,638 | 2,294 |
| refuerzo `PRIRH15CONSTRUCTOR` | 1,497 | 1,497 | 1,302 |
| frente `PRICARB18CANDELARIA` | 0,854 | 0,854 | 0,742 |
| fondo `CHICARB4,5H002` | 0,831 | 0,831 | 0,723 |
| canto 19x0,45 / 22x1 | 20,82 / 5,42 | 20,82 / 5,42 | igual |
| tarugos / soportes / cartón / etiquetas | 24 / 8 / 1,2 / 4 | 24 / 8 / 1,2 / 4 | igual |

Ninguno de los dos está mal: el Simulador muestra lo que se **compra** (con merma, es
lo que se cobra: `m² × precio = costo`) y Consumos muestra la **medida neta** por
defecto, con el campo libre para indicar otro desperdicio de planta.

## Presentación

- Tableros: 3 decimales (`fmtM2`), Cantos: 2 decimales (`fmtMl`), Consumibles hasta
  1 decimal (`fmtUnidad`, la grafía del Simulador: cartón `1,2`), todos con
  `toLocaleString('es-CO')`. Una entrada sin consumo se muestra como `—`.
- Estados vacíos: sin cotización elegida, cotización sin muebles, «sin coincidencias»
  con el texto escrito, cargando y error de carga.
- Todo se recalcula con `useMemo` por cambio de estado, no por celda.

## Verificación

`tests/hdr-consumos.test.ts` (trece pruebas) reconcilia el consumo por **dos caminos
independientes** y exige que coincidan:

1. el desglose del motor (`maderaPorRol` por rol + código y `cantoPorCalibre.metros`
   por calibre, más `cantidadesConsumibles`);
2. las filas que dibuja `construirFilas()` (largo × ancho de cada pieza de la HDR).

La prueba estrella es **«Consumos cuadra fila a fila con la tabla Materiales del
Simulador»**: sobre el caso real (caja y refuerzo con el mismo tablero) exige la misma
cantidad de filas, mismo rol, mismo código y el mismo m² que `maderaPorRol[i].m2` con
el % de la merma del proyecto; los mismos calibres y metros de `cantoPorCalibre`; los
mismos conteos de `cantidadesConsumibles`; y que con 0% (el valor por defecto) cada
fila sea exactamente el neto `cm2/10000` y **menor** que el `m2` con merma.

Además fija: que exista **una entrada por rol + código, por calibre y por consumible**
y ninguna cifra lumped; que caja y refuerzo con el mismo tablero queden en **dos filas
distintas** y sin duplicados de `rol:código`; que con 0% el consumo sea exactamente el
neto y **no** arrastre la merma del proyecto; que el % mueve cada tablero y deja
`cantos` y `consumibles` idénticos (`deepEqual`); que **la cantidad de la cotización
nunca sea el valor por defecto** (una fila con `cantidad 3 × repeticiones 2` consume lo
mismo que una con 1, y `cantidadCotizacion` queda solo como referencia) y que la
cantidad editada multiplique cada tablero, cada canto, cada consumible y las piezas
—incluido el `0` explícito, que no rompe nada—; que `parseCantidad` vuelva a 1 ante
vacío, texto o negativo y acepte coma decimal; que una fila por mueble sin agregados; el
buscador (código, descripción, área, mayúsculas, varias palabras); la exclusión y el
reporte de los módulos rotos; el acotado del porcentaje; y que un mueble sin piezas dé
arreglos vacíos, no `NaN`.

`npm run quality:gate` aprobado (exit 0) con el mapa de lanes actualizado.

## Excel y orden alfabético (2026-11-09)

El botón **Exportar consumos a Excel** descarga directamente un `.xlsx` con nombre `Consumos_<proyecto>_YYYY-MM-DD.xlsx`; la fecha corresponde a America/Bogota. Se exporta el subconjunto visible tras la búsqueda, con las cantidades editadas y el desperdicio de tablero seleccionado.

Pantalla y Excel comparten un orden alfabético español por código, descripción y área, con orden natural de números. El libro contiene una tabla de Excel filtrable, encabezados congelados y una fila por mueble. Incluye código, descripción, área, cantidad de consumo, cantidad de cotización como referencia, piezas, m² netos y con desperdicio por rol/tablero, metros por calibre y unidades por consumible. Las columnas de consumo son numéricas, sin redondear los datos almacenados. Proyecto, fecha, búsqueda y porcentaje quedan registrados encima de la tabla.

ExcelJS se carga bajo demanda al pulsar el botón. No se permite exportar un subconjunto visible que incluya muebles con error de despiece. Las pruebas reabren el archivo generado y verifican tabla, orden, números, cantidades cero/fraccionarias y cada partida contra los datos de pantalla; también cubren el cambio de día entre UTC y Bogotá.

## Referencias

- [Consumo de materiales: unidades y merma](consumo_materiales.md) — por qué tablero y
  canto tienen mermas distintas.
- [HDR consolidada y Excel continuo](hdr_excel_consolidado.md) — de dónde salen las
  cantidades y los grupos físicos.
- [Líneas de material suelto](lineas_material_suelto.md) — qué queda fuera del HDR.
