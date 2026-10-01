import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Cada page.tsx y cada Server Action (uno por archivo en admin/, hdr/, cotizaciones/)
// llama getUserAndRole() por su cuenta, sin compartir resultado entre sí — una sola
// carga de página puede disparar varias llamadas a sb.auth.getUser() en paralelo.
// cache() de React deduplica esas llamadas dentro de la misma request (no entre
// Server Actions separadas, que son invocaciones distintas por diseño), bajando la
// carga sobre el endpoint de Auth de Supabase. Ver WikiLLM/log.md: se detectó una
// ráfaga de 52 "AuthApiError: Request rate limit reached" en ~3s contra el dev server.
export const getUserAndRole = cache(async () => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  let rol = 'vendedor';
  if (user) {
    const { data: perfil } = await sb.from('cot_perfiles').select('rol').eq('user_id', user.id).single();
    if (perfil?.rol) rol = perfil.rol;
  }
  return { user, rol };
});
