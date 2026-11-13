# Ayuda global, valores de cotización y estado En desarrollo

## Ayuda por pantalla

`AppHeader` muestra Guía y Tips antes del menú User. `AppHeaderAyuda` selecciona
los pasos de `src/lib/guias.ts` mediante `helpContext`; las guías usan los
selectores `data-tour` presentes en cada pantalla. El control Tips conserva el
estado global de `useTooltips`.

## Valores de cotización

`calcularValoresCotizacion` agrega costos y precios de cada línea usando la
cantidad de módulos y el multiplicador de la sección. Expone total sin y con
herrajes en USD/COP, utilidad y margen configurado junto al margen ponderado
real. El disclosure está dentro de `print:hidden` y no se muestra en PDF.

## Pipeline y avisos

El estado `en_desarrollo` pertenece al grupo En curso. La migración
`0260_pipeline_en_desarrollo.sql` amplía los checks de cotizaciones y Pipeline;
el trigger existente sincroniza el estado de los registros vinculados. Al
entrar a ese estado, las acciones consultan correos de perfiles admin con el
cliente de servicio y envían una notificación por Resend. Requiere
`RESEND_API_KEY`, `EMAIL_FROM` y `SUPABASE_SERVICE_ROLE_KEY`; un fallo de envío
no revierte el estado y devuelve un aviso visible.

### Aplicación de esquema

La migración 0260 se aplicó y registró en el Supabase conectado el 2026-11-12,
con nombre `pipeline_en_desarrollo` y versión `20261112183818`. Antes de esa
aplicación, los checks de ambas tablas todavía excluían `en_desarrollo`.
La ampliación permite persistir el estado desde cotizaciones y Pipeline;
no cambia el estado de registros existentes ni envía correos por sí misma.

## Agrupación con materiales y cantos distintos

Los módulos pueden formar un grupo aunque varíe su código de tablero o canto.
El motor comparte solo piezas continuas que pasan la homologación geométrica,
de material y cantos. Las incompatibles permanecen locales y los laterales de
la unión solo se descuentan si tablero y canto son compatibles. Profundidad,
margen y espesor de frentes mantienen sus restricciones previas.
