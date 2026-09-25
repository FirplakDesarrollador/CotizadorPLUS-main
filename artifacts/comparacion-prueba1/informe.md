# Comparación de consumos PRUEBA 1

Consulta de Supabase: 2026-09-23. Se utilizaron las plantillas vigentes y el motor local src/lib/engine.ts, incluidos sus cambios locales existentes. No se modificó la base de datos ni el motor.

## Criterios

- Consumos por una unidad de mueble, con las medidas de cada hoja en pulgadas. No se suman las cantidades de pedido de MADERA (AY), pues no coinciden con una unidad por referencia.
- Espesores de caja/refuerzos 15 mm, frentes 18 mm y fondo 6 mm; el fondo de 6 mm es un supuesto de comparación. Merma del motor: 15 %. Se comparan directamente los m² consolidados de Excel (AK, AO, AQ, AS, AU, AW), sin volver a aplicarles merma. No se suman columnas de tableros AZ:BD, que incorporan cantidades de pedido y formatos.
- Gavetas DB según sufijo: 2, 3 o 4; variantes 1s y 2s con tres gavetas y una o dos pequeñas. Las demás reglas se resuelven desde la base de datos.
- El motor agrupa el canto de caja y polar por calibre: se compara su suma BT + BV. Excel rotula 0,5 mm y el catálogo 0,45 mm; se trata como equivalencia funcional para comparar longitud, no como identidad de producto.
- No se comparan precios, perforaciones ni mecanizados. Los campos de herrajes sin consumo en el listado se revisaron como ausencia, sin asignarles equivalencias nuevas.

## Inconsistencia del archivo

COSTOS MUEBLES!C11 y CANTOS Y OTROS!C10 contienen DB19-1s, ancho 19 pulgadas. MADERA!B11 contiene DB12-1s, ancho 12 pulgadas. Son referencias distintas: se comparan por separado y no se reemplaza una por la otra.

## Madera por referencia

| Referencia | Excel m² | Proyecto m² | Diferencia m² | Diferencia % |
|---|---:|---:|---:|---:|
| BFD15 | 2.2862 | 2.2752 | -0.0110 | -0.48% |
| BFD36 | 4.0877 | 4.0533 | -0.0344 | -0.84% |
| SBFD30 | 3.1306 | 3.1151 | -0.0154 | -0.49% |
| B12 | 2.1227 | 2.0912 | -0.0315 | -1.48% |
| B30 | 3.8610 | 3.8142 | -0.0467 | -1.21% |
| DB30-2 | 4.0461 | 4.1570 | +0.1109 | +2.74% |
| DB12-3 | 2.3468 | 2.3509 | +0.0041 | +0.18% |
| DB20-4 | 3.6527 | 3.5544 | -0.0983 | -2.69% |
| DB12-1s | 2.3468 | 2.3261 | -0.0207 | -0.88% |
| DB24-2s | 3.8205 | 3.8060 | -0.0144 | -0.38% |
| W1236 | 1.6747 | 1.6666 | -0.0081 | -0.49% |
| W3036 | 3.3162 | 3.2998 | -0.0164 | -0.49% |
| W302024 | 3.2274 | 3.2037 | -0.0237 | -0.73% |
| UW1236 | 1.6896 | 1.6877 | -0.0019 | -0.11% |
| UW3036 | 3.3671 | 3.3667 | -0.0004 | -0.01% |

## Cantos por referencia

| Referencia | Frente Excel / proyecto (m) | Caja + polar Excel / proyecto (m) |
|---|---:|---:|
| BFD15 | 2.4728 / 2.4732 | 11.2159 / 11.3520 |
| BFD36 | 5.2768 / 5.2512 | 16.5499 / 16.6860 |
| SBFD30 | 4.9720 / 4.9464 | 12.1426 / 12.3824 |
| B12 | 3.1432 / 3.1176 | 11.4895 / 11.4894 |
| B30 | 6.6960 / 6.3464 | 18.8047 / 18.3474 |
| DB30-2 | 4.9720 / 4.9464 | 19.5555 / 19.4343 |
| DB12-3 | 3.9528 / 3.9144 | 12.7711 / 12.8095 |
| DB20-4 | 6.3880 / 6.3400 | 20.9124 / 20.5103 |
| DB19-1s | 5.0196 / 4.9812 | 17.0383 / 17.0767 |
| DB24-2s | 5.7816 / 5.7432 | 20.0863 / 20.1247 |
| W1236 | 2.6384 / 2.6256 | 10.4426 / 10.5972 |
| W3036 | 5.5816 / 5.5560 | 15.9290 / 16.0836 |
| W302024 | 3.9560 / 3.9304 | 13.9342 / 14.0660 |
| UW1236 | 2.2386 / 2.2336 | 11.7261 / 11.2468 |
| UW3036 | 4.7820 / 4.7721 | 18.1269 / 17.6476 |

## Diferencias de consumibles y herrajes

| Referencia | Consumo | Excel | Proyecto | Diferencia |
|---|---|---:|---:|---:|
| DB12-3 | barra (pares) | 0 | 3 | +3 |
| UW1236 | tarugos (und) | 24 | 32 | +8 |
| UW1236 | soportes (und) | 12 | 8 | -4 |
| UW3036 | tarugos (und) | 24 | 32 | +8 |
| UW3036 | soportes (und) | 12 | 8 | -4 |

Los demás consumibles y herrajes comparados coinciden. Se detectaron diferencias en madera para las 15 filas. La diferencia por sí sola no demuestra un error de la aplicación: el motor incorpora descuentos de fabricación y reglas actuales que pueden diferir del listado.

## Interpretación

- UW1236 y UW3036: el patrón de +8 tarugos y −4 soportes es compatible con un entrepaño fijo en el proyecto frente a tres entrepaños soportados en el Excel. Debe validarse contra la hoja de ruta aplicable.
- DB12-3: el motor deriva tres pares de barras de sus tres traseros altos de gaveta. Excel registra cero pares.
- Las diferencias de frentes son compatibles con los descuentos de fabricación del motor (reveal de 3,2 mm). No se atribuyen todas las diferencias de tablero a esta causa: revisar el desglose por rol en el CSV.
- No hay referencias sin familia correspondiente en la base. La falta de correspondencia entre hojas afecta únicamente DB19-1s / DB12-1s.

Detalle completo: [comparacion.csv](comparacion.csv).
