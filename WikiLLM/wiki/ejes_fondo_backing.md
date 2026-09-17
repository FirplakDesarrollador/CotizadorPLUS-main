# Ejes del fondo (backing): `largo`/`ancho` no son "el mayor primero"

## Las dos convenciones que se confunden

La hoja de ruta ordena las columnas **por tamaño**: la medida mayor va primero,
sin importar el eje.

| Pieza de `W2936-SM` | Largo mm | Ancho mm | La mayor es… |
| --- | ---: | ---: | --- |
| BASE | 706.6 | 304.8 | horizontal |
| SIDE | 914.4 | 304.8 | vertical |
| SHELF | 705.6 | 266.7 | horizontal |
| DOOR | 930.25 | 365.1 | vertical |
| BACKING | 898.4 | 720.6 | vertical |

El motor, en cambio, usa `formula_largo`/`formula_ancho` como **ejes
geométricos**, y cuál es cuál lo decide `visualizacion.intercambiar` de la pieza:

| `intercambiar` | `largo` es | `ancho` es |
| --- | --- | --- |
| `false` | horizontal (base `L`) | vertical (base `A`) |
| `true` | vertical (base `A`) | horizontal (base `L`) |

`construirVisualizacion()` lo aplica así:

```ts
const u = config.intercambiar ? a : l, v = config.intercambiar ? l : a;
const [w,d,h] = config.plano==='XZ' ? [u,t,v] : …;   // w = horizontal, h = vertical
```

Ambas convenciones conviven de forma legítima en el catálogo: `B`, `BFD`, `SBFD`,
`V`, `PC`… usan `intercambiar=false`; `DB`, `S`, `SA`, `WER`, `WLD`, `WPC`, `UV`…
usan `intercambiar=true`. Lo que no puede pasar es mezclarlas dentro de una misma
pieza.

## El defecto corregido

`0045_w_sm_hoja_real.sql` copió el backing tal como lo lista la hoja
(`898.4 x 720.6`) y lo escribió como largo/ancho:

```sql
formula_largo = 'gola ? A-0.62992 : L-TC'     -- rama gola basada en A
formula_ancho = 'gola ? L-0.62992 : A-0.59'   -- rama gola basada en L
```

El fondo de `W` tiene `intercambiar=false`, y su rama **sin** gola (`L-TC` /
`A-0.59`) ya seguía esa convención. La rama **con** gola quedó con la contraria.
Como una pieza solo tiene un `intercambiar`, una de las dos ramas tenía que estar
mal — y era la de gola.

Efecto medido en `W2936-SM` (carcasa 736.6 x 914.4 mm):

| | ancho horizontal | alto vertical | ¿cabe? |
| --- | ---: | ---: | --- |
| Antes (0045) | 898.4 | 720.6 | **no** — sobresalía 161.8 mm por los lados |
| Ahora (0047) | 720.6 | 898.4 | sí |

Era la causa de que la vista frontal del Simulador reportara `Largo 898,4 mm` en
un mueble de 736.6 mm: el bounding box de la escena lo fijaba el fondo girado, no
la carcasa.

**El costo nunca estuvo afectado**: el área es la misma (`720.6 × 898.4 =
898.4 × 720.6 = 0.6474 m²`). El fondo tampoco lleva canto. Lo único equivocado
era qué medida es el largo y cuál el ancho.

> Nota: `0048` cambió después la medida del backing con gola de `A-0.62992`
> (898.4 mm) a `A-1.62992` (873.0 mm), porque el lateral de `W-SM` se corta 1"
> más corto que el alto nominal y el fondo debe seguir al lateral. Eso no altera
> nada de lo explicado aquí: el eje sigue siendo el mismo, solo cambia el valor.
> Ver [w_sm_hoja_real.md](w_sm_hoja_real.md).

## Auditoría del catálogo completo

Se hicieron dos pasadas sobre el catálogo real de Supabase (60 tipos, 446 piezas).

**1. Estática** — cruzar `formula_largo`/`formula_ancho` contra `intercambiar` en
los 44 tipos con pieza de respaldo. `W` era la única incoherencia real. `BMW` y
`SDB` salieron como sospechosos pero son falsos positivos: su backing usa medidas
constantes (`9.50079`, `16.62992 x 17.36220`), no expresiones en `L`/`A`.

**2. Empírica** — construir la escena de cada tipo con tres juegos de medidas y
`gola` 0/1, y verificar que el respaldo quepa en la carcasa. Resultado tras 0047:
**ningún fondo excede su carcasa en ningún caso**.

`SDB` apareció en la primera corrida de esta pasada, pero por medidas de prueba
irreales: es "Cajonera con panel removible", modelada con un despiece de medidas
constantes (su backing es fijo, 422.4 x 441.0 mm), así que solo se fabrica al
ancho para el que se tomó ese despiece. A su ancho nominal cabe sin problema.

18 tipos no tienen pieza de respaldo, como es de esperar: no son cajas
(`F`, `PN`, `TK`, `BOV`, `BT`, `CC`, `CLV`, `DD`, `DF`, `DFE`, `E`, `FL`, `KD`,
`KF`, `POD`, `D`, `R`, `WCC`).

### Los tipos sin `visualizacion` cargada

`B-FE`, `UB-FE`, `V-FE` y `UW` no tienen `visualizacion` en la base y caen en
`inferirMontaje()`. **No es un problema**: para el plano `XZ` la inferencia deriva
el flag de las propias fórmulas,

```ts
intercambiar = /\bL\b/.test(ancho) && !/\bL\b/.test(largo)
```

que es exactamente la definición de la convención B. Los cuatro quedan con el
flag correcto y pasan la pasada empírica.

Esto también confirma por qué el defecto de `W` había que arreglarlo en las
fórmulas y no en el flag: sus dos ramas usaban convenciones opuestas, y una pieza
solo tiene un `intercambiar`.

## Orden de columnas en las tablas de despiece

El orden de la hoja es presentación, no geometría, así que no vive en las
fórmulas sino en `orientarPieza()` (`src/lib/muebles.ts`):

```ts
const invertir = pieza.rol === 'frente' || (pieza.rol === 'fondo' && pieza.anchoIn > pieza.largoIn);
```

El frente siempre se muestra con el alto primero. El fondo se ordena **por
tamaño**, porque su eje depende del `intercambiar` de cada tipo y la tabla no
tiene acceso a esa configuración: en los tipos con `intercambiar=true` el largo ya
es el mayor y la fila no cambia; en `W` y `SBFD` se invierte y vuelve a leerse
como en la hoja.

La regla vive en `muebles.ts` y no en cada tabla porque **el Simulador y el HDR se
contradecían**: el HDR ya la aplicaba y el despiece del Simulador mostraba los
valores crudos del motor. En un `SBFD` 30x30x24 el Simulador listaba el frente
como `377.8 x 758.8` y el fondo como `747 x 762`, cuando producción los lee
`758.8 x 377.8` y `762 x 747`. Ahora ambas tablas llaman a la misma función.

### Nombre de la pieza

`nombrePieza()` traduce `frente` → `puerta` cuando la tipología declara
`n_puertas`. El motor usa el mismo nombre para una puerta y para la cara de una
gaveta; solo es puerta cuando hay puertas. `HdrTabla` aplica la misma distinción
para elegir entre `DOOR` y `FRENTE`, con su propia nomenclatura de producción.

## Cobertura

`tests/visualizacion.test.ts` verifica con `W2936-SM` que el fondo cabe en la
carcasa y que el eje vertical es el mayor (que no quede acostado), con `gola` 0 y
1. Comprobado que el test falla con las fórmulas de 0045 y pasa con las de 0047.

`tests/despiece-presentacion.test.ts` cubre las dos convenciones de presentación:
que el frente va con el alto primero pase lo que pase, que el fondo se ordena por
tamaño, que la carcasa nunca se reordena y que solo `frente` se renombra.

**Deuda**: `tests/fixtures/catalogo-visualizacion.json` está desactualizado —
tiene 57 tipos (le faltan `B-FE`, `UB-FE`, `V-FE`) y su `W` no tiene las ramas de
gola de 0045/0047. Por eso los tests de gola parchean las fórmulas en el propio
test en vez de leerlas del fixture. Refrescarlo cambiaría las entradas de los 57
tipos a la vez, así que se deja anotado.

Ver también [w_sm_hoja_real.md](w_sm_hoja_real.md) y
[visualizacion_gola_voladizo.md](visualizacion_gola_voladizo.md).
