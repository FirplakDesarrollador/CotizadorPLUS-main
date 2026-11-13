import { normalizarConfig, type ConfigOptimizador } from '@/lib/corte/config';
import type { ListaCorte, TableroInfo } from '@/lib/corte/lista';
import type { PlanDiario } from '@/lib/corte/plan-diario';
import type { CorteDia, PlanCorte } from '@/lib/corte/plan-corte';
import type { ProyectoOptimizador } from './actions';
import { ETIQUETA_GRUPO, resumenPorGrupo } from '@/lib/corte/clasificacion';
// ExcelJS devuelve ext en las imágenes ancladas con dimensiones, pero omite
// ese campo de ImageRange en sus declaraciones públicas.
declare module 'exceljs' { interface ImageRange { ext: { width:number; height:number }; } }

export type SnapshotOptimizador = { version: 1; cotizacionId: string | null; cotizacionCodigo: string | null; proyectoNombre: string; cfg: ConfigOptimizador; texturaPorMaterial: Record<string,string>; tableros: TableroInfo[]; proyecto: ProyectoOptimizador; lista: ListaCorte; planDiario: PlanDiario; planCorte: PlanCorte };
export type GuardadoOptimizador = { id:string; nombre:string; proyecto_nombre:string; cotizacion_id:string|null; autor_id:string; autor_email:string; created_at:string; config:ConfigOptimizador & {texturaPorMaterial:Record<string,string>}; resultado:SnapshotOptimizador };
export type ResumenGuardado = Pick<GuardadoOptimizador,'id'|'nombre'|'proyecto_nombre'|'cotizacion_id'|'autor_id'|'autor_email'|'created_at'> & {laminas:number; desperdicioPct:number; piezas:number};
export const MAX_IMAGENES=150, MAX_BYTES_IMAGENES=6*1024*1024;
// Reserva para el envoltorio de React dentro del límite de 1 MB de Server Actions.
export const MAX_BYTES_GUARDADO=900*1024;
export function validarTamanoGuardado(datos:unknown){if(new TextEncoder().encode(JSON.stringify(datos)).byteLength>MAX_BYTES_GUARDADO)throw new Error('La optimización es demasiado grande para guardarse con el límite de 1 MB. Máximo admitido: 900 KB de datos más el envío. No se guardó parcialmente.');}
const MAX_BYTES_SNAPSHOT=15*1024*1024;
/** Solo comprime el transporte. La BD conserva el JSON completo y legible. */
export async function prepararGuardado<T extends {snapshot:unknown}>(datos:T):Promise<Omit<T,'snapshot'>&{snapshot:unknown}>{
  if(new TextEncoder().encode(JSON.stringify(datos)).byteLength<=MAX_BYTES_GUARDADO)return datos;
  const bytes=new TextEncoder().encode(JSON.stringify(datos.snapshot));
  if(bytes.byteLength>MAX_BYTES_SNAPSHOT)throw new Error('La optimización supera el máximo de 15 MB de información completa.');
  if(typeof CompressionStream==='undefined')throw new Error('Este navegador no permite comprimir la optimización. Usa una versión actual de Chrome o Edge.');
  const comprimido=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binario='';for(let i=0;i<comprimido.length;i+=8192)binario+=String.fromCharCode(...comprimido.subarray(i,i+8192));
  const envio={...datos,snapshot:{transporte:'gzip-base64-v1',contenido:btoa(binario)}};
  try{validarTamanoGuardado(envio);}catch{throw new Error('La optimización sigue superando el límite de 1 MB aun comprimida. No se guardó parcialmente.');}
  return envio;
}
export async function leerSnapshotTransportado(raw:unknown):Promise<unknown>{
  if(!objeto(raw)||!Object.hasOwn(raw,'transporte'))return raw;
  if(raw.transporte!=='gzip-base64-v1'||typeof raw.contenido!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(raw.contenido))throw new Error('Optimización comprimida inválida.');
  if(raw.contenido.length>MAX_BYTES_GUARDADO)throw new Error('La optimización comprimida supera el límite de 1 MB.');
  let chunks:Uint8Array[]=[];let total=0;
  try{
    const bytes=Uint8Array.from(atob(raw.contenido),c=>c.charCodeAt(0));
    const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES_SNAPSHOT){await reader.cancel();throw new Error('La optimización descomprimida supera el máximo de 15 MB.');}chunks.push(value);}
    const completo=new Uint8Array(total);let offset=0;for(const c of chunks){completo.set(c,offset);offset+=c.length;}chunks=[];
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(completo)) as unknown;
  }catch(e){if(e instanceof Error&&e.message.includes('15 MB'))throw e;throw new Error('No se pudo leer la optimización comprimida.');}
}
const objeto=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
function exigir(ok:unknown,mensaje:string):asserts ok {if(!ok)throw new Error(mensaje);}
export function normalizarSnapshot(raw:unknown):SnapshotOptimizador {
  exigir(objeto(raw)&&raw.version===1,'Snapshot no compatible.');
  function finitos(x:unknown,prof=0){exigir(prof<45,'Snapshot demasiado profundo.');if(typeof x==='number')exigir(Number.isFinite(x),'Snapshot contiene un número no finito.');else if(Array.isArray(x))x.forEach(v=>finitos(v,prof+1));else if(objeto(x))Object.values(x).forEach(v=>finitos(v,prof+1));}
  finitos(raw);
  exigir(raw.cotizacionId===null||typeof raw.cotizacionId==='string','Snapshot sin cotización.');
  exigir(typeof raw.proyectoNombre==='string'&&raw.proyectoNombre.trim(),'Snapshot sin proyecto.');
  exigir(objeto(raw.cfg)&&objeto(raw.texturaPorMaterial)&&Object.values(raw.texturaPorMaterial).every(v=>typeof v==='string'),'Snapshot sin configuración o texturas.');
  exigir(Array.isArray(raw.tableros)&&objeto(raw.proyecto)&&Array.isArray(raw.proyecto.modulos)&&Array.isArray(raw.proyecto.errores),'Snapshot sin proyecto completo.');
  exigir(objeto(raw.lista)&&Array.isArray(raw.lista.filas)&&Array.isArray(raw.lista.materiales)&&typeof raw.lista.totalPiezas==='number','Snapshot sin lista completa.');
  exigir(objeto(raw.planDiario)&&Array.isArray(raw.planDiario.dias)&&typeof raw.planDiario.ritmo==='number'&&typeof raw.planDiario.totalPiezas==='number'&&typeof raw.planDiario.diasMinimos==='number','Snapshot sin plan diario.');
  exigir(objeto(raw.planCorte)&&Array.isArray(raw.planCorte.dias)&&objeto(raw.planCorte.proyectoCompleto)&&Array.isArray(raw.planCorte.proyectoCompleto.materiales)&&objeto(raw.planCorte.consolidado)&&Array.isArray(raw.planCorte.porMaterial)&&objeto(raw.planCorte.reparto),'Snapshot sin plan de corte completo.');
  const s=structuredClone(raw) as unknown as SnapshotOptimizador;
  s.cfg=normalizarConfig(s.cfg);
  const numeros=(o:unknown,claves:string[])=>objeto(o)&&claves.every(k=>typeof o[k]==='number'&&Number.isFinite(o[k]));
  const totalesValidos=(t:unknown)=>numeros(t,['laminas','iteraciones','areaLaminasM2','areaPiezasM2','desperdicioPct'])&&objeto(t)&&numeros(t.cortes,['refilado','nivel1','nivel2','nivel3','total']);
  exigir(totalesValidos(s.planCorte.consolidado)&&totalesValidos(s.planCorte.proyectoCompleto),'Snapshot: totales incompletos.');
  exigir(numeros(s.planCorte.reparto,['iteraciones','tablerosInicial','cotaTableros','semilla','evaluaciones','aciertosCache'])&&typeof s.planCorte.reparto.optimo==='boolean','Snapshot: reparto incompleto.');
  for(const m of s.lista.materiales)exigir(typeof m.material==='string'&&typeof m.proveedor==='string'&&typeof m.formatoCodigo==='string'&&numeros(m,['piezas','areaNetaM2'])&&Array.isArray(m.roles)&&Array.isArray(m.alertas)&&['laminasMinimas','laminasMaxDesperdicio','desperdicioMinimoPct','laminasPorPila','espesorMm'].every(k=>Object.hasOwn(m,k)),'Snapshot: resumen por material incompleto.');
  for(const d of s.planDiario.dias){exigir(numeros(d,['dia','piezas','libre'])&&Array.isArray(d.items)&&Array.isArray(d.materiales)&&Array.isArray(d.alertas),'Snapshot: jornada incompleta.');for(const m of d.items)exigir(typeof m.codigo==='string'&&typeof m.cocina==='string'&&typeof m.material==='string'&&numeros(m,['unidades','piezas'])&&typeof m.partido==='boolean','Snapshot: módulo del día inválido.');}
  for(const f of s.lista.filas)exigir(typeof f.material==='string'&&typeof f.pieza==='string'&&[f.largoMm,f.anchoMm,f.cantidad,f.cantoLargos,f.cantoAnchos].every(n=>typeof n==='number'&&n>=0)&&Array.isArray(f.modulos)&&typeof f.calibre==='string','Snapshot: fila de lista inválida.');
  for(const m of s.proyecto.modulos)exigir(typeof m.codigo==='string'&&typeof m.cocina==='string'&&typeof m.cantidad==='number'&&Array.isArray(m.piezas)&&objeto(m.tableroPorRol),'Snapshot: módulo inválido.');
  for(const d of [...s.planCorte.dias,{...s.planCorte.proyectoCompleto,dia:0,totales:s.planCorte.proyectoCompleto,modulos:[],piezas:0}]){
    exigir(Array.isArray(d.materiales)&&Array.isArray(d.sinFormato)&&Array.isArray(d.modulos)&&Number.isInteger(d.dia)&&totalesValidos(d.totales),'Snapshot: día inválido.');
    for(const m of d.materiales){const p=m.esquema?.plan;exigir(typeof m.material==='string'&&objeto(p)&&Array.isArray(p.patrones)&&Array.isArray(p.grupos)&&Array.isArray(p.noCaben)&&Number(p.formato?.largoMm)>0&&Number(p.formato?.anchoMm)>0&&objeto(m.cortes),'Snapshot: material inválido.');for(const patron of p.patrones){exigir(Number.isInteger(patron.repeticiones)&&patron.repeticiones>0&&Array.isArray(patron.colocaciones)&&Array.isArray(patron.sobrantes),'Snapshot: patrón inválido.');for(const c of patron.colocaciones)exigir(typeof c.etiqueta==='string'&&[c.x,c.y,c.largoMm,c.anchoMm,c.grupo].every(n=>typeof n==='number'&&n>=0)&&typeof c.girada==='boolean','Snapshot: colocación inválida.');for(const r of patron.sobrantes)exigir([r.x,r.y,r.largoMm,r.anchoMm].every(n=>typeof n==='number'&&n>=0)&&typeof r.reutilizable==='boolean','Snapshot: sobrante inválido.');}}
  }
  exigir(diasExportables(s).some(d=>d.materiales.some(m=>m.esquema.plan.patrones.length)),'No hay esquemas calculados para guardar.');
  exigir(JSON.stringify(s).length<=15*1024*1024,'Snapshot demasiado grande (máximo 15 MB).');
  return s;
}
export function compararParametros(guardados:unknown,actuales:unknown){
  const a=normalizarConfig(guardados),b=normalizarConfig(actuales);const cambios:Array<{campo:string;antes:unknown;ahora:unknown}>=[];
  function visitar(x:unknown,y:unknown,campo:string){if(JSON.stringify(x)===JSON.stringify(y))return;if((objeto(x)&&objeto(y))||(Array.isArray(x)&&Array.isArray(y))){const xx=x as Record<string,unknown>,yy=y as Record<string,unknown>;for(const k of new Set([...Object.keys(xx),...Object.keys(yy)]))visitar(xx[k],yy[k],campo?`${campo}.${k}`:k);}else cambios.push({campo,antes:x??null,ahora:y??null});}
  visitar(a,b,'');return cambios;
}
export function diasExportables(s:SnapshotOptimizador):CorteDia[]{return s.planCorte.dias.length?s.planCorte.dias:[{dia:0,piezas:s.lista.totalPiezas,modulos:s.proyecto.modulos.map(m=>({codigo:m.codigo,cocina:m.cocina,unidades:m.cantidad,piezas:m.piezasPorModulo*m.cantidad,material:Object.values(m.tableroPorRol)[0]??'',partido:false})),materiales:s.planCorte.proyectoCompleto.materiales,sinFormato:s.planCorte.proyectoCompleto.sinFormato,totales:s.planCorte.proyectoCompleto}];}
export const totalesSnapshot=(s:SnapshotOptimizador)=>s.planCorte.dias.length?s.planCorte.consolidado:s.planCorte.proyectoCompleto;
export function validarImagenes(raw:unknown,s:SnapshotOptimizador):Record<string,string>{
  exigir(objeto(raw),'Imágenes inválidas.');const entries=Object.entries(raw);exigir(entries.length<=MAX_IMAGENES,`Máximo ${MAX_IMAGENES} imágenes por exportación.`);
  exigir(entries.reduce((n,[,v])=>n+(typeof v==='string'?v.length:0),0)<=MAX_BYTES_IMAGENES,'Las imágenes superan el límite total de 6 MB.');
  const keys=diasExportables(s).flatMap(d=>d.materiales.flatMap(m=>m.esquema.plan.patrones.map((_,i)=>`${d.dia}-${m.material}-${i}`)));
  exigir(keys.length<=MAX_IMAGENES,`Máximo ${MAX_IMAGENES} imágenes por exportación.`);exigir(keys.length===entries.length&&keys.every(k=>Object.hasOwn(raw,k)),'Faltan imágenes de los esquemas o hay imágenes ajenas al guardado.');
  for(const [,v]of entries){exigir(typeof v==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(v),'Solo se aceptan imágenes PNG.');const bytes=Uint8Array.from(atob(v.slice(v.indexOf(',')+1)),c=>c.charCodeAt(0));exigir(bytes.length>=33&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n),'Imagen PNG inválida.');const view=new DataView(bytes.buffer);exigir(view.getUint32(16)>0&&view.getUint32(16)<=2400&&view.getUint32(20)>0&&view.getUint32(20)<=2400,'Dimensiones PNG inválidas (máximo 2400 px).');}
  return raw as Record<string,string>;
}
export function fechaExacta(value:string){return new Date(value).toLocaleString('es-CO',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});}
export function nombreArchivo(g:Pick<GuardadoOptimizador,'proyecto_nombre'|'created_at'>){const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(g.created_at));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `Optimizacion_${g.proyecto_nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,80)||'proyecto'}_${p.year}-${p.month}-${p.day}_${p.hour}${p.minute}.xlsx`;}

/** ExcelJS solo se descarga/importa en el servidor que construye el archivo. */
export async function crearWorkbook(g:GuardadoOptimizador,rawImagenes:unknown){
  const s=normalizarSnapshot(g.resultado),imagenes=validarImagenes(rawImagenes,s);
  const ExcelJS=(await import('exceljs')).default;const wb=new ExcelJS.Workbook();wb.creator=g.autor_email;wb.created=new Date(g.created_at);wb.title=g.nombre;
  const mm='0.0',m2='0.00',pct='0.000" %"';
  function hoja(nombre:string){const ws=wb.addWorksheet(nombre);ws.columns=Array.from({length:14},(_,i)=>({width:i===0?38:i===1?30:19}));ws.views=[{state:'frozen',ySplit:1}];return ws;}
  function encabezado(ws:import('exceljs').Worksheet,values:string[],filter=false){const r=ws.addRow(values);r.font={bold:true,color:{argb:'FFFFFFFF'}};r.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0F172A'}};r.alignment={wrapText:true,vertical:'middle'};r.height=32;if(filter)ws.autoFilter={from:{row:r.number,column:1},to:{row:r.number,column:values.length}};return r;}
  function titulo(ws:import('exceljs').Worksheet,value:string){const r=ws.addRow([value]);r.font={bold:true,size:14};ws.addRow([]);}
  function filas(ws:import('exceljs').Worksheet,rows:Array<Array<string|number|boolean|null>>,formats:Record<number,string>={}){for(const row of rows){const r=ws.addRow(row);r.alignment={vertical:'top',wrapText:true};r.eachCell((cell,col)=>{if(typeof cell.value==='number'){const etiqueta=col===2?String(row[0]??''):'';cell.numFmt=formats[col]??(etiqueta.includes('(%)')?pct:etiqueta.includes('(m²)')?m2:etiqueta.includes('(mm)')?mm:'0.###');}});}}
  function tabla(ws:import('exceljs').Worksheet,headers:string[],rows:Array<Array<string|number|boolean|null>>,formats:Record<number,string>={}){const h=encabezado(ws,headers);filas(ws,rows,formats);if(rows.length)ws.addTable({name:`T_${ws.id}_${h.number}`,ref:`A${h.number}`,headerRow:true,totalsRow:false,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:headers.map(name=>({name,filterButton:true})),rows});}
  function totales(ws:import('exceljs').Worksheet,t:PlanCorte['consolidado']){filas(ws,[['Láminas',t.laminas],['Área láminas (m²)',t.areaLaminasM2],['Área piezas (m²)',t.areaPiezasM2],['Desperdicio (%)',t.desperdicioPct],['Cortes totales',t.cortes.total],['Combinaciones de acomodo',t.iteraciones]]);}
  const general=hoja('Resumen general');titulo(general,'OPTIMIZACIÓN — Cotizador PLUS');
  filas(general,[['Proyecto',g.proyecto_nombre],['Código de cotización',s.cotizacionCodigo||''],['Nombre del guardado',g.nombre],['Autor',g.autor_email],['Fecha/hora (America/Bogota)',fechaExacta(g.created_at)],['Fecha exacta original (UTC)',g.created_at],['ID del guardado',g.id]]);encabezado(general,['Parámetro','Valor']);
  for(const [k,v]of Object.entries(s.cfg)){
    if(k==='formatos'||k==='texturas'||k==='pilas'||k==='criterio')continue;
    const r=general.addRow([k,typeof v==='boolean'?(v?'Sí':'No'):v]);if(typeof v==='number')r.getCell(2).numFmt=k.includes('Pct')?pct:k.includes('Mm')?mm:'0';
  }
  encabezado(general,['Criterio de optimización','Orden']);s.cfg.criterio.forEach((c,i)=>general.addRow([c,i+1]));
  encabezado(general,['Pilas por espesor','Láminas por pila']);filas(general,s.cfg.pilas.map(p=>[p.espesorMm,p.laminas]),{1:mm});
  encabezado(general,['Formato','Largo (mm)','Ancho (mm)','Activo']);filas(general,s.cfg.formatos.map(f=>[f.codigo,f.largoMm,f.anchoMm,f.activo?'Sí':'No']),{2:mm,3:mm});
  encabezado(general,['Textura','Rota veta']);filas(general,s.cfg.texturas.map(t=>[t.nombre,t.rotaVeta?'Sí':'No']));
  encabezado(general,['Material','Textura elegida','Rota veta']);filas(general,s.lista.materiales.map(m=>{const t=s.texturaPorMaterial[m.material]??s.cfg.texturas[0]?.nombre??'';return [m.material,t,s.cfg.texturas.find(x=>x.nombre===t)?.rotaVeta?'Sí':'No'];}));
  encabezado(general,['Indicador general','Valor']);filas(general,[['Módulos',s.proyecto.modulos.length],['Unidades',s.proyecto.modulos.reduce((n,m)=>n+m.cantidad,0)],...resumenPorGrupo(s.proyecto.modulos,s.proyecto.errores).flatMap(r=>[[`${ETIQUETA_GRUPO[r.grupo]} (unidades)`,r.unidades],[`${ETIQUETA_GRUPO[r.grupo]} (piezas)`,r.piezas]]),['Total piezas (suma de grupos)',resumenPorGrupo(s.proyecto.modulos).reduce((n,r)=>n+r.piezas,0)],['Materiales',s.lista.materiales.length],['Piezas a cortar',s.lista.totalPiezas],['Días de corte',s.planCorte.dias.length]]);totales(general,totalesSnapshot(s));
  const materiales=hoja('Resumen por material');encabezado(materiales,['Material','Proveedor','Espesor (mm)','Lámina','Láminas por pila','Textura','Rota veta','Piezas','m² netos','Láminas mín','Máx ≤ desperdicio','Desperdicio mínimo (%)','Alertas','Roles'],true);
  filas(materiales,s.lista.materiales.map(m=>{const t=s.texturaPorMaterial[m.material]??s.cfg.texturas[0]?.nombre??'';return [m.material,m.proveedor,m.espesorMm,m.formatoCodigo,m.laminasPorPila,t,s.cfg.texturas.find(x=>x.nombre===t)?.rotaVeta?'Sí':'No',m.piezas,m.areaNetaM2,m.laminasMinimas,m.laminasMaxDesperdicio,m.desperdicioMinimoPct,m.alertas.join('; '),m.roles.join(', ')];}),{3:mm,9:m2,12:pct});
  const lista=hoja('Lista de corte');encabezado(lista,['Material','Pieza','Largo (mm)','Ancho (mm)','Cantidad','Enchape largos','Enchape anchos','Canto','Módulos'],true);filas(lista,s.lista.filas.map(f=>[f.material,f.pieza,f.largoMm,f.anchoMm,f.cantidad,f.cantoLargos,f.cantoAnchos,f.calibre,f.modulos.join(', ')]),{3:mm,4:mm});lista.addRow(['Total piezas','','','',s.lista.totalPiezas]);
  const diario=hoja('Plan de corte por día');encabezado(diario,['Día','Módulo','Cocina','Tablero','Unidades','Piezas','Partido','Piezas del día','Capacidad libre','Alertas'],true);for(const d of s.planDiario.dias)filas(diario,d.items.map(m=>[d.dia,m.codigo,m.cocina,m.material,m.unidades,m.piezas,m.partido?'Sí':'No',d.piezas,d.libre,d.alertas.join('; ')]),{6:mm});diario.addRow(['Ritmo (piezas/día)',s.planDiario.ritmo]);diario.addRow(['Total piezas',s.planDiario.totalPiezas]);diario.addRow(['Días mínimos',s.planDiario.diasMinimos]);
  for(const d of diasExportables(s)){
    const ws=hoja(d.dia?`Día ${d.dia}`:'Proyecto completo');titulo(ws,d.dia?`Día ${d.dia}`:'Sin ritmo definido: corrida del proyecto completo, no representa una jornada');filas(ws,[['Piezas',d.piezas],['Materiales',d.materiales.length]]);totales(ws,d.totales);
    encabezado(ws,['Módulo','Cocina','Tablero','Unidades','Piezas','Partido']);filas(ws,d.modulos.map(m=>[m.codigo,m.cocina,m.material,m.unidades,m.piezas,m.partido?'Sí':'No']));
    encabezado(ws,['Material','Láminas','m² láminas','m² piezas','Desperdicio (%)','Cortes','Refilado','Nivel 1','Nivel 2','Nivel 3']);filas(ws,d.materiales.map(m=>[m.material,m.esquema.plan.laminas,m.esquema.plan.areaLaminasM2,m.esquema.plan.areaPiezasM2,m.esquema.plan.desperdicioPct,m.cortes.total,m.cortes.refilado,m.cortes.nivel1,m.cortes.nivel2,m.cortes.nivel3]),{3:m2,4:m2,5:pct});if(d.sinFormato.length)ws.addRow(['Sin formato',d.sinFormato.join(', ')]);
    for(const m of d.materiales){const plan=m.esquema.plan;for(const [i,p]of plan.patrones.entries()){
      ws.addRow([]);titulo(ws,`Patrón ${i+1} · ${m.material} · ${plan.formato.codigo}`);filas(ws,[['Repeticiones',p.repeticiones],['Desperdicio del patrón (%)',p.desperdicioPct],['Piezas por lámina',p.colocaciones.length],['Área de piezas del patrón (mm²)',p.areaPiezasMm2],['Patrón transpuesto',p.transpuesta?'Sí':'No'],['Largo de lámina (mm)',plan.formato.largoMm],['Ancho de lámina (mm)',plan.formato.anchoMm],['Textura',m.esquema.textura],['Rota veta',m.esquema.girable?'Sí':'No']]);
      const width=800,height=width*plan.formato.anchoMm/plan.formato.largoMm;const id=wb.addImage({base64:imagenes[`${d.dia}-${m.material}-${i}`],extension:'png'});ws.addImage(id,{tl:{col:0,row:ws.rowCount},ext:{width,height}});for(let r=0;r<Math.ceil(height/20)+2;r++)ws.addRow([]);
      tabla(ws,['Colocaciones','Material','Formato','Etiqueta','Grupo','X (mm)','Y (mm)','Largo (mm)','Ancho (mm)','Girada','Franja','Columna'],p.colocaciones.map(c=>[i+1,m.material,plan.formato.codigo,c.etiqueta,c.grupo,c.x,c.y,c.largoMm,c.anchoMm,c.girada?'Sí':'No',c.franja??null,c.columna??null]),{6:mm,7:mm,8:mm,9:mm});ws.addRow(['Desperdicio del patrón (%)',p.desperdicioPct]).getCell(2).numFmt=pct;
      tabla(ws,['Sobrantes','X (mm)','Y (mm)','Largo (mm)','Ancho (mm)','Reutilizable'],p.sobrantes.map(r=>[i+1,r.x,r.y,r.largoMm,r.anchoMm,r.reutilizable?'Sí':'No']),{2:mm,3:mm,4:mm,5:mm});
    }encabezado(ws,['Grupos de medida','Etiqueta','Largo (mm)','Ancho (mm)','Cantidad']);filas(ws,plan.grupos.map(v=>[v.grupo,v.etiqueta,v.largoMm,v.anchoMm,v.cantidad]),{3:mm,4:mm});if(plan.noCaben.length){encabezado(ws,['No caben','Largo (mm)','Ancho (mm)','Cantidad']);filas(ws,plan.noCaben.map(p=>[p.etiqueta,p.largoMm,p.anchoMm,p.cantidad]),{2:mm,3:mm});}filas(ws,[['Mínimo teórico de láminas',plan.laminasMinimas],['Desperdicio mínimo (%)',plan.desperdicioMinimoPct],['Meta inalcanzable',plan.metaInalcanzable?'Sí':'No'],['Iteraciones',plan.iteraciones],['Sobrantes reutilizables',plan.sobrantesReutilizables],['Sobrante reutilizable (m²)',plan.sobranteReutilizableM2],['Mayor sobrante largo (mm)',plan.mayorSobrante?.largoMm??null],['Mayor sobrante ancho (mm)',plan.mayorSobrante?.anchoMm??null]]);}
  }
  const resumen=hoja('Resumen consolidado');titulo(resumen,'Compras y corte consolidado');encabezado(resumen,['Material','Láminas','m² láminas','m² piezas','Desperdicio (%)','Cortes','Refilado','Nivel 1','Nivel 2','Nivel 3'],true);filas(resumen,s.planCorte.porMaterial.map(m=>[m.material,m.laminas,m.areaLaminasM2,m.areaPiezasM2,m.desperdicioPct,m.cortes.total,m.cortes.refilado,m.cortes.nivel1,m.cortes.nivel2,m.cortes.nivel3]),{3:m2,4:m2,5:pct});
  encabezado(resumen,['Comparación','Láminas','m² láminas','m² piezas','Desperdicio (%)','Cortes','Refilado','Nivel 1','Nivel 2','Nivel 3']);filas(resumen,[['Consolidado',...valoresTotales(s.planCorte.consolidado)],['Proyecto completo',...valoresTotales(s.planCorte.proyectoCompleto)]],{3:m2,4:m2,5:pct});filas(resumen,[['Días',s.planCorte.dias.length],['Ritmo',s.planCorte.ritmo],...Object.entries(s.planCorte.reparto).map(([k,v]):Array<string|number|boolean>=>[`Reparto: ${k}`,v])]);
  encabezado(resumen,['Día','Material','Sobrantes reutilizables','m² reutilizables']);for(const d of diasExportables(s))filas(resumen,d.materiales.map(m=>[d.dia,m.material,m.esquema.plan.sobrantesReutilizables,m.esquema.plan.sobranteReutilizableM2]),{4:m2});
  if(s.proyecto.errores.length){encabezado(resumen,['Módulos con error','Detalle']);filas(resumen,s.proyecto.errores.map(e=>[e.codigo,e.error]));}
  return wb;
}
function valoresTotales(t:PlanCorte['consolidado']){return [t.laminas,t.areaLaminasM2,t.areaPiezasM2,t.desperdicioPct,t.cortes.total,t.cortes.refilado,t.cortes.nivel1,t.cortes.nivel2,t.cortes.nivel3];}
