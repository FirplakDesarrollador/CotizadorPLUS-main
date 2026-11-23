import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const PROXY_PATH = join(process.cwd(), 'src', 'proxy.ts');
const MIDDLEWARE_PATH = join(process.cwd(), 'src', 'lib', 'supabase', 'middleware.ts');

test('src/proxy.ts delega las solicitudes a updateSession y define matcher excluyendo assets estáticos', () => {
  const source = readFileSync(PROXY_PATH, 'utf-8');
  assert.match(source, /export async function proxy\(/);
  assert.match(source, /updateSession\(request\)/);
  assert.match(source, /_next\/static/);
  assert.match(source, /_next\/image/);
  assert.match(source, /favicon\.ico/);
});

test('middleware de Supabase protege rutas privadas redirigiendo a /login cuando no hay usuario', () => {
  const source = readFileSync(MIDDLEWARE_PATH, 'utf-8');
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /if \(!user && !isAuthRoute && !isPublicAsset\)/);
  assert.match(source, /url\.pathname = '\/login'/);
});

test('middleware exceptúa recuperación de contraseña y callback PKCE de la redirección forzada a /cotizador', () => {
  const source = readFileSync(MIDDLEWARE_PATH, 'utf-8');
  assert.match(source, /\/recuperar-contrasena/);
  assert.match(source, /\/actualizar-contrasena/);
  assert.match(source, /!isPasswordRecoveryRoute && !path\.startsWith\('\/auth\/callback'\)/);
  assert.match(source, /url\.pathname = '\/cotizador'/);
});
