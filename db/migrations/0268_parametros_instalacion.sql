insert into public.cot_parametros (key, value, descripcion)
values ('instalacion', '{"miami":{},"fueraMiami":{},"texas":{}}'::jsonb, 'Tarifas unitarias de instalación en USD por zona')
on conflict (key) do nothing;
