# Consumo de materiales: unidades y merma

## Unidades

Producción compra tablero por **m²** y canto por **metro lineal**, así que el
Simulador muestra el consumo en esas unidades y ya con su merma. Antes mostraba
`cm²` y `cm` en neto, que no corresponden ni a la unidad de compra ni a la
cantidad que se cobra.

| Material | Unidad | Merma incluida |
| --- | --- | --- |
| Tablero | m² | `(1 + desperdicio)` — el % del proyecto |
| Canto | m | 5 cm por arista, más 8 cm por pieza de refuerzo |

## Las dos mermas son distintas

Es el punto que más confusión causaba: **el tablero y el canto no usan el mismo
mecanismo de merma.**

- **Tablero** — factor porcentual del proyecto (`desperdicio`, ej. 10% o 15%).
  Es el único factor de merma de la madera; no se aplica un markup encima.
- **Canto** — no usa ese porcentaje. Su merma son **5 cm por arista** cantada,
  más **8 cm por cada pieza de refuerzo** (el canto del refuerzo posterior
  envuelve también su espesor). Ambos ya venían sumados dentro de `longCm`.

Por eso cambiar el `desperdicio` del proyecto mueve el consumo de tablero pero
**no** el de canto.

## La asimetría que se corrigió

El motor exponía las dos magnitudes con criterios opuestos:

| | Cantidad reportada | Costo |
| --- | --- | --- |
| Tablero (antes) | `cm2` **neto**, sin merma | `cm2 × (1+desperdicio) / 10000 × precio_m2` |
| Canto (antes) | `longCm` **con** merma | `longCm / 100 × precio` |

Es decir, la cantidad del tablero no explicaba su costo y la del canto sí. Ahora
el motor expone ambas magnitudes en las dos formas:

- `maderaPorRol`: `cm2` (neto, del despiece) y `m2` (facturable, con merma)
- `cantoPorCalibre`: `longCm` (neto+merma, se conserva) y `metros`

`m2 × precio_m2` y `metros × precio` reproducen el costo salvo redondeo. Se
guardan con más decimales de los que se muestran justamente para no arrastrar
ese error.

## Trazabilidad con la HDR

El consumo tiene que poder reconstruirse desde el listado de piezas, que es lo
que ve producción:

```text
Σ piezas[rol].areaCm2  ==  maderaPorRol[rol].cm2        (el despiece)
cm2 × (1 + desperdicio) / 10000  ==  m2                 (la merma)
m2 × precio_m2  ==  costo                               (lo que se cobra)
```

En el `SBFD 30x30x24` del reporte, el neto de los cuatro tableros suma
**2.710 m²**, que es exactamente el TOTAL de m² de la tabla de despiece. Con 15%
de merma el consumo facturable es 3.117 m².

La columna de cantidad lleva el desglose en su `title`: `<neto> m² de piezas +
<n>% de desperdicio`, para poder verificarlo sin salir de la pantalla.

## El calibre se agrupa por clave normalizada

El calibre de canto de una pieza puede venir de **tres sitios distintos**, y no
siempre con la misma grafía:

1. la plantilla de la pieza (`cot_piezas_plantilla.cantos->>'calibre'`),
2. el valor derivado del espesor del tablero (constantes del motor),
3. el override del formulario, que toma el texto de `cot_cantos`.

`cot_cantos` estaba internamente inconsistente: `19X0,45`, `19X1` y `19X2` con X
mayúscula frente a `22x0,45`, `22x1` y `22x1 High Gloss` con minúscula. Las
plantillas usaban siempre minúscula (334 piezas con `19x0,45`, 74 con `22x1`, cero
mayúsculas). Eso producía dos defectos:

- **El listado partía un mismo canto en dos filas**: las piezas de caja, que sí
  reciben el override, caían en `19X0,45`; las de refuerzo, que no lo reciben, en
  `19x0,45`.
- **En la HDR la columna "Espesor canto" salía vacía** para las piezas con
  override, porque `espesorCantoLabel()` partía el texto por `x` minúscula.

El costo nunca estuvo mal: el motor ya normalizaba para **buscar** el precio. Lo
que fallaba era la presentación, en las dos tablas a la vez.

La corrección va en tres capas:

- `0050_normaliza_calibre_canto.sql` pasa la `x` a minúscula en `cot_cantos`, en
  los overrides guardados de 44 líneas y en el `config_default` de 4 proyectos.
- El motor agrupa por `norm(calibre)` en vez de por el texto crudo, y reporta la
  grafía del catálogo.
- `espesorCantoLabel()` parte por `/x/i`.

Las dos últimas hacen que el defecto no pueda reaparecer si algún día entra otra
grafía por cualquiera de los tres caminos.

## Trampa: el Simulador persiste el resultado

`simuladorStore` guarda el `result` completo en `localStorage`
(`simulador-storage`). **Añadir un campo al `Breakdown` y renderizarlo sin más
tumba la página** de cualquiera que tuviera un resultado calculado con la forma
anterior: el campo llega `undefined` y un `.toLocaleString()` encima lanza
`TypeError`.

Pasó exactamente así al introducir `m2`/`metros`: la ruta `/cotizador` quedó en
blanco con `Cannot read properties of undefined (reading 'toLocaleString')`.

El `migrate` del store ya pone `result: null`, pero **solo corre si cambia la
`version`**. Al tocar la forma del `Breakdown` hay que subirla (ahora en 3).

Regla para la próxima vez: si se añade un campo al `Breakdown` y se renderiza,
subir `version` en `simuladorStore` **y** dejar el render tolerante a que el campo
falte, derivándolo de la medida neta cuando se pueda.

## Cobertura

`tests/consumo-materiales.test.ts` fija las cuatro propiedades: que el m² se
reconstruye desde las piezas con varios porcentajes de merma, que la cantidad
explica el costo en tablero y canto, que los metros de canto incluyen los 5 cm
por arista y los 8 cm por refuerzo, y que cambiar la merma de madera **no**
altera el despiece ni el canto — solo el consumo facturable.

Los dos últimos casos salieron de fallos reales del test al escribirlo: la regla
de los 8 cm del refuerzo no estaba documentada, y el redondeo de `m2` rompía la
igualdad con el costo.

Un quinto caso fija que un mismo canto no se parta en dos filas al llegar con
distinta capitalización, y que el override no altere el consumo.

Ver también [ejes_fondo_backing.md](ejes_fondo_backing.md) para la otra
convención de presentación del despiece.
