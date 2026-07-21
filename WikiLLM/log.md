# Registro Cronológico (Log)

Registro de ingestión, consultas y cambios en la wiki.

## [2026-07-08] ingest | Inicialización de WikiLLM
Se creó la estructura base de WikiLLM siguiendo los lineamientos de Karpathy. Se añadió el documento general de la aplicación.

## [2026-07-09] ingest | Documentación de la Arquitectura Base
Se analizó el directorio `src/` (incluyendo `lib`, `app`, `store` y `components`). Se crearon los documentos `motor_calculo.md` y `arquitectura_frontend.md` para documentar el algoritmo de cotización y la estructura de Next.js. Se actualizó el índice general.

## [2026-07-09] ingest | Documentación de BBDD y Dependencias
Se analizaron los archivos `db/migrations/0001_schema.sql` y `package.json` para mapear la infraestructura relacional de Supabase y las dependencias tecnológicas del proyecto. Se crearon los documentos `esquema_base_datos.md` y `dependencias_proyecto.md` en la wiki.
## [2026-07-14] update | Desactivación global del recargo de cliente (se prioriza uso exclusivo de margen)
## [2026-07-14] update | Cambio en formato de inputs de márgenes y recargos a porcentajes (0-100) en todos los formularios de la UI

## [2026-07-14] ingest | Plan funcional y técnico para agrupación de módulos
Se documentaron las reglas de identificación, geometría compartida, compatibilidad, precios individuales, nomenclatura imperial/métrica, persistencia, interfaz, exportación, migración y pruebas. Se contrastaron las fórmulas activas de Supabase y los libros Excel del proyecto; la tabla completa de prefijos métricos queda pendiente, con `BFD -> IP` como equivalencia confirmada.

## [2026-07-14] update | Implementación de agrupación física de módulos
Se añadió la migración de grupos y nomenclaturas, el cálculo de laterales/piezas continuas y prorrateo individual, las validaciones de compatibilidad, la edición A/A1/A2 con renumeración, los códigos individuales y concatenados, subtotales y colores en UI, impresión y Excel, y la configuración administrativa de prefijos y reglas de fusión.

## [2026-07-15] update | Pruebas integradas y correcciones de precisión en agrupación
Se aplicó y verificó la migración 0020 en Supabase I+D; se añadieron ocho pruebas automatizadas y se ejecutó el flujo E2E B12.DB10.BFD20, métrico IP50, validaciones, impresión y Excel. Se corrigió el ruido de coma flotante en conversiones/prorrateos y se implementó el cierre determinístico del residuo monetario en la última línea.

## [2026-07-15] update | Alineación del nombre de módulo agrupado
Se movió el rótulo del subtotal y su código agrupado para que comience bajo la columna Módulo en la cotización, la impresión y la exportación a Excel, sin alterar la posición de los totales.
