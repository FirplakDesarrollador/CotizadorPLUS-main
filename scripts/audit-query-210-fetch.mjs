import fs from 'node:fs';
for (const line of fs.readFileSync(fs.existsSync('.env.local')?'.env.local':'.env','utf8').split(/\r?\n/)) {
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
}
const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const snapshot={date:new Date().toISOString()};
for(const table of ['cot_tipos_mueble','cot_piezas_plantilla','cot_reglas_config']){
 const rows=[];
 for(let offset=0;;offset+=1000){
  const r=await fetch(`${base}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!r.ok)throw Error(`${table}: ${r.status}`);
  const batch=await r.json();rows.push(...batch);if(batch.length<1000)break;
 }
 snapshot[table]=rows;
}
fs.mkdirSync('outputs/query-210',{recursive:true});
fs.writeFileSync('outputs/query-210/catalogo.json',JSON.stringify(snapshot,null,2));
console.log(Object.fromEntries(Object.entries(snapshot).map(([k,v])=>[k,Array.isArray(v)?v.length:v])));
