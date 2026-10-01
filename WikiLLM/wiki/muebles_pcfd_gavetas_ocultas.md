# Torres PCFD con gavetas ocultas

## Fuentes y alcance

La familia se confirmó cruzando dos libros:

- `Simulación muebles CEMA (1).xlsx`, que contiene el despiece, fórmulas de canto, consumibles y herrajes.
- `Cotizaciones de muestra/26037 - cema - PODs cabinets quotation - White - PARA LUIS TRM 3250 Y COSTO EN 3250 1.xlsx`, que confirma el uso comercial de los SKU en POD A/B/C, pero conserva valores calculados y no el despiece paramétrico.

La cotización 26037 incluye `PCFD22 3/48422-2OP-PUSH-TK4`, `PCFD34 3/48422-2OP-PUSH-TK4` y `PCFD36 3/48422-2OP-PUSH-TK4`. La tabla comercial repite la descripción inglesa `1 Door PUSH 3 Shelves 4 Pull out`.

## Evidencia maestra

En `Costos Muebles` del simulador CEMA:

| Fila | SKU | L × A × P (in) | Configuración maestra |
| --- | --- | --- | --- |
| 5448 | `PCFD219525 1/2-4OP-PUSH-TK5` | 21 × 95 × 25.5 | 1 puerta, 4 gavetas ocultas, 3 entrepaños |
| 5449 | `PCFD22 3/48422-2OP-PUSH-TK4` | 22.75 × 84 × 22 | 1 puerta, 2 gavetas ocultas, 3 entrepaños |
| 5450 | `PCFD36 3/48422-2OP-PUSH-TK4` | 36.75 × 84 × 22 | 2 puertas, 2 gavetas ocultas, 3 entrepaños |
| 5451 | `PCFD34 1/28416 1/2-2OP-PUSH-TK4` | 34.5 × 84 × 16.5 | 2 puertas, 2 gavetas ocultas, 3 entrepaños |

Por tanto, `2OP` representa dos gavetas ocultas y `4OP`, cuatro. La descripción inglesa de la cotización 26037 (`4 Pull out` para referencias `2OP`) contradice el maestro y no debe gobernar la fabricación. También es incorrecto asumir una puerta para todos los anchos: el maestro usa dos puertas en 34.5 y 36.75 pulgadas.

El SKU `PCFD34 3/48422-2OP-PUSH-TK4` de la cotización no aparece literalmente en la copia actual del simulador CEMA; existe una variante cercana de 34.5 × 84 × 16.5. Su precio comercial está en la cotización, pero su despiece debe calcularse con la familia paramétrica, no copiarse de una fila inexistente.

## Geometría observada para `2OP-PUSH-TK4`

Variables base: `zocalo = 4.5`, `n_cajones = 2`, `n_entrepanos = 3`; `n_puertas` depende del ancho.

| Pieza | Cantidad | Fórmula de área o dimensión observada |
| --- | ---: | --- |
| Laterales | 2 | `(A - 4.5) × P` |
| Base/tapa/división | 3 | `(L - 1.18) × (P - 0.9)` |
| Refuerzos traseros | 3 | `(L - 1.18) × 3.25` |
| Entrepaños | 3 | `(L - 1.18) × (P - 1.54)` |
| Puertas/frentes 18 mm | `n_puertas` | El Excel acumula `L × (A - 5.25) × 1.25` como área total de frente para `2OP` |
| Complemento de frente 5.5 mm | 2 | `L × A - 0.8 × área_frente_18mm` |
| Bases de gaveta | 2 | `(L - 2.95) × (P - 4.63)` |
| Traseros de gaveta | 2 | `(L - 3.427) × 2.6875` |
| Fondo | 1 | `(L - 0.59) × (A - 5.25)` |

Las fórmulas de frentes de esta familia son una acumulación de área del Excel, no un despiece explícito de alto por puerta/gaveta. Antes de generar planos de corte debe definirse la distribución vertical; para cotización de costo se puede reproducir el área acumulada.

## Herrajes y consumibles

Para la fila 5449 (una puerta, dos gavetas):

- 4 patas y 16 tornillos.
- 2 pares de bisagras; la fila ancha 5450 usa 4 pares por sus dos puertas.
- 2 pares de rieles `TANDEM`.
- 2 dispositivos magnéticos `PUSH TO OPEN HBM237-02`.
- 0 manijas.
- 12 soportes de entrepaño, 36 tarugos, 4 etiquetas y cartón dimensional.

Costos de referencia guardados en CEMA para la fila 5449: COP 342,253.98 sin herrajes, COP 130,529.60 de herrajes y COP 472,783.58 total. Son evidencia de la estructura, no precios vigentes.

## Implementación en Cotizador PLUS

La migración `db/migrations/0025_pcfd_gavetas_parametricas.sql` reemplaza la
plantilla fija de `PCFD` por una plantilla paramétrica compatible con el mueble
estándar y con gavetas ocultas:

- El modo `STANDARD` conserva cero gavetas y cinco entrepaños.
- El preset `2OP` configura dos gavetas, tres entrepaños y zócalo TK4 de 4.5 in.
- El preset `4OP` configura cuatro gavetas, tres entrepaños y zócalo TK5 de 5.25 in.
- Cajones, entrepaños y zócalo permanecen editables después de aplicar un preset.
- El número de puertas es automático: una para anchos menores de 24 in y dos
  desde 24 in; también puede sobrescribirse manualmente.
- Cada gaveta agrega base, trasero y un par de rieles. Las configuraciones OP
  agregan dos dispositivos `PUSHOPENHBM237`, eliminan manijas y ajustan las
  bisagras según el número de puertas.
- El selector de riel está disponible tanto en el simulador como al crear o
  editar líneas de una cotización, y su código queda persistido en la línea.
- La referencia generada añade `-2OP-PUSH` o `-4OP-PUSH` según la cantidad
  configurada.

La interfaz valida que puertas, cajones y entrepaños sean enteros no negativos,
y que el zócalo sea no negativo y menor que la altura del mueble. Los presets
son ayudas de configuración; el motor continúa aceptando cantidades manuales
para fabricar variantes diferentes.

## Alcance geométrico

El cálculo de costo reproduce el área agregada de los frentes que usa CEMA.
Esto permite cotizar material y canto de PCFD-OP, pero no define por sí solo la
distribución vertical exacta de cada frente. Un futuro generador de planos de
corte deberá incorporar alturas individuales o una regla explícita de reparto.

La prueba `tests/pcfd-op.test.ts` valida:

- compatibilidad del PCFD estándar;
- reproducción de áreas, canto y herrajes de la fila CEMA 5449 para `2OP`;
- edición manual de cuatro gavetas y dos entrepaños con derivación automática
  de dos puertas para un mueble ancho.
