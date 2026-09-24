# Comparación de precios: Simulador CEMA 23_09 y Cotizador PLUS

Consulta Supabase: 2026-09-23T16:08:55.940Z. Fuente: Simulador CEMA 23_09.xlsx, hojas Materiales y costos unitarios. Comparación de costos de insumos, no de precios de venta ni márgenes. No se modificó el Excel ni la base de datos.

## Tableros

Se compararon Materiales!M3:M99 (COP/m²) y cot_tableros.precio_m2 mediante código, normalizando mayúsculas y espacios. De los 48 tableros activos de PLUS, 40 tienen el mismo código: 37 coinciden al peso más cercano y 3 presentan diferencias mayores. Los 8 restantes no tienen el mismo código en Excel. Hay 57 códigos de Excel sin coincidencia exacta en PLUS; esto no demuestra ausencia del material, pues existen variantes de formato y nombres diferentes.

| Código | Excel COP/m² | PLUS COP/m² | PLUS menos Excel | Diferencia % | Fuente |
|---|---:|---:|---:|---:|---|
| CHIRHCARB4BLANCO AMERICANO | 38,902.51 | 12,900.00 | -26,002.51 | -66.84% | Materiales!M50 |
| ECOCARB15ARLINGTON | 32,489.03 | 29,645.00 | -2,844.03 | -8.75% | Materiales!M67 |
| ECOCARB9ARLINGTON 2 LADOS | 27,868.85 | 28,962.00 | +1,093.15 | +3.92% | Materiales!M71 |

También se revisó el precio neto por lámina (Materiales J frente a precio_real). Las tres diferencias anteriores existen igualmente por lámina: blanco americano 4 mm 115.805 vs 38.400 COP; Arlington 15 mm 145.070 vs 132.371 COP; Arlington 9 mm dos lados 124.440 vs 129.320 COP. Adicionalmente, CHIRHCARB18H4001 MD133 DARK 183 tiene una diferencia de 1 COP por lámina (116.882 vs 116.881), aunque coincide por m² al peso.

## Cantos

Los siete códigos coinciden exactamente, incluyendo NA. Precio por metro lineal:

| Referencia | Excel y PLUS COP/m | Fuente |
|---|---:|---|
| 22x1 | 980.00 | Materiales!C104 |
| 22x0,45 | 421.00 | Materiales!C105 |
| 22x1 High Gloss | 3,930.15 | Materiales!C108 |
| NA | 0.00 | Materiales!C109 |
| 19X2 | 1,333.00 | Materiales!C106 |
| 19X0,45 | 400.00 | Materiales!C107 |
| 19X1 | 764.00 | Materiales!C110 |

El bloque costos unitarios!B25:B27 conserva 900 / 368 / 368 COP/m, frente a 980 / 400 / 400 en el catálogo. Las fórmulas inspeccionadas de Costos Muebles!T4:V4 referencian B11/B12 (980 y 400), no B25:B27. Por tanto, esos valores antiguos no se presentan como diferencias de catálogo con PLUS.

## Herrajes y consumibles

De 19 registros activos en PLUS, 16 tienen equivalencia identificada en costos unitarios y coinciden con tolerancia de 0,01 COP. Riel Slim China difiere solo 0,004 COP por redondeo. La correspondencia se hizo por referencia/nombre y se conserva en el CSV con la celda original.

| Código | Excel COP | PLUS COP | Unidad PLUS | Fuente |
|---|---:|---:|---|---|
| TARUGO8x30 | 142.56 | 142.56 | COP/und | costos unitarios!B31 |
| CARTON | 6,886.00 | 6,886.00 | COP/und | costos unitarios!B29 |
| ETIQUETA | 594.00 | 594.00 | COP/und | costos unitarios!B30 |
| PATA10AJUST | 1,987.00 | 1,987.00 | COP/und | costos unitarios!B28 |
| BISAGRAPAR | 5,800.00 | 5,800.00 | COP/par | costos unitarios!B33 |
| MANIJA415 | 7,450.00 | 7,450.00 | COP/und | costos unitarios!B70 |
| TORNILLO858 | 23.00 | 23.00 | COP/und | costos unitarios!B83 |
| RIELTANDEM | 49,706.80 | 49,706.80 | COP/par | costos unitarios!B84 |
| BARRAEST | 9,800.00 | 9,800.00 | COP/par | costos unitarios!B37 |
| BONUITMX500 | 57,000.00 | 57,000.00 | COP/und | costos unitarios!B90 |
| RIELMETALBOX | 28,000.00 | 28,000.00 | COP/par | costos unitarios!B43 |
| RIELSLIMCHI | 55,671.62 | 55,671.62 | COP/par | costos unitarios!B85 |
| SLIMBOXALTO | 48,250.00 | 48,250.00 | COP/par | costos unitarios!B125 |
| SLIMBOXBAJO | 28,700.00 | 28,700.00 | COP/par | costos unitarios!B126 |
| RIELFE500 | 31,064.00 | 31,064.00 | COP/par | costos unitarios!B76 |
| PUSHOPENHBM237 | 8,032.00 | 8,032.00 | COP/und | costos unitarios!B105 |

El soporte 5x9 del Excel vale 47 COP y existe con ese mismo precio en PLUS, pero está inactivo. El selector activo de soporte usa SOPORTEMET 5MM a 45,70 COP: −1,30 COP (−2,77 %) respecto al soporte del Excel. Es un cambio de referencia, no una discrepancia del mismo producto.

Sin equivalencia exacta confirmada en el Excel: barra estabilizadora Madecentro 11.800 COP/par, soporte metálico 5 mm 45,70 COP/und y grapas J-08 48,76 COP/und. No se equipara la barra Madecentro con la barra genérica de 9.800 COP.

Hay además precios alternativos de riel en Materiales!B114:B115 (Bonuit MAX 56.074 y Full Extension 6.000), distintos de costos unitarios!B90/B76 (57.000 y 31.064), que sí coinciden con PLUS. No se asume que las referencias específicas de Materiales sean idénticas a las genéricas. El selector B36 usa B44 para Bonuit MAX y B76 para Full Extension; B44 y B90 valen 57.000.

## Alcance y pendientes

No se hicieron equivalencias automáticas entre variantes de tablero ni entre accesorios parecidos. El CSV incluye todos los tableros, los siete cantos, los veinte registros de herrajes (incluido el soporte inactivo) y referencias adicionales de costos unitarios sin equivalencia confirmada. Algunas referencias adicionales son accesorios o productos con distinta unidad/moneda; no se agregan en un total monetario.

[Detalle de comparación](comparacion.csv).
