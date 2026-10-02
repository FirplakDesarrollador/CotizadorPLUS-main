import fs from 'node:fs';
import {calcularMueble} from '../src/lib/engine.ts';
const dir='outputs/query-210/';
const source=JSON.parse(fs.readFileSync(dir+'source.json','utf8'));
const db=JSON.parse(fs.readFileSync(dir+'catalogo.json','utf8'));
const types=db.cot_tipos_mueble.filter((t    )=>t.activo);
const byPref=Object.fromEntries(types.map((t    )=>[t.pref,t]));
const clean=(s       )=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function classify(s    ){
 let c=s.code,f=s.family;
 // Material thickness, project locations and handing are not new cabinet structures.
 const sm=/SMG?|GOAL/.test(c.slice(f.split('-')[0].length));
 const fe=/(?:-|\s)FE(?:-|\s|$)/.test(c),push=/PUSH/.test(c),shk=/SHK/.test(c),mbb=/MBB/.test(c);
 let mods=[];
 if(/^(KF|BK)$/.test(f)){const sub=c.match(/^(?:KF|BK)-([A-Z]+)/)?.[1];if(sub)mods.push(sub);}
 if(f==='USVFD'&&/\bNR/.test(c))mods.push('NR');
 if(/D\d/.test(c)&&['WBL','BBLFD'].includes(f))mods.push('D-L/R');
 if(/RS/.test(c))mods.push('RS');
 if(/MO/.test(c)&&f==='OW')mods.push('MO');
 if(/(?:-|\s)LOC(?:-|\s|$)/.test(c))mods.push('LOC');
 if(/ZR/.test(c))mods.push('ZR');
 if(/GC/.test(c))mods.push('GC');
 if(/-B(?:\s|$)/.test(c))mods.push('B');
 if(/POD/.test(c)&&f!=='POD')mods.push('POD');
 if(/RNG/.test(c))mods.push('RNG');
 if(/INT/.test(c))mods.push('INT');
 if(/HOOD/.test(c))mods.push('HOOD');
 if(/SK/.test(c)&&!shk)mods.push('SK');
 if(/-F9/.test(c))mods.push('F9');
 if(sm&&!/^(KF|BK)$/.test(f))mods.push(/SMG/.test(c)?'SMG':'SM');if(fe)mods.push('FE');if(push)mods.push('PUSH');if(mbb)mods.push('MBB');if(shk)mods.push('SHK');
 return [f,...mods].join('-');
}
function category(name       ){
 let n=clean(name).replace(/_/g,' ');
 if(/BLIND/.test(n))return 'blind';
 if(/CONTRAP|PARCHE/.test(n))return 'contraparche';
 if(/SHELF|SHLEF|SHEFL|ENTREPANO/.test(n))return 'entrepano';
 if(/GOLA/.test(n))return 'gola';
 if(/GAV|CAJON|POD21/.test(n)){
  if(/FRENTE/.test(n))return 'frente_gaveta';
  if(/TRAS|TRA |TRASERO/.test(n))return 'trasero_gaveta';
  if(/LAT/.test(n))return 'lateral_gaveta';
  if(/FONDO|BASE|PIEZA/.test(n))return 'base_gaveta';
 }
 if(/RAIL|RIEL|REFUERZO|^REF\b|^REF /.test(n))return /TRAS|TRA\b/.test(n)?'ref_tras':'ref_del';
 if(/DOOR|PUERTA|FRENTE|FRONT OVEN/.test(n))return 'frente';
 if(/BACK|FONDO/.test(n))return 'fondo';
 if(/SIDE|LATERAL|^LAT /.test(n))return 'lateral';
 if(/BASE|TAPA/.test(n))return 'base_tapa';
 if(/PANEL/.test(n))return 'panel';
 if(/FILLER/.test(n))return 'filler';
 if(/ZOCALO|TOE/.test(n))return 'zocalo';
 return n;
}
const mode=(xs         ,fallback       )=>xs.length?xs.sort((a,b)=>xs.filter(x=>x===b).length-xs.filter(x=>x===a).length)[0]:fallback;
function mapType(s    ){
 let f=s.family,key=s.typology, note='';let overrides    ={};let modeFrentes='normal';
 let target=key.replace('-NR','').replace('-F9','').replace('SMG','SM');
 if(key.includes('SMG'))note='SMG se contrasta con SM; no existe prefijo SMG independiente';
 if(['BMW','BOMH'].includes(f))target=target.replace(f,f+'-1');
 if(f==='KF'){
  target=key.slice(3);modeFrentes='solo_frentes';note='Kit de frentes mediante modo solo_frentes de '+target;
 }
 if(f==='OUVFD'){target='UVFD';modeFrentes='sin_frentes';note='Carcasa UVFD mediante modo sin_frentes; sin imponer los entrepaños de Query';}
 if(f==='ODB'){target='DB';modeFrentes='sin_frentes';overrides={n_cajones:2,n_cajones_pequenos:0,n_cajones_ocultos:0,gola:1};note='DB sin frentes con opción gola; equivalencia configurable';}
 if(f.startsWith('DB-')){
   const part=f.slice(3);const small=part.includes('S')?Number(part[0]):0;
   overrides={n_cajones:small?3:Number(part),n_cajones_pequenos:small,n_cajones_ocultos:0,n_barras:small?3-small:part==='2'?2:0};
   if(!byPref[target]&&!/SM|FE|INT|RNG/.test(key))target='DB';
 }
 if(['USVFDR','UBFDR','UBR'].includes(f)){target=f.slice(0,-1);overrides.removible=1;note='R corresponde a opción removible';}
 if(byPref[target])return {type:byPref[target],overrides,modeFrentes,note};
 // SM/PUSH may be available as transversal options, without a dedicated template.
 if(byPref[f]&&/^(?:-(?:SMG?|PUSH))*$/.test(key.slice(f.length))&&!['KF','BK'].includes(f)){
  if(key.includes('SM'))overrides.gola=1;
  return {type:byPref[f],overrides,modeFrentes,note:'Variante aplicada sobre plantilla '+f};
 }
 return {type:null,overrides,modeFrentes,note:'Sin plantilla equivalente verificada'};
}
for(const s of source){s.typology=classify(s);}
// Collapse repeated descriptions of the same commercial code; retain first (latest CSV order).
const unique=[...new Map(source.slice().reverse().map((s    )=>[s.code,s])).values()].sort((a    ,b    )=>a.piezas[0].row-b.piezas[0].row);
function run(s    ){
 const mapping=mapType(s);const result    ={...s,mapping:{pref:mapping.type?.pref??null,note:mapping.note},rawCount:s.piezas.length+s.duplicates.length,queryCount:s.piezas.length,queryShelves:s.piezas.filter((p    )=>category(p.pieza)==='entrepano').length};
 if(!mapping.type){result.status='sin_equivalencia';return result;}
 const t=mapping.type;const pieces=db.cot_piezas_plantilla.filter((p    )=>p.tipo_mueble_id===t.id);
 const dims    ={...s.dims};let inferred=[];
 for(const k of ['L','A','P'])if(!dims[k]){
  let candidate=0;
  if(k==='A')candidate=mode(s.piezas.filter((p    )=>category(p.pieza)==='lateral').map((p    )=>p.largo),0);
  if(k==='P')candidate=mode(s.piezas.filter((p    )=>category(p.pieza)==='lateral').map((p    )=>p.ancho),0);
  if(['PN','F','TK','R'].includes(s.family)){candidate=k==='L'?s.piezas[0].largo:k==='A'?s.piezas[0].ancho:18;}
  if(s.family==='KF'&&k==='P'){candidate=304.8;inferred.push('P auxiliar: no interviene en los frentes');}
  if(s.code==='POD29 3/414 3/814'&&k==='P'){candidate=355.6;inferred.push('P=14 pulgadas del SKU');}
  if(candidate){dims[k]=candidate;inferred.push(k+': pieza');}
 }
 result.dimsUsed=dims;result.inferred=inferred;
 if(['L','A','P'].some(k=>!dims[k])){result.status='dimensiones_incompletas';return result;}
 const cx=mode(s.piezas.filter((p    )=>['lateral','base_tapa'].includes(category(p.pieza))).map((p    )=>p.esp).filter(Boolean),15);
 const fx=mode(s.piezas.filter((p    )=>category(p.pieza).startsWith('frente')).map((p    )=>p.esp).filter(Boolean),18);
 const bx=mode(s.piezas.filter((p    )=>category(p.pieza)==='fondo').map((p    )=>p.esp).filter(Boolean),6);
 const overrides    ={...mapping.overrides};
 if(/D-L\/R/.test(s.typology)){
  const m=s.code.match(/\bD(\d+)(?:\s+(\d+)\/(\d+))?/);if(m)overrides.door=Number(m[1])+(m[2]?Number(m[2])/Number(m[3]):0);
  overrides.mano_derecha=/-R\b/.test(s.code)?1:0;
 }
 if(['UDB','UDV','DV'].includes(s.family)){
  const m=s.code.match(/-(\d+)(S)?/);if(m){const n=Number(m[1]);Object.assign(overrides,{n_cajones:m[2]?3:n,n_cajones_pequenos:m[2]?n:0,n_cajones_ocultos:0});}
 }
 try{
 const r=calcularMueble({dims:Object.fromEntries(Object.entries(dims).map(([k,v])=>[k,Number(v)/25.4]))       ,piezas:pieces,reglas:db.cot_reglas_config.filter((r    )=>r.activo&&(!r.tipo_mueble_id||r.tipo_mueble_id===t.id)),preset:{caja:'c',frente:'f',fondo:'b',refuerzo:'c'},tablerosByCode:{c:{codigo:'c',precio_m2:0,espesor_mm:cx},f:{codigo:'f',precio_m2:0,espesor_mm:fx},b:{codigo:'b',precio_m2:0,espesor_mm:bx}},cantosByCalibre:Object.fromEntries(['19X0,45','19X1','22X0,45','22X1'].map(c=>[c,{calibre:c,precio:0}])),herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,margen:0,trm:1,desperdicio:0,overrides,modoFrentes:mapping.modeFrentes       });
 result.vars=r.vars;result.appPieces=r.piezas.filter(p=>p.cant>0&&p.rol&&p.largoIn>0&&p.anchoIn>0);
 result.appCount=result.appPieces.reduce((n       ,p    )=>n+p.cant,0);
 result.appShelves=result.appPieces.filter((p    )=>category(p.pieza)==='entrepano').reduce((n       ,p    )=>n+p.cant,0);
 const actual      =[];for(const p of result.appPieces)for(let i=0;i<p.cant;i++)actual.push({...p,category:category(p.pieza),l:p.largoIn*25.4,a:p.anchoIn*25.4});
 const diffs=[];const matches=[];const unmatched=[];
 for(const p of s.piezas){
  const cat=category(p.pieza);const candidates=actual.map((a,i)=>({a,i,direct:Math.abs(a.l-p.largo)+Math.abs(a.a-p.ancho),swap:Math.abs(a.a-p.largo)+Math.abs(a.l-p.ancho)})).filter(x=>x.a.category===cat || (['F','TK','R'].includes(s.family)&&x.a.category==='panel') || (s.family==='DFE'&&cat==='lateral_gaveta'&&x.a.category==='lateral') || (cat==='frente_gaveta'&&x.a.category==='frente'&&r.vars.n_puertas===0));
  const edgeScore=(x    )=>{const swapped=x.swap+.05<x.direct;return Math.abs((swapped?x.a.cantoAnchos:x.a.cantoLargos)-p.cl-p.bl)+Math.abs((swapped?x.a.cantoLargos:x.a.cantoAnchos)-p.ca-p.ba);};
  candidates.sort((a,b)=>{const diff=Math.min(a.direct,a.swap)-Math.min(b.direct,b.swap);return Math.abs(diff)>.1?diff:edgeScore(a)-edgeScore(b);});
  if(!candidates.length){unmatched.push(p.pieza);continue;}
  const b=candidates[0],a=b.a;actual.splice(b.i,1);const swap=b.swap+0.05<b.direct;
  const edges=[p.cl+p.bl,p.ca+p.ba],appEdges=swap?[a.cantoAnchos,a.cantoLargos]:[a.cantoLargos,a.cantoAnchos];
  const cal=a.cantoCalibre?Number(a.cantoCalibre.split('x').at(-1).replace(',','.')):0;
  const diff=edges.some((v,i)=>v!==appEdges[i])||(edges[0]+edges[1]>0&&Math.abs(p.canto-cal)>.001);
  const match={query:p.pieza,app:a.pieza,queryRow:p.row,edges,appEdges,calQuery:p.canto,calApp:cal,swap,dimensionDistance:Math.min(b.direct,b.swap),white:[p.bl,p.ba]};matches.push(match);if(diff)diffs.push(match);
 }
 result.edgeDiffs=diffs;result.matches=matches;result.unmatchedQuery=unmatched;result.unmatchedApp=actual.map(a=>a.pieza);
 result.countEqual=result.queryCount===result.appCount;result.shelvesEqual=result.queryShelves===result.appShelves;
 result.status='evaluado';
 }catch(e    ){result.status='error_evaluacion';result.error=e.message;}
 return result;
}
const results=unique.map(run);
const groups    ={};for(const r of results)(groups[r.typology]??=[]).push(r);
const samples      =[];
for(const list of Object.values(groups)           ){
 // Take latest first, then diversify dimensions and shelf counts before filling to five.
 const selected      =[];const signatures=new Set();
 for(const r of list){const sig=[r.dimsUsed?.A??r.dims.A,r.queryShelves,r.queryCount,r.mapping.pref].join('|');if(!signatures.has(sig)&&selected.length<5){selected.push(r);signatures.add(sig);}}
 for(const r of list)if(selected.length<5&&!selected.includes(r))selected.push(r);
 for(const r of selected){r.selected=true;samples.push(r);}
}
const coverage=Object.entries(groups).map(([typology,list]    )=>({typology,available:list.length,sampled:Math.min(5,list.length),mapped:[...new Set(list.map((r    )=>r.mapping.pref).filter(Boolean))],examples:list.slice(0,5).map((r    )=>r.code)}));
fs.writeFileSync(dir+'results.json',JSON.stringify({date:db.date,coverage,results,samples},null,2));
console.log(JSON.stringify({unique:unique.length,typologies:coverage.length,sampled:samples.length,statuses:Object.fromEntries([...new Set(samples.map(r=>r.status))].map(s=>[s,samples.filter(r=>r.status===s).length])),coverage},null,2));


