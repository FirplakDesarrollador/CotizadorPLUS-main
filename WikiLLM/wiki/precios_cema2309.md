# Precios del Simulador CEMA 23_09 frente a PLUS

Consulta de Supabase del 2026-09-23. Fuente: `Simulador CEMA 23_09.xlsx`, hojas `Materiales` y `costos unitarios`. Auditoría de lectura: no se cambiaron precios ni lógica de la app.

## Tableros

Se cruzaron códigos normalizando espacios y mayúsculas. De 48 registros activos de PLUS, 40 tienen código coincidente: 37 coinciden en COP/m² al peso y tres difieren:

| Código | Excel COP/m² | PLUS COP/m² |
|---|---:|---:|
| CHIRHCARB4BLANCO AMERICANO | 38.902,51 | 12.900 |
| ECOCARB15ARLINGTON | 32.489,03 | 29.645 |
| ECOCARB9ARLINGTON 2 LADOS | 27.868,85 | 28.962 |

También hay una diferencia de 1 COP por lámina en CHIRHCARB18H4001 MD133 DARK 183 (116.882 Excel, 116.881 PLUS), sin diferencia al peso en COP/m². Ocho códigos de PLUS y 57 de Excel no cruzan exactamente; no deben equipararse variantes de formato o producto solo por similitud de nombre.

## Cantos y herrajes

- Los siete cantos coinciden exactamente.
- De 19 herrajes/consumibles activos, 16 equivalencias identificadas coinciden a 0,01 COP. Riel Slim China solo difiere por redondeo de centavos.
- El soporte 5x9 del Excel cuesta 47 COP y está inactivo en PLUS. El soporte activo metálico 5 mm cuesta 45,70 COP; son referencias diferentes.
- Barra Madecentro, soporte metálico y grapas J-08 no tienen equivalencia exacta confirmada en el archivo.
- `costos unitarios!B25:B27` conserva cantos de 900/368/368 COP/m. Las fórmulas inspeccionadas `Costos Muebles!T4:V4` usan B11/B12, con 980/400, coincidentes con PLUS.
- `Materiales!B114:B115` contiene rieles específicos con precios distintos al bloque de costos unitarios. No asumir que son la misma referencia. PLUS coincide con costos unitarios para Bonuit MAX (57.000) y Full Extension 500 (31.064).

Ver [informe completo](../../artifacts/comparacion-precios-cema2309/informe.md), [comparación por referencia](../../artifacts/comparacion-precios-cema2309/comparacion.csv) y [esquema de datos](esquema_base_datos.md).
