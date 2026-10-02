-- Separa el trasero Tandem condicional de DB y variantes en dos filas:
-- una para 68 mm (1 largo) y otra para 183 mm (1 largo + 2 anchos).
do $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.cot_tipos_mueble where pref in ('DB','DB-3-SM','DB-2S-SM','DB-2-SM')
  loop
    insert into public.cot_piezas_plantilla
      (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
       resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,modo_agrupacion,
       clave_fusion,formula_largo_grupo,visualizacion)
    select tipo_mueble_id,nombre,
      rol_tablero,'n_cajones == 4 ? 1 : 0',formula_largo,'68/25.4',
      resta_largo,resta_ancho,'{"calibre":"19x0,45","largos":1,"anchos":0}'::jsonb,
      tarugos,soportes,orden-0.1,notas,modo_agrupacion,clave_fusion,formula_largo_grupo,visualizacion
    from public.cot_piezas_plantilla
    where tipo_mueble_id=v_id and lower(nombre)='trasero_gaveta'
      and formula_ancho ilike '%n_cajones%68/25.4%';

    update public.cot_piezas_plantilla
    set formula_cantidad='n_cajones == 4 ? 0 : 1',
        formula_ancho='183/25.4',
        cantos=jsonb_set(jsonb_set(cantos,'{largos}','1'::jsonb,true),'{anchos}','2'::jsonb,true),
        updated_at=now()
    where tipo_mueble_id=v_id and lower(nombre)='trasero_gaveta'
      and formula_ancho ilike '%n_cajones%68/25.4%';
  end loop;
end $$;
