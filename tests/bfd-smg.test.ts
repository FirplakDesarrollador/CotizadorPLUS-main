import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';

const piezas: Pieza[] = [
  { nombre:'base',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'P-0.70866-TB',cantos:{},visualizacion:{version:1,funcion:'base',plano:'XY',intercambiar:false,x:'TC',y:'0',z:'0',confirmado:true} },
  { nombre:'lateral',rol_tablero:'caja',formula_cantidad:'2',formula_largo:'A',formula_ancho:'P',cantos:{},visualizacion:{version:1,funcion:'lateral',plano:'YZ',intercambiar:false,x:'I*(L-TC)',y:'0',z:'0',confirmado:true,recorte:{borde:'frontal_superior',profundidad:'27',alto:'73'}} },
  { nombre:'refuerzo_delantero',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'80/25.4',cantos:{},visualizacion:{version:1,funcion:'travesano_frontal',plano:'XY',intercambiar:false,x:'TC',y:'27',z:'A-TC',confirmado:true} },
  { nombre:'refuerzo_trasero',rol_tablero:'refuerzo',formula_cantidad:'2',formula_largo:'L-2*TC',formula_ancho:'80/25.4',cantos:{} },
  { nombre:'entrepano',rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'L-2*TC-0.03937',formula_ancho:'P >= 23.5 ? 558.8/25.4 : (P <= 12.5 ? 266.7/25.4 : P-1.5)',cantos:{},visualizacion:{version:1,funcion:'estante',plano:'XY',intercambiar:false,confirmado:true} },
  { nombre:'frente',rol_tablero:'frente',formula_cantidad:'2',formula_largo:'(L-2*RV)/2',formula_ancho:'A-30/25.4',cantos:{} },
  { nombre:'fondo',rol_tablero:'fondo',formula_cantidad:'1',formula_largo:'A-0.07874',formula_ancho:'L-0.62992',cantos:{} },
];
const reglas: Regla[] = [
  {tipo_mueble_id:null,variable:'n_entrepanos',condicion:'true',valor:'1',prioridad:10},
  {tipo_mueble_id:null,variable:'n_puertas',condicion:'true',valor:'2',prioridad:10},
];
const input: CalcInput = {
  dims:{L:24,A:30,P:24},piezas,reglas,
  preset:{caja:'C',refuerzo:'C',frente:'F',fondo:'B'},
  tablerosByCode:{C:{codigo:'C',precio_m2:1,espesor_mm:15},F:{codigo:'F',precio_m2:1,espesor_mm:18},B:{codigo:'B',precio_m2:1,espesor_mm:6}},
  cantosByCalibre:{},herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,
  margen:0,margenHerraje:0,trm:1,desperdicio:0,
};
const mm=(value:number)=>value*25.4;
const approx=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<0.1,`${actual} ≈ ${expected}`);

test('BFD24-SMG reproduce las diez piezas de la hoja suministrada',()=>{
  const result=calcularMueble(input);
  assert.equal(result.piezas.reduce((sum,p)=>sum+p.cant,0),10);
  const p=Object.fromEntries(result.piezas.map(piece=>[piece.pieza,piece]));
  approx(mm(p.base.largoIn),579.6);approx(mm(p.base.anchoIn),585.6);
  approx(mm(p.lateral.largoIn),762);approx(mm(p.lateral.anchoIn),609.6);
  approx(mm(p.refuerzo_delantero.largoIn),579.6);approx(mm(p.refuerzo_delantero.anchoIn),80);
  approx(mm(p.refuerzo_trasero.largoIn),579.6);approx(mm(p.refuerzo_trasero.anchoIn),80);
  approx(mm(p.entrepano.largoIn),578.6);approx(mm(p.entrepano.anchoIn),558.8);
  approx(mm(p.frente.largoIn),301.6);approx(mm(p.frente.anchoIn),732);
  approx(mm(p.fondo.largoIn),760);approx(mm(p.fondo.anchoIn),593.6);
});

test('BFD-SMG visualiza mecanizados, refuerzo retirado, entrepaño y fondo',()=>{
  const member:PreparedGroupMember={pref:'BFD-SMG',permiteAgrupacion:false,calc:input};
  const scene=construirVisualizacion([member],calcularGrupoFisico([member]));
  const laterales=scene.paneles.filter(p=>p.funcion==='lateral');
  assert.equal(laterales.length,2);
  for(const lateral of laterales) assert.deepEqual(lateral.recorte,{borde:'frontal_superior',profundidad:27,alto:73});
  const rail=scene.paneles.find(p=>p.funcion==='travesano_frontal')!;
  approx(rail.y,27);approx(rail.d,80);
  assert.equal(scene.paneles.filter(p=>p.funcion==='estante').length,1);
  assert.equal(scene.paneles.filter(p=>p.funcion==='respaldo').length,1);
});
