import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ServerClient = ReturnType<typeof createServerClient>;

// Cliente sin request scope, para scripts, CLI y workers. Usa la clave de
// servicio, que **ignora RLS**, de modo que solo debe construirse cuando no hay
// sesión de usuario que respetar.
//
// Si la clave no está configurada se lanza en vez de caer a la anónima: un
// cliente anónimo silencioso convierte un problema de configuración en fallos de
// RLS difusos, mucho más adelante y lejos de la causa.
function createElevatedClient(): ServerClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY. Se llamó a createClient() fuera de un request de '
      + 'Next, donde no hay sesión de usuario, y no hay clave de servicio con la que operar.',
    );
  }
  return createSupabaseClient(URL, serviceKey) as unknown as ServerClient;
}

// Cliente Supabase para Server Components y Server Actions: lleva la sesión del
// usuario y respeta RLS.
//
// Fuera de un request de Next, `cookies()` lanza y no hay sesión que llevar; en
// ese caso se devuelve el cliente elevado. El `try` envuelve **solo** la lectura
// de cookies, que es la condición que se quiere detectar: si lo que falla es
// `createServerClient`, el error se propaga en lugar de degradar la llamada a un
// cliente que no aplica RLS.
export async function createClient(): Promise<ServerClient> {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    return createElevatedClient();
  }

  return createServerClient(URL, KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: ignorar (el middleware refresca la sesión).
        }
      },
    },
  });
}
