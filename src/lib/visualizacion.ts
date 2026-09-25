import { evalExpr, type Pieza } from './engine';
import type { GroupCalculation, PreparedGroupMember } from './group-engine';
import { inferirMontaje, validarMontaje, type FuncionMontaje, type MontajeConfig } from './visualizacion-config';

export type PanelVisual = {
  id: string; nombre: string; modulo: number; pref: string; rol: string; material: string;
  funcion: FuncionMontaje; x: number; y: number; z: number; w: number; d: number; h: number;
  largo: number; ancho: number; espesor: number; giro: number; confirmado: boolean;
  nota: string; cajon: string | null;
};
export type EscenaMueble = {
  version: 1; paneles: PanelVisual[]; avisos: string[]; omitidas: string[];
  modulos: { pref: string; x: number; largo: number; alto: number; profundo: number }[];
};
type Item = { p: Pieza; config: MontajeConfig; funcion: FuncionMontaje; l: number; a: number; t: number; count: number; source: number; w: number; d: number; h: number };
const mm = (v: number) => v * 25.4;
const isFront = (p: Pieza) => p.rol_tablero === 'frente' || /frente/i.test(p.nombre);
const isDrawer = (f: FuncionMontaje) => ['base_gaveta','trasero_gaveta','lateral_gaveta','frente_interior','frente_gaveta'].includes(f);

/** Uses the exact evaluated, group-adjusted cutting list. Never changes prices. */
export function construirVisualizacion(members: PreparedGroupMember[], group: GroupCalculation): EscenaMueble {
  const scene: EscenaMueble = {version:1,paneles:[],avisos:[],omitidas:[],modulos:[]};
  const warn = (s: string) => { if (!scene.avisos.includes(s)) scene.avisos.push(s); };
  let offset=0;
  const totalL=mm(group.largoTotalIn), multi=members.length>1;
  const continuous=new Set<string>();
  const addPanel = (panel: PanelVisual) => {
    if (scene.paneles.length >= 1500) { warn('Se alcanzó el límite de 1.500 piezas visibles.'); return; }
    scene.paneles.push(panel);
  };
  members.forEach((member, mi) => {
    const {calc,pref}=member, result=group.lineas[mi];
    const L=mm(calc.dims.L), A=mm(calc.dims.A), P=mm(calc.dims.P);
    const thickness=(rol: string) => Number(calc.tablerosByCode[calc.preset[rol]]?.espesor_mm ?? 0);
    const TC=thickness('caja') || 15, TF=thickness('frente') || 18, TB=thickness('fondo') || 6;
    scene.modulos.push({pref,x:offset,largo:L,alto:A,profundo:P});
    const vars=result.vars, items: Item[]=[];
    const used=new Set<number>();
    calc.piezas.forEach((p, pi) => {
      if (calc.modoFrentes==='sin_frentes' && isFront(p) || calc.modoFrentes==='solo_frentes' && !isFront(p)) return;
      const ri=result.piezas.findIndex((r,i)=>!used.has(i)&&r.pieza===p.nombre);
      if (ri<0) return;
      used.add(ri); const r=result.piezas[ri];
      if (!(r.cant>0)) return;
      let config: MontajeConfig;
      try { config={...inferirMontaje(p),...validarMontaje(p.visualizacion)}; }
      catch { warn(`${pref}: montaje inválido de ${p.nombre}; se usa inferencia.`); config=inferirMontaje(p); }
      // DB-2S-SM tiene dos pares de Gola de madera propios. Esta geometría es
      // estructural: los rails delanteros son verticales a 20 mm del frente y
      // cada Gola es horizontal, contra el frente. Se fija aquí para que una
      // configuración heredada de DB no pueda volver a intercambiar planos.
      if (pref === 'DB-2S-SM' && p.nombre === 'refuerzo_delantero') {
        config = {
          ...config,
          funcion: 'travesano_frontal', plano: 'XZ', intercambiar: false,
          y: '20', z: 'I===0 ? A-H : A-2*alto_frente_pequeno-RV-28.4-H',
          confirmado: true,
          nota: 'Refuerzo vertical: superior y bajo la segunda gaveta.',
        };
      }
      if (pref === 'DB-2S-SM' && p.nombre === 'gola_madera') {
        config = {
          ...config,
          funcion: 'gola', plano: 'XY', intercambiar: false,
          y: '0', z: 'I===0 ? A-80-H : A-2*alto_frente_pequeno-RV-28.4-80-H',
          confirmado: true,
          nota: 'Gola horizontal contra el frente, bajo cada refuerzo.',
        };
      }
      let funcion=config.funcion ?? 'automatico';
      if (funcion==='automatico') funcion=inferirMontaje(p).funcion!;
      if (funcion==='frente' && /n_cajones/.test(p.formula_cantidad) && !vars.n_puertas) funcion='frente_gaveta';
      const l=mm(r.largoIn), a=mm(r.anchoIn);
      if(funcion==='omitir' || !p.rol_tablero || l===0 || a===0) {
        scene.omitidas.push(`${pref} · ${p.nombre} (área, canto o dimensión nula)`); return;
      }
      let t=thickness(p.rol_tablero);
      if (!(t>0)) { t=15; warn(`${pref}: espesor de ${p.rol_tablero} no definido; se representan 15 mm.`); }
      let count=r.cant;
      if(multi && p.modo_agrupacion==='continua') {
        const key=p.clave_fusion||p.nombre;
        if(continuous.has(key)) return;
        continuous.add(key);
        count=group.lineas.reduce((s,line)=>s+line.piezas.filter(v=>v.pieza===p.nombre&&v.largoIn===r.largoIn&&v.anchoIn===r.anchoIn).reduce((n,v)=>n+v.cant,0),0);
        // Aliased names (e.g. refuerzo_horizontal / delantero) share the same fusion key.
        if(Math.abs(count-Math.round(count))>.001) {
          count=members.reduce((s,m,j)=>{
            const q=m.calc.piezas.find(q=>q.modo_agrupacion==='continua'&&(q.clave_fusion||q.nombre)===key);
            return s+(q?group.lineas[j].piezas.find(v=>v.pieza===q.nombre)?.cant??0:0);
          },0);
        }
      } else if(multi && p.modo_agrupacion==='lateral_compartido') count=2;
      if(Math.abs(count-Math.round(count))>.001) { warn(`${pref} · ${p.nombre}: cantidad fraccionaria ${count.toFixed(3)} sin montaje físico definido.`); return; }
      if(![l,a,t,count].every(Number.isFinite)||l<=0||a<=0||count>500) { warn(`${pref} · ${p.nombre}: dimensiones o cantidad inválidas.`); return; }
      const u=config.intercambiar?a:l, v=config.intercambiar?l:a;
      let [w,,h]=config.plano==='XY'?[u,v,t]:config.plano==='YZ'?[t,v,u]:[u,t,v];
      const d=config.plano==='XY'?v:config.plano==='YZ'?v:t;
      // Un respaldo no puede desbordar la carcasa. Las plantillas antiguas que
      // guardaron los ejes al revés se corrigen al vuelo si la orientación opuesta
      // es la única que cabe; el corte y su costo no se alteran.
      if (funcion==='respaldo' && config.plano==='XZ' && (w>L+1 || h>A+1)) {
        const alternateW=config.intercambiar?l:a;
        const alternateH=config.intercambiar?a:l;
        if (alternateW<=L+1 && alternateH<=A+1) [w,h]=[alternateW,alternateH];
      }
      items.push({p,config,funcion,l,a,t,count:Math.round(count),source:pi,w,d,h});
    });
    const sideH=Math.max(0,...items.filter(i=>i.funcion==='lateral').map(i=>i.h));
    const foot=sideH>0?Math.max(0,A-sideH):0;
    const innerH=sideH||A;
    const doors=items.filter(i=>i.funcion==='frente');
    const fronts=items.filter(i=>i.funcion==='frente_gaveta').flatMap(i=>Array.from({length:i.count},(_,k)=>({item:i,k})));
    fronts.sort((a,b)=>a.item.h-b.item.h||a.item.source-b.item.source);
    const intFronts=items.filter(i=>i.funcion==='frente_interior' && (Boolean(vars.n_cajones_ocultos) || /ocult|interior/i.test(i.p.nombre))).flatMap(i=>Array.from({length:i.count},(_,k)=>({item:i,k})));
    const bodyCount=Math.max(0,...items.filter(i=>i.funcion==='base_gaveta').map(i=>i.count),fronts.length+intFronts.length);
    const drawerSlots: {z:number;h:number;key:string;interior?:boolean}[]=[];
    const gola=vars.gola?53.6:0;
    if(fronts.length) {
      const sum=fronts.reduce((s,f)=>s+f.item.h,0), gap=3.2;
      let z = doors.length > 0
        ? A - (gola ? gola : 0) - gap
        : A - Math.max(0, (innerH - sum - (fronts.length - 1) * gap - gola) / 2);
      if(sum+(fronts.length-1)*gap+gola>innerH+1) warn(`${pref}: los frentes de gaveta exceden el alto disponible; se conservan sus cortes.`);
      fronts.forEach((f,j)=>{
        if(gola && (j===0||j===fronts.length-1)) z-=gola/2;
        z-=f.item.h; drawerSlots.push({z,h:f.item.h,key:`${mi}:gaveta:${j}`}); z-=gap;
      });
      // Gavetas interiores detrás de un frente exterior (ej. DB2-1OP):
      if(intFronts.length && drawerSlots.length) {
        const topSlot=drawerSlots[0];
        const half=topSlot.h/2;
        topSlot.h=half;
        intFronts.forEach((_,idx)=>{
          drawerSlots.push({z:topSlot.z+half,h:half,key:`${mi}:gaveta:int:${idx}`,interior:true});
        });
      }
    } else {
      // Internal drawers use the lower cabinet zone; their exact mounting remains editable.
      const zone=vars.n_puertas?Math.min(innerH*.5,bodyCount*200):innerH;
      for(let i=0;i<bodyCount;i++) drawerSlots.push({z:foot+(bodyCount-i-1)*zone/Math.max(1,bodyCount),h:zone/Math.max(1,bodyCount),key:`${mi}:gaveta:${i}`});
    }
    const sequence=new Map<string,number>();
    const totals=new Map<string,number>();
    items.forEach(i=>totals.set(i.funcion,(totals.get(i.funcion)||0)+i.count));
    // Place doors in horizontal rows; full-width doors naturally stack vertically.
    const doorSlots=new Map<string,{x:number;z:number}>();
    const blind=items.find(i=>i.funcion==='frente_falso'&&i.h>innerH*.8);
    const left=blind?blind.w:0, doorW=L-left;
    const doorRows:{entries:{item:Item;k:number;x:number}[];width:number;height:number}[]=[];
    for(const item of doors) for(let k=0;k<item.count;k++) {
      let row=doorRows.at(-1);
      if(!row||row.width+item.w+3.2>doorW+1) { row={entries:[],width:0,height:0}; doorRows.push(row); }
      row.entries.push({item,k,x:row.width}); row.width+=item.w+3.2; row.height=Math.max(row.height,item.h);
    }
    let doorZ=foot;
    for(const row of doorRows) {
      const pad=Math.max(0,(doorW-(row.width-3.2))/2);
      for(const e of row.entries) doorSlots.set(`${e.item.source}:${e.k}`,{x:left+pad+e.x,z:doorZ});
      doorZ+=row.height+3.2;
    }
    // Con gola la puerta se corta más alta que la carcasa (en W, `A+0.62402`; ver
    // migración 0045). Ese sobrante es el agarre: en un superior se toma la puerta
    // por debajo, así que cuelga bajo la base en vez de sobresalir sobre la tapa.
    const voladizoGola=vars.gola&&doorRows.length?Math.max(0,doorZ-3.2-foot-innerH):0;
    if(voladizoGola) for(const [key,slot] of doorSlots) doorSlots.set(key,{...slot,z:slot.z-voladizoGola});
    if(doorZ-voladizoGola>A+4 && doors.length) warn(`${pref}: la fachada necesita distribución específica por niveles; revisar parámetros de montaje.`);
    const baseDepth=items.find(i=>i.funcion==='base')?.d;
    for(const item of items) {
      const {p,config,w,d,h,count,funcion}=item;
      for(let k=0;k<count;k++) {
        const i=sequence.get(funcion)||0; sequence.set(funcion,i+1);
        const n=totals.get(funcion)||count;
        const full=multi&&p.modo_agrupacion==='continua', width=full?totalL:L;
        let x=(width-w)/2, y=0, z=foot, cajon:string|null=null;
        let drawerIndex=i;
        if(funcion==='frente_gaveta') drawerIndex=fronts.findIndex(f=>f.item===item&&f.k===k);
        else if(funcion==='frente_interior') drawerIndex=Math.max(0,drawerSlots.findIndex(s=>s.interior));
        else if(funcion==='base_gaveta') {
          if(intFronts.length && k>=fronts.length) drawerIndex=Math.max(0,drawerSlots.findIndex(s=>s.interior))+(k-fronts.length);
          else drawerIndex=k;
        }
        else if(funcion==='trasero_gaveta') {
          if(intFronts.length) {
            if(h>100) drawerIndex=1;
            else drawerIndex=k===0?0:Math.max(0,drawerSlots.findIndex(s=>s.interior));
          } else {
            const ordered=items.filter(q=>q.funcion===funcion).flatMap(q=>Array.from({length:q.count},(_,j)=>({q,j}))).sort((a,b)=>a.q.h-b.q.h||a.q.source-b.q.source);
            drawerIndex=ordered.findIndex(v=>v.q===item&&v.j===k);
          }
        }
        if(funcion==='lateral_gaveta') drawerIndex=Math.floor(i/2);
        const slot=drawerSlots[drawerIndex%Math.max(1,drawerSlots.length)];
        if(isDrawer(funcion)&&slot) cajon=slot.key;
        switch(funcion) {
          case 'lateral': x=k===0?0:L-w; break;
          case 'base': z=foot+i*(innerH-h)/Math.max(1,n-1); break;
          case 'tapa': z=A-h; break;
          case 'base_tapa': z=foot+i*(innerH-h)/Math.max(1,n-1); break;
          case 'estante': y=P-d; z=foot+TC+(i+1)*(innerH-2*TC-h)/(n+1); break;
          case 'division': x=(i+1)*L/(n+1)-w/2; z=foot+TC; break;
          case 'respaldo': y=baseDepth ?? P-d; z=foot+(innerH-h)/2; break;
          case 'travesano_frontal': {
            const cajonSuperior=drawerSlots[0];
            // En muebles con una gaveta superior y puertas, los dos refuerzos
            // horizontales enmarcan la gaveta: uno arriba y otro abajo.
            if (p.nombre==='refuerzo_horizontal' && doors.length && drawerSlots.length===1 && i===1) z=cajonSuperior.z-h;
            else z=drawerSlots[i]?.z+drawerSlots[i]?.h-h;
            if(!Number.isFinite(z)) z=A-h-i*(innerH-h)/Math.max(1,n);
            break;
          }
          case 'travesano_posterior': y=P-d; z=foot+i*(innerH-h)/Math.max(1,n-1); break;
          case 'travesano_lateral': x=TC; z=A-h; break;
          case 'frente': {const ds=doorSlots.get(`${item.source}:${k}`)!; x=ds.x; z=ds.z; y=-d; break;}
          case 'frente_falso': x=blind===item?0:(L-w)/2; z=blind===item?foot:A-h; y=-d; break;
          case 'frente_gaveta': z=slot?.z??foot; y=-d; break;
          case 'base_gaveta': x=(L-w)/2; y=10; z=(slot?.z??foot)+30; break;
          case 'trasero_gaveta': x=(L-w)/2; y=10+(items.find(v=>v.funcion==='base_gaveta')?.d??P-80)-d; z=(slot?.z??foot)+30+(items.find(v=>v.funcion==='base_gaveta')?.t??TC); break;
          case 'lateral_gaveta': x=i%2===0?TC+12:L-TC-12-w; y=10; z=(slot?.z??foot)+30; break;
          case 'frente_interior': x=(L-w)/2; y=10; z=(slot?.z??foot)+30; break;
          case 'gola': y=80; z=i===0?A-h:(drawerSlots.at(-1)?.z??foot)+ (drawerSlots.at(-1)?.h??innerH/2)-h; break;
          case 'zocalo': y=i%2===0?50:P-d; z=0; break;
          case 'panel': x=(L-w)/2; y=-d; z=foot; break;
          case 'suelto': x=L+40+i*(w+20); z=0; warn(`${pref}: ${p.nombre} se muestra aparte hasta definir su montaje.`); break;
        }
        if(multi&&p.modo_agrupacion==='lateral_compartido') {
          if(k===0 && mi>0) {
            const prev=members[mi-1].calc.dims.A;
            if(prev>=calc.dims.A) continue;
            x=-w/2;
          }
          if(k===1 && mi<members.length-1) {
            const next=members[mi+1].calc.dims.A;
            if(next>calc.dims.A) continue;
            x=L-w/2;
          }
        }
        const defaults={x,y,z};
        let giro=0, confirmed=config.confirmado===true;
        const ctx={L:width,A,P,TC,TF,TB,LP:item.l,AP:item.a,EP:item.t,I:k,N:count,W:w,D:d,H:h,X:x,Y:y,Z:z};
        try {
          for(const axis of ['x','y','z'] as const) if(config[axis]) defaults[axis]=Number(evalExpr(config[axis],ctx));
          if(!Object.values(defaults).every(Number.isFinite)) throw new Error('Coordenada no finita');
          giro=Number(evalExpr(String(config.giro??0),ctx));
          if(![0,90,180,270].includes(giro)) throw new Error('Giro debe ser ortogonal');
        } catch { warn(`${pref} · ${p.nombre}: fórmula de ubicación inválida; se usa posición inferida.`); defaults.x=x;defaults.y=y;defaults.z=z;giro=0;confirmed=false; }
        // Los dos pares de DB-2S-SM se relacionan con componentes físicos, no
        // con una fracción del alto: el primero se apoya arriba y el segundo
        // queda bajo la segunda base de gaveta. La Gola queda bajo su refuerzo
        // y ambas golas siguen pegadas al frente (y=0).
        if (pref === 'DB-2S-SM' && (p.nombre === 'refuerzo_delantero' || p.nombre === 'gola_madera')) {
          const segundaBaseZ = (drawerSlots[1]?.z ?? foot) + 30;
          const altoRefuerzo = items.find((candidate) => candidate.p.nombre === 'refuerzo_delantero')?.h ?? 80;
          const arriba = i === 0 ? A : segundaBaseZ;
          if (p.nombre === 'refuerzo_delantero') {
            defaults.y = 20;
            defaults.z = arriba - h;
          } else {
            defaults.y = 0;
            defaults.z = arriba - altoRefuerzo - h;
          }
          confirmed = true;
        }
        addPanel({id:`${mi}:${item.source}:${k}`,nombre:p.nombre,modulo:mi,pref,rol:p.rol_tablero,
          material:calc.preset[p.rol_tablero]??'',funcion,x:defaults.x+(full?0:offset),y:defaults.y,z:defaults.z,w,d,h,
          largo:item.l,ancho:item.a,espesor:item.t,giro,confirmado:confirmed,
          nota:config.nota??'',cajon});
      }
    }
    if(['BBL','BBLFD','BLS','WER','WBL','SDB','WPC','PCFD'].includes(pref)) warn(`${pref}: interpretación de piezas rectangulares; recortes, ensambles y distribución especial requieren validación de montaje.`);
    offset+=L;
  });
  return scene;
}
