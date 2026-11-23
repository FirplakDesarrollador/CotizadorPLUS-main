import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8');

test('la migración permite que cada usuario guarde solo su propio nombre', () => {
  const sql = read('db', 'migrations', '0207_nombre_usuario_cotizaciones.sql');
  assert.match(sql, /if auth\.uid\(\) is null/i);
  assert.match(sql, /insert into public\.cot_perfiles\(user_id, nombre\)/i);
  assert.match(sql, /values \(auth\.uid\(\), v_nombre\)/i);
  assert.match(sql, /on conflict \(user_id\) do update/i);
  assert.match(sql, /char_length\(v_nombre\) > 80/i);
});

test('el ingreso exige nombre y lo persiste después de autenticar', () => {
  const login = read('src', 'app', 'login', 'page.tsx');
  assert.match(login, /placeholder="Tu nombre"/);
  assert.match(login, /maxLength=\{80\}/);
  assert.match(login, /signInWithPassword[\s\S]*cot_guardar_nombre_usuario/);
});

test('el listado muestra el nombre del autor en Cotizado por', () => {
  const page = read('src', 'app', 'cotizaciones', 'page.tsx');
  const service = read('src', 'lib', 'cotizaciones.ts');
  assert.match(page, />Cotizado por</);
  assert.match(page, /c\.cotizado_por_usuario/);
  assert.match(service, /cot_nombres_usuarios/);
  assert.match(service, /creado_por/);
});

test('el menú de usuario muestra el nombre arriba del correo', () => {
  const header = read('src', 'components', 'AppHeader.tsx');
  const auth = read('src', 'lib', 'auth.ts');
  const nombrePosition = header.indexOf("{nombre || 'Usuario'}");
  const emailPosition = header.indexOf("{email || 'Sin correo'}");
  assert.ok(nombrePosition >= 0);
  assert.ok(emailPosition > nombrePosition);
  assert.match(auth, /select\('rol,nombre'\)/);
  assert.match(auth, /return \{ user, rol, nombre \}/);
});
