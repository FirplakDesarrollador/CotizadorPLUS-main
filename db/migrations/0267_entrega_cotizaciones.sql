alter table public.cot_cotizaciones add column if not exists entrega jsonb;

insert into public.cot_parametros (key, value, descripcion)
values ('ddp', '{"tableroPct":0,"herrajesPct":0}'::jsonb, 'Porcentajes DDP sobre precios de venta')
on conflict (key) do nothing;
