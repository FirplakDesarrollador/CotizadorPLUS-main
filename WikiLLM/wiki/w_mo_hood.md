# W-MO-HOOD

## Propósito

`W-MO-HOOD` es una tipología superior derivada de `UW`. Conserva su carcasa,
entrepaños, fondo, frentes y herrajes, pero incorpora un vano inferior abierto
definido por dos medidas editables:

- `MO`: distancia vertical entre la base y el entrepaño fijo.
- `HOOD`: distancia vertical entre el final inferior de los laterales y la base.

Los formularios convierten ambas medidas desde la unidad visible a pulgadas y
las persisten dentro de `config.overrides`.

## Geometría

- La base se eleva a `Z = HOOD`, conserva el borde posterior alineado con el
  lateral y extiende sus 130 mm adicionales exclusivamente hacia el frente.
- El entrepaño fijo queda en `Z = MO + HOOD`.
- El entrepaño fijo inicia en la cara frontal del lateral, justo detrás de los
  frentes; su menor profundidad queda descontada por la parte posterior.
- Las puertas comienzan en el entrepaño fijo y su alto es
  `A - MO - HOOD - RV`, donde `RV` conserva la luz de 3,2 mm.
- El espacio inferior queda libre; no se prolongan las puertas por debajo del
  entrepaño fijo.
- Solo la base hereda la profundidad de `OW-MO`: `P + 5.11811 in` (`P + 130 mm`).
  La tapa, los laterales y las demás piezas conservan la profundidad de `UW`.
- Los entrepaños móviles se distribuyen en la zona superior cerrada por puertas.
- El fondo inicia en `Z = HOOD`, por lo que termina en la base elevada y no
  continúa por el vano inferior hasta el final de los laterales.
- El refuerzo trasero superior queda bajo la tapa y el inferior se apoya justo
  sobre la base, en `Z = HOOD + TC`.

## Regla de entrepaños

La cantidad se deriva de la altura interna superior `A - MO - HOOD`, no del
alto total del mueble. `n_entrepanos` incluye el entrepaño fijo: hasta 16 in se
usa solo el fijo; hasta 24 in se agrega uno móvil; hasta 36 in se agregan dos;
y por encima se agregan tres. Los móviles se reparten uniformemente entre la
cara superior del entrepaño fijo y la cara inferior de la tapa.

## Datos y validación

La migración `0211_w_mo_hood.sql` crea el tipo, clona la configuración vigente
de `UW` y reemplaza únicamente las fórmulas y metadatos de montaje necesarios.
Los valores iniciales son `MO = 200 mm` y `HOOD = 0`; la UI exige `MO > 0`,
`HOOD >= 0` y `MO + HOOD < A`.

La visualización admite `MO` y `HOOD` como variables de montaje en milímetros,
por lo que muestra la base elevada, el vano libre, el entrepaño fijo y el inicio
real de las puertas sin alterar las fórmulas de costo.

## Despliegue

La migración quedó aplicada y registrada en el proyecto Supabase configurado el
2026-10-21. La comprobación posterior encontró el tipo activo con 10 piezas,
4 reglas y 2 herrajes; además confirmó `P+5.11811` para la base,
`A-MO-HOOD-RV` para el frente y las reglas iniciales `MO=200/25.4` y `HOOD=0`.

El script `scripts/apply-migration.mjs` permite aplicar futuras migraciones por
la Management API, valida que la referencia corresponda a la URL de la app y
evita reaplicar una migración ya registrada.

La migración incremental `0212_w_mo_hood_montaje.sql`, aplicada el 2026-10-21,
incorpora estas correcciones de profundidad, respaldo, refuerzos y entrepaños.
