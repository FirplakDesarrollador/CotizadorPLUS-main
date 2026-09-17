import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function getUserAndRole() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  let rol = 'vendedor';
  if (user) {
    const { data: perfil } = await sb.from('cot_perfiles').select('rol').eq('user_id', user.id).single();
    if (perfil?.rol) rol = perfil.rol;
  }
  return { user, rol };
}
