-- El selector ya imprime el prefijo: conservar solo el nombre descriptivo.
update public.cot_tipos_mueble
set nombre_es=regexp_replace(regexp_replace(nombre_es,
      '^'||pref||' — ',''),'^(BOMH-1-FE|BOMH-1)\s+',''),
    nombre_en=regexp_replace(nombre_en,'^'||pref||' — ',''),updated_at=now()
where pref in ('PC-SM','PC-MO-SM','BMW-1-SM','BMW-1-FE-SM','BOMH-1-SM','BOMH-1-FE-SM',
               'PC-SMG','PC-MO-SMG','BMW-1-SMG','BMW-1-FE-SMG','BOMH-1-SMG','BOMH-1-FE-SMG');
