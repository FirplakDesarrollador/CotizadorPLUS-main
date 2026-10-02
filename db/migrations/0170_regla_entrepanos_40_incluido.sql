-- A partir de 40 pulgadas corresponden tres entrepaños.
update public.cot_reglas_config
set condicion='A < 40',
    notas=replace(notas,'hasta 40','menor de 40'),
    updated_at=now()
where variable='n_entrepanos'
  and condicion='A <= 40'
  and activo=true;
