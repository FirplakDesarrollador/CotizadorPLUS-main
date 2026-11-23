import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import type { CalcInput, Pieza, Regla } from '../src/lib/engine';
import { toInches } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { normalizarPlantillasFabricacion, ajustarEntrepanos } from '../src/lib/reglas-fabricacion';
import { usaTkTorre, usaMoTorre, usaPuertaSupTorre, usaHuecoHornoParametrico, usaPuertaParametrica, altoPorDefectoIn } from '../src/lib/muebles';
import { codigoComercial } from '../src/lib/module-groups';
import { validarMontaje } from '../src/lib/visualizacion-config';
import { ajustarGavetasFe } from '../src/lib/gavetas';
import { contornoLateral } from '../src/lib/visualizacion-contorno';
import catalogo from './fixtures/catalogo-pc-bmw-bomh.json';
import { ajustarPiezasSinFondo } from '../src/lib/muebles';

const bases=['PC','PC-MO','BMW-1','BMW-1-FE','BOMH-1','BOMH-1-FE'];
const cerca=(a:number,b:number)=>assert.ok(Math.abs(a-b)<0.001,`${a} ≠ ${b}`);
function calcular(pref:string, espesor=15, puerta=36, unidad:'in'|'mm'|'cm'='in', prof=24) {
  const tipo=catalogo.tipos.find(t=>t.pref===pref)!;
  assert.ok(tipo,pref);
  const originales=catalogo.piezas.filter(p=>p.tipo_mueble_id===tipo.id) as unknown as Pieza[];
  const piezas=ajustarEntrepanos(normalizarPlantillasFabricacion(originales,pref),pref);
  const factor=unidad==='mm'?25.4:unidad==='cm'?2.54:1;
  const torre=pref.startsWith('PC');
  const calc:CalcInput={
    dims:{L:toInches(30*factor,unidad),A:toInches((torre?96:30)*factor,unidad),P:toInches(prof*factor,unidad)}, piezas,
    reglas:catalogo.reglas.filter(r=>r.tipo_mueble_id==null||r.tipo_mueble_id===tipo.id) as Regla[],
    overrides:{zocalo:4,PUERTA_SUP:toInches(puerta*factor,unidad),MO:18,horno_largo:24,horno_alto:15},
    preset:{caja:'C',refuerzo:'R',frente:'F',fondo:'B',gaveta:'C'},
    tablerosByCode:{C:{codigo:'C',espesor_mm:espesor,precio_m2:10},R:{codigo:'R',espesor_mm:espesor,precio_m2:10},F:{codigo:'F',espesor_mm:18,precio_m2:20},B:{codigo:'B',espesor_mm:6,precio_m2:5}},
    cantosByCalibre:new Proxy({}, {get:(_,key)=>({calibre:String(key),precio:1})}),herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,usaCarton:false,margen:0,trm:1,desperdicio:0,
  };
  calc.piezas=ajustarGavetasFe(calc.piezas,pref,calc.preset);
  const members:PreparedGroupMember[]=[{pref,permiteAgrupacion:false,calc}];
  const grupo=calcularGrupoFisico(members);
  return {calc,result:grupo.lineas[0],scene:construirVisualizacion(members,grupo)};
}

test('doce copias conservan las piezas fuera de las correcciones solicitadas',()=>{
  for(const base of bases) for(const suf of ['SM','SMG']) {
    const before=calcular(base),after=calcular(`${base}-${suf}`);
    // Los fijos y las cajas FE ahora tienen medidas nuevas por petición expresa.
    const permitidas=['puerta_inferior','frente_gaveta','entrepano_fijo',
      ...(base.startsWith('BOMH')?['frente_izq','frente_der','trasero_gaveta']:[]),
      ...(base.endsWith('-FE')?['lateral_gaveta_izq','lateral_gaveta_der','trasero_gaveta','contraparche']:[])];
    for(const p of before.result.piezas) {
      if(permitidas.includes(p.pieza) || (base.endsWith('-FE') && /^(lateral_gaveta|trasero_gaveta|contraparche)(_|$)/.test(p.pieza))) continue;
      const q=after.result.piezas.find(q=>q.pieza===p.pieza)!;
      assert.ok(q,`${base}-${suf}: ${p.pieza}`);
      assert.deepEqual([q.cant,q.largoIn,q.anchoIn,q.rol],[p.cant,p.largoIn,p.anchoIn,p.rol],`${base}-${suf}: ${p.pieza}`);
    }
    for(const p of before.scene.paneles.filter(p=>base.startsWith('BOMH')&&p.nombre==='refuerzo_delantero')) {
      const q=after.scene.paneles.find(q=>q.nombre===p.nombre)!;
      assert.deepEqual([q.x,q.y,q.z,q.w,q.d,q.h],[p.x,p.y,p.z,p.w,p.d,p.h],`${base}: parte superior intacta`);
    }
  }
});

test('fijos cortan exactamente las medidas de la base y refuerzos su largo por 80 mm',()=>{
  for(const pref of ['PC-MO','PC-MO-SM','PC-MO-SMG',...bases.filter(b=>b.startsWith('B')).flatMap(b=>[b+'-SM',b+'-SMG'])]) {
    for(const espesor of [15,18]) for(const prof of [18,21,24,27]) {
      const {result}=calcular(pref,espesor,36,'in',prof);
      const base=result.piezas.find(p=>p.pieza==='base'||p.pieza==='base_tapa')!;
      const fijo=result.piezas.find(p=>p.pieza==='entrepano_fijo')!;
      cerca(fijo.largoIn*25.4,base.largoIn*25.4);cerca(fijo.anchoIn*25.4,base.anchoIn*25.4);
      for(const r of result.piezas.filter(p=>/^refuerzo_delantero(?:_|$)/.test(p.pieza))) {
        cerca(r.largoIn*25.4,base.largoIn*25.4);cerca(r.anchoIn*25.4,80);
      }
    }
  }
});

test('SMG conserva aristas rectas y esquina superior completa con recorte 27 x 73',()=>{
  for(const base of bases) {
    const {scene}=calcular(base+'-SMG');
    for(const lateral of scene.paneles.filter(p=>p.funcion==='lateral')) {
      const outline=contornoLateral(lateral);
      assert.ok(outline.some(p=>p[1]===lateral.y&&p[2]===lateral.z+lateral.h),'esquina frontal superior');
      assert.ok(outline.some(p=>p[1]===lateral.y+lateral.d&&p[2]===lateral.z+lateral.h),'esquina trasera superior');
      let area=0;
      outline.forEach((p,i)=>{
        const q=outline[(i+1)%outline.length];
        assert.ok(p[1]===q[1]||p[2]===q[2],base+': arista diagonal');
        area+=p[1]*q[2]-q[1]*p[2];
      });
      cerca(Math.abs(area/2),lateral.d*lateral.h-27*73);
    }
  }
});

test('el recorte superior existente sigue quitando la esquina; sin fondo el fijo sigue la base',()=>{
  const lateral=calcular('PC-SMG').scene.paneles.find(p=>p.funcion==='lateral')!;
  const superior={...lateral,recortes:[{borde:'frontal_superior' as const,profundidad:27,alto:73}]};
  const outline=contornoLateral(superior);
  assert.ok(!outline.some(p=>p[1]===lateral.y&&p[2]===lateral.z+lateral.h));
  for(const pref of ['BMW-1-SM','BOMH-1-FE-SMG']) {
    const tipo=catalogo.tipos.find(t=>t.pref===pref)!;
    const originales=catalogo.piezas.filter(p=>p.tipo_mueble_id===tipo.id) as unknown as Pieza[];
    const ajustadas=ajustarEntrepanos(ajustarPiezasSinFondo(normalizarPlantillasFabricacion(originales,pref),pref,false),pref+'-SF');
    const base=ajustadas.find(p=>p.nombre==='base')!,fijo=ajustadas.find(p=>p.nombre==='entrepano_fijo')!;
    assert.equal(base.formula_ancho,'P-TC');assert.equal(fijo.formula_ancho,base.formula_ancho);
    assert.equal(fijo.formula_largo,base.formula_largo);
  }
});

test('BOMH superiores parten encima del fijo y terminan bajo el refuerzo de 80 mm',()=>{
  for(const base of ['BOMH-1','BOMH-1-FE']) for(const suf of ['SM','SMG']) for(const espesor of [15,18]) {
    const {scene}=calcular(base+'-'+suf,espesor);
    const fijo=scene.paneles.find(p=>p.nombre==='entrepano_fijo')!;
    const ref=scene.paneles.find(p=>p.nombre==='refuerzo_delantero')!;
    for(const frente of scene.paneles.filter(p=>['frente_izq','frente_der'].includes(p.nombre))) {
      cerca(frente.z,fijo.z+fijo.h);cerca(frente.z+frente.h,ref.z);
    }
    const trasero=scene.paneles.find(p=>p.funcion==='trasero_gaveta')!;
    cerca(trasero.h,base.endsWith('-FE')?80:68);
  }
});

test('BMW/BOMH FE: cajas pequeñas 100/80 mm, profundidad DB-FE y fondo 8 mm menor',()=>{
  for(const base of ['BMW-1-FE','BOMH-1-FE']) for(const suf of ['SM','SMG']) {
    for(const [prof,largo] of [[24,500],[23.999,450],[21,450],[20.999,350],[18,350],[27,500]]) {
      const {scene,result}=calcular(base+'-'+suf,15,36,'in',prof);
      const laterales=scene.paneles.filter(p=>p.funcion==='lateral_gaveta');
      assert.equal(laterales.length,2);
      for(const lateral of laterales){cerca(lateral.h,100);cerca(lateral.d,largo);}
      for(const p of result.piezas.filter(p=>p.pieza.startsWith('lateral_gaveta'))){cerca(p.largoIn*25.4,largo);cerca(p.anchoIn*25.4,100);}
      cerca(scene.paneles.find(p=>p.funcion==='base_gaveta')!.d,largo-8);
      cerca(scene.paneles.find(p=>p.funcion==='trasero_gaveta')!.h,80);
      cerca(scene.paneles.find(p=>p.funcion==='frente_interior')!.h,100);
    }
  }
});

test('PC SM/SMG: 30 mm entre puertas, fijo a 25/21 mm y regla superior a 36 pulgadas',()=>{
  for(const espesor of [15,18]) for(const suf of ['SM','SMG']) {
    const {scene}=calcular(`PC-${suf}`,espesor);
    const sup=scene.paneles.find(p=>p.nombre==='puerta_superior')!;
    const inf=scene.paneles.find(p=>p.nombre==='puerta_inferior')!;
    const fijo=scene.paneles.filter(p=>p.nombre==='base_tapa').sort((a,b)=>a.z-b.z)[1];
    cerca(sup.z-inf.z-inf.h,30);
    cerca(fijo.z-sup.z,suf==='SM'?25:21);
    const moviles=scene.paneles.filter(p=>p.nombre==='entrepano');
    assert.equal(moviles.filter(p=>p.z>=fijo.z+fijo.h).length,1);
    assert.equal(moviles.filter(p=>p.z+p.h<=fijo.z).length,3);
  }
});

test('SM: refuerzos verticales a 20 mm y golas horizontales pegadas sin retraso',()=>{
  for(const base of bases) for(const espesor of [15,18]) {
    const {scene}=calcular(`${base}-SM`,espesor);
    const refs=scene.paneles.filter(p=>p.nombre==='refuerzo_delantero_gola');
    const golas=scene.paneles.filter(p=>p.nombre==='gola_madera');
    assert.equal(refs.length,base==='PC-MO'?2:1);
    refs.forEach((r,i)=>{
      const g=golas[i]; cerca(r.y,20); cerca(r.h,80); cerca(r.d,espesor);
      cerca(g.y,0); cerca(g.d,80); cerca(g.h,espesor); cerca(g.z+g.h,r.z);
    });
    assert.equal(scene.avisos.filter(a=>/inválid|no finita/.test(a)).length,0,scene.avisos.join('\n'));
  }
});

test('PC-MO: vano medido desde debajo de la gola SM o puerta +10 SMG',()=>{
  for(const suf of ['SM','SMG']) for(const espesor of [15,18]) {
    const {scene}=calcular(`PC-MO-${suf}`,espesor);
    const fijos=scene.paneles.filter(p=>p.nombre==='entrepano_fijo').sort((a,b)=>a.z-b.z);
    const sup=scene.paneles.find(p=>p.nombre==='puerta_superior')!;
    const inf=scene.paneles.find(p=>p.nombre==='puerta_inferior')!;
    cerca(fijos[1].z-sup.z,25);
    const inicio=suf==='SM'?Math.max(...scene.paneles.filter(p=>p.nombre==='gola_madera').map(p=>p.z)):sup.z-10;
    cerca(inicio-fijos[0].z-fijos[0].h,18*25.4);
    cerca(fijos[0].z-inf.z-inf.h,30);
  }
});

test('BMW/BOMH: frente 30 mm debajo del fijo; SMG mecanizado exacto bajo el fijo',()=>{
  for(const base of bases) for(const suf of ['SM','SMG']) {
    const {scene,result}=calcular(`${base}-${suf}`);
    const fijoZ=result.vars.fijo_inferior_z*25.4;
    if(base.startsWith('B')) {
      const frente=scene.paneles.find(p=>p.nombre==='frente_gaveta')!;
      cerca(fijoZ-frente.z-frente.h,30);
    }
    const laterales=scene.paneles.filter(p=>p.funcion==='lateral');
    for(const p of laterales) {
      if(suf==='SM') { assert.equal(p.recortes,undefined); continue; }
      assert.equal(p.recortes?.length,1);
      const r=p.recortes![0]; cerca(r.profundidad,27); cerca(r.alto,73);
      cerca(p.z+r.z!+r.alto,fijoZ);
    }
  }
});

test('formularios y códigos reconocen torres nuevas, SF y huecos BOMH',()=>{
  for(const base of ['PC','PC-MO']) for(const suf of ['SM','SMG']) for(const sf of ['','-SF']) {
    const pref=`${base}-${suf}${sf}`;
    assert.equal(usaTkTorre(pref),true); assert.equal(usaPuertaSupTorre(pref),true);
    assert.equal(usaMoTorre(pref),base==='PC-MO'); assert.equal(altoPorDefectoIn(pref,'inferior'),null);
    const codigo=codigoComercial({pref,largo:30,alto:96,prof:24,unidad:'in',sistema:'imperial',zocaloIn:4});
    assert.ok(codigo.includes('309624'),codigo); assert.ok(codigo.endsWith('TK4'),codigo);
  }
  for(const suf of ['SM','SMG']) assert.equal(usaHuecoHornoParametrico(`BOMH-1-FE-${suf}`),true);
});

test('recorte frontal exige Z válida y BBL/SF se retiran del selector compartido',()=>{
  assert.throws(()=>validarMontaje({recorte:{borde:'frontal',profundidad:'27',alto:'73'}}));
  assert.throws(()=>validarMontaje({recorte:{borde:'frontal',profundidad:'27',alto:'73',z:'process.exit()'}}));
  assert.ok(validarMontaje({recorte:{borde:'frontal',profundidad:'27',alto:'73',z:'FI-73-Z'}}));
  const codigo=readFileSync('src/lib/cotizar.ts','utf8');
  assert.match(codigo,/TIPOLOGIAS_NO_COTIZABLES[\s\S]*?'BBL'[\s\S]*?'BBLFD-D-L\/R-SM-SF'/);
  const migration=readFileSync('db/migrations/0261_pc_bmw_bomh_sm_smg.sql','utf8');
  assert.match(migration,/replace\(pref,'PCFD-MO','PC-MO'\)/);
  assert.doesNotMatch(migration,/delete from public\.cot_tipos_mueble/);
});

test('gavetas BMW/BOMH SM quedan bajo la gola sin colisiones y sobre la base',()=>{
  for(const base of bases.filter(b=>b.startsWith('B'))) for(const espesor of [15,18]) {
    const {scene}=calcular(`${base}-SM`,espesor);
    const gola=scene.paneles.find(p=>p.nombre==='gola_madera')!;
    const piso=scene.paneles.find(p=>p.nombre==='base')!;
    const noCabe=base==='BMW-1-FE'&&espesor===18;
    assert.equal(scene.avisos.some(a=>a.includes('no cabe entre la base y la gola')),noCabe);
    for(const p of scene.paneles.filter(p=>p.cajon && p.funcion!=='frente_gaveta')) {
      if(!noCabe) assert.ok(p.z+p.h<=gola.z+0.001,`${base}: ${p.nombre} llega a ${p.z+p.h}; gola en ${gola.z}`);
      assert.ok(p.z>=piso.z+piso.h-0.001,`${base}: ${p.nombre} atraviesa la base`);
    }
  }
});

test('PC conserva cotas al usar alturas equivalentes en pulgadas, cm y mm',()=>{
  for(const pref of ['PC','PC-SM','PC-SMG','PC-MO-SM','PC-MO-SMG']) {
    const esperado=calcular(pref).scene;
    for(const unidad of ['mm','cm'] as const) {
      const actual=calcular(pref,15,36,unidad).scene;
      assert.equal(actual.paneles.length,esperado.paneles.length);
      actual.paneles.forEach((p,i)=>{
        const q=esperado.paneles[i];
        assert.equal(p.nombre,q.nombre);
        for(const eje of ['x','y','z','w','d','h'] as const) {
          assert.ok(Math.abs(p[eje]-q[eje])<1e-6,`${pref} ${unidad}: ${p.nombre} ${eje}`);
        }
      });
    }
  }
});

test('BBLFD sin fondo conserva Door y mano, añadiendo solo SF al código',()=>{
  for(const base of ['BBLFD','BBLFD-D-L/R-SM']) for(const doorHand of ['L','R'] as const) {
    const input={largo:42,alto:30,prof:24,unidad:'in' as const,sistema:'imperial' as const,door:17.875,doorHand};
    const con=codigoComercial({...input,pref:base});
    assert.equal(codigoComercial({...input,pref:base,conFondo:false}),con+'-SF');
    assert.equal(codigoComercial({...input,pref:base+'-SF',conFondo:false}),con+'-SF');
    assert.equal(usaPuertaParametrica(base+'-SF'),true);
  }
});
