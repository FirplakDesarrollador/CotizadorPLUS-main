-- Normaliza tarugos y herrajes según las reglas de fabricación solicitadas.
update public.cot_piezas_plantilla
set tarugos=4, updated_at=now()
where lower(nombre) like 'refuerzo%' or lower(nombre)='gola_madera';

update public.cot_piezas_plantilla
set tarugos=8, updated_at=now()
where lower(nombre) like 'base%' or lower(nombre) like 'tapa%';

do $$
declare v_id uuid;
begin
  for v_id in select distinct tipo_mueble_id from public.cot_herrajes_plantilla where rol='pata' loop
    if not exists (select 1 from public.cot_reglas_config where tipo_mueble_id=v_id and variable='n_patas' and condicion='L>36') then
      insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
      values (v_id,'n_patas','L>36','5',4,true,'Quinta pata para largos mayores de 36 pulgadas.');
    end if;
  end loop;

  for v_id in select id from public.cot_tipos_mueble where pref in ('BLS','BLS-RS-SM') loop
    delete from public.cot_herrajes_plantilla where tipo_mueble_id=v_id and rol in ('pata','tornillo','bisagra');
    insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
    values
      (v_id,'pata','PATA10AJUST','pata','n_patas',10,'Seis patas para BLS y variantes.'),
      (v_id,'tornillo','TORNILLO858','tornillo','n_patas*4',20,'Cuatro tornillos 5/8 por pata.'),
      (v_id,'bisagra','BISAGRAPAR','bisagra','n_puertas',30,'Par de bisagras por puerta.');
    delete from public.cot_reglas_config where tipo_mueble_id=v_id and variable='n_patas';
    insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
    values
      (v_id,'n_patas','L>36','6',4,true,'BLS: seis patas; regla de largo mayor a 36 pulgadas.'),
      (v_id,'n_patas','true','6',5,true,'BLS: seis patas.');
  end loop;

  delete from public.cot_herrajes_plantilla h using public.cot_tipos_mueble t
  where h.tipo_mueble_id=t.id and t.pref='PCFD'
    and (h.rol='push' or lower(coalesce(h.herraje_codigo,'')) like '%push%');
end $$;
