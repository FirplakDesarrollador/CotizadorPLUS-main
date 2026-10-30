import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
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

test('SMG agrupa estructura, conserva frentes y mecanizados y omite fondo solo agrupado',()=>{
  const migration=readFileSync('db/migrations/0230_agrupacion_smg.sql','utf8');
  for(const pref of ['BFD-SMG','BFD-SMG-SF','SBFD-SMG','SBFD-SMG-SF']) assert.ok(migration.includes(`'${pref}'`));
  assert.match(migration,/permite_agrupacion=true/);
  assert.match(migration,/lateral_compartido/);
  assert.match(migration,/continua_opcional/);
  const structure=piezas.map((piece):Pieza=>({ ...piece,
    modo_agrupacion:piece.nombre==='lateral'?'lateral_compartido':piece.nombre==='refuerzo_delantero'?'continua_opcional':['base','refuerzo_trasero','fondo'].includes(piece.nombre)?'continua':'local',
    clave_fusion:piece.nombre==='refuerzo_delantero'?'refuerzo_frontal':piece.nombre,
    formula_largo_grupo:piece.nombre==='fondo'?'LG-TC':'LG-(2*TC)',
  }));
  const members:PreparedGroupMember[]=['BFD-SMG','SBFD-SMG'].map(pref=>({pref,permiteAgrupacion:true,omiteFondoSoloAgrupado:true,calc:{...input,piezas:pref.startsWith('SBFD')?structure.filter(p=>p.nombre!=='entrepano'):structure}}));
  const group=calcularGrupoFisico(members);
  const rows=group.lineas.flatMap(line=>line.piezas);
  assert.equal(rows.filter(p=>p.pieza==='lateral').reduce((s,p)=>s+p.cant,0),3);
  assert.equal(rows.filter(p=>p.pieza==='frente').reduce((s,p)=>s+p.cant,0),4);
  assert.equal(rows.some(p=>p.pieza==='fondo'),false);
  assert.ok(group.piezasContinuas.includes('base'));
  assert.ok(group.piezasContinuas.includes('refuerzo_frontal'));
  for(const row of rows.filter(p=>p.pieza==='base')) approx(mm(row.largoIn),1219.2-30);
  const scene=construirVisualizacion(members,group);
  for(const side of scene.paneles.filter(p=>p.funcion==='lateral')) assert.deepEqual(side.recorte,{borde:'frontal_superior',profundidad:27,alto:73});
  assert.throws(()=>calcularGrupoFisico([members[0],{...members[1],calc:{...members[1].calc,dims:{L:24,A:30,P:22}}}]),/profundidad/i);
  assert.throws(()=>calcularGrupoFisico(members.map(m=>({...m,calc:{...m.calc,dims:{L:60,A:30,P:24},tablerosByCode:{...m.calc.tablerosByCode,C:{...m.calc.tablerosByCode.C,formato:'183X244'}}}}))),/supera/);
});

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
