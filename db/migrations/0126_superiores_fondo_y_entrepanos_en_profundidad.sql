-- Orden fisico posterior para las familias superiores indicadas:
-- frente -> entrepano -> fondo -> refuerzo trasero.
-- Solo modifica metadatos de visualizacion; no altera cortes, cantidades o costos.

do $$
declare
  v_prefs constant text[] := array[
    'W', 'WLD', 'W-SM', 'W-SM-PUSH', 'WSM', 'OW',
    'TW', 'TW-SM-PUSH', 'UW', 'OW-MO', 'W-SM-LOC'
  ];
begin
  update public.cot_piezas_plantilla p
  set visualizacion = coalesce(p.visualizacion, '{}'::jsonb) || jsonb_build_object(
        'version', 1, 'funcion', 'respaldo', 'plano', 'XZ',
        'y', 'P-TC-TB', 'confirmado', true,
        'nota', 'Fondo delante de los refuerzos traseros.'
      ),
      updated_at = now()
  from public.cot_tipos_mueble t
  where p.tipo_mueble_id = t.id
    and t.pref = any(v_prefs)
    and p.nombre = 'fondo';

  update public.cot_piezas_plantilla p
  set visualizacion = coalesce(p.visualizacion, '{}'::jsonb) || jsonb_build_object(
        'version', 1, 'funcion', 'estante', 'plano', 'XY',
        'y', 'P-TC-TB-D', 'confirmado', true,
        'nota', 'Entrepano delante del fondo; su borde posterior termina en la cara frontal del fondo.'
      ),
      updated_at = now()
  from public.cot_tipos_mueble t
  where p.tipo_mueble_id = t.id
    and t.pref = any(v_prefs)
    and p.nombre in ('entrepano', 'entrepano_superior', 'shelf', 'shlef');

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = any(v_prefs) and p.nombre = 'fondo'
      and p.visualizacion->>'y' is distinct from 'P-TC-TB'
  ) then
    raise exception 'No todos los fondos superiores quedaron delante de los refuerzos traseros';
  end if;

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = any(v_prefs)
      and p.nombre in ('entrepano', 'entrepano_superior', 'shelf', 'shlef')
      and p.visualizacion->>'y' is distinct from 'P-TC-TB-D'
  ) then
    raise exception 'No todos los entrepanos superiores quedaron delante del fondo';
  end if;
end $$;

