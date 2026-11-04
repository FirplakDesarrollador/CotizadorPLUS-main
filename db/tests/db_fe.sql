-- Verifica el catálogo real sin cambios persistidos.
begin;
do $$ declare db uuid; fe uuid; donante uuid;
begin
 select id into strict db from public.cot_tipos_mueble where pref='DB';
 select id into strict fe from public.cot_tipos_mueble where pref='DB-FE';
 select id into strict donante from public.cot_tipos_mueble where pref='DB-2S-SM-FE';
 if not exists(select 1 from public.cot_tipos_mueble where id=fe and activo and permite_agrupacion and pref_imperial='DB-FE' and pref_metrico='DB-FE')
 then raise exception 'DB-FE no está activa y agrupable como tipología principal'; end if;
 if exists(select 1 from public.cot_piezas_plantilla p
 left join public.cot_piezas_plantilla n on n.tipo_mueble_id=fe and n.nombre=p.nombre
 where p.tipo_mueble_id=db and p.nombre not in ('base_gaveta','trasero_gaveta_pequena','trasero_gaveta_grande')
 and (n.id is null or (to_jsonb(n)-'id'-'tipo_mueble_id'-'created_at'-'updated_at') is distinct from
 (to_jsonb(p)-'id'-'tipo_mueble_id'-'created_at'-'updated_at')))
 then raise exception 'DB-FE alteró la carcasa o los frentes fuente'; end if;
 if exists(select 1 from public.cot_piezas_plantilla n
 left join public.cot_piezas_plantilla d on d.tipo_mueble_id=donante and d.nombre=n.nombre
 where n.tipo_mueble_id=fe and n.nombre in ('fondo_gaveta','lateral_gaveta_pequena','lateral_gaveta_grande','trasero_gaveta_pequena','trasero_gaveta_grande','contraparche_pequeno','contraparche_grande')
 and (d.id is null or (to_jsonb(n)-'id'-'tipo_mueble_id'-'created_at'-'updated_at'-'formula_cantidad') is distinct from
 (to_jsonb(d)-'id'-'tipo_mueble_id'-'created_at'-'updated_at'-'formula_cantidad')))
 then raise exception 'DB-FE no usa la geometría/mecanizados FE actuales'; end if;
 if exists(select 1 from public.cot_herrajes_plantilla where tipo_mueble_id=fe and (rol='barra' or herraje_codigo='RIELTANDEM'))
 or (select count(*) from public.cot_herrajes_plantilla where tipo_mueble_id=fe and rol='riel' and herraje_codigo='RIELFE500' and selector_key='riel_fe' and formula_cantidad='n_cajones')<>1
 then raise exception 'Riel o barras incorrectos en DB-FE'; end if;
 if exists(select 1 from public.cot_piezas_plantilla where tipo_mueble_id=fe and nombre='base_gaveta')
 or (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=fe and nombre='fondo_gaveta' and formula_cantidad='n_cajones' and formula_largo='492/25.4')<>1
 then raise exception 'El fondo de cada gaveta debe ser único y FE de 492 mm'; end if;
end $$;
rollback;
