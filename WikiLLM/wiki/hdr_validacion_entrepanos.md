# Validación de entrepaños en HDR

## Causa del caso W96.27867-SM-PUSH

El módulo de Condominio V mide 96,2 × 78 × 67 cm. Su configuración persistida contiene `overrides.n_entrepanos = 1`; su despiece guardado también tiene una pieza `entrepano`. Las reglas actuales, sin esa selección manual, generan dos entrepaños. La HDR respetaba el override y por eso imprimía uno. No es una pérdida de filas al expandir cantidades.

Con las reglas actuales, las dos filas son SHELF 1 y SHELF 2, ambas de 931 × 619,2 mm con tablero de caja de 15 mm. La prueba de regresión verifica cantidades y dimensiones.

## Comportamiento implementado

- `src/app/hdr/validacion.ts` compara el despiece calculado con el override de entrepaños y el calculado sin ese override, conservando los demás parámetros, materiales y reglas. Compara piezas reales, incluidos entrepaños fijos; no supone que toda tipología obedezca a la variable global.
- `modulosDeCotizacionAction` valida líneas individuales e integrantes de grupos físicos con un catálogo compartido por petición. Los avisos se conservan al consolidar HDR equivalentes entre áreas.
- La pantalla lista las diferencias y enlaza a la cotización. PDF y Excel requieren revisar y confirmar las cantidades cuando existen avisos. La confirmación se reinicia al seleccionar una cotización. Para corregir, editar la cantidad en la cotización y volver a seleccionarla en HDR.
- Una excepción manual no se sustituye automáticamente: puede ser intencional. Confirmarla permite exportar el despiece guardado, sin cambiar la cotización ni sus importes.
- El encabezado de la HDR cuenta los entrepaños del despiece real, como la descripción de cotizaciones, en lugar de imprimir la variable global.

## Auditoría de solo lectura, 2026-11-09

`node --conditions=react-server --env-file=.env --import tsx scripts/auditar-hdr.ts`

Se evaluaron 837 módulos con las reglas actuales: 14 discrepancias y cero errores de cálculo.

| Proyecto | Líneas con discrepancias |
| --- | ---: |
| Condominio V | 8 |
| Casa A - Casa modelo A | 1 |
| Casa Poro - Casa modelo C | 4 |
| Edificio Santa Barbara | 1 |

El informe detallado local queda en `.tmp/hdr-auditoria.json`. `--strict` devuelve un código distinto de cero si hay discrepancias. El script no escribe en la base de datos. Esta auditoría no declara incorrectas todas las excepciones manuales.

## Alcance y verificación

La validación automática añadida cubre discrepancias de entrepaños frente a las reglas actuales. No certifica por sí sola geometría, montaje, puertas, gavetas, materiales o cantos, ni inspecciona PDF previamente descargados. El simulador y la HDR comparten el motor; dos ejecuciones con configuraciones diferentes pueden producir cantidades diferentes.

Las regresiones comprueban el ejemplo métrico, dimensiones, cantidades de filas, entrepaños fijos, ausencia de falsos avisos en plantillas de cantidad fija, conservación de personalizaciones, consolidación y bloqueo de exportación pendiente de revisión. `quality:gate` aprobó con exit 0 las 131 suites, TypeScript y el trinquete de ESLint. `quality:learn -- --strict` no encontró HIGH. La verificación visual y las dos generaciones independientes de PDF no se completaron: el host de acceso al navegador no está disponible y Playwright no está instalado en este entorno. No se afirma validación visual ni publicación.

Relacionados: [protocolo PDF](protocolo_pdf_cotizaciones.md), [consumos HDR](hdr_consumos.md).
