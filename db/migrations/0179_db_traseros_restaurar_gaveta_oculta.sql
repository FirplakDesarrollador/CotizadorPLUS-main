-- 0179 — Restaura la rama de gaveta oculta en los traseros de DB
--
-- `0171_db_normalizar_nombres_traseros_gaveta.sql` borro la plantilla generica
-- `trasero_gaveta` y parametrizo las cantidades de `pequena` y `grande`, pero al
-- reescribir las formulas **perdio la rama `n_cajones_ocultos`** que tenian
-- antes:
--
--   pequena  antes: n_cajones_ocultos>0 ? 2 : n_cajones_pequenos
--            0171 : n_cajones_pequenos>0?n_cajones_pequenos:(n_cajones==4?n_cajones:0)
--   grande   antes: n_cajones_ocultos>0 ? 1 : (n_cajones_pequenos>0 ? n_cajones-n_cajones_pequenos : 0)
--            0171 : n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:(n_cajones==4?0:n_cajones)
--
-- Efecto: una configuracion con gaveta oculta (DB2-1OP: `n_cajones_ocultos=1`,
-- `n_cajones_pequenos=0`) pasaba a dar **0 traseros pequenos** en vez de 2, y
-- `n_cajones` grandes en vez de 1. El despiece quedaba sin los traseros de la
-- gaveta oculta. Lo detecta `tests/db2-1op.test.ts`.
--
-- Esta migracion es aditiva: antepone la rama de ocultos y conserva intacta la
-- logica que `0171` introdujo para DB-4 y para las mixtas DB-1S/DB-2S.
--
--   n_cajones_ocultos>0          -> 2 pequenos / 1 grande   (gaveta oculta)
--   n_cajones_pequenos>0         -> n_pequenos / resto      (mixtas DB-1S/2S)
--   n_cajones==4                 -> 4 pequenos / 0 grandes  (DB-4)
--   resto                        -> 0 pequenos / n grandes  (DB-2/DB-3)

begin;

update public.cot_piezas_plantilla p
set formula_cantidad = 'n_cajones_ocultos>0 ? 2 : (n_cajones_pequenos>0 ? n_cajones_pequenos : (n_cajones==4 ? n_cajones : 0))',
    notas = 'Trasero pequeno de 68 mm: 2 con gaveta oculta; gavetas pequenas de DB-1S/DB-2S; todas las de DB-4.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB'
  and p.nombre = 'trasero_gaveta_pequena';

update public.cot_piezas_plantilla p
set formula_cantidad = 'n_cajones_ocultos>0 ? 1 : (n_cajones_pequenos>0 ? n_cajones-n_cajones_pequenos : (n_cajones==4 ? 0 : n_cajones))',
    notas = 'Trasero grande de 183 mm: 1 con gaveta oculta; gavetas grandes de DB-1S/DB-2S; todas las de DB-2/DB-3.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB'
  and p.nombre = 'trasero_gaveta_grande';

-- Las dos plantillas tienen que seguir siendo exactamente dos, como exigia 0171.
do $$
begin
  if (select count(*)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
      where t.pref = 'DB'
        and p.nombre in ('trasero_gaveta_pequena', 'trasero_gaveta_grande')) <> 2 then
    raise exception 'DB debe contener exactamente los traseros pequeno y grande';
  end if;

  if exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'DB'
      and p.nombre in ('trasero_gaveta_pequena', 'trasero_gaveta_grande')
      and p.formula_cantidad not like '%n_cajones_ocultos%'
  ) then
    raise exception 'los traseros de DB deben contemplar la gaveta oculta';
  end if;
end $$;

commit;
