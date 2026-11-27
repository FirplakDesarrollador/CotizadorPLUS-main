-- Restablece el contrato de agrupación de 0113 para la tapa del locero.
do $$
declare
  changed integer;
begin
  update public.cot_piezas_plantilla p
  set modo_agrupacion = 'continua',
      updated_at = now()
  from public.cot_tipos_mueble t
  where t.id = p.tipo_mueble_id
    and t.pref = 'W-SM-LOC'
    and p.nombre = 'tapa'
    and p.modo_agrupacion = 'lateral_compartido'
    and p.formula_cantidad = '1'
    and p.clave_fusion = 'tapa'
    and p.formula_largo_grupo = 'LG-(2*TC)';

  get diagnostics changed = row_count;
  if changed > 1 or (
    select count(*)
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'W-SM-LOC'
      and p.nombre = 'tapa'
  ) <> 1 or not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'W-SM-LOC'
      and p.nombre = 'tapa'
      and p.modo_agrupacion = 'continua'
      and p.formula_cantidad = '1'
      and p.clave_fusion = 'tapa'
      and p.formula_largo_grupo = 'LG-(2*TC)'
  ) then
    raise exception 'La tapa W-SM-LOC no coincide con el contrato de agrupación';
  end if;
end $$;
