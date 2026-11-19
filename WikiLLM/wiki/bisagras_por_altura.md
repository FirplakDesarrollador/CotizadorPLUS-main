# Bisagras por alto de puerta

La regla usa el alto efectivo de fabricación de cada hoja. El motor convierte el despiece a milímetros antes de evaluar los límites.

| Alto en mm | Alto en cm | Bisagras por puerta |
| --- | --- | --- |
| Hasta 1200 | Hasta 120 | 2 |
| Más de 1200 y hasta 1800 | Más de 120 y hasta 180 | 3 |
| Más de 1800 y hasta 2400 | Más de 180 y hasta 240 | 5 |

En pulgadas se aplican los mismos límites mediante la equivalencia exacta de 25,4 mm por pulgada. Las medidas fraccionarias se comparan con los límites sin redondear al milímetro. Las puertas fuera de rango mantienen su cantidad de plantilla.

Se suman las hojas reales de cada módulo. Se conservan los herrajes excluidos y las configuraciones sin frentes. Cuando la referencia es `BISAGRAPAR`, el desglose y el precio usan pares. Tres bisagras equivalen a 1,5 pares y cinco a 2,5 pares. El simulador invalida resultados anteriores mediante la versión 21 de su caché.

`scripts/actualizar-bisagras.ts` simula el ajuste de cotizaciones guardadas. Con `--apply`, respalda las líneas afectadas y actualiza en una transacción sus bisagras, costos y totales derivados. Usa despieces y precios unitarios de herraje guardados.

El 2026-11-19 se actualizaron siete líneas de Kundara Campestre y Bosketo. Se conciliaron los totales con sus líneas y repeticiones, y se compararon dos PDF independientes por cotización. En Herrajes incluidos quedaron 2.645 pares para Kundara Campestre y 1.077,5 para Bosketo. Una nueva simulación encontró cero líneas pendientes. La auditoría general sigue señalando el grupo preexistente de Satori cocinas.
