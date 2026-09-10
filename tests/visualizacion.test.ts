import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { inferirMontaje, validarMontaje } from '../src/lib/visualizacion-config';
import { type Pieza, type Regla, type Tablero } from '../src/lib/engine';

const data=JSON.parse(fs.readFileSync('tests/fixtures/catalogo-visualizacion.json','utf8')) as {
  tipos:{id:string;pref:string;permite_agrupacion:boolean}[];
  piezas:(Pieza&{tipo_mueble_id:string})[];reglas:Regla[];preset:Record<string,string>;tableros:Tablero[];
};
function member(pref:string,overrides:Record<string,number>={}):PreparedGroupMember {
  const tipo=data.tipos.find(t=>t.pref===pref)!;
  const tall=['PC','PCFD','VPC','OVPC','WPC','AL','CC'].includes(pref);
  return {pref,permiteAgrupacion:tipo.permite_agrupacion,calc:{
    dims:{L:pref==='SDB'?72:/^BBL/.test(pref)?60:36,A:tall?84:30,P:24},
    piezas:data.piezas.filter(p=>p.tipo_mueble_id===tipo.id).map(p=>({...p,visualizacion:inferirMontaje(p)})),
    reglas:data.reglas.filter(r=>!r.tipo_mueble_id||r.tipo_mueble_id===tipo.id),overrides,
    preset:data.preset,tablerosByCode:Object.fromEntries(data.tableros.map(t=>[t.codigo,t])),
    cantosByCalibre:{},herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,usaCarton:false,
    margen:0,trm:1,desperdicio:0,
  }};
}
for(const tipo of data.tipos) test(`${tipo.pref}: escena finita conserva cortes del catálogo`,()=>{
  const m=member(tipo.pref),g=calcularGrupoFisico([m]),s=construirVisualizacion([m],g);
  assert.ok(s.paneles.length>0 || s.omitidas.length>0,'No geometric coverage');
  assert.ok(!s.avisos.some(a=>a.includes('cantidad fraccionaria')));
  for(const p of s.paneles){
    assert.ok([p.x,p.y,p.z,p.w,p.d,p.h].every(Number.isFinite),p.nombre);
    const actual=[p.w,p.d,p.h].sort((a,b)=>a-b),expected=[p.largo,p.ancho,p.espesor].sort((a,b)=>a-b);
    assert.deepEqual(actual,expected);
  }
});
test('DB mixto: frentes pequeños arriba y gavetas vinculadas a sus fondos',()=>{
  const m=member('DB',{n_cajones:3,n_cajones_pequenos:1}),s=construirVisualizacion([m],calcularGrupoFisico([m]));
  const fr=s.paneles.filter(p=>p.funcion==='frente_gaveta').sort((a,b)=>b.z-a.z);
  assert.equal(fr.length,3);assert.ok(Math.abs(fr[0].h-152.4)<.1);
  for(const f of fr){ const b=s.paneles.find(p=>p.funcion==='base_gaveta'&&p.cajon===f.cajon)!;assert.ok(b);assert.ok(Math.abs(b.z-f.z-30)<.1); }
});
test('grupo: tres laterales reales y una base continua, sin cantidades prorrateadas',()=>{
  const a=member('BFD'),b=member('BFD');a.calc.dims.L=24;b.calc.dims.L=24;
  const g=calcularGrupoFisico([a,b]),s=construirVisualizacion([a,b],g);
  assert.equal(s.paneles.filter(p=>p.funcion==='lateral').length,3);
  const bases=s.paneles.filter(p=>p.funcion==='base');assert.equal(bases.length,1);
  assert.ok(Math.abs(bases[0].w-(48*25.4-30))<.03);
  assert.ok(!s.avisos.some(a=>a.includes('fraccionaria')));
});
test('frentes excluidos / kit conserva exactamente el alcance del resultado',()=>{
  const a=member('DB',{n_cajones:3,n_cajones_pequenos:1});a.calc.modoFrentes='sin_frentes';
  const s=construirVisualizacion([a],calcularGrupoFisico([a]));assert.ok(!s.paneles.some(p=>p.rol==='frente'));
  a.calc.modoFrentes='solo_frentes';const kit=construirVisualizacion([a],calcularGrupoFisico([a]));assert.ok(kit.paneles.every(p=>p.rol==='frente'));
});
test('montaje: coordenadas por instancia, giro y validación de expresiones',()=>{
  const m=member('BFD');m.calc.piezas=m.calc.piezas.filter(p=>p.nombre==='lateral');
  m.calc.piezas[0].visualizacion={...inferirMontaje(m.calc.piezas[0]),x:'I*(L-W)',y:'Y+12',giro:90};
  const s=construirVisualizacion([m],calcularGrupoFisico([m]));assert.equal(s.paneles[0].y,12);assert.equal(s.paneles[1].x,36*25.4-15);assert.equal(s.paneles[0].giro,90);
  assert.throws(()=>validarMontaje({x:'process.exit()'}));assert.throws(()=>validarMontaje({x:'I=1'}));assert.throws(()=>validarMontaje({x:'I++'}));
  assert.throws(()=>validarMontaje({plano:'AB'}));assert.doesNotThrow(()=>validarMontaje({x:'I==0?TC:L-W',version:1}));
});
