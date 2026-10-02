# Auditoría Query App 2-10 frente al catálogo activo

Consulta de Supabase: 2026-10-02 16:02 UTC. Auditoría de lectura, sin modificar plantillas ni reglas.

## Fuentes y método

- [Informe completo con muestra y evidencia](../../outputs/query-210/comparacion-query-210.md).
- [Fuente CSV](../../Query%20App%202-10.csv): 5.000 filas, 562 descripciones, 510 códigos normalizados.
- Captura local de `cot_tipos_mueble`, `cot_piezas_plantilla` y `cot_reglas_config`: 81 tipos activos y uno inactivo.
- 252 referencias seleccionadas en 110 agrupaciones de código, incluidas dos descripciones sin SKU homologable. Se toman cinco cuando existen; en 89 grupos hay menos de cinco referencias.
- Se conserva FE/SM/SMG/PUSH y otras variantes. DB conserva el número de cajones y la S posterior a la medida. Las descripciones no sustituyen al código.
- Se ejecuta el motor real con dimensiones recuperadas del DSL de producción y espesores de la fuente. No se fuerza el número de entrepaños para producir coincidencias. Las equivalencias configurables y aproximadas se identifican en el informe.
- `CANTIDAD` está vacía: una fila por pieza. Se excluyen 12 repeticiones exactas con la misma letra y despiece. Se comparan aristas visibles + blancas y calibre; el catálogo no permite certificar blanco/color por arista.

## Resultados de la captura

201 referencias calculables: 120 con igual total de piezas y 81 con distinto total. 103 presentan diferencias de patrón/calibre en piezas emparejadas; esta cifra incluye anomalías de origen y correspondencias geométricas por revisar, no 103 errores confirmados de Plus. 50 referencias sin equivalente verificado y una con dimensiones incompletas.

Hallazgos concretos:

- B-FE: cinco muestras de 16 piezas coinciden en cantidad, pero el trasero de gaveta pasa de dos cantos largos en Query a uno en Plus.
- UVFD: cinco muestras coinciden en cantidad; el entrepaño tiene cuatro aristas en Query y ninguna en Plus.
- DB-1S: 18 piezas coincidentes; traseros grandes con 1L×0A en Query y 1L×2A en Plus.
- DB-2-SMG: tres muestras de 13 piezas frente a 16 de DB-2-SM, con dos golas y un refuerzo adicionales en Plus.
- UW: cinco muestras coinciden en piezas, cantos y tres entrepaños, incluido el fijo.
- W-SM y WBL-D-L/R-SM de 40 pulgadas: Query tiene tres entrepaños; Plus devuelve dos. WSM de 25 pulgadas: dos frente a uno.
- WPC: las dos referencias calculadas contienen dos/cuatro entrepaños frente a seis en Plus.
- OW de 49,5 pulgadas: dos entrepaños frente a tres. TW3334 1/4-PUSH-SM: uno frente a dos, aunque ambos suman diez piezas por otra diferencia de puertas.

## Límites

La exportación tiene exactamente 5.000 filas y termina con IC40-2P de solo seis piezas; no se certifica su integridad ni la cobertura de todo Query. DB19-2S-FE-SM-15MM tiene una fila con seis cantos largos y calibre cero: dato anómalo. Configuraciones de horno, kits parciales, módulos compuestos y overrides de proyecto necesitan revisión específica antes de modificar las plantillas. IC y IP son alias métricos de DB y BFD, no ausencias automáticas del catálogo.

Ver también [validación de hojas de ruta](validacion_hojas_de_ruta.md), [ejes del fondo](ejes_fondo_backing.md) y [variantes Gola SM](variantes_frente_gola_sm.md).
