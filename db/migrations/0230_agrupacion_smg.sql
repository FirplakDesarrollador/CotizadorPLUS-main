-- Habilita las carcasas SMG reconstruidas sin alterar geometría ni herrajes.
-- Reutiliza las reglas físicas existentes: n+1 laterales, estructura continua,
-- refuerzo frontal opcional y frentes/entrepaños locales.
begin;

update public.cot_tipos_mueble
set permite_agrupacion=true, updated_at=now()
where pref in ('BFD-SMG','BFD-SMG-SF','SBFD-SMG','SBFD-SMG-SF');

update public.cot_piezas_plantilla p
set modo_agrupacion = case
      when p.nombre='lateral' then 'lateral_compartido'
      when p.nombre='refuerzo_delantero' then 'continua_opcional'
      else 'continua' end,
    clave_fusion = case
      when p.nombre='lateral' then null
      when p.nombre='refuerzo_delantero' then 'refuerzo_frontal'
      else p.nombre end,
    formula_largo_grupo = case
      when p.nombre='lateral' then null
      when p.nombre='fondo' then 'LG-TC'
      else 'LG-(2*TC)' end
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id
  and t.pref in ('BFD-SMG','BFD-SMG-SF','SBFD-SMG','SBFD-SMG-SF')
  and p.nombre in ('lateral','base','refuerzo_delantero','refuerzo_trasero','fondo');

commit;
