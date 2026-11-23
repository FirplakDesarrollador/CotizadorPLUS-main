import type { Patron } from '@/lib/corte/guillotina';
import { diasExportables, MAX_BYTES_IMAGENES, MAX_IMAGENES, type SnapshotOptimizador } from './guardados';
const colores=['#a5f3fc','#fecaca','#fef08a','#bbf7d0','#ddd6fe','#fed7aa','#bfdbfe','#f5d0fe','#d9f99d','#fecdd3'];
const escapar=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function dimensionesRaster(largo:number,ancho:number,maxPx=2400){if(!Number.isFinite(largo)||!Number.isFinite(ancho)||largo<=0||ancho<=0||!Number.isFinite(maxPx)||maxPx<=0)throw new Error('Formato de lámina inválido.');const escala=Math.min(2,Math.min(2400,maxPx)/Math.max(largo,ancho));return {ancho:Math.max(1,Math.round(largo*escala)),alto:Math.max(1,Math.round(ancho*escala))};}
export function svgDePatron(p:Patron,largo:number,ancho:number){
  dimensionesRaster(largo,ancho);const cuerpo=Math.max(8,Math.round(Math.min(largo,ancho)/22));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largo} ${ancho}" width="${largo}" height="${ancho}"><rect width="${largo}" height="${ancho}" fill="#f8fafc" stroke="#475569" stroke-width="6"/>${p.sobrantes.map(s=>`<rect x="${s.x}" y="${s.y}" width="${s.largoMm}" height="${s.anchoMm}" fill="${s.reutilizable?'#e2e8f0':'#f1f5f9'}" stroke="#cbd5e1" stroke-width="3"/>`).join('')}${p.colocaciones.map(c=>`<g><title>${escapar(c.etiqueta)}</title><rect x="${c.x}" y="${c.y}" width="${c.largoMm}" height="${c.anchoMm}" fill="${colores[Math.abs(c.grupo-1)%colores.length]}" stroke="#334155" stroke-width="4"/><text x="${c.x+5}" y="${c.y+cuerpo}" font-size="${Math.min(cuerpo,c.anchoMm*.7)}" fill="#0f172a">(${c.grupo})</text></g>`).join('')}</svg>`;
}
export async function rasterizarSvg(svg:SVGSVGElement,maxPx=2400){
  const v=svg.viewBox.baseVal,{ancho,alto}=dimensionesRaster(v.width,v.height,maxPx);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
  try{const img=new Image();await new Promise<void>((ok,no)=>{img.onload=()=>ok();img.onerror=()=>no(new Error('No se pudo rasterizar el esquema SVG.'));img.src=url;});const canvas=document.createElement('canvas');canvas.width=ancho;canvas.height=alto;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas no disponible para exportar imágenes.');ctx.fillStyle='white';ctx.fillRect(0,0,ancho,alto);ctx.drawImage(img,0,0,ancho,alto);const png=canvas.toDataURL('image/png');canvas.width=0;canvas.height=0;return png;}finally{URL.revokeObjectURL(url);}
}
export async function generarImagenesConPresupuesto(claves:string[],render:(clave:string,maxPx:number)=>Promise<string>){
  if(claves.length>MAX_IMAGENES)throw new Error(`La exportación necesita ${claves.length} imágenes y supera el máximo de ${MAX_IMAGENES}.`);
  if(new Set(claves).size!==claves.length)throw new Error('Hay esquemas con claves duplicadas.');
  for(const maxPx of [2400,1800,1400,1000,800]){
    const out:Record<string,string>={};let bytes=0;let excedido=false;
    for(const clave of claves){const png=await render(clave,maxPx);bytes+=png.length;if(bytes>MAX_BYTES_IMAGENES){excedido=true;break;}out[clave]=png;}
    if(!excedido)return out;
  }
  throw new Error('Las imágenes superan el máximo total de 6 MB incluso con resolución reducida. No se exportó ningún archivo.');
}
export async function imagenesSnapshot(s:SnapshotOptimizador){
  const patrones=diasExportables(s).flatMap(d=>d.materiales.flatMap(m=>m.esquema.plan.patrones.map((p,i)=>({clave:`${d.dia}-${m.material}-${i}`,p,formato:m.esquema.plan.formato}))));if(patrones.length>MAX_IMAGENES)throw new Error(`La exportación necesita ${patrones.length} imágenes y supera el máximo de ${MAX_IMAGENES}.`);
  const porClave=new Map(patrones.map(p=>[p.clave,p]));
  return generarImagenesConPresupuesto(patrones.map(p=>p.clave),async(clave,maxPx)=>{const {p,formato}=porClave.get(clave)!;const doc=new DOMParser().parseFromString(svgDePatron(p,formato.largoMm,formato.anchoMm),'image/svg+xml');return rasterizarSvg(doc.documentElement as unknown as SVGSVGElement,maxPx);});
}
