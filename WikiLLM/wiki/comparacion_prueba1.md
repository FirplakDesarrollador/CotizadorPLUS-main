# Comparación de consumos PRUEBA 1

Consulta de catálogos y plantillas de Supabase realizada el 2026-09-23, evaluada con el motor local existente. No se cambiaron datos productivos ni lógica de cálculo.

Fuente: archivo externo `PRUEBA 1.xlsx`, hojas `MADERA ` y `CANTOS Y OTROS`. Hay 15 filas por hoja y 16 códigos distintos entre ambas: madera contiene DB12-1s, pero costos y cantos contienen DB19-1s. No deben cruzarse por posición.

Comparación por unidad, merma del 15 %, caja/refuerzo de 15 mm, frente de 18 mm y fondo supuesto de 6 mm. Se usan los m² consolidados del Excel directamente, sin una segunda merma. Los cantos de caja y polar se suman para compararlos con el calibre agrupado del motor; la equivalencia de 0,5 mm del Excel con 0,45 mm del catálogo es funcional y no identifica el mismo producto.

Hallazgos principales:

- DB30-2: madera Excel 4,0461 m², motor 4,1570 m² (+2,74 %).
- DB20-4: madera Excel 3,6527 m², motor 3,5544 m² (−2,69 %).
- DB12-3: Excel indica cero pares de barras, motor tres, derivados de los traseros altos.
- UW1236 y UW3036: Excel 24 tarugos y 12 soportes; motor 32 tarugos y 8 soportes. Compatible con un entrepaño fijo en las plantillas vigentes.
- Los restantes consumibles y herrajes comparados coinciden. Hay diferencias de canto y madera; no equivalen por sí solas a errores, pues las plantillas incluyen descuentos de fabricación.

No se auditaron precios ni perforaciones. No se agregaron consumos por cantidades de pedido.

Consultar el [informe completo](../../artifacts/comparacion-prueba1/informe.md) y el [detalle por consumo](../../artifacts/comparacion-prueba1/comparacion.csv). Contexto: [consumo de materiales](consumo_materiales.md) y [motor](motor_calculo.md).
