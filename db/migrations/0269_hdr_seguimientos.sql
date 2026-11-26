create table public.hdr_seguimientos (
  cotizacion_id uuid primary key,
  codigo text,
  proyecto text not null,
  entradas jsonb not null check (jsonb_typeof(entradas) = 'array'),
  responsables jsonb not null check (jsonb_typeof(responsables) = 'array' and jsonb_array_length(responsables) = 4),
  marcas jsonb not null check (jsonb_typeof(marcas) = 'array' and jsonb_array_length(marcas) = jsonb_array_length(entradas)),
  total integer not null check (total > 0),
  completadas integer not null check (completadas between 0 and total),
  revision integer not null default 1 check (revision > 0),
  actualizado_en timestamptz not null default now()
);

create index hdr_seguimientos_recientes_idx on public.hdr_seguimientos (actualizado_en desc, cotizacion_id);

alter table public.hdr_seguimientos enable row level security;
revoke all on public.hdr_seguimientos from anon, authenticated;
grant select, insert on public.hdr_seguimientos to authenticated;
grant update (responsables, marcas, completadas, revision, actualizado_en) on public.hdr_seguimientos to authenticated;

create policy hdr_seguimientos_select on public.hdr_seguimientos
  for select to authenticated using ((select public.cot_is_admin()));
create policy hdr_seguimientos_insert on public.hdr_seguimientos
  for insert to authenticated with check (
    (select public.cot_is_admin()) and exists (
      select 1 from public.cot_cotizaciones c where c.id = cotizacion_id
    )
  );
create policy hdr_seguimientos_update on public.hdr_seguimientos
  for update to authenticated using ((select public.cot_is_admin()))
  with check ((select public.cot_is_admin()));
