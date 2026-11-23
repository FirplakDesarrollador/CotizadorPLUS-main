-- Copias curadas: solo cambia el encuentro entre niveles de frentes.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Renombrar en sitio conserva IDs y referencias de cotizaciones existentes.
update public.cot_tipos_mueble
set pref=replace(pref,'PCFD-MO','PC-MO'),
    pref_imperial=replace(pref_imperial,'PCFD-MO','PC-MO'),
    pref_metrico=replace(pref_metrico,'PCFD-MO','PC-MO'), updated_at=now()
where pref in ('PCFD-MO','PCFD-MO-SF');

update public.cot_tipos_mueble set activo=false, updated_at=now()
where pref in ('BBL','BBL-SF');
-- BBLFD-D-L/R-SM-SF se retira del selector en getCotizadorData; conserva su
-- identidad interna para resolver el interruptor sin fondo y el historial.

do $$
declare origen public.cot_tipos_mueble%rowtype; destino uuid; base text; suf text;
        nuevo text; es_mo boolean; es_pc boolean; fs text; fi text;
begin
  foreach base in array array['PC','PC-MO','BMW-1','BMW-1-FE','BOMH-1','BOMH-1-FE'] loop
    select * into strict origen from public.cot_tipos_mueble where pref=base;
    foreach suf in array array['SM','SMG'] loop
      nuevo:=base||'-'||suf;
      select id into destino from public.cot_tipos_mueble where pref=nuevo;
      if destino is not null then
        raise exception 'La copia % ya existe; no sobrescribir personalizaciones', nuevo;
      end if;
      destino:=gen_random_uuid();
      insert into public.cot_tipos_mueble
      select (jsonb_populate_record(null::public.cot_tipos_mueble,to_jsonb(origen)||jsonb_build_object(
        'id',destino,'pref',nuevo,'pref_imperial',nuevo,'pref_metrico',nuevo,
        'nombre_es',nuevo||' — '||origen.nombre_es,
        'nombre_en',nuevo||' — '||coalesce(origen.nombre_en,origen.nombre_es),
        'activo',true,'created_at',now(),'updated_at',now()))).*;

      insert into public.cot_piezas_plantilla
      select (jsonb_populate_record(null::public.cot_piezas_plantilla,to_jsonb(p)||jsonb_build_object(
        'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
      from public.cot_piezas_plantilla p where p.tipo_mueble_id=origen.id;
      insert into public.cot_reglas_config
      select (jsonb_populate_record(null::public.cot_reglas_config,to_jsonb(r)||jsonb_build_object(
        'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
      from public.cot_reglas_config r where r.tipo_mueble_id=origen.id;
      insert into public.cot_herrajes_plantilla
      select (jsonb_populate_record(null::public.cot_herrajes_plantilla,to_jsonb(h)||jsonb_build_object(
        'id',gen_random_uuid(),'tipo_mueble_id',destino,'created_at',now(),'updated_at',now()))).*
      from public.cot_herrajes_plantilla h where h.tipo_mueble_id=origen.id;

      es_pc:=base in ('PC','PC-MO'); es_mo:=base='PC-MO';
      if es_pc then
        fs:=case when base='PC' and suf='SMG' then 'A-PUERTA_SUP+21/25.4' else 'A-PUERTA_SUP+25/25.4' end;
        fi:=case when not es_mo then 'fijo_superior_z'
          when suf='SM' then 'fijo_superior_z-80/25.4-TC-MO-TF'
          else 'A-PUERTA_SUP-10/25.4-MO-TF' end;
        update public.cot_piezas_plantilla set formula_ancho=
          case when es_mo then 'fijo_inferior_z-zocalo-30/25.4'
          else 'A-zocalo-PUERTA_SUP-30/25.4' end
        where tipo_mueble_id=destino and nombre='puerta_inferior';
      else
        fs:=case when base like 'BMW-%' then '224.93/25.4-TR/2' else '332.8/25.4' end;
        fi:='fijo_superior_z';
        update public.cot_piezas_plantilla
        set formula_ancho='fijo_inferior_z-30/25.4-3.2/25.4'
        where tipo_mueble_id=destino and nombre='frente_gaveta';
      end if;
      insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,notas) values
        (destino,'fijo_superior_z','true',fs,1,'Cara inferior del fijo superior; pulgadas'),
        (destino,'fijo_inferior_z','true',fi,1,'Cara inferior del fijo inferior; pulgadas');

      if suf='SM' then
        -- Herrajes SM propios: no duplicar manijas ni perfiles heredados.
        delete from public.cot_herrajes_plantilla where tipo_mueble_id=destino and rol='manija';
        insert into public.cot_piezas_plantilla
          (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
        values
          (destino,'refuerzo_delantero_gola','refuerzo',case when es_mo then '2' else '1' end,
           'L-2*TC','80/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,81,
           'Refuerzo vertical bajo el fijo, retrasado 20 mm.',
           '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"x":"TC","y":"20","z":"(I===0 ? FS : FI)-H","confirmado":true}'),
          (destino,'gola_madera','caja',case when es_mo then '2' else '1' end,
           'L-2*TC','80/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,82,
           'Gola horizontal sin retraso, pegada bajo el refuerzo de 80 mm.',
           '{"version":1,"funcion":"gola","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"(I===0 ? FS : FI)-80-H","confirmado":true}');
      else
        delete from public.cot_herrajes_plantilla where tipo_mueble_id=destino and rol='manija';
        update public.cot_piezas_plantilla
        set visualizacion=coalesce(visualizacion,'{}'::jsonb)||
          '{"recortes":[{"borde":"frontal","profundidad":"27","alto":"73","z":"FI-73-Z"}],"nota":"Mecanizado frontal vertical de 27 x 73 mm desde la cara inferior del fijo."}'::jsonb
        where tipo_mueble_id=destino and nombre='lateral';
      end if;
    end loop;
  end loop;
end $$;

do $$ begin
  if (select count(*) from public.cot_tipos_mueble
      where pref in ('PC-SM','PC-MO-SM','BMW-1-SM','BMW-1-FE-SM','BOMH-1-SM','BOMH-1-FE-SM',
                     'PC-SMG','PC-MO-SMG','BMW-1-SMG','BMW-1-FE-SMG','BOMH-1-SMG','BOMH-1-FE-SMG') and activo) <> 12
  then raise exception 'Deben existir las doce copias activas'; end if;
end $$;
commit;
