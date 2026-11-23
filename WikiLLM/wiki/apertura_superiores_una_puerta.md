# Apertura L/R en W-SM, WLD y WSM

## Regla y alcance

Solo las tipologías exactas `W-SM`, `WLD` y `WSM` requieren elegir L o R cuando el número de puertas es uno. Se respeta `overrides.n_puertas`: seleccionar una puerta activa el requisito aunque las dimensiones correspondan a dos; seleccionar dos lo desactiva. El selector no aparece para otras tipologías ni cantidades de puertas.

`src/lib/mano-puerta.ts` comparte el alcance, la validación y el sufijo comercial. Los formularios reciben las reglas activas del catálogo mediante `getCotizadorData().tipos[].reglasPuertas`, con la misma normalización de puertas del motor. No se duplica un umbral fijo en las vistas. El servidor valida nuevamente con el resultado real del motor al agregar o editar líneas y al confirmar módulos del simulador.

## Persistencia y referencias

- `manoPuerta` guarda exclusivamente `L` o `R` dentro de `config`; no utiliza `doorHand`, que pertenece a las puertas paramétricas de otros muebles y tenía R por defecto.
- Los formularios nuevos arrancan sin selección. El estado persistido del simulador, su historial y los módulos combinados conservan el dato; los estados antiguos lo reconstruyen vacío.
- `codigoComercial()` agrega `-L` o `-R` al final de la referencia, después de medidas, sistema y espesor. No modifica geometría, cantidades, materiales, cantos ni precios.
- El recálculo guarda el sufijo. `normalizarNombresLineas()` lo conserva en la proyección de lectura utilizada por cotizaciones e impresión, con la cantidad de puertas del override o del despiece persistido.
- La HDR muestra la misma referencia, incluidas las referencias individuales de grupos. Si falta la apertura, PDF y Excel HDR se bloquean hasta completar el dato; confirmar un aviso de entrepaños no permite omitir esta obligación.

## Cotizaciones existentes: aplicación del 2026-11-09

`scripts/sincronizar-mano-puerta.ts` audita sin escribir por defecto. Con `--apply` respalda las filas y grupos afectados, marca `config.manoPuertaPendiente` y actualiza referencias solo si existe una apertura explícita. No inventa L/R ni recalcula importes. Comprueba que el resto de columnas de cada línea permanezca intacto y utiliza `updated_at` como control de concurrencia cuando está disponible.

Comando: `node --conditions=react-server --env-file=.env --import tsx scripts/sincronizar-mano-puerta.ts --apply`.

Se inspeccionaron 1063 líneas: 26 muebles de una puerta sin apertura, en ocho cotizaciones. Se aplicaron las 26 marcas con respaldo local en `.tmp/mano-puerta-respaldo-1794252688940.json`. La segunda auditoría devuelve cero cambios pendientes de sincronización; siguen existiendo 26 aperturas que debe elegir una persona. Se conservaron precios, medidas y cantidades. Los informes quedan en `.tmp/mano-puerta-auditoria.json`, `.tmp/mano-puerta-aplicacion.json` y `.tmp/mano-puerta-postflight.json`.

Al entrar en una cotización, la página calcula los pendientes y muestra una alerta con códigos y secciones. Para resolverla, editar cada mueble, seleccionar L/R y guardar; la alerta se actualiza con la recarga normal del editor. La detección no depende exclusivamente de la marca histórica, por lo que también cubre líneas antiguas o nuevas que lleguen sin ella.

## Verificación

Las regresiones cubren alcance exacto, cero/dos puertas, selección manual, unidades in/cm/mm, regla por prioridad, ausencia de R predeterminada, persistencia del simulador, sufijo tras espesor, cambio L→R sin duplicación, reconstrucción de nombres al reabrir, bloqueo de HDR incompleta e invariantes de cálculo. El gate final aprobó con exit 0: 132 suites, TypeScript y trinquete de ESLint. `quality:learn -- --strict` devolvió cero HIGH; quedan dos avisos MED y tres LOW de latencia de pruebas. Evidencia local: `.tmp/mano-puerta-gate-final.txt` y `.tmp/mano-puerta-learn-final.txt`.

Tras la autorización explícita del usuario, se comprobó el HTML real mediante HTTP autenticado de las ocho cotizaciones afectadas: ocho respuestas 200, ocho avisos L/R presentes, cero indicadores de error de Next. Los pendientes por cotización son 2, 1, 8, 7, 4, 1, 2 y 1 (26 en total). Evidencia: `.tmp/mano-puerta-http.json`.

No se enviaron correos ni se modificaron cotizaciones durante esta comprobación. La primera sesión temporal alcanzó a crearse antes de un fallo de lectura UTF-16 del informe local; se identificó por UUID, fecha exacta y agente Node y se cerró sin afectar otras sesiones. La repetición protegió el cierre con `finally`, terminó correctamente y cerró su sesión. Una consulta posterior confirmó cero sesiones QA abiertas.

Límite: esta evidencia verifica el HTML entregado por el servidor; no sustituye una revisión visual del navegador, interacción de controles ni las dos generaciones independientes de PDF, que siguen pendientes. El acceso a pestañas no está disponible y el control nativo de Edge fue detenido por no poder verificar su URL en la sesión anterior. No se afirma publicación o verificación visual.

Relacionados: [nombres comerciales](nombres_comerciales_modulos.md), [validación HDR](hdr_validacion_entrepanos.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).

## Preparación de publicación LIz → DEV → main (2026-11-09)

Con la publicación autorizada por el usuario, se repitieron `quality:plan`, `quality:gate:full` (132 suites, exit 0), la compilación de producción (exit 0) y `quality:learn -- --strict` sin HIGH. Supabase tiene registradas las migraciones locales hasta `0253_svfdh_smg_refuerzo_delantero_80`; esta funcionalidad utiliza el JSON de configuración existente y no requiere una migración de esquema adicional. La sincronización autorizada se ejecutó de nuevo sobre 1066 líneas y devolvió cero cambios por aplicar, sin modificar importes ni geometría. Evidencia local: `.tmp/publicacion-liz-gate.txt`, `.tmp/publicacion-liz-build.txt`, `.tmp/publicacion-liz-learn.txt` y `.tmp/publicacion-liz-supabase.json`.
