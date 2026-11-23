-- 0182 — La descripción de F, PN y TK: nombre de producción y sin contadores
--
-- Los tres son elementos de **una sola pieza** y cada uno es el único de su
-- categoría en el catálogo (`filler`, `panel`, `zocalo`). Su descripción venía
-- con `· N puerta(s)` y `· N entrepaño(s)`, que salen de reglas **globales** de
-- `n_puertas`/`n_entrepanos` —aplican a todo tipo sin excepción— y no significan
-- nada para un panel de relleno o un zócalo.
--
--   antes:  TK 4.5x96x0.75 in · 1 puerta(s) · 3 entrepaño(s)
--   ahora:  TOEKICK 4.5x96x0.75 in
--
-- Completa la `0181`, que puso FILLER pero dejó los contadores y no cubría PN
-- ni TK.
--
-- La descripción se **reconstruye desde las columnas** (`largo`, `alto`, `prof`,
-- `unidad_dim`) en lugar de parsear el texto: es exactamente como la arma
-- `construirFilaLinea()`, y evita depender de si lo guardado empieza por el
-- prefijo base (`TK`) o por el código completo (`TK5 1/496`).
--
-- Solo descripción: no toca precio, cantidades ni el código del módulo.
-- Idempotente: el `where` exige que el valor actual difiera del objetivo.

begin;

with objetivo as (
  select id,
         (case pref
            when 'F' then 'FILLER'
            when 'PN' then 'PANEL'
            when 'TK' then 'TOEKICK'
          end)
         || ' ' || largo::text || 'x' || alto::text || 'x' || prof::text || ' ' || unidad_dim
           as desc_nueva
  from public.cot_cotizacion_lineas
  where pref in ('F', 'PN', 'TK')
)
update public.cot_cotizacion_lineas l
set descripcion_es = o.desc_nueva
from objetivo o
where o.id = l.id
  and l.descripcion_es is distinct from o.desc_nueva;

do $$
begin
  if exists (
    select 1 from public.cot_cotizacion_lineas
    where pref in ('F', 'PN', 'TK')
      and (descripcion_es like '%·%'
           or descripcion_es !~ '^(FILLER|PANEL|TOEKICK) ')
  ) then
    raise exception 'quedan lineas de elemento plano con la descripcion antigua';
  end if;
end $$;

commit;
