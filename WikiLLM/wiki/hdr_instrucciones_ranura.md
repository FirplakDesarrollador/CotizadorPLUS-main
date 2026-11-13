# Instrucciones de producción R…L en HDR

## Carcasa con fondo

La HDR añade una instrucción al texto de BASE, TAPA y laterales de carcasa, incluidas las filas BASE/TAPA provenientes de `base_tapa`. El requisito se activa por la presencia real de una pieza `fondo` con cantidad positiva; `fondo_gaveta` no cuenta como fondo de carcasa.

La instrucción de ranura se imprime únicamente en muebles de pared cuya tipología empieza por `W` u `OW` (por ejemplo `W`, `W-SM-PUSH`, `WPC`, `WBL`, `OW`). Los muebles inferiores ya no llevan la instrucción, y los superiores que no empiezan por `W`/`OW` (como `TW` o `UW`) tampoco la reciben.

| Tipología | Pieza en tablero de 15 mm | Pieza en tablero de 18 mm |
| --- | --- | --- |
| `W…` / `OW…` | R16L | R19L |

El espesor procede del tablero real de la pieza. Para otros espesores o un espesor desconocido no se infiere una instrucción. Los códigos inferiores `R17L`/`R20L` quedan fuera de uso en la HDR.

Se conservan los nombres de producción existentes (`SIDE R`, `SIDE L` o `SIDE` en grupos); únicamente se agrega el sufijo. Se excluyen BASE GAVETA, divisiones, entrepaños, refuerzos, frentes, fondos y otras piezas no incluidas en la lista exacta.

## Gavetas FE

Solo en tipologías que incluyen el segmento exacto `FE`, independientemente de si la carcasa tiene fondo:

| Nombre interno | Texto en HDR |
| --- | --- |
| lateral_gaveta_pequena | LAT GAV PEQ R13L |
| lateral_gaveta_grande | LAT GAV GRANDE R13L |
| contraparche_pequeno | CONTRAPARCHE PEQ R13L |
| contraparche_grande | CONTRAPARCHE GRANDE R13L |

Laterales de gaveta con otros nombres, contraparche sin tamaño y demás piezas conservan su texto anterior.

## Implementación y garantías

La transformación vive en `datosHdr.ts`, al construir las filas compartidas por pantalla, PDF y Excel. Solo cambia `FilaHDR.pieza`: no altera las plantillas, los nombres internos, las medidas, espesores, cantidades, letras, cantos, consumos o precios. Las cotizaciones existentes reciben el texto al regenerar las HDR. No se reescriben PDF o Excel que ya estén descargados.

Los grupos físicos conservan contexto de tipología y fondo por integrante. En un lateral compartido, se considera el fondo de ambos vecinos; las bases y tapas continuas reciben la instrucción cuando soportan el fondo de algún integrante. No se asigna una instrucción de fondo al lateral exterior de un módulo sin fondo.

Las pruebas comparan todas las columnas distintas de `pieza` contra las filas originales, verifican el conjunto exacto de textos cambiados, las dos combinaciones W/OW por espesor, cantidades cero de fondo, ausencia de fondo, la ausencia de instrucción en inferiores y en superiores que no son W/OW, exclusiones FE y grupos mixtos. La comprobación visual y la doble exportación de PDF siguen pendientes por la limitación de acceso al navegador documentada en [apertura L/R](apertura_superiores_una_puerta.md).
