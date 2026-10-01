-- Códigos de módulo ya guardados con la medida al final en vez de después de la letra base.
--
-- `codigoModulo()` (src/lib/module-groups.ts) ahora inserta la medida antes del sufijo
-- separado por guion: B-FE + 12" -> `B12-FE`, no `B-FE12`. Las líneas guardadas antes
-- del cambio conservan el formato viejo hasta que la cotización se vuelva a guardar
-- (`cotizaciones.ts` reescribe `codigo_modulo` en cada recálculo), así que se normalizan
-- aquí de una vez.
--
-- Solo aplica a prefijos con guion, que hoy son las tres tipologías FE (B-FE, UB-FE,
-- V-FE). Las cajoneras DB quedan fuera a propósito: su guion vive en el sufijo de
-- tipología (`DB18-1S`), no en el prefijo, y ese formato ya es el correcto.
update cot_cotizacion_lineas
set codigo_modulo = split_part(pref, '-', 1)
                 || substring(codigo_modulo from char_length(pref) + 1)
                 || substring(pref from position('-' in pref))
where pref like '%-%'
  and codigo_modulo like pref || '%'
  and codigo_modulo <> pref;
