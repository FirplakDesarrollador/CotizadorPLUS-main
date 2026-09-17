'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EscenaMueble, PanelVisual } from '@/lib/visualizacion';

type View = 'front' | 'side' | 'top';
const titles: Record<View,string> = {front:'Frontal',side:'Lateral derecha',top:'Superior'};
const mm=(n:number)=>n.toLocaleString('es-CO',{maximumFractionDigits:1});
const input='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 min-w-0 w-full';
function color(p:PanelVisual) {
  if(/frente|panel/.test(p.funcion)) return '#b87935';
  if(/gaveta/.test(p.funcion)) return '#367a95';
  if(p.funcion==='gola') return '#8771ad';
  if(/travesano/.test(p.funcion)) return '#718456';
  return '#718096';
}
function corners(p:PanelVisual, opening:number, drawer:string): number[][] {
  const angle=p.giro*Math.PI/180, c=Math.round(Math.cos(angle)),s=Math.round(Math.sin(angle));
  const dy=p.cajon && p.cajon===drawer?-opening:0;
  return [0,p.h].flatMap(z=>[[0,0],[p.w,0],[p.w,p.d],[0,p.d]].map(([x,y])=>[p.x+x*c-y*s,p.y+y*c+x*s+dy,p.z+z]));
}
const project=(c:number[],view:View)=>view==='front'?[c[0],-c[2]]:view==='side'?[c[1],-c[2]]:[c[0],-c[1]];

function Drawing({scene,view,selected,onSelect,solid,opening,drawer}:{scene:EscenaMueble;view:View;selected:string;onSelect:(id:string)=>void;solid:boolean;opening:number;drawer:string}) {
  const ref=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(300);
  useEffect(()=>{
    const host=ref.current; if(!host) return;
    const resize=()=>setWidth(host.getBoundingClientRect().width);
    resize(); const observer=new ResizeObserver(resize);observer.observe(host); return()=>observer.disconnect();
  },[]);
  const shapes=scene.paneles.map(p=>({p,points:corners(p,opening,drawer).map(c=>project(c,view))}));
  const all=shapes.flatMap(s=>s.points);
  // Include the nominal module envelope even in front-only or open configurations.
  for(const m of scene.modulos) for(const x of [m.x,m.x+m.largo]) for(const y of [0,m.profundo]) for(const z of [0,m.alto]) all.push(project([x,y,z],view));
  const minX=Math.min(0,...all.map(p=>p[0])),maxX=Math.max(1,...all.map(p=>p[0]));
  const minY=Math.min(0,...all.map(p=>p[1])),maxY=Math.max(1,...all.map(p=>p[1]));
  const scale=Math.max(.001,Math.min(Math.max(100,width-48)/(maxX-minX),290/(maxY-minY)));
  const height=(maxY-minY)*scale+88;
  const ox=(width-(maxX-minX)*scale)/2-minX*scale,oy=42-minY*scale;
  shapes.sort((a,b)=>view==='front'?b.p.y-a.p.y:view==='side'?a.p.x-b.p.x:a.p.z-b.p.z);
  const chosen=shapes.find(s=>s.p.id===selected);
  const render=(shape:typeof shapes[number],highlight=false)=>{
    const {p,points}=shape;
    const xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
    const x=ox+Math.min(...xs)*scale,y=oy+Math.min(...ys)*scale;
    const w=Math.max(.8,(Math.max(...xs)-Math.min(...xs))*scale),h=Math.max(.8,(Math.max(...ys)-Math.min(...ys))*scale);
    const faded=selected&&selected!==p.id;
    return <g key={`${p.id}:${highlight}`} onClick={()=>onSelect(p.id)} className="cursor-pointer">
      <title>{p.nombre} · {p.pref} · {mm(p.largo)} × {mm(p.ancho)} × {mm(p.espesor)} mm</title>
      {solid&&!highlight&&<rect x={x} y={y} width={w} height={h} fill="white"/>}
      <rect x={x} y={y} width={w} height={h} fill={color(p)} fillOpacity={highlight?.48:solid?.3:faded?.02:.1} stroke={color(p)} strokeOpacity={faded&&!highlight?.15:.85} strokeWidth={highlight?2:1}/>
    </g>;
  };
  return <div ref={ref} className="min-w-0">
    <h4 className="text-sm font-medium text-slate-700 mb-1">{titles[view]}</h4>
    <svg role="img" aria-label={`${titles[view]} del mueble calculado, medidas en milímetros`} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <text x={width/2} y={18} textAnchor="middle" fontSize={12} fill="#475569">{view==='side'?'Profundidad':'Largo'} {mm(maxX-minX)} mm</text>
      <line x1={ox+minX*scale} x2={ox+maxX*scale} y1={28} y2={28} stroke="#cbd5e1"/>
      {shapes.map(s=>render(s))}{chosen&&render(chosen,true)}
      <text x={width/2} y={height-23} textAnchor="middle" fontSize={12} fill="#475569">{view==='top'?'Frente abajo':view==='side'?'Frente a la izquierda':'Vista desde el frente'}</text>
      <text x={width/2} y={height-7} textAnchor="middle" fontSize={12} fill="#475569">{view==='top'?'Profundidad':'Alto'} {mm(maxY-minY)} mm</text>
    </svg>
  </div>;
}

export default function MuebleVisualizer({scene}:{scene?:EscenaMueble}) {
  const [selected,setSelected]=useState(''),[solid,setSolid]=useState(false),[opening,setOpening]=useState(0),[drawer,setDrawer]=useState('');
  const drawers=useMemo(()=>[...new Set(scene?.paneles.map(p=>p.cajon).filter((v):v is string=>!!v)??[])], [scene]);
  if(!scene) return <section className="bg-white rounded-2xl border border-slate-200 p-5"><h3 className="font-medium text-slate-900">Visualización del mueble</h3><p className="text-sm text-slate-500 mt-2">Vuelve a calcular para generar las tres vistas de este resultado guardado.</p></section>;
  const active=scene.paneles.find(p=>p.id===selected), selectedId=active?.id??'';
  const activeDrawer=drawers.includes(drawer)?drawer:drawers[0]??'';
  return <section data-testid="mueble-visualizer" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
    <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-medium text-slate-900">Visualización del mueble</h3><p className="text-xs text-slate-500 mt-1">{scene.paneles.length} piezas · {scene.modulos.map(m=>m.pref).join(' + ')} · medidas del último cálculo</p></div><span className="text-xs text-slate-500">Montaje {scene.paneles.length&&scene.paneles.every(p=>p.confirmado)?'parametrizado y confirmado':'interpretado'}</span></div>
    <div className="grid sm:grid-cols-2 gap-3">
      <label className="text-xs text-slate-600 space-y-1"><span>Representación</span><select className={input} value={solid?'solid':'xray'} onChange={e=>setSolid(e.target.value==='solid')}><option value="xray">Piezas en transparencia</option><option value="solid">Exterior ensamblado</option></select></label>
      <label className="text-xs text-slate-600 space-y-1"><span>Pieza resaltada</span><select className={input} value={selectedId} onChange={e=>setSelected(e.target.value)}><option value="">Todas las piezas</option>{scene.paneles.map((p,i)=><option key={p.id} value={p.id}>{i+1}. {p.pref} · {p.nombre}</option>)}</select></label>
    </div>
    {scene.paneles.length>0?<div className="grid grid-cols-1 xl:grid-cols-3 gap-4">{(['front','side','top'] as View[]).map(view=><Drawing key={view} scene={scene} view={view} selected={selectedId} onSelect={setSelected} solid={solid} opening={opening} drawer={activeDrawer}/>)}</div>:<p className="text-sm text-slate-600">El resultado no contiene piezas con volumen representable.</p>}
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><span>□ Carcasa</span><span className="text-amber-700">□ Frentes</span><span className="text-cyan-700">□ Gavetas</span><span className="text-lime-700">□ Travesaños</span><span className="text-violet-700">□ Gola</span></div>
    {drawers.length>0&&<div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-slate-600 space-y-1"><span>Gaveta</span><select className={input} value={activeDrawer} onChange={e=>{setDrawer(e.target.value);setOpening(0);}}>{drawers.map((d,i)=><option key={d} value={d}>{scene.modulos[Number(d.split(':')[0])]?.pref} · gaveta {i+1}</option>)}</select></label><label className="text-xs text-slate-600 space-y-2"><span>Apertura ilustrativa · {opening} mm</span><input aria-label="Apertura ilustrativa" className="block w-full accent-slate-800" type="range" min={0} max={Math.min(350,...scene.modulos.map(m=>m.profundo*.65))} step={10} value={opening} onChange={e=>setOpening(Number(e.target.value))}/></label></div>}
    <p className="text-xs text-slate-600 break-words" aria-live="polite">{active?`${active.nombre} · ${active.material} · corte ${mm(active.largo)} × ${mm(active.ancho)} × ${mm(active.espesor)} mm · posición ${mm(active.x)}, ${mm(active.y)}, ${mm(active.z)} mm. ${active.nota}`:'Selecciona una pieza para identificarla en las tres vistas. Las posiciones inferidas se pueden ajustar en Diseño de muebles.'}</p>
    {(scene.avisos.length>0||scene.omitidas.length>0)&&<details className="text-xs text-slate-600"><summary className="cursor-pointer">Alcance del montaje{scene.omitidas.length?` · ${scene.omitidas.length} filas sin volumen`:''}</summary><ul className="list-disc pl-5 space-y-1 mt-2">{scene.avisos.map((s,i)=><li key={`a${i}`}>{s}</li>)}{scene.omitidas.map((s,i)=><li key={`o${i}`}>{s}</li>)}</ul></details>}
  </section>;
}
