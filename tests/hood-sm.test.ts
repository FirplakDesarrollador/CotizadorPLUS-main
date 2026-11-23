import test from 'node:test';
import assert from 'node:assert/strict';
import { usaHoodSm, validarHoodSm } from '../src/lib/hood-sm';
import { codigoComercial, convertirExacto } from '../src/lib/module-groups';
import fs from 'node:fs';
import { type CalcInput, type Pieza } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { getModuloValues, initialModuloValues, useSimuladorStore } from '../src/store/simuladorStore';

const piezas=JSON.parse(fs.readFileSync('tests/fixtures/hood-sm.json','utf8')) as Record<string,Pieza[]>;
function member(pref:string,alto=70,hood=15,free=5):PreparedGroupMember {
  const medidas=validarHoodSm(alto,hood,free);
  const calc:CalcInput={
    dims:{L:650/25.4,A:medidas.altoCarcasa*10/25.4,P:350/25.4},
    piezas:piezas[pref],reglas:[],overrides:{n_puertas:pref.startsWith('TW')?1:2,HOOD:hood*10/25.4,FREE:free*10/25.4},
    preset:{caja:'C15',refuerzo:'C15',frente:'F18',fondo:'B6'},
    tablerosByCode:{C15:{codigo:'C15',espesor_mm:15,precio_m2:1,formato:'183X244'},F18:{codigo:'F18',espesor_mm:18,precio_m2:1},B6:{codigo:'B6',espesor_mm:6,precio_m2:1}},
    cantosByCalibre:{'19X0,45':{calibre:'19x0,45',precio:1},'19X2':{calibre:'19x2',precio:1},'22X1':{calibre:'22x1',precio:1}},herrajesByCode:{},consumiblesBySelector:{tarugo:2},etiquetasUnd:0,margen:0,trm:4000,desperdicio:0,
  };
  return {pref,permiteAgrupacion:true,calc};
}
const approx=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<0.001,`${actual} ≈ ${expected}`);

test('HOOD de SM solo se aplica a las dos nuevas tipologías',()=>{
  for(const pref of ['TW-SM-HOOD','W-SM-HOOD',' tw-sm-hood ']) assert.equal(usaHoodSm(pref),true);
  for(const pref of ['W-MO-HOOD','W-SM','TW-SM-PUSH','BFD-SMG',null]) assert.equal(usaHoodSm(pref),false);
});
test('HOOD es obligatorio, finito, no negativo y menor que el alto',()=>{
  for(const hood of [undefined,NaN,Infinity,-1,70,80]) assert.throws(()=>validarHoodSm(70,hood,0),/HOOD/);
  for(const hood of [0,15,69]) assert.doesNotThrow(()=>validarHoodSm(70,hood,0));
  assert.throws(()=>validarHoodSm(NaN,15,0),/HOOD/);
  assert.equal(convertirExacto(70,'cm','mm')-convertirExacto(15,'cm','mm'),550);
});
test('FREE determina la parte visible y descuenta el frente falso',()=>{
  assert.deepEqual(validarHoodSm(70,35,10),{altoCarcasa:35,altoFrenteFalsoBajoCarcasa:25});
  assert.deepEqual(validarHoodSm(700,350,100),{altoCarcasa:350,altoFrenteFalsoBajoCarcasa:250});
  assert.deepEqual(validarHoodSm(70,35,35),{altoCarcasa:35,altoFrenteFalsoBajoCarcasa:0});
  for(const free of [undefined,NaN,Infinity,-1,36]) assert.throws(()=>validarHoodSm(70,35,free),/FREE/);
});
test('ambas familias conservan alto, profundidad y espesor en su código',()=>{
  for(const pref of ['TW-SM-HOOD','W-SM-HOOD']) {
    const value=codigoComercial({pref,largo:65,alto:70,prof:35,unidad:'cm',sistema:'metrico',espesorCajaMm:15,espesorFrenteMm:15});
    assert.equal(value,`${pref.startsWith('TW')?'TW':'W'}657035-SM15-HOOD`);
  }
});

test('la carcasa reproduce la hoja y ambas plantillas solo difieren en sus puertas',()=>{
  assert.deepEqual(piezas['TW-SM-HOOD'],piezas['W-SM-HOOD']);
  for(const pref of Object.keys(piezas)) {
    const m=member(pref),group=calcularGrupoFisico([m]);
    const rows=group.lineas[0].piezas;
    const row=(name:string)=>rows.find(p=>p.pieza===name)!;
    for(const name of ['base','tapa','refuerzo_trasero','gola_madera','entrepano_fijo']) approx(row(name).largoIn*25.4,620);
    approx(row('base').anchoIn*25.4,350);
    approx(row('lateral').largoIn*25.4,550);
    approx(row('entrepano_fijo').anchoIn*25.4,327);
    approx(row('frente').anchoIn*25.4,370.85);
    approx(row('frente_falso').anchoIn*25.4,245.95);
    approx(row('fondo').largoIn*25.4,534);
    approx(row('fondo').anchoIn*25.4,634);
    assert.equal(row('frente').cant,pref.startsWith('TW')?1:2);
    approx(row('frente').largoIn*25.4,pref.startsWith('TW')?646.8:321.8);
    const scene=construirVisualizacion([m],group);
    assert.deepEqual(scene.avisos,[]);
    assert.equal(scene.paneles.length,pref.startsWith('TW')?11:12);
    const door=scene.paneles.find(p=>p.nombre==='frente')!;
    approx(door.z,175.95);approx(door.z+door.h,546.8);
  }
});

test('70 / 35 / 10 agrega el tramo superior manteniendo FREE visible',()=>{
  for(const pref of Object.keys(piezas)) {
    const m=member(pref,70,35,10),group=calcularGrupoFisico([m]);
    const scene=construirVisualizacion([m],group);
    const falseFront=scene.paneles.find(p=>p.nombre==='frente_falso')!;
    approx(scene.paneles.find(p=>p.nombre==='lateral')!.h,350);
    approx(scene.modulos[0].alto,700);approx(scene.modulos[0].z,-350);
    approx(falseFront.h,395.95);approx(falseFront.z,-250);approx(falseFront.z+falseFront.h,145.95);
    for (const door of scene.paneles.filter(p=>p.nombre==='frente')) approx(door.z-(falseFront.z+falseFront.h),30);
    approx(350+falseFront.z,100);
    assert.deepEqual(scene.avisos,[]);
    assert.ok(group.lineas[0].piezas.every(p=>p.largoIn>0 && p.anchoIn>0));
  }
});

test('la extensión reproduce el IGES y aumenta madera, canto y precio',()=>{
  for(const pref of Object.keys(piezas)) {
    const m=member(pref,70.5,15.5,0),group=calcularGrupoFisico([m]);
    const scene=construirVisualizacion([m],group);
    const falseFront=scene.paneles.find(p=>p.nombre==='frente_falso')!;
    approx(falseFront.h,300.95);approx(falseFront.z,-155);
    const baseline=calcularGrupoFisico([{...m,calc:{...m.calc,piezas:m.calc.piezas.map(p=>p.nombre==='frente_falso'?{...p,formula_ancho:'HOOD-FREE'}:p)}}]);
    const material=(r:typeof group)=>r.lineas[0].maderaPorRol.find(p=>p.rol==='frente')!;
    assert.ok(Math.abs(material(group).cm2-material(baseline).cm2-646.8*145.95/100)<0.02);
    assert.ok(group.lineas[0].costoCanto>baseline.lineas[0].costoCanto);
    assert.ok(group.lineas[0].precioCop>baseline.lineas[0].precioCop);
  }
});

test('FREE igual a HOOD conserva el tramo superior y agrupación comparte estructura',()=>{
  const full=member('TW-SM-HOOD',70,15,15);
  const fullResult=calcularGrupoFisico([full]);
  assert.equal(fullResult.lineas[0].piezas.find(p=>p.pieza==='frente_falso')?.cant,1);
  const upperOnly=construirVisualizacion([full],fullResult).paneles.find(p=>p.nombre==='frente_falso')!;
  approx(upperOnly.h,145.95);approx(upperOnly.z,0);
  const members=[member('TW-SM-HOOD'),member('W-SM-HOOD')];
  const result=calcularGrupoFisico(members);
  approx(result.lineas.flatMap(l=>l.piezas).filter(p=>p.pieza==='lateral').reduce((s,p)=>s+p.cant,0),3);
  assert.ok(result.piezasContinuas.includes('base_tapa'));
  const scene=construirVisualizacion(members,result);
  assert.equal(scene.paneles.filter(p=>p.nombre==='frente').length,3);
  assert.equal(scene.paneles.filter(p=>p.nombre==='frente_falso').length,2);
});

test('FREE se conserva en el módulo y en deshacer/rehacer del simulador',()=>{
  const values={...initialModuloValues,hood:'35',free:'10'};
  assert.equal(getModuloValues(values).free,'10');
  const store=useSimuladorStore;
  store.getState().resetSimuladorState();
  store.getState().setSimuladorState(values);
  store.getState().setSimuladorState({free:'12'});
  store.getState().undo();assert.equal(store.getState().free,'10');
  store.getState().redo();assert.equal(store.getState().free,'12');
  store.getState().resetSimuladorState();
});

test('HOOD completo consume 46 tarugos, con entrepaño fijo y frente falso sujetos',()=>{
  for(const pref of Object.keys(piezas)) {
    const m=member(pref);
    const result=calcularGrupoFisico([m]).lineas[0];
    assert.equal(result.cantidadesConsumibles.tarugos,46,pref);
    assert.equal(result.consumibles.tarugos,92,'46 unidades por precio de tarugo 2');
    assert.equal(result.cantidadesConsumibles.soportes,0,'el entrepaño fijo no usa soportes móviles');
    assert.equal(m.calc.piezas.find(p=>p.nombre==='entrepano_fijo')!.tarugos,8);
    assert.equal(m.calc.piezas.find(p=>p.nombre==='frente_falso')!.tarugos,10);
    assert.equal(m.calc.piezas.find(p=>p.nombre==='gola_madera')!.tarugos,4);
    const sinFrentes=calcularGrupoFisico([{...m,calc:{...m.calc,modoFrentes:'sin_frentes'}}]).lineas[0];
    assert.equal(sinFrentes.cantidadesConsumibles.tarugos,36);
    const soloFrentes=calcularGrupoFisico([{...m,calc:{...m.calc,modoFrentes:'solo_frentes'}}]).lineas[0];
    assert.equal(soloFrentes.cantidadesConsumibles.tarugos,10);
  }
  const grouped=calcularGrupoFisico([member('TW-SM-HOOD'),member('W-SM-HOOD')]);
  assert.equal(grouped.lineas.reduce((s,l)=>s+l.cantidadesConsumibles.tarugos,0),78,
    'mantiene las reglas de uniones compartidas; no fuerza 46 en cada asignación de grupo');
});
