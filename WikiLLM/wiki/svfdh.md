# SVFDH y SVFDH-SMG

Clones activos de SVFD mediante migración idempotente 0251: mismas piezas, reglas, herrajes y agrupación; sin convertir los SVFD existentes. Familia de materiales Baños y alto inicial 28,75 pulgadas conservados.

SVFDH siempre incluye altura y profundidad en el código comercial. SVFDH-SMG también y cambia el alto del frente a A − 30 mm (sin restar además RV). Además, el refuerzo delantero de SMG y SMG-SF mide 80 mm. Mantiene el ancho del frente y las cantidades de SVFD. La normalización compartida protege catálogos precargados.

Simulador, cotizaciones, HDR, programación y exportaciones usan codigoComercial. Caché del simulador versión 15 para recalcular geometría y códigos sin borrar selecciones.

Regresiones: tests/gavetas-fe-medidas.test.ts. Relacionados: [nombres comerciales](nombres_comerciales_modulos.md), [DB FE](db_fe.md).

## Refuerzo delantero SMG: 2026-11-07

SVFDH-SMG y SVFDH-SMG-SF usan refuerzo_delantero con ancho de 80 mm (80/25.4 en el motor); se conservan largo, cantidad, material y cantos. Migración idempotente 0253 y normalización en prepararCotizacion para catálogos precargados. SVFD y SVFDH sin SMG conservan su regla. Caché del simulador v17 invalida los resultados anteriores.

Verificación 0253: siete módulos de Condominio V recalculados con respaldo y control de concurrencia; dimensiones exteriores, notas, cantidades, materiales y herrajes conservados. HDR y Excel de ambas variantes muestran 80 mm. Dos PDF independientes de Condominio V: diez páginas cada uno, texto idéntico y páginas renderizadas revisadas. Auditoría estricta de doce cotizaciones sin diferencias ni errores. quality:gate exit 0 (766 pruebas), quality:learn estricto sin HIGH.
