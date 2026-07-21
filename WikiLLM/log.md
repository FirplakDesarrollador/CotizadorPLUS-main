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

## [2026-07-15] ingest | Rieles de cajón para muebles DB
Se integraron los 5 tipos de riel del Excel `materiales.xlsx` (Hoja1 sección HERRAJES) al catálogo `cot_herrajes`. Se creó la migración `0020_rieles_db.sql`, se añadió `DB_RIELES` a `muebles.ts`, se extendió `CotizarInput` con `rielCodigo` en `cotizar.ts` (override de precio en memoria, sin tocar el motor), y se agregó el selector "Tipo de riel" al simulador (`CotizadorForm.tsx`) y formulario de cotizaciones (`AddLineForm.tsx`), visible solo para muebles DB. Se creó la página `wiki/rieles_db.md`.

## [2026-07-21] update | Integración de ramas DEV y Andres en rama Solve
Se resolvió la integración de cambios remotos de DEV y Andres en la rama `Solve`, unificando las firmas de componentes (`NuevoCotizacionForm`, `CotizadorForm`, `CocinaCard`), resolviendo conflictos de tipos de TypeScript y verificando la compilación limpia de Next.js (`npm run build`).

## [2026-07-21] update | Nuevo tipo de riel: Riel full extension 500mm
Se agregó un 6º tipo de riel al catálogo, tomado de `materiales.xlsx` (Hoja1 fila 64 y hoja `Rieles`, valor $27,105 — ya existía en Hoja1 con el nombre "Costo riel full extension 500mm" y se renombró a "Riel full extension 500mm" para consistencia con el resto de la lista). Cambios: nueva entrada en `DB_RIELES` (`muebles.ts`), nueva migración `0021_riel_full_extension.sql` que inserta el registro en `cot_herrajes`. No se tocó `cotizar.ts` ni el motor: el mecanismo de override de precio por `rielCodigo` ya es genérico y toma cualquier código presente en `cot_herrajes`. El selector "Tipo de riel" en Simulador y Cotizaciones lo muestra automáticamente al iterar `DB_RIELES`. Actualizada `wiki/rieles_db.md`.

## [2026-07-21] fix | Códigos de riel en muebles.ts no coincidían con la BD real
El usuario reportó (con capturas del panel admin de Herrajes) que el catálogo real en Supabase usa códigos distintos a los que tenía `DB_RIELES`. Se consultó `cot_herrajes` directamente vía REST API y se confirmó el desajuste en 4 de 6 códigos: `RIELSLIMCHINA`→`RIELSLIMCHI`, `RIELSLIMALTO`→`SLIMBOXALTO`, `RIELSLIMBAJO`→`SLIMBOXBAJO`, y el `RIELFULLEXT500` recién agregado→`RIELFE500`. Como `cotizar.ts` indexa `herrajesByCode` por `codigo` exacto, este desajuste hacía que el override de precio fallara en silencio para esos 4 rieles (la cotización usaba el precio de `RIELTANDEM` sin importar cuál se seleccionara). Se corrigieron los códigos en `muebles.ts` para que coincidan exactamente con producción, y se actualizaron `0020_rieles_db.sql` y `0021_riel_full_extension.sql` para que un entorno nuevo se sembraría con los mismos códigos que ya están en producción. Verificado contra la BD real que los 6 códigos y precios ahora coinciden 1:1.
