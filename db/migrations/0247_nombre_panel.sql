-- Nombre descriptivo uniforme. Los códigos y notas por línea se conservan aparte.
update public.cot_tipos_mueble
set nombre_es = 'Panel'
where pref = 'PN' and nombre_es is distinct from 'Panel';
