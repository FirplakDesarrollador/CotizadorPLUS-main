// Apply the reviewed mounting migration to the project's configured Supabase.
// Credentials stay in process memory. Uses the documented migration endpoint.
import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/)
  .map(l=>l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2].replace(/^['"]|['"]$/g,'')]));
const ref=env.SUPABASE_PROJECT_REF;
if(!ref || !env.SUPABASE_ACCESS_TOKEN) throw new Error('Missing Supabase management configuration');
if(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname!==`${ref}.supabase.co`) throw new Error('Project reference does not match application URL');
const headers={Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'};
const name='visualizacion_montaje';
const endpoint=`https://api.supabase.com/v1/projects/${ref}/database/migrations`;
const listing=await fetch(endpoint,{headers});
if(!listing.ok) throw new Error(`Cannot inspect migration history: ${listing.status}`);
const migrations=await listing.json();
if(migrations.some(m=>m.name===name)) console.log('Mounting migration already recorded; no changes.');
else {
  const query=fs.readFileSync('db/migrations/0031_visualizacion_montaje.sql','utf8');
  const result=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({name,query})});
  if(!result.ok) throw new Error(`Migration failed (${result.status}): ${await result.text()}`);
  console.log(`Migration applied to configured project ${ref}.`);
}
