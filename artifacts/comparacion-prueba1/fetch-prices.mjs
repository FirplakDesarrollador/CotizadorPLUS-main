import fs from 'node:fs';
const dir='artifacts/comparacion-precios-cema2309';fs.mkdirSync(dir,{recursive:true});
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).map(l=>l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map(m=>[m[1],m[2].replace(/^['"]|['"]$/g,'')]));
const db={consultado:new Date().toISOString()};
for(const table of ['cot_tableros','cot_cantos','cot_herrajes']){
 db[table]=[];
 for(let offset=0;;offset+=1000){const response=await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`}});if(!response.ok)throw Error(`${table}: ${response.status}`);const rows=await response.json();db[table].push(...rows);if(rows.length<1000)break;}
}
fs.writeFileSync(`${dir}/catalogos.json`,JSON.stringify(db,null,2));
console.log(JSON.stringify({consultado:db.consultado,tableros:db.cot_tableros.length,cantos:db.cot_cantos.length,herrajes:db.cot_herrajes},null,2));
