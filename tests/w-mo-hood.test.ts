import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '@/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '@/lib/group-engine';
import { construirVisualizacion } from '@/lib/visualizacion';
import { codigoComercial } from '@/lib/module-groups';
import { esMuebleSuperior, usaMedidasMoHood } from '@/lib/muebles';

const pieces: Pieza[] = [
  { nombre:'base',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'P+5.11811',modo_agrupacion:'continua',clave_fusion:'base_tapa',formula_largo_grupo:'LG-(2*TC)',visualizacion:{version:1,funcion:'base',plano:'XY',y:'P-D',z:'HOOD',confirmado:true} },
  { nombre:'tapa',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'P',modo_agrupacion:'local',visualizacion:{version:1,funcion:'tapa',plano:'XY',confirmado:true} },
  { nombre:'lateral',rol_tablero:'caja',formula_cantidad:'2',formula_largo:'A',formula_ancho:'P',modo_agrupacion:'lateral_compartido',visualizacion:{version:1,funcion:'lateral',plano:'YZ',confirmado:true} },
  { nombre:'refuerzo_trasero',rol_tablero:'refuerzo',formula_cantidad:'2',formula_largo:'L-2*TC',formula_ancho:'80/25.4',modo_agrupacion:'continua',clave_fusion:'refuerzo_trasero',formula_largo_grupo:'LG-(2*TC)',visualizacion:{version:1,funcion:'travesano_posterior',plano:'XZ',z:'I===0 ? A-H : HOOD+TC',confirmado:true} },
  { nombre:'entrepano',rol_tablero:'refuerzo',formula_cantidad:'n_entrepanos-1',formula_largo:'L-2*TC',formula_ancho:'P-1.5',modo_agrupacion:'local',visualizacion:{version:1,funcion:'estante',plano:'XY',z:'MO+HOOD+TC+(I+1)*(A-MO-HOOD-2*TC-H)/(N+1)',confirmado:true} },
  { nombre:'entrepano_fijo',rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'P-0.905512',modo_agrupacion:'local',visualizacion:{version:1,funcion:'estante',plano:'XY',y:'0',z:'MO+HOOD',confirmado:true} },
  { nombre:'frente',rol_tablero:'frente',formula_cantidad:'n_puertas',formula_largo:'(L-n_puertas*RV)/n_puertas',formula_ancho:'A-MO-HOOD-RV',modo_agrupacion:'local',visualizacion:{version:1,funcion:'frente',plano:'XZ',z:'MO+HOOD',confirmado:true} },
  { nombre:'fondo',rol_tablero:'fondo',formula_cantidad:'1',formula_largo:'A-HOOD-0.62992',formula_ancho:'L+0.370079',modo_agrupacion:'continua',clave_fusion:'fondo',formula_largo_grupo:'LG-TC',visualizacion:{version:1,funcion:'respaldo',plano:'XZ',intercambiar:true,y:'P-TC-TB',z:'HOOD',confirmado:true} },
];
const rules: Regla[] = [
  { variable:'n_puertas',condicion:'true',valor:'2',prioridad:1,tipo_mueble_id:null },
  { variable:'n_entrepanos',condicion:'A-MO-HOOD <= 16',valor:'1',prioridad:1,tipo_mueble_id:'w-mo-hood' },
  { variable:'n_entrepanos',condicion:'A-MO-HOOD <= 24',valor:'2',prioridad:2,tipo_mueble_id:'w-mo-hood' },
  { variable:'n_entrepanos',condicion:'A-MO-HOOD <= 36',valor:'3',prioridad:3,tipo_mueble_id:'w-mo-hood' },
  { variable:'n_entrepanos',condicion:'true',valor:'4',prioridad:4,tipo_mueble_id:'w-mo-hood' },
];
const calc: CalcInput = {
  dims:{L:30,A:36,P:12},piezas:pieces,reglas:rules,overrides:{MO:8,HOOD:4},
  preset:{caja:'C15',refuerzo:'C15',frente:'F18',fondo:'B6'},
  tablerosByCode:{
    C15:{codigo:'C15',precio_m2:1,espesor_mm:15,formato:'183X244'},
    F18:{codigo:'F18',precio_m2:1,espesor_mm:18,formato:'183X244'},
    B6:{codigo:'B6',precio_m2:1,espesor_mm:6,formato:'183X244'},
  },cantosByCalibre:{},herrajesByCode:{},consumiblesBySelector:{},
  etiquetasUnd:0,usaCarton:false,margen:0,trm:1,desperdicio:0,
};

test('W-MO-HOOD calcula puerta, base profunda y espacios MO/HOOD',()=>{
  const result=calcularMueble(calc);
  const piece=(name:string)=>result.piezas.find(p=>p.pieza===name)!;
  assert.ok(Math.abs(piece('base').anchoIn-(12+5.11811))<0.000001);
  assert.ok(Math.abs(piece('frente').anchoIn-(36-8-4-(3.2/25.4)))<0.000001);

  const member:PreparedGroupMember={pref:'W-MO-HOOD',permiteAgrupacion:true,calc};
  const scene=construirVisualizacion([member],calcularGrupoFisico([member]));
  const base=scene.paneles.find(p=>p.nombre==='base')!;
  const fixed=scene.paneles.find(p=>p.nombre==='entrepano_fijo')!;
  const shelves=scene.paneles.filter(p=>p.nombre==='entrepano');
  const backing=scene.paneles.find(p=>p.nombre==='fondo')!;
  const rails=scene.paneles.filter(p=>p.nombre==='refuerzo_trasero').sort((a,b)=>a.z-b.z);
  const doors=scene.paneles.filter(p=>p.nombre==='frente');
  assert.ok(Math.abs(base.z-4*25.4)<0.1);
  assert.ok(Math.abs(base.y+5.11811*25.4)<0.1,'la extensión de la base debe salir hacia el frente');
  assert.ok(Math.abs(fixed.z-12*25.4)<0.1);
  assert.equal(fixed.y,0,'el entrepaño fijo debe iniciar detrás de los frentes');
  assert.equal(shelves.length,1,'el vano interno de 24 in debe producir un entrepaño móvil');
  assert.ok(shelves[0].z>fixed.z+fixed.h && shelves[0].z+shelves[0].h<36*25.4-15);
  assert.ok(Math.abs(backing.z-4*25.4)<0.1);
  assert.ok(Math.abs(rails[0].z-(4*25.4+15))<0.1,'el refuerzo inferior debe quedar sobre la base');
  assert.ok(doors.every(door=>Math.abs(door.z-fixed.z)<0.1));
  assert.ok(doors.every(door=>Math.abs(door.z+door.h-(36*25.4-3.2))<0.1));
});

test('W-MO-HOOD queda registrado en migración, formularios y código comercial',()=>{
  const migration=fs.readFileSync('db/migrations/0211_w_mo_hood.sql','utf8');
  const simulator=fs.readFileSync('src/app/cotizador/CotizadorForm.tsx','utf8');
  const quoteForm=fs.readFileSync('src/app/cotizaciones/[id]/AddLineForm.tsx','utf8');
  assert.match(migration,/where pref='UW'/);
  assert.match(migration,/P\+5\.11811/);
  assert.match(migration,/A-MO-HOOD-RV/);
  const correction=fs.readFileSync('db/migrations/0212_w_mo_hood_montaje.sql','utf8');
  assert.match(correction,/A-HOOD-0\.62992/);
  assert.match(correction,/'y','P-D'/);
  assert.match(correction,/A-MO-HOOD <= 24/);
  assert.match(simulator,/Field label="MO"/);
  assert.match(simulator,/Field label="HOOD"/);
  assert.ok(simulator.indexOf('Field label="MO"') < simulator.indexOf('<div data-tour="tableros"'), 'MO y HOOD deben aparecer antes de Tableros en el Simulador');
  assert.match(simulator,/tipoActual\?\.pref_imperial/);
  assert.match(quoteForm,/L label="MO"/);
  assert.match(quoteForm,/L label="HOOD"/);
  assert.ok(quoteForm.indexOf('L label="MO"') < quoteForm.indexOf('L label="Cantidad"'), 'MO y HOOD deben aparecer en la fila principal de medidas');
  assert.equal(usaMedidasMoHood('W-MO-HOOD'),true);
  assert.equal(usaMedidasMoHood(' w-mo-hood '),true);
  assert.equal(esMuebleSuperior('W-MO-HOOD'),true);
  assert.equal(codigoComercial({pref:'W-MO-HOOD',largo:30,alto:36,prof:12,unidad:'in',sistema:'imperial'}),'W303612-MO-HOOD');
});
