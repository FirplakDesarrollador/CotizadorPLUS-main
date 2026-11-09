import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirFilas, resultadoFisicoHdr, consolidarModulosHdr } from '../src/app/hdr/datosHdr';
import type { ModuloHDR } from '../src/app/hdr/actions';

const tableros=[{codigo:'C15',espesor_mm:15},{codigo:'F18',espesor_mm:18},{codigo:'F18OTRO',espesor_mm:18},{codigo:'F15',espesor_mm:15}];
function member(largo:number,frente='F18'):PreparedGroupMember {
  return {pref:'BFD',codigoModulo:`BFD${largo/10}`,permiteAgrupacion:true,calc:{dims:{L:largo/25.4,A:770/25.4,P:600/25.4},preset:{caja:'C15',refuerzo:'C15',frente},tablerosByCode:Object.fromEntries(tableros.map(t=>[t.codigo,{...t,precio_m2:100}])),piezas:[
    {nombre:'base',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'P-TC',modo_agrupacion:'continua',clave_fusion:'base',formula_largo_grupo:'LG-2*TC'},
    {nombre:'lateral',rol_tablero:'caja',formula_cantidad:'2',formula_largo:'A',formula_ancho:'P',modo_agrupacion:'lateral_compartido'},
    {nombre:'refuerzo_trasero',rol_tablero:'refuerzo',formula_cantidad:'2',formula_largo:'L-2*TC',formula_ancho:'80/25.4',modo_agrupacion:'continua',clave_fusion:'refuerzo_trasero',formula_largo_grupo:'LG-2*TC'},
    {nombre:'frente',rol_tablero:'frente',formula_cantidad:'1',formula_largo:'L-RV',formula_ancho:'A-RV',modo_agrupacion:'local'},
  ],reglas:[],overrides:{n_puertas:1},herrajesPlantilla:[],herrajesByCode:{},cantosByCalibre:{},consumiblesBySelector:{},etiquetasUnd:0,usaCarton:false,margen:0,trm:4000,desperdicio:0}};
}

test('HDR física BFD70 + BFD40 cuenta una base, tres laterales y dos refuerzos; rechaza fracciones por módulo', () => {
  const grupo=calcularGrupoFisico([member(700),member(400)]);
  assert.throws(()=>construirFilas({...grupo.lineas[0],trm:4000,margen:0},tableros),/fraccionaria/);
  const fisico=resultadoFisicoHdr(grupo,4000,0),filas=construirFilas(fisico,tableros);
  assert.equal(filas.filter(f=>f.pieza==='BASE').length,1);
  assert.equal(filas.filter(f=>f.pieza.startsWith('SIDE')).length,3);
  assert.equal(filas.filter(f=>f.pieza==='RAIL TRASERO').length,2);
  assert.equal(filas.find(f=>f.pieza==='BASE')?.origen,'Compartida del grupo');
  assert.ok(Math.abs(filas.find(f=>f.pieza==='BASE')!.largoMm-1070)<0.001);
  assert.ok(filas.filter(f=>f.pieza.startsWith('DOOR')).every(f=>f.origen?.startsWith('A')));
});

test('tres módulos con fracciones menores a media pieza conservan la base y el material de cada frente', () => {
  assert.throws(()=>calcularGrupoFisico([member(300,'F15'),member(400)]),/mismo espesor/);
  const grupo=calcularGrupoFisico([member(300,'F18OTRO'),member(400),member(300)]);
  const filas=construirFilas(resultadoFisicoHdr(grupo,4000,0),tableros);
  assert.equal(filas.filter(f=>f.pieza==='BASE').length,1);
  assert.equal(filas.filter(f=>f.pieza.startsWith('SIDE')).length,4);
  assert.equal(filas.filter(f=>f.pieza.startsWith('DOOR')&&f.espesorMm===18&&f.tableroCodigo==='F18OTRO').length,1);
  assert.equal(filas.filter(f=>f.pieza.startsWith('DOOR')&&f.espesorMm===18&&f.tableroCodigo==='F18').length,2);
});

test('las instrucciones de un grupo conservan el fondo y la tipología de cada integrante', () => {
  const a = member(700), b = member(400);
  a.calc.piezas.push({ nombre: 'fondo', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', modo_agrupacion: 'local' });
  const grupo = calcularGrupoFisico([a, b]);
  const original = construirFilas(resultadoFisicoHdr(grupo, 4000, 0), tableros);
  const filas = construirFilas(resultadoFisicoHdr(grupo, 4000, 0, ['BFD', 'BFD']), tableros);
  assert.ok(filas.some(f => f.pieza === 'BASE R17L'));
  assert.equal(filas.filter(f => f.pieza === 'SIDE R17L').length, 2);
  assert.equal(filas.filter(f => f.pieza === 'SIDE').length, 1);
  assert.deepEqual(filas.map(({ pieza: _pieza, ...datos }) => datos), original.map(({ pieza: _pieza, ...datos }) => datos));
  assert.equal(filas.filter(f => f.pieza.endsWith('R17L')).length, 3);
});

test('consolidación es estable, suma repeticiones una vez y conserva todos los orígenes', () => {
  const result=resultadoFisicoHdr(calcularGrupoFisico([member(700),member(400)]),4000,0);
  const a:ModuloHDR={lineaId:'a',codigoModulo:'GRUPO BFD70 + BFD40',nombreDescriptivo:'A1 y A2',cantidad:1,repeticionesArea:2,cocinaNombre:'A',grupoId:'g1',ok:true,result,origenes:[{lineaId:'a',codigoModulo:'BFD70',cantidad:1,repeticionesArea:2},{lineaId:'b',codigoModulo:'BFD40',cantidad:1,repeticionesArea:2}]};
  const b:ModuloHDR={...a,lineaId:'c',grupoId:'g2',repeticionesArea:3,origenes:[{lineaId:'c',codigoModulo:'BFD70',cantidad:1,repeticionesArea:3},{lineaId:'d',codigoModulo:'BFD40',cantidad:1,repeticionesArea:3}],result:{...result,piezas:[...result.piezas].reverse()}};
  const out=consolidarModulosHdr([a,b]);assert.equal(out.length,1);assert.equal(out[0].cantidad,5);assert.equal(out[0].origenes?.length,4);
  assert.deepEqual(consolidarModulosHdr(out),out);
  assert.deepEqual(out[0].ok&&out[0].result.piezas,result.piezas);
  const sinConsumo={...b,result:{...result,piezas:[...result.piezas,{...result.piezas[0],pieza:'no_fabricada',cant:0,largoIn:999}],maderaPorRol:[...result.maderaPorRol,{rol:'sin_consumo',codigo:'NO_USADO',cm2:0,m2:0,costo:0}],herrajes:[...result.herrajes,{rol:'no_usado',codigo:'NO_USADO',cant:0,precio:1,costo:0}]}};
  assert.equal(consolidarModulosHdr([a,sinConsumo]).length,1,'una pieza o material sin consumo no cambia la fabricación');
  for(const distinto of [{...b,nombreDescriptivo:'Otra nota'},{...b,result:{...result,herrajes:[{rol:'riel',codigo:'OTRO',cant:1,precio:1,costo:1}]}},{...b,result:{...result,piezas:result.piezas.map((p,i)=>i? p:{...p,largoIn:p.largoIn+0.01})}}])assert.equal(consolidarModulosHdr([a,distinto]).length,2);
});
