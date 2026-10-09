-- 0181 — Las líneas de filler se describen "FILLER", no "F"
--
-- `construirFilaLinea()` arma `descripcion_es` empezando por el prefijo, de modo
-- que un filler quedaba como "F 6x36x24 in · 1 puerta(s)". Producción lo lee
-- escrito: FILLER. El código del módulo (`F636`) no cambia; solo la descripción.
--
-- El código ya genera la forma nueva (`etiquetaDescripcion()` en `muebles.ts`),
-- pero las líneas guardadas conservarían la vieja hasta que se recalculara su
-- cotización. Esto las pone al día: 17 líneas en 5 cotizaciones.
--
-- Alcance estricto: solo `pref = 'F'`, que es la única tipología de categoría
-- `filler` del catálogo. Un prefijo distinto que empiece por F no se toca.
--
-- Idempotente: el `where` exige que la descripción aún empiece por "F ".

begin;

update public.cot_cotizacion_lineas
set descripcion_es = 'FILLER ' || substring(descripcion_es from 3)
where pref = 'F'
  and descripcion_es like 'F %';

do $$
begin
  if exists (
    select 1 from public.cot_cotizacion_lineas
    where pref = 'F' and descripcion_es like 'F %'
  ) then
    raise exception 'quedan lineas de filler con la descripcion antigua';
  end if;
end $$;

commit;
