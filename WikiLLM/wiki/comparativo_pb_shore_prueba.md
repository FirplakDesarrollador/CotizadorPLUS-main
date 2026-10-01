# Comparativo PB SHORE PRUEBA frente a HDR

## Corte y fuentes

Auditoría del 2026-09-30 sobre la cotización `d41e0343-9acc-49e9-83ad-88a3be70c279`, nombre exacto **PB SHORE PRUEBA** (distinta de PB SHORES). Una cocina con multiplicador 1; 20 líneas de cantidad 1. Fuente: `breakdown` persistido, sin recalcular ni modificar la cotización.

Se revisaron 23 PDF en `PB SHORE PRUEBA/PROYECTO PB SHORE`: 19 referencias exactas, una comparación provisional del panel PN21 7/8 y tres HDR sin módulo cotizado. Informe y CSV: [informe comparativo](../../output/pdf/Informe_comparativo_PB_SHORE_PRUEBA.pdf), [resumen](../../output/pdf/PB_SHORE_PRUEBA_resumen.csv), [detalle de piezas](../../output/pdf/PB_SHORE_PRUEBA_detalle_piezas.csv).

## Resultados netos

| Magnitud | HDR | PLUS | PLUS - HDR |
|---|---:|---:|---:|
| Piezas | 117 | 121 | +4 |
| Tablero m² | 24,795147 | 25,601090 | +0,805943 |
| Canto m | 180,179860 | 151,224794 | -28,955066 |

Estos totales incluyen provisionalmente PN21 7/8 × 34 1/2 de PLUS frente a PN21 7/8 × 33 1/4 de HDR; no son una afirmación de equivalencia de referencias. PLUS guarda además 29,441250 m² con 15 % de merma y 166,8048 m de canto con suplementos. No comparar estos últimos directamente con el neto HDR.

## Diferencias verificadas

- **WLD3013/WLD3614:** PLUS incluye 2 entrepaños adicionales por módulo; sus laterales y fondos son 25,4 mm más bajos que HDR. Diferencia neta de tablero: +0,355483 y +0,432902 m², respectivamente.
- **Seis WLD:** el despiece guardado no asigna aristas de canto a los refuerzos traseros. Los cuatro WLD de altura 30 tampoco asignan aristas a sus entrepaños, aunque las HDR sí las exigen. Los entrepaños adicionales de los dos WLD bajos también tienen cero aristas.
- **DB15-1S:** los tres traseros de gaveta tienen dos cantos largos en PLUS frente a uno en HDR. Diferencia total neta de canto +0,791646 m, incluyendo pequeñas diferencias dimensionales. Frentes grandes de 300 mm frente a 300,08 mm.
- **TK5 1/4 × 96:** PLUS añade los dos extremos de 133,35 mm que HDR no enchapa: +0,2667 m.
- **PN21 7/8:** 876,3 mm de alto en PLUS frente a 844,55 mm en HDR. Confirmar cuál referencia es correcta.
- **BFD15:** la descripción guardada dice 2 entrepaños pero las piezas incluyen 1, coincidente con HDR. Para cantidades usar las piezas, no la descripción.
- Sin contraparte cotizada: F628 3/4, USVFD NR3628 3/4 y USVFDR3628 3/4.

## Método

Una fila con letra en HDR equivale a una pieza. Se excluyen plantillas de cantidad cero. Se permite rotación de dimensiones al identificar piezas, conservando las aristas del eje original para calcular canto. Se verificaron 1.104 celdas numéricas mediante extracciones independientes con pdfplumber y PDFium. Tablero neto = suma de superficies físicas; canto neto = suma de longitud de aristas Color y Blanco. Las diferencias de 0,005 mm en paneles fraccionarios provienen de redondeo de mm.

Ver [consumo de materiales](consumo_materiales.md). El motor actual añade 8 cm a cada pieza cuyo nombre contiene `refuerzo` cuando entra al bloque de canto, no solamente a los posteriores; además agrega 5 cm por arista de desperdicio. Este informe utiliza los consumos guardados y separa estos suplementos del neto geométrico.

Los hallazgos describen esta instantánea, no prueban que toda cotización vigente ni toda plantilla presente las mismas diferencias. No se alteraron código de aplicación, base de datos ni PDF fuente.
