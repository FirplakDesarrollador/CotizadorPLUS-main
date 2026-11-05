import { createHash } from 'node:crypto';
import { normalizarEstadoExcel } from './pipeline-estados.ts';
const texto = v => v == null || String(v).trim() === '' ? null : String(v).trim();
export function fechaSerialExcel(value) {
 if(value==null || value==='')return null;
 // Excepciones de la fuente confirmadas por el usuario el 2026-11-05.
 if(value==='-')return null;
 if(value==='27/04/02026')return '2026-04-27';
 if(typeof value !== 'number' || !Number.isFinite(value) || value<0 || value>2958465)throw new Error(`Fecha Excel inválida: ${value}`);
 return new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000).toISOString().slice(0,10);
}
export function montoExcel(value) {
 if(value==null || value==='')return 0;
 if(typeof value==='number'){if(!Number.isFinite(value))throw new Error('Monto no finito');return value;}
 const raw=String(value).trim().replace(/^(USD|COP)\s*/i,'');
 if(!/^-?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?$/.test(raw))throw new Error(`Monto Excel ambiguo: ${value}`);
 return Number(raw.replace(/\./g,'').replace(',','.'));
}
export function claveImportacion(row) {
 return createHash('sha256').update(JSON.stringify([texto(row.codigo),texto(row.nombre_proyecto),row.fecha_ingreso??null,texto(row.cliente)])).digest('hex');
}
export function filaVaciaExcel(row) {return row.every(v=>v==null || String(v).trim()==='');}
export function mapearFilaPipeline(row, origen) {
 if(filaVaciaExcel(row))return null;
 const result={fecha_ingreso:fechaSerialExcel(row[0]),codigo:texto(row[3]),nombre_proyecto:texto(row[4]),
  estado:normalizarEstadoExcel(row[5]),estado_planos:texto(row[6]),fecha_limite_envio:fechaSerialExcel(row[7]),
  cliente:texto(row[9]),zona:texto(row[10]),pais:texto(row[11])??'Colombia',incoterm:texto(row[12]),
  productos:texto(row[13]),asesor:texto(row[15]),estimador:texto(row[16]),link_planner:texto(row[17]),link_tarea_planos:texto(row[18]),
  monto_fob_usd:montoExcel(row[19]),monto_fob_cop:montoExcel(row[20]),nuevo_valor_usd:montoExcel(row[21]),nuevo_valor_cop:montoExcel(row[22]),
  fase_cotizacion:String(row[27]??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')==='si',
  tipo_cotizacion:null,tipo_origen:texto(row[31]),trm:null,moneda:'USD',origen_excel:origen};
 return {...result,clave_importacion:claveImportacion(result)};
}
export function pendientesImportacion(rows, existentes) {
 const keys=new Set(existentes.map(row=>row.clave_importacion||claveImportacion(row)));const pendientes=[];let duplicados=0;
 for(const row of rows){if(keys.has(row.clave_importacion)){duplicados++;continue;}keys.add(row.clave_importacion);pendientes.push(row);}
 return {pendientes,duplicados};
}
