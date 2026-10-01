#!/usr/bin/env node
// Ejecuta un archivo .sql (o SQL inline) en el proyecto Supabase via Management API.
// Uso: node scripts/run-sql.mjs db/migrations/0001_schema.sql
//      node scripts/run-sql.mjs --q "select 1"
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

const REF = process.env.SUPABASE_PROJECT_REF;
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
if (!REF || !PAT) { console.error('Falta SUPABASE_PROJECT_REF o SUPABASE_ACCESS_TOKEN en .env.local'); process.exit(1); }

const args = process.argv.slice(2);
let query;
if (args[0] === '--q') query = args.slice(1).join(' ');
else if (args[0]) query = fs.readFileSync(path.resolve(args[0]), 'utf8');
else { console.error('Indica un archivo .sql o --q "<sql>"'); process.exit(1); }

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
const text = await res.text();
if (!res.ok) { console.error(`HTTP ${res.status}\n${text}`); process.exit(1); }
console.log(`HTTP ${res.status}`);
try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch { console.log(text); }
