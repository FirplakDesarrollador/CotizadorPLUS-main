import assert from 'node:assert/strict';
import test from 'node:test';

// `createClient()` devuelve el cliente con la sesión del usuario dentro de un
// request de Next, y uno elevado con la clave de servicio fuera de él. Lo segundo
// **ignora RLS**, así que importa que no se llegue ahí por accidente ni se
// degrade en silencio.
//
// Estos tests corren fuera de Next, donde `cookies()` lanza, de modo que ejercen
// precisamente la rama elevada. Lo que no se puede cubrir por esta vía es el otro
// lado del arreglo —que un fallo de `createServerClient` se propague en lugar de
// caer a la rama elevada—, porque exigiría un request de Next real: ahí la
// garantía es estructural, el `try` envuelve solo la lectura de cookies.

const ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

// El módulo lee el entorno al cargarse, así que se prepara antes de importarlo y
// cada caso recibe su propia instancia.
async function cargar(serviceKey: string | undefined, caso: string) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proyecto.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  if (serviceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  const mod = await import(`../src/lib/supabase/server.ts?caso=${caso}`);
  return mod.createClient as () => Promise<unknown>;
}

function conEntornoRestaurado(fn: () => Promise<void>) {
  const previo = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  return fn().finally(() => {
    for (const k of ENV) {
      if (previo[k] === undefined) delete process.env[k];
      else process.env[k] = previo[k];
    }
  });
}

test('sin clave de servicio no cae a la anónima: lanza nombrando la variable', () => conEntornoRestaurado(async () => {
  const createClient = await cargar(undefined, 'sin-clave');
  await assert.rejects(createClient(), (e: unknown) => {
    const msg = String((e as Error).message);
    assert.match(msg, /SUPABASE_SERVICE_ROLE_KEY/, `el error debe nombrar la variable: ${msg}`);
    return true;
  });
}));

test('con clave de servicio construye el cliente elevado', () => conEntornoRestaurado(async () => {
  const createClient = await cargar('service-key', 'con-clave');
  const cliente = await createClient();
  assert.equal(typeof cliente, 'object');
  assert.ok(cliente, 'debe devolver un cliente');
  assert.equal(typeof (cliente as { from?: unknown }).from, 'function', 'debe ser un cliente de Supabase');
}));
