import assert from 'node:assert/strict';
import test from 'node:test';
import { type CalcInput, type Canto, type Pieza } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { orientarPieza } from '../src/lib/muebles';
import { construirVisualizacion } from '../src/lib/visualizacion';

const piezas: Pieza[] = [
  { nombre:'lateral',rol_tablero:'caja',formula_cantidad:'2',formula_largo:'A',formula_ancho:'P',visualizacion:{version:1,funcion:'lateral',plano:'YZ',intercambiar:false,confirmado:true} },
  { nombre:'refuerzo_delantero',rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'L-door-(RV/4)-(3*TC/2)',formula_ancho:'80/25.4',tarugos:4,visualizacion:{version:1,funcion:'travesano_frontal',plano:'XY',intercambiar:false,confirmado:true} },
  { nombre:'refuerzo_vertical',rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'A-TC',formula_ancho:'80/25.4',tarugos:4,visualizacion:{version:1,funcion:'travesano_frontal',plano:'YZ',intercambiar:false,confirmado:true} },
  { nombre:'refuerzo_delantero',rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'80/25.4',formula_ancho:'door+(RV/4)-(3*TC/2)',tarugos:4,visualizacion:{version:1,funcion:'travesano_frontal',plano:'XZ',intercambiar:true,y:'20',z:'A-H',confirmado:true} },
  { nombre:'gola_madera',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'door+(RV/4)-(3*TC/2)',formula_ancho:'80/25.4',tarugos:4,visualizacion:{version:1,funcion:'gola',plano:'XY',intercambiar:false,y:'0',z:'A-80-TC',confirmado:true} },
  { nombre:'blind door',rol_tablero:'frente',formula_cantidad:'1',formula_largo:'L-door-(RV/2)',formula_ancho:'A',visualizacion:{version:1,funcion:'frente_falso',plano:'XZ',intercambiar:false,confirmado:true} },
  { nombre:'frente',rol_tablero:'frente',formula_cantidad:'1',formula_largo:'door-RV',formula_ancho:'A-(30/25.4)',visualizacion:{version:1,funcion:'frente',plano:'XZ',intercambiar:false,confirmado:true} },
];

function escena(manoDerecha:number){
  const calc:CalcInput={
    dims:{L:42,A:30,P:24},piezas,reglas:[],overrides:{door:17.875,mano_derecha:manoDerecha,gola:1,n_puertas:1},
    preset:{caja:'CAJA',refuerzo:'REF',frente:'FRENTE'},
    tablerosByCode:{CAJA:{codigo:'CAJA',precio_m2:1,espesor_mm:15},REF:{codigo:'REF',precio_m2:1,espesor_mm:15},FRENTE:{codigo:'FRENTE',precio_m2:1,espesor_mm:18}},
    cantosByCalibre:new Proxy({}, {get:(_,key)=>({calibre:String(key),precio:1})}) as Record<string,Canto>,
    herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,usaCarton:false,margen:0,trm:1,desperdicio:0,
  };
  const member:PreparedGroupMember={pref:'BBLFD-D-L/R-SM',permiteAgrupacion:false,calc};
  const group=calcularGrupoFisico([member]);
  return {scene:construirVisualizacion([member],group),despiece:group.lineas[0]};
}

for(const [mano,manoDerecha] of [['R',1],['L',0]] as const){
  test(`BBLFD-D-L/R-SM ${mano}: refuerzos terminan en el montante y la Gola queda debajo`,()=>{
    const {scene,despiece}=escena(manoDerecha);
    const vertical=scene.paneles.find(p=>p.nombre==='refuerzo_vertical')!;
    const refuerzos=scene.paneles.filter(p=>p.nombre==='refuerzo_delantero');
    const horizontal=refuerzos.find(p=>Math.abs(p.d-80)<0.1 && Math.abs(p.h-15)<0.1)!;
    const adicional=refuerzos.find(p=>Math.abs(p.h-80)<0.1)!;
    const gola=scene.paneles.find(p=>p.nombre==='gola_madera')!;
    const frente=scene.paneles.find(p=>p.nombre==='frente')!;

    assert.ok(Math.abs(vertical.h-747)<0.1,'refuerzo vertical = A-TC');
    assert.ok(Math.abs(vertical.d-80)<0.1,'todos los refuerzos tienen 80mm');
    assert.equal(vertical.x<adicional.x,mano==='R');
    if(mano==='R'){
      assert.ok(Math.abs(horizontal.x+horizontal.w-vertical.x)<0.1);
      assert.ok(Math.abs(vertical.x+vertical.w-adicional.x)<0.1);
    }else{
      assert.ok(Math.abs(adicional.x+adicional.w-vertical.x)<0.1);
      assert.ok(Math.abs(vertical.x+vertical.w-horizontal.x)<0.1);
    }
    assert.ok(Math.abs(adicional.y-20)<0.1);
    assert.ok(Math.abs(gola.x-adicional.x)<0.1 && Math.abs(gola.w-adicional.w)<0.1);
    assert.ok(Math.abs(gola.y)<0.1,'Gola pegada a la cara interna del frente');
    assert.ok(Math.abs(gola.z+gola.h-adicional.z)<0.1,'Gola pegada bajo el refuerzo adicional');
    assert.ok(Math.abs(frente.h-732)<0.1,'puerta = A-30mm');
    assert.ok(Math.abs(frente.w-(17.875*25.4-3.2))<0.1,'puerta = Door-3.2mm');
    const blind=scene.paneles.find(p=>p.nombre==='blind door')!;
    assert.ok(Math.abs(blind.h-762)<0.1,'Blind Door usa el alto del módulo');
    assert.ok(Math.abs(blind.w-(42*25.4-17.875*25.4-1.6))<0.1,'Blind Door descuenta solo 1.6mm');
    const frenteTabla=orientarPieza(despiece.piezas.find(p=>p.pieza==='frente')!);
    const blindTabla=orientarPieza(despiece.piezas.find(p=>p.pieza==='blind door')!);
    assert.ok(Math.abs(frenteTabla.largoIn*25.4-732)<0.1,'tabla: Largo del frente sale de A-30mm');
    assert.ok(Math.abs(blindTabla.largoIn*25.4-762)<0.1,'tabla: Largo de Blind Door sale de A');
    const izquierda=mano==='R'?blind:frente;
    const derecha=mano==='R'?frente:blind;
    assert.ok(Math.abs(derecha.x-(izquierda.x+izquierda.w)-1.6)<0.1,'separación entre frentes = 1.6mm');
    assert.ok(scene.paneles.every(p=>p.confirmado));
  });
}
