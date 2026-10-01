# Cadena de precio: Excel CEMA vs. Cotizador PLUS

Verificación fórmula por fórmula entre la hoja `Precio` de `Simulación muebles CEMA (1).xlsx`
(7.027 filas de producto) y la cadena de precio del motor (`src/lib/engine.ts`,
`src/lib/cotizar.ts`, `src/lib/cotizaciones.ts`). Complementa a
[motor_calculo.md](motor_calculo.md).

## 1. Convención común

Los dos sistemas usan **margen sobre precio**, no markup sobre costo:

```
precio = costo / (1 - margen)
```

y los dos tratan mueble y herraje como **dos cadenas separadas con márgenes distintos**
que solo se suman al final. Eso está alineado.

## 2. Correspondencia de columnas

| Concepto | Excel (hoja `Precio`, fila N) | Motor (`engine.ts`) |
|---|---|---|
| Costo mueble | `I = 'Costos Muebles'!I` | `costoSinHerrajes` |
| Precio COP mueble | `J = I/(1-$T$1)` | `precioCop = costoSinHerrajes/(1-margen)` |
| Precio USD mueble | `K = J/$V$1` | `precioUsd = precioCop*descF/trm` |
| Costo herraje | `L = 'Costos Muebles'!J` | `costoHerrajes` |
| Precio COP herraje | `M = L/(1-$T$23)` | `precioHerrajesCop = costoHerrajes/(1-margenHerraje)` |
| Precio USD herraje | `N = M/$V$1` | `precioHerrajesUsd` |
| Total sin herrajes | `Z = K/(1-10%)` | — (no existe el 10%) |
| Total con herrajes | `W = K/(1-10%) + N` | `precioConHerrajesUsd` (sin 10%) |
| Margen efectivo | `Y = 1-(X/W)` | — (no se calcula) |

## 3. Parámetros del Excel

No hay hoja de parámetros: las constantes viven en la **columna T de `Precio`**, filas 1-27,
y la TRM en `$V$1` (= 3650).

| Celda | Etiqueta | Valor | Filas que lo usan |
|---|---|---|---|
| `$T$1` | MARGEN MUEBLES | 0.57 | 5.733 |
| `$T$2` | MARGEN fillers | 0.52 | 250 |
| `$T$12` | MARGEN Pn y TK | 0.50 | 1.030 |
| `$T$23` | MARGEN HARDWARE | 0.35 | 7.027 (columna `M`, sin excepción) |
| `$T$24` | Margen MP | 0.10 | 4 (tablero/canto vendido suelto) |
| `$T$25` | Margen Panel Closet | 0.50 | **0** |
| `$T$26/27` | Margen Panel Closet Perf | 0.52 | **0** |
| — | sin margen (`J = I`) | — | 10 (lavamanos OSLO, lavarropas, mesones, tina) |

`W` tiene el patrón `=(K/(1-10%)+N)` en las 7.027 filas: el recargo del 10% está quemado y
aplica **solo a la parte de mueble, nunca al herraje**. Ese 10% es el recargo del cliente CEMA
(ya modelado en `cot_recargos_cliente`: `CEMA, 0.10, incluye_herrajes=false`).

## 4. Divergencias estructurales

1. **El 10% está desactivado en el motor.** `recargo_extra` no se consume; el bloque `recF` de
   `engine.ts` está comentado ("se manejará rentabilidad con márgenes"). Es la única diferencia
   de fórmula real entre las dos cadenas.
2. **Catálogo de márgenes incompleto/desalineado.** `cot_parametros.margenes` tiene
   `{muebles, fillers, pn_tk}`; `pn_tk = 0.44` contra `$T$12 = 0.50`, y falta la categoría MP
   (0.10). `AdminCatalogos.tsx` reescribe el JSON con esas tres llaves exactas, así que cualquier
   llave nueva se borra al guardar desde la UI.
3. **`margen_herraje` mal sembrado.** `db/migrations/0003_seed_parametros.sql` lo pone en `0.57`;
   el valor correcto (`$T$23`) es `0.35`, que es el default del código. El seed es un upsert con
   `do update set value = excluded.value`, así que reejecutarlo revierte el valor bueno.
4. **El override de margen del proyecto solo mueve una categoría** (`cotizar.ts:94`, solo
   `margen_key === 'muebles'`). Es fiel al Excel (cambiar `$T$1` mueve las 5.733 filas de muebles
   y nada más), no es un defecto.
5. **No se calcula el margen efectivo** (`Y`/`AB` del Excel), que es el margen real de la venta
   una vez mezclados mueble (57%) y herraje (35%).

## 5. Dos defectos del app

**A. El herraje se factura en cero cuando hay margen override** — `cotizaciones.ts:156-160`:

```ts
const usarUnificado = input.margenOverride !== undefined;
const precioUnitCop = (input.conHerrajes && !usarUnificado) ? res.precioConHerrajesCop : res.precioCop;
```

El comentario dice "precioCop ya consolidado", pero `engine.ts:281` calcula
`precioCop = costoSinHerrajes/(1-margen)` — no incluye herraje. El `margenOverride` ya entra al
motor por `cotizar.ts:94`, así que la rama no aporta nada y solo descuenta el herraje. Alcance
mayor al aparente: `AddLineForm.tsx:144` inicializa el campo de margen desde
`projectDefaults.margen`, de modo que si el proyecto trae margen por defecto **todas** las líneas
nacen con override; aplica también a líneas agrupadas (`cotizaciones.ts:305`). El Simulador
(`CotizadorForm.tsx:628-630`) no tiene esa compuerta, por eso Simulador y Cotización muestran
precios distintos para la misma línea.

**B. El descuento se aplica a USD pero no a COP** — `engine.ts:281-293`: `descF` multiplica los
campos USD y ninguno de los COP. Con 10% de descuento, `precioUsd*TRM ≠ precio_unit_cop`, y los
totales COP y USD de la cotización dejan de cuadrar entre sí.

## 6. Márgenes equivalentes (absorber el 10% sin reactivar el recargo)

Como el 10% aplica solo al mueble, es exactamente absorbible en el margen de cada categoría:
`1 - m' = 0.9 * (1 - m)`.

| Categoría | Excel | Margen equivalente en el app |
|---|---|---|
| Muebles (`$T$1`) | 0.57 | **0.613** |
| Fillers (`$T$2`) | 0.52 | **0.568** |
| Pn y TK (`$T$12`) | 0.50 | **0.550** |
| MP (`$T$24`) | 0.10 | **0.190** |
| Hardware (`$T$23`) | 0.35 | **0.35** (sin cambio: el 10% no toca el herraje) |

Verificado contra una fila representativa de cada familia (`BFD9`, `F1 1/227`, `PN1212`,
`18MM C TAB9672`): `I/(1-m')/TRM` reproduce `Z` del Excel con error de precisión de máquina, y
`W = Z + N` en las 7.027 filas. Con TRM 3650 y descuento 0, el app queda idéntico al Excel.

Contrapartida: esos márgenes hornean el 10% de CEMA en los parámetros globales, así que no sirven
para Infinitum (25%) ni CEFI (25%). La solución limpia es reactivar `recF` por cliente.

## 7. Defectos detectados en el Excel

- **Las 10 filas "sin margen" tienen las unidades rotas.** Ej. fila 6966 (`OSLO2519`): `I = 47.72`
  ya viene en USD, `J = I` (sin margen, correcto para reventa) pero `K = J` — falta el `/$V$1` —
  y `L = I` duplica el costo del mueble como si fuera hardware, que luego se marca al 35% en `M`.
  El resultado (`W = 53.04`) no es un precio de reventa a costo. No hay que replicarlas en el app.
- Fila 6978 (`TINES6027 1/2`): `I = 222` contra `L = 2526`; revisar cuál es el costo real.
- El 10% quemado en `W` y `Z` obliga a editar 7.027 fórmulas para cotizar otro cliente; debería
  vivir en una celda (`$T$28`).
- `$T$25`/`$T$26`/`$T$27` están definidos y no los usa ninguna fila.
