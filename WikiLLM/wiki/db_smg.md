# DB-SMG: cajoneras con gola metálica

Las cajoneras de gola metálica se presentan como tres familias comerciales,
formadas en conjunto por doce tipologías físicas.
Cada tipo deriva de su par `DB-SM`, conserva sus reglas de cajones, barras,
frentes, refuerzos, cajas y rieles, y sustituye la gola de madera por el espacio
y los mecanizados necesarios para una gola metálica.

## Variantes

- Base: `DB-2S-SMG`, `DB-2-SMG`, `DB-2-1INT-SMG`, `DB-3-SMG`.
- Full Extension: los mismos cuatro patrones con sufijo `-FE`; heredan las
  cajas de gaveta de madera y `RIELFE500` de sus pares `DB-SM-FE`.
- Sin fondo: los mismos cuatro patrones con sufijo `-SF`; no producen la pieza
  `fondo` y calculan la profundidad de la base como `P-TC`.

Simulador y Cotizaciones muestran tres entradas independientes:

- `DB-SMG — Cajoneras con Gola metálica` (`__DB_SMG__`);
- `DB-SMG-FE — Cajoneras con Gola metálica y riel Full Extension`
  (`__DB_SMG_FE__`);
- `DB-SMG-SF — Cajoneras con Gola metálica sin fondo` (`__DB_SMG_SF__`).

Cada entrada aparece una vez y abre un subselector de cuatro configuraciones.
Base y FE usan listas estáticas; SF se descubre dinámicamente entre los tipos
cargados. El cambio de configuración resuelve `pref → id`, por lo que conserva
los IDs persistidos. Todas fuerzan `gola = 1`; SF fija `conFondo = false` y FE
selecciona `RIELFE500`. El selector general de fondo permanece visible, igual
que en el patrón DB-SM-SF existente.

## Despiece y agrupación

Las piezas se clonan de cada par DB-SM salvo `gola`, `gola_madera` o
`gola_perfil`: DB-SMG no corta una gola de tablero. Laterales, base, refuerzos,
fondos de 6 mm (excepto SF), cajas y frentes conservan las fórmulas de origen.

Al agrupar muebles inferiores SMG se aplica la misma regla de los SM: se omite
el respaldo únicamente en el conjunto y la base se lleva a `P-TC`. Las piezas
compatibles restantes conservan la agrupación configurada en sus plantillas.

## Refuerzo delantero, mecanizado y visualización

Las doce tipologías usan un solo `refuerzo_delantero`. Se monta horizontal,
recorre el ancho interior y queda retirado 27 mm desde el frente. DB-SMG no
hereda la orientación vertical de los dos refuerzos asociados a la gola de
madera DB-SM.

La plantilla `lateral` tiene cantidad 2 y declara dos elementos en
`visualizacion.recortes`:

- uno en el borde `frontal_superior`;
- otro en `frontal_nivel_gaveta`, a la altura que antes ocupaba el segundo
  refuerzo delantero de cada configuración;
- ambos con profundidad 27 mm desde el frente y alto 73 mm.

El motor resuelve el segundo nivel a partir de la distribución real de gavetas,
por lo que 2S, 2, 2-1INT y 3 conservan sus alturas particulares. El render
dibuja ambos vaciados en los dos laterales, también en las variantes SF. No
existe un panel de gola de madera en la escena.

En `DB-2-1INT-SMG` y sus variantes FE/SF, el segundo mecanizado se referencia
contra la `base_gaveta` situada sobre la junta entre los dos frentes exteriores:
el borde superior del vaciado queda inmediatamente debajo de esa base. El
frente de la gaveta interior se excluye del cálculo para impedir que el vaciado
termine en la parte inferior del lateral.

## Código comercial

Los códigos conservan la variante: `DB36-2S-SMG`, `DB36-2-SMG-FE` y
`DB36-3-SMG-SF`. Cuando caja y frentes son ambos de 18 mm, el segmento se
compacta por convención a `SMG18`, por ejemplo `DB36-2S-SMG18`,
`DB36-2-SMG18-FE` y `DB36-3-SMG18-SF`.
Si ambos son de 15 mm se integra `SMG15`, por ejemplo `DB36-2S-SMG15`,
`DB36-2-SMG15-FE` y `DB36-3-SMG15-SF`. No se añade `-15MM` a SMG.

## Perfil metálico pendiente

El perfil de aluminio no se costea todavía. A 2026-10-21 no existe en
`cot_herrajes` un código, unidad de compra ni precio confirmado. La migración no
inventa el herraje; deberá añadirse cuando Diseño/Compras entregue esos datos.

Implementación: `db/migrations/0213_db_smg.sql` y ajuste de montaje
`db/migrations/0214_db_smg_refuerzo_y_doble_mecanizado.sql`. Regresiones principales:
`tests/db-smg.test.ts`.
