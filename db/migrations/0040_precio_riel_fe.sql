-- Precio del riel full extension: 27.105 -> 31.064.
--
-- Al cruzar el tipo nuevo B-FE contra la fila `B12-FE` del Excel CEMA (version
-- 10-09-2026, hoja 'Costos Muebles') el costo de herrajes daba 56.121 contra 60.080
-- del Excel. Toda la diferencia era el riel: patas (7.948), bisagra (5.800), manija
-- (14.900) y tornillos (368) coincidian al peso, y la columna AG del Excil
-- ("Costo PAR rieles cajon FULL EXTENSION") trae 31.064 contra los 27.105 del catalogo.
--
-- Los 27.105 venian de `materiales.xlsx` (Hoja1 fila 64) cuando se sembro el riel en
-- `0021_riel_full_extension.sql`. El maestro de costos CEMA es mas reciente y es la
-- fuente que se usa para cotizar, asi que manda ese.
--
-- Con este cambio el costo de herrajes de B12-FE queda en 60.080, identico al Excel.
update cot_herrajes
set precio = 31064
where codigo = 'RIELFE500';
