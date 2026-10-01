-- Normaliza el numero de entrepanos por altura en los superiores solicitados.
-- UW conserva su regla exclusiva y no participa en esta actualizacion.

do $$
declare
  v_pref text;
  v_tipo uuid;
begin
  foreach v_pref in array array[
    'W', 'WLD', 'W-SM', 'W-SM-PUSH', 'WSM', 'OW', 'TW', 'TW-SM-PUSH'
  ] loop
    select id into v_tipo
    from public.cot_tipos_mueble
    where pref = v_pref;

    if v_tipo is null then
      raise exception 'No existe la tipologia %', v_pref;
    end if;

    delete from public.cot_reglas_config
    where tipo_mueble_id = v_tipo
      and variable = 'n_entrepanos';

    insert into public.cot_reglas_config (
      tipo_mueble_id, variable, condicion, valor, prioridad, notas
    ) values
      (v_tipo, 'n_entrepanos', 'A <= 17', '0', 10,
       'Superiores: sin entrepanos hasta 17 pulgadas.'),
      (v_tipo, 'n_entrepanos', 'A <= 27', '1', 20,
       'Superiores: un entrepano de 18 a 27 pulgadas.'),
      (v_tipo, 'n_entrepanos', 'A <= 40', '2', 30,
       'Superiores: dos entrepanos de 28 a 40 pulgadas.'),
      (v_tipo, 'n_entrepanos', 'true', '3', 40,
       'Superiores: tres entrepanos por encima de 40 pulgadas.');

    update public.cot_piezas_plantilla
    set formula_cantidad = 'n_entrepanos',
        notas = concat_ws(' | ', nullif(notas, ''),
          '0124: cantidad por altura (0 hasta 17, 1 hasta 27, 2 hasta 40, 3 por encima de 40 pulgadas)'),
        updated_at = now()
    where tipo_mueble_id = v_tipo
      and nombre in ('entrepano', 'shelf', 'shlef');

    if not exists (
      select 1
      from public.cot_piezas_plantilla
      where tipo_mueble_id = v_tipo
        and nombre in ('entrepano', 'shelf', 'shlef')
    ) then
      raise exception 'La tipologia % no tiene plantilla de entrepano', v_pref;
    end if;
  end loop;
end $$;
