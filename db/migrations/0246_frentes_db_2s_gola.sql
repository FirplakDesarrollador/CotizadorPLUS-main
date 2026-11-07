-- Confirmado 2026-11-06 para SMG metálica y SM de madera, variantes FE/SF:
-- grande=(A-2*30 mm)/2; pequeño=grande/2-3,2 mm.
-- No cambia materiales, cantos, ancho de frente, cantidades ni otras configuraciones DB.
begin;

update public.cot_reglas_config r
set valor = case r.variable
      when 'espacio_gola' then '30/25.4'
      when 'alto_frente_grande' then '(A-2*espacio_gola)/2'
      when 'alto_frente_pequeno' then 'alto_frente_grande/2-RV' end,
    condicion = 'true', prioridad = 1, activo = true,
    notas = 'DB 2S SM/SMG: dos espacios de gola de 30 mm; frente inferior mitad útil; pequeños mitad del inferior menos luz RV.'
from public.cot_tipos_mueble t
where t.id=r.tipo_mueble_id
  and t.pref ~ '^DB-2S-SMG?(-FE)?(-SF)?$'
  and r.variable in ('espacio_gola','alto_frente_grande','alto_frente_pequeno');

insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id,v.variable,'true',v.valor,1,true,
  'DB 2S SM/SMG: dos golas de 30 mm y luz RV en cada frente pequeño.'
from public.cot_tipos_mueble t
cross join (values
  ('espacio_gola','30/25.4'),
  ('alto_frente_grande','(A-2*espacio_gola)/2'),
  ('alto_frente_pequeno','alto_frente_grande/2-RV')
) as v(variable,valor)
where t.pref ~ '^DB-2S-SMG?(-FE)?(-SF)?$'
  and not exists(select 1 from public.cot_reglas_config r where r.tipo_mueble_id=t.id and r.variable=v.variable);

update public.cot_piezas_plantilla p
set formula_ancho = case p.nombre
      when 'frente_gaveta_grande' then 'alto_frente_grande'
      else 'alto_frente_pequeno' end,
    notas = 'Frente DB 2S SM/SMG: grande=(A-60 mm)/2; cada pequeño=grande/2-RV.'
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref ~ '^DB-2S-SMG?(-FE)?(-SF)?$'
  and p.nombre in ('frente_gaveta_grande','frente_gaveta_pequena');

commit;
