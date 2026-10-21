#!/usr/bin/env node
// Aplica y registra una migracion SQL usando la Management API de Supabase.
// Uso: node scripts/apply-migration.mjs <nombre> <archivo.sql>
import fs from 'node:fs';
import path from 'node:path';

for (const filename of ['.env.local', '.env']) {
  const envPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const [name, filename] = process.argv.slice(2);
const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!name || !filename) throw new Error('Indica el nombre y el archivo de migracion.');
if (!ref || !token || !appUrl) throw new Error('Falta la configuracion administrativa de Supabase.');
if (new URL(appUrl).hostname !== `${ref}.supabase.co`) {
  throw new Error('SUPABASE_PROJECT_REF no coincide con NEXT_PUBLIC_SUPABASE_URL.');
}

const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/migrations`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const listing = await fetch(endpoint, { headers });
if (!listing.ok) throw new Error(`No se pudo consultar el historial (${listing.status}): ${await listing.text()}`);

const migrations = await listing.json();
if (migrations.some((migration) => migration.name === name)) {
  console.log(`La migracion ${name} ya estaba registrada; no se reaplico.`);
} else {
  const query = fs.readFileSync(path.resolve(filename), 'utf8');
  const result = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, query }),
  });
  if (!result.ok) throw new Error(`La migracion fallo (${result.status}): ${await result.text()}`);
  console.log(`Migracion ${name} aplicada y registrada correctamente.`);
}
