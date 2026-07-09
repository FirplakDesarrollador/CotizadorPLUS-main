import { createBrowserClient } from '@supabase/ssr';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente Supabase para componentes de cliente.
export function createClient() {
  return createBrowserClient(URL, KEY);
}
