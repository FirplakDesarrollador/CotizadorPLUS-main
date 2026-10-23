-- PCFD-MO: PUERTA_SUP define la zona superior; MO es la luz abierta entre los
-- dos entrepaños fijos. Los fijos se fabrican con el tablero de frente.

do $$
declare
  v_mo uuid;
begin
  select id into v_mo
  from public.cot_tipos_mueble
  where upper(pref) = 'PCFD-MO';
  if v_mo is null then raise exception 'No existe PCFD-MO'; end if;

  delete from public.cot_reglas_config
  where tipo_mueble_id = v_mo and variable = 'PUERTA_SUP';
  insert into public.cot_reglas_config(
    tipo_mueble_id, variable, condicion, valor, prioridad, notas
  ) values (
    v_mo, 'PUERTA_SUP', 'true', '(A-zocalo-MO-2*TF)/2', 5,
    'Altura predeterminada de la zona de puertas superiores'
  );

  update public.cot_piezas_plantilla
  set rol_tablero = 'frente',
      updated_at = now()
  where tipo_mueble_id = v_mo and nombre = 'entrepano_fijo';

  update public.cot_piezas_plantilla
  set formula_ancho = 'PUERTA_SUP-RV',
      updated_at = now()
  where tipo_mueble_id = v_mo and nombre = 'puerta_superior';

  update public.cot_piezas_plantilla
  set formula_ancho = 'A-zocalo-PUERTA_SUP-MO-2*TF-RV',
      updated_at = now()
  where tipo_mueble_id = v_mo and nombre = 'puerta_inferior';
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PCFD-MO'
      and p.nombre = 'entrepano_fijo'
      and p.rol_tablero = 'frente'
      and p.formula_cantidad = '2'
  ) then raise exception 'Los entrepaños fijos de PCFD-MO no usan material de frente'; end if;

  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PCFD-MO'
      and p.nombre = 'puerta_superior'
      and p.formula_ancho = 'PUERTA_SUP-RV'
  ) then raise exception 'La puerta superior de PCFD-MO no usa PUERTA_SUP'; end if;

  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where upper(t.pref) = 'PCFD-MO'
      and p.nombre = 'puerta_inferior'
      and p.formula_ancho = 'A-zocalo-PUERTA_SUP-MO-2*TF-RV'
  ) then raise exception 'La puerta inferior de PCFD-MO no respeta MO y los fijos'; end if;
end;
$$;
