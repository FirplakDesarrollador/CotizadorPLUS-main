-- base_gaveta no pertenece a la regla de bases estructurales de 8 tarugos.
update public.cot_piezas_plantilla
set tarugos=0,
    updated_at=now()
where lower(nombre)='base_gaveta';
