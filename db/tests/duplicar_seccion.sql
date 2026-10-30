-- Integración real con RLS; datos y permisos de prueba se revierten al terminar.
begin;
create temporary table qa_copia as
select gen_random_uuid() q,gen_random_uuid() a,gen_random_uuid() siguiente,
 gen_random_uuid() g,gen_random_uuid() extra,
 (select creado_por from public.cot_cotizaciones order by created_at limit 1) propietario;
grant select on qa_copia to authenticated;
insert into public.cot_cotizaciones(id,nombre,creado_por,pais)
select q,'QA copia transaccional',propietario,'Colombia' from qa_copia;
insert into public.cot_cocinas(id,cotizacion_id,nombre,orden,cantidad)
select a,q,'Casa D - Closet M-07',0,3 from qa_copia
union all select siguiente,q,'Vacía',1,1 from qa_copia;
insert into public.cot_grupos_modulos(id,cotizacion_id,cocina_id,etiqueta,orden,codigo_grupo,total_cop,total_usd,breakdown)
select g,q,a,'A',0,'W60.W70',300,3,'{"laterales":3,"uniones":1}'::jsonb from qa_copia
union all select extra,q,a,'B',1,'EXTRA',10.25,0.1025,'{"adicional":true}'::jsonb from qa_copia;
insert into public.cot_cotizacion_lineas(cotizacion_id,cocina_id,grupo_id,orden,posicion_grupo,
 tipo_mueble_id,pref,largo,alto,prof,unidad_dim,cantidad,config,breakdown,anotaciones,
 precio_total_cop,precio_total_usd,codigo_modulo,descripcion_es,descripcion_en,codigo_sap)
select c.q,c.a,c.g,v.orden,v.orden+1,(select id from public.cot_tipos_mueble where pref='W'),
 'W',60,70,35,'cm',1,'{"preset":{"caja":"C","frente":"F"},"overrides":{"HOOD":5,"FREE":2},"cantoCaja":"19x0,45"}'::jsonb,
 '{"piezas":[{"pieza":"base","origen":"Grupo A (A1 + A2)"}],"precioCop":123.45}'::jsonb,
 'Nota particular',v.cop,v.usd,v.codigo,'Descripción completa','English description','SAP-1'
from qa_copia c cross join(values(0,100,1,'W60'),(1,200,2,'W70')) v(orden,cop,usd,codigo);
insert into public.cot_cotizacion_lineas(cotizacion_id,cocina_id,grupo_id,orden,cantidad,config,
 precio_total_cop,precio_total_usd,codigo_modulo,anotaciones)
select q,a,extra,2,2,'{"clasificacionPdf":"herrajes_otros","material":{"tipo":"herraje","cantidad":1.5,"codigo":"EXTRA"}}',
 10.25,0.1025,'EXTRA','Adicional fraccionario' from qa_copia;
-- Línea histórica sin grupo: también se debe conservar.
insert into public.cot_cotizacion_lineas(cotizacion_id,cocina_id,grupo_id,orden,cantidad,precio_total_cop,precio_total_usd,anotaciones)
select q,a,null,3,0.5,7.5,0.075,'Histórica sin grupo' from qa_copia;
update public.cot_cocinas set total_cop=953.25,total_usd=9.5325 where id=(select a from qa_copia);
update public.cot_cotizaciones set total_cop=953.25,total_usd=9.5325 where id=(select q from qa_copia);

select set_config('request.jwt.claim.sub',(select propietario::text from qa_copia),true);
set local role authenticated;
do $$ declare ctx record; copia uuid; vacia uuid; begin
 select * into ctx from pg_temp.qa_copia;
 copia:=public.cot_duplicar_cocina(ctx.q,ctx.a);
 if (select nombre from public.cot_cocinas where id=copia)<>'Casa D - Closet M-07-copia'
 or (select cantidad from public.cot_cocinas where id=copia)<>3
 or (select orden from public.cot_cocinas where id=copia)<>1
 or (select orden from public.cot_cocinas where id=ctx.siguiente)<>2
 then raise exception 'Nombre, cantidad u orden de copia incorrectos'; end if;
 if (select total_cop from public.cot_cotizaciones where id=ctx.q)<>1906.5
 or (select total_usd from public.cot_cotizaciones where id=ctx.q)<>19.065
 then raise exception 'Totales no incluyen exactamente una copia con repeticiones'; end if;
 if (select jsonb_agg(to_jsonb(l)-array['id','cocina_id','grupo_id','created_at','updated_at'] order by orden,posicion_grupo)
     from public.cot_cotizacion_lineas l where cocina_id=ctx.a)
 is distinct from
    (select jsonb_agg(to_jsonb(l)-array['id','cocina_id','grupo_id','created_at','updated_at'] order by orden,posicion_grupo)
     from public.cot_cotizacion_lineas l where cocina_id=copia)
 then raise exception 'La copia perdió información de líneas o cambió precios'; end if;
 if (select jsonb_agg(to_jsonb(g)-array['id','cocina_id','created_at','updated_at'] order by orden)
     from public.cot_grupos_modulos g where cocina_id=ctx.a)
 is distinct from
    (select jsonb_agg(to_jsonb(g)-array['id','cocina_id','created_at','updated_at'] order by orden)
     from public.cot_grupos_modulos g where cocina_id=copia)
 then raise exception 'La copia perdió grupos o su despiece'; end if;
 if exists(select 1 from public.cot_cotizacion_lineas l left join public.cot_grupos_modulos g on g.id=l.grupo_id
   where l.cocina_id=copia and l.grupo_id is not null and g.cocina_id is distinct from copia)
 then raise exception 'La copia reutilizó grupos de origen'; end if;
 update public.cot_cotizacion_lineas set anotaciones='Editado solo copia' where cocina_id=copia and orden=0;
 if (select anotaciones from public.cot_cotizacion_lineas where cocina_id=ctx.a and orden=0)<>'Nota particular'
 then raise exception 'La copia no es independiente'; end if;
 update public.cot_cocinas set nombre='Nombre editable' where id=copia;
 if (select nombre from public.cot_cocinas where id=ctx.a)<>'Casa D - Closet M-07'
 then raise exception 'Renombrar copia alteró origen'; end if;
 vacia:=public.cot_duplicar_cocina(ctx.q,ctx.siguiente);
 if exists(select 1 from public.cot_cotizacion_lineas where cocina_id=vacia)
 or (select total_cop from public.cot_cotizaciones where id=ctx.q)<>1906.5
 then raise exception 'Copia de sección vacía incorrecta'; end if;
 perform public.cot_duplicar_cocina(ctx.q,ctx.a);
 if (select total_cop from public.cot_cotizaciones where id=ctx.q)<>2859.75
 then raise exception 'Copia repetida perdió importes'; end if;
 begin
   perform public.cot_duplicar_cocina(gen_random_uuid(),ctx.a);
   raise exception 'Aceptó cotización distinta';
 exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Revocación solo dentro de esta transacción: provoca un fallo después de
-- insertar cocina/grupos y comprueba el rollback de la operación completa.
revoke insert on public.cot_cotizacion_lineas from authenticated;
set local role authenticated;
do $$ declare ctx record; antes jsonb; despues jsonb; msg text; begin
 select * into ctx from pg_temp.qa_copia;
 select jsonb_agg(to_jsonb(c) order by id) into antes from public.cot_cocinas c where cotizacion_id=ctx.q;
 begin
   perform public.cot_duplicar_cocina(ctx.q,ctx.a);
   raise exception 'La prueba no produjo el fallo esperado';
 exception when insufficient_privilege then
   get stacked diagnostics msg=message_text;
   if position('cot_cotizacion_lineas' in msg)=0 then raise exception 'Fallo de permisos inesperado: %',msg; end if;
 end;
 select jsonb_agg(to_jsonb(c) order by id) into despues from public.cot_cocinas c where cotizacion_id=ctx.q;
 if antes is distinct from despues then raise exception 'El fallo dejó una copia parcial o cambió orden'; end if;
 if (select count(*) from public.cot_grupos_modulos where cotizacion_id=ctx.q)<>6
 or (select total_cop from public.cot_cotizaciones where id=ctx.q)<>2859.75
 then raise exception 'El fallo dejó grupos parciales o alteró totales'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ declare ctx record; begin
 select * into ctx from pg_temp.qa_copia;
 begin
   perform public.cot_duplicar_cocina(ctx.q,ctx.a);
   raise exception 'Un usuario ajeno pudo copiar';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.cot_duplicar_cocina(uuid,uuid)','execute')
 then raise exception 'La función permite acceso anónimo'; end if;
end $$;
rollback;
select 'Copia de sección: información, grupos, importes, repeticiones, independencia, vacías, RLS y rollback aprobados. Fixtures y permisos revertidos.' resultado;
