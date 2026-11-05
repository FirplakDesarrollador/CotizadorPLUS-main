# Preferencias individuales de herrajes y BOV

## Contrato de persistencia

`config.conHerrajes` controla la inclusión completa de herrajes y
`config.herrajesExcluidos` contiene los roles desmarcados del módulo. Una
configuración histórica sin `conHerrajes` equivale a `true`; una lista nula
equivale a ninguna exclusión. La preferencia explícita del módulo prevalece
sobre los valores predeterminados del proyecto al reabrir el editor.

`inputDesdeLinea` debe conservar ambos campos: lo usan los recálculos,
agrupaciones, movimientos y sincronizaciones. Cambiar la TRM no puede reactivar
herrajes ni borrar exclusiones. `construirFilaLinea` guarda el input, el
despiece y los precios derivados del mismo cálculo; el resumen usa esos importes.

El fallo corregido forzaba `conHerrajes=true` y descartaba las exclusiones al
reconstruir cada línea. Al editar un módulo con grupo, el primer cálculo era
correcto pero el recálculo posterior volvía a incluir rieles y barras. La
actualización de TRM también borraba ambos campos. No es posible reconstruir
preferencias históricas ya sobrescritas sin evidencia adicional.

## Plantillas BOV

La migración `0237_bov_patas_tornillos.sql` añade a BOV y BOV-SF los roles
faltantes: `pata/PATA10AJUST = n_patas` y
`tornillo/TORNILLO858 = n_patas*4`. La regla global vigente es cuatro patas:
por módulo completo son cuatro patas y dieciséis tornillos. El motor respeta
exclusiones individuales, desactivación completa y el modo de solo frentes.
Las cantidades de línea y repeticiones de área se aplican después.

`scripts/reparar-bov-herrajes.ts` tiene modo de inspección y `--apply`; rechaza
referencias inactivas, sin precio o plantillas contradictorias. Respalda los
datos antes de insertar filas faltantes y recalcula los grupos afectados con
las preferencias originales, seguido de áreas y cabeceras. La reparación no
resuelve nuevamente las tipologías: conserva el tipo ya guardado. Las funciones
`recalcularGrupo` y `recomputarTotales` se comparten con el flujo normal de edición.

## Auditoría del 2026-11-05

- Alcance: 11 cotizaciones y 814 líneas de módulos; 18 líneas BOV en seis proyectos.
- Antes: BOV y BOV-SF carecían de plantilla; las 18 líneas tenían herrajes activos,
  `n_patas=4`, despiece de herrajes vacío y precios sin patas ni tornillos.
- El usuario autorizó aplicar las referencias estándar y recalcular. Se
  insertaron cuatro filas de catálogo mediante el cliente de servicio; el SQL
  equivalente queda versionado en la migración, sin afirmar ejecución del gestor
  de migraciones. Se recalcularon 18 grupos.
- Respaldo previo en el directorio temporal del sistema:
  `cotizador-respaldo-bov-herrajes-1793893306277.json`. Un primer intento de editar
  desde CLI encontró la autorización obligatoria de la RPC de fondo; no cambió
  líneas. La segunda aplicación usó el recálculo de grupos existentes y guardó
  además `cotizador-respaldo-bov-herrajes-1793893347792.json`.
- Auditorías posteriores de solo lectura: 18/18 BOV con cuatro patas y dieciséis
  tornillos; cero diferencias de herrajes e importes en los 814 módulos. La
  auditoría general estricta concilia áreas/cabeceras, materiales y grupos.
- Aumentos COP, antes de IVA y con repeticiones: KUNDARA 1.745.251,28;
  MALECÓN 72 11.190.141,86; Condominio V 307.985,76; Satori 667.302,48;
  Casa Poro 12.832,74; Casa A 12.832,74.
- Caso concreto aportado por el usuario: DB65-2S-SMG de Condominio V,
  `71453bd4-71cf-4371-af11-e4d588cda957`. Se verificó una copia temporal del
  módulo con sus materiales y configuración real en Chromium local,
  1440×1000. Tres guardados con recarga: excluir riel/barra → incluirlos →
  excluirlos. Precios unitarios COP: 452.769,78 → 600.308,24 → 452.769,78.
  Las casillas, configuración y despiece coincidieron tras cada recarga;
  sin errores de aplicación. La copia se eliminó. La selección del DB65
  original permanece sin exclusiones por decisión explícita del usuario,
  quien cambiará la selección por su cuenta.
- Se usó Playwright porque el plugin Browser no está disponible. La revisión
  automática rechazó pruebas que alternaran selecciones en el módulo real;
  se sustituyeron por una copia temporal, sin modificar el original.
- Se abrieron las 11 vistas de impresión y se generaron dos PDF independientes
  por cada proyecto con BOV y por Milán Closet: 14 PDF. Los pares tienen texto
  idéntico. Páginas por generación: Condominio V 9, KUNDARA 10, MALECÓN 11,
  Casa Poro 8, Casa A 7, Satori 4, Milán 4. Se extrajo texto con pypdf y
  se revisaron mosaicos de todas las páginas renderizadas con PDFium; sin
  recortes de filas ni errores de aplicación. La caché de desarrollo de Next
  tenía rutas omitidas y tipos generados corruptos: se regeneró antes de la
  verificación definitiva, sin cambiar la configuración ni la línea base.
  Una consulta independiente a las líneas, áreas y cabeceras contrastó el
  total impreso en la moneda del proyecto y todas las cantidades de herrajes
  incorporados de los siete proyectos; coincidieron con el texto de los PDF.
- `quality:gate`: 93 suites, exit 0; `quality:learn -- --strict`: cero HIGH.
  Cuatro avisos de latencia del optimizador (dos MED y dos LOW), fuera de
  esta funcionalidad. Alcance visual: Chromium local, escritorio e impresión;
  no se verificó despliegue remoto, impresión física ni otros navegadores.

## Verificación reproducible

`node --conditions=react-server --env-file=.env --import tsx scripts/auditar-preferencias-herrajes.ts --strict`
lee todas las páginas de datos, recalcula los grupos y contrasta herrajes y
precios unitarios COP/USD. Tolera 0,011 en el precio unitario por distribución
de residuos de redondeo en grupos. No escribe en la base.

Las regresiones en `tests/cotizaciones.test.ts` cubren reconstrucción de
preferencias y dos cambios consecutivos de TRM; `tests/db-sin-herrajes.test.ts`
comprueba la reducción del costo al excluir rieles y barras, reactivación
reversible y barra automática heredada.

Relacionados: [BOV24](bov24_hoja_real.md),
[protocolo de cotizaciones/PDF](protocolo_pdf_cotizaciones.md).

## Publicación y registro de migración: 2026-11-05

La migración `0237_bov_patas_tornillos` se aplicó y registró mediante
Management API con versión `20261105160555`. La ejecución es idempotente:
conservó las cuatro filas creadas durante la reparación autorizada y no
recalculó ni cambió selecciones de cotizaciones. Se confirmó su presencia en
`supabase_migrations.schema_migrations`.

Antes de promover LIz → DEV → main se repitieron ambas auditorías estrictas:
11 cotizaciones, 814 módulos, 18 líneas BOV, sin diferencias de precios ni
herrajes y sin errores de materiales, grupos o conciliación. La selección
original del DB65 de Condominio V sigue intacta por decisión del usuario.
