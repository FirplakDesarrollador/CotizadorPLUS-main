-- ============================================================================
-- Cotizador PLUS — Lista blanca de admins + auto-asignación de rol
--  - cot_admin_emails: correos que serán admin.
--  - Trigger en auth.users: al crear usuario, crea su cot_perfiles (admin si está
--    en la lista, si no vendedor). No bloquea el signup ante errores.
--  - Backfill de usuarios existentes.
-- ============================================================================

create table if not exists public.cot_admin_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);

insert into public.cot_admin_emails (email) values
  ('andres.saldarriaga@firplak.com'),
  ('maria.salazar@firplak.com'),
  ('kevin.castro@firplak.com'),
  ('brillitt.baquero@firplak.com'),
  ('especialistadiseno@firplak.com'),
  ('alejandro.isaza@firplak.com')
on conflict (email) do nothing;

-- RLS: solo admin gestiona la lista; autenticados pueden leerla.
alter table public.cot_admin_emails enable row level security;
drop policy if exists cot_admin_emails_sel on public.cot_admin_emails;
drop policy if exists cot_admin_emails_all on public.cot_admin_emails;
create policy cot_admin_emails_sel on public.cot_admin_emails for select using (public.cot_is_authenticated());
create policy cot_admin_emails_all on public.cot_admin_emails for all using (public.cot_is_admin()) with check (public.cot_is_admin());

-- Función de alta: crea/actualiza perfil según lista blanca.
create or replace function public.cot_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare es_admin boolean;
begin
  select exists (select 1 from public.cot_admin_emails a where lower(a.email) = lower(new.email)) into es_admin;
  insert into public.cot_perfiles (user_id, rol, nombre)
  values (new.id, case when es_admin then 'admin' else 'vendedor' end, new.email)
  on conflict (user_id) do update set rol = excluded.rol;
  return new;
exception when others then
  return new; -- nunca bloquear el signup de la app existente
end $$;

drop trigger if exists trg_cot_handle_new_user on auth.users;
create trigger trg_cot_handle_new_user
  after insert on auth.users
  for each row execute function public.cot_handle_new_user();

-- Backfill: perfiles para usuarios existentes (rol según lista blanca).
insert into public.cot_perfiles (user_id, rol, nombre)
select u.id,
       case when exists (select 1 from public.cot_admin_emails a where lower(a.email)=lower(u.email)) then 'admin' else 'vendedor' end,
       u.email
from auth.users u
on conflict (user_id) do update set rol = excluded.rol;
