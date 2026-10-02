import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Canto, type Pieza } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';

const piezas: Pieza[] = [
  { nombre:'base', rol_tablero:'caja', formula_cantidad:'1', formula_largo:'L-2*TC', formula_ancho:'P-TC', cantos:{calibre:'19x0,45',largos:2,anchos:0}, visualizacion:{version:1,funcion:'base',plano:'XY',intercambiar:false,z:'0',confirmado:true} },
  { nombre:'lateral', rol_tablero:'caja', formula_cantidad:'2', formula_largo:'A', formula_ancho:'P', cantos:{calibre:'19x0,45',largos:2,anchos:2}, visualizacion:{version:1,funcion:'lateral',plano:'YZ',intercambiar:false,confirmado:true} },
  { nombre:'refuerzo_trasero', rol_tablero:'refuerzo', formula_cantidad:'2', formula_largo:'L-2*TC', formula_ancho:'80/25.4', cantos:{calibre:'19x0,45',largos:2,anchos:0}, visualizacion:{version:1,funcion:'travesano_posterior',plano:'XZ',intercambiar:false,z:'I===0 ? TC : A-H',confirmado:true} },
  { nombre:'refuerzo_delantero', rol_tablero:'caja', formula_cantidad:'1', formula_largo:'L-2*TC', formula_ancho:'80/25.4', cantos:{calibre:'19x0,45',largos:2,anchos:0}, visualizacion:{version:1,funcion:'travesano_frontal',plano:'XZ',intercambiar:false,y:'0',z:'A-H',confirmado:true} },
  { nombre:'frente', rol_tablero:'frente', formula_cantidad:'1', formula_largo:'A-RV', formula_ancho:'L-RV', cantos:{calibre:'22x1',largos:2,anchos:2}, visualizacion:{version:1,funcion:'frente',plano:'XZ',intercambiar:true,y:'-EP',z:'0',confirmado:true} },
];

const calc: CalcInput = {
  dims:{L:24,A:30,P:24}, piezas, reglas:[], preset:{caja:'CAJA',refuerzo:'REF',frente:'FRENTE'},
  tablerosByCode:{CAJA:{codigo:'CAJA',precio_m2:1,espesor_mm:15},REF:{codigo:'REF',precio_m2:1,espesor_mm:15},FRENTE:{codigo:'FRENTE',precio_m2:1,espesor_mm:18}},
  cantosByCalibre:new Proxy({}, {get:(_,key)=>({calibre:String(key),precio:1})}) as Record<string,Canto>,
  herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,usaCarton:false,margen:0,trm:1,desperdicio:0,
};

test('BOV24 reproduce las siete piezas y medidas de la hoja real',()=>{
  const result=calcularMueble(calc);
  assert.equal(result.piezas.reduce((sum,p)=>sum+p.cant,0),7);
  const expected:Record<string,[number,number,number]>={
    base:[1,579.6,594.6], lateral:[2,762,609.6], refuerzo_trasero:[2,579.6,80],
    refuerzo_delantero:[1,579.6,80], frente:[1,758.8,606.4],
  };
  for(const p of result.piezas){
    const [cantidad,largo,ancho]=expected[p.pieza];
    assert.equal(p.cant,cantidad,p.pieza);
    assert.ok(Math.abs(p.largoIn*25.4-largo)<0.1,`${p.pieza} largo`);
    assert.ok(Math.abs(p.anchoIn*25.4-ancho)<0.1,`${p.pieza} ancho`);
  }
});

test('BOV24 visualiza siete paneles y separa los dos rails traseros',()=>{
  const member:PreparedGroupMember={pref:'BOV',permiteAgrupacion:false,calc};
  const scene=construirVisualizacion([member],calcularGrupoFisico([member]));
  assert.equal(scene.paneles.length,7);
  assert.equal(scene.paneles.filter(p=>p.nombre==='lateral').length,2);
  const traseros=scene.paneles.filter(p=>p.nombre==='refuerzo_trasero').sort((a,b)=>a.z-b.z);
  assert.equal(traseros.length,2);
  assert.ok(traseros[1].z>traseros[0].z,'los rails traseros deben ocupar niveles distintos');
  assert.equal(scene.paneles.filter(p=>p.nombre==='refuerzo_delantero').length,1);
  assert.equal(scene.paneles.filter(p=>p.nombre==='frente').length,1);
  assert.ok(scene.paneles.every(p=>p.confirmado));
});
