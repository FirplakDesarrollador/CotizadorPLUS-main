import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { inferirMontaje, validarMontaje } from '../src/lib/visualizacion-config';
import { type Pieza, type Regla, type Tablero, type Canto } from '../src/lib/engine';

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
    cantosByCalibre: new Proxy({}, { get: () => ({ calibre: '0.5', precio: 1000 }) }) as Record<string, Canto>,
    herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,usaCarton:false,
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
// La puerta de un superior con gola se corta más alta que la carcasa (migración
// 0045 para W). Ese sobrante es el agarre inferior: debe colgar bajo la base, no
// sobresalir sobre la tapa.
function wGola(gola:number){
  const m=member('W',{gola});
  const frente=m.calc.piezas.find(p=>p.nombre==='frente')!;
  frente.formula_ancho='gola ? A+0.62402 : A-RV';
  return construirVisualizacion([m],calcularGrupoFisico([m]));
}
test('W con gola: el sobrante de la puerta cuelga por debajo, no por encima',()=>{
  const alto=30*25.4;
  const puertas=wGola(1).paneles.filter(p=>p.funcion==='frente');
  assert.ok(puertas.length>0);
  for(const p of puertas){
    assert.ok(p.h>alto,`la puerta con gola debe ser más alta que la carcasa: ${p.h}`);
    assert.ok(Math.abs(p.z+p.h-alto)<.1,`el canto superior debe quedar a ras de la tapa: ${p.z+p.h}`);
    assert.ok(p.z<-1,`el sobrante debe quedar bajo la base: z=${p.z}`);
  }
});
test('W sin gola: la puerta sigue apoyada en la base',()=>{
  const alto=30*25.4;
  for(const p of wGola(0).paneles.filter(p=>p.funcion==='frente')){
    assert.equal(p.z,0);
    assert.ok(p.h<=alto);
  }
});
// El fondo se construía girado 90° cuando 0045 copió las medidas de la hoja real
// (que ordena por tamaño) como largo/ancho (que son ejes atados a `intercambiar`).
// En W2936-SM el backing salía 898.4mm de ancho en una carcasa de 736.6. Ver
// migración 0047 y WikiLLM/wiki/ejes_fondo_backing.md.
function wEscena(gola:number){
  const m=member('W',{gola});
  m.calc.dims={L:29,A:36,P:12};
  // Fórmulas reales de W tras las migraciones 0045/0047/0048 (el fixture es anterior).
  const lateral=m.calc.piezas.find(p=>p.nombre==='lateral')!;
  lateral.formula_largo='gola ? A-1 : A';
  const fondo=m.calc.piezas.find(p=>p.nombre==='fondo')!;
  fondo.formula_largo='L-0.62992';
  fondo.formula_ancho='gola ? A-1.62992 : A-0.62992';
  const s=construirVisualizacion([m],calcularGrupoFisico([m]));
  return {
    fondo: s.paneles.find(p=>p.funcion==='respaldo')!,
    lateral: s.paneles.find(p=>p.funcion==='lateral')!,
  };
}
for(const gola of [0,1]) test(`W gola=${gola}: el fondo cabe dentro del lateral`,()=>{
  const L=29*25.4, {fondo,lateral}=wEscena(gola);
  assert.ok(fondo,'sin panel de respaldo');
  assert.ok(fondo.w<=L+1.5,`el fondo mide ${fondo.w.toFixed(1)}mm de ancho en una carcasa de ${L.toFixed(1)}mm`);
  assert.ok(fondo.z>=lateral.z-1.5 && fondo.z+fondo.h<=lateral.z+lateral.h+1.5,
    `el fondo (${fondo.z.toFixed(1)}..${(fondo.z+fondo.h).toFixed(1)}) se sale del lateral (${lateral.z.toFixed(1)}..${(lateral.z+lateral.h).toFixed(1)})`);
  // El eje vertical debe ser el mayor: es un panel vertical, no uno acostado.
  assert.ok(fondo.h>fondo.w,`el fondo quedó acostado: ${fondo.w.toFixed(1)}x${fondo.h.toFixed(1)}`);
});
test('W-SM: el lateral se corta 1" menos que el alto nominal',()=>{
  assert.ok(Math.abs(wEscena(1).lateral.h-889)<.1,'lateral con gola debe ser 889mm (35")');
  assert.ok(Math.abs(wEscena(0).lateral.h-914.4)<.1,'lateral con manija sigue en 914.4mm (36")');
});

test('SVFD: el fondo conserva ancho L-16mm y alto A-2mm en el dibujo',()=>{
  const m=member('SVFD');
  m.calc.dims={L:36,A:30,P:21};
  const fondo=m.calc.piezas.find(p=>p.nombre==='fondo')!;
  fondo.formula_largo='A-0.07874';
  fondo.formula_ancho='L-0.62992';
  fondo.visualizacion={version:1,funcion:'respaldo',plano:'XZ',intercambiar:true,confirmado:false};
  const scene=construirVisualizacion([m],calcularGrupoFisico([m]));
  const respaldo=scene.paneles.find(p=>p.funcion==='respaldo')!;
  assert.ok(respaldo,'SVFD debe incluir el fondo');
  assert.ok(Math.abs(respaldo.w-898.4)<.1,`ancho mostrado ${respaldo.w}mm debe ser L-16mm`);
  assert.ok(Math.abs(respaldo.h-760)<.1,`alto mostrado ${respaldo.h}mm debe ser A-2mm`);
  assert.ok(respaldo.z>=-0.1 && respaldo.z+respaldo.h<=762.1,'el fondo debe caber dentro de los laterales');
});

test('respaldo con ejes heredados no se dibuja fuera de una carcasa no cuadrada',()=>{
  const m=member('SVFD');
  m.calc.dims={L:36,A:30,P:21};
  const fondo=m.calc.piezas.find(p=>p.nombre==='fondo')!;
  fondo.formula_largo='A-0.07874';
  fondo.formula_ancho='L-0.62992';
  // Simula una configuración persistida anterior a la corrección de ejes.
  fondo.visualizacion={version:1,funcion:'respaldo',plano:'XZ',intercambiar:false,confirmado:false};
  const respaldo=construirVisualizacion([m],calcularGrupoFisico([m])).paneles.find(p=>p.funcion==='respaldo')!;
  assert.ok(respaldo.w<=36*25.4+1 && respaldo.h<=30*25.4+1,'el respaldo debe permanecer dentro de la carcasa');
  assert.ok(Math.abs(respaldo.w-898.4)<.1 && Math.abs(respaldo.h-760)<.1,'se debe elegir la orientación que cabe');
});

test('DB-4 visualiza los cuatro traseros bajos en sus gavetas',()=>{
  const m=member('DB',{n_cajones:4,n_cajones_pequenos:0});
  const trasero=m.calc.piezas.find(p=>p.nombre==='trasero_gaveta')!;
  trasero.formula_ancho='n_cajones == 4 ? 68/25.4 : 183/25.4';
  const scene=construirVisualizacion([m],calcularGrupoFisico([m]));
  const traseros=scene.paneles.filter(p=>p.funcion==='trasero_gaveta');
  assert.equal(traseros.length,4);
  assert.ok(traseros.every(p=>Math.abs(p.h-68)<.1),'cada trasero DB-4 debe medir 68mm de alto');
  assert.equal(new Set(traseros.map(p=>p.cajon)).size,4,'cada trasero debe quedar vinculado a su gaveta');
});

for (const pref of ['SBFD','SVFD']) test(`${pref}: el refuerzo delantero se monta vertical`,()=>{
  const m=member(pref);
  const refuerzo=m.calc.piezas.find(p=>p.nombre==='refuerzo_delantero')!;
  const altoMm=pref==='SBFD'?128:96;
  refuerzo.formula_ancho=String(altoMm/25.4);
  refuerzo.visualizacion={version:1,funcion:'travesano_frontal',plano:'XZ',intercambiar:false,confirmado:false};
  const panel=construirVisualizacion([m],calcularGrupoFisico([m])).paneles.find(p=>p.nombre==='refuerzo_delantero')!;
  assert.ok(Math.abs(panel.h-altoMm)<.1,`${altoMm}mm deben estar sobre el eje vertical`);
  assert.ok(panel.d<=16,'el refuerzo vertical debe tener solo el espesor en profundidad');
});

test('DB-SM: refuerzo delantero vertical y Gola de madera horizontal',()=>{
  const m=member('DB',{n_cajones:3,n_cajones_pequenos:2,gola:1});
  m.pref='DB-2S-SM';
  const gola=m.calc.piezas.find(p=>p.nombre==='gola_perfil')!;
  gola.nombre='gola_madera';
  const group=calcularGrupoFisico([m]);
  const scene=construirVisualizacion([m],group);
  const refuerzos=scene.paneles.filter(p=>p.nombre==='refuerzo_delantero');
  const golas=scene.paneles.filter(p=>p.nombre==='gola_madera');
  assert.equal(refuerzos.length,2);
  assert.ok(refuerzos.every(p=>Math.abs(p.h-80)<.1&&p.d<=16),'los refuerzos deben verse verticales');
  assert.equal(golas.length,2);
  assert.ok(golas.every(p=>p.h<=16&&Math.abs(p.d-80)<.1&&p.y===0),'las golas deben verse horizontales contra los frentes');
  const bases=scene.paneles.filter(p=>p.funcion==='base_gaveta');
  assert.equal(bases.length,3);
  assert.ok(Math.abs(refuerzos[0].z+refuerzos[0].h-30*25.4)<.1,'el primer refuerzo debe quedar arriba');
  assert.ok(Math.abs(refuerzos[1].z+refuerzos[1].h-bases[1].z)<.1,'el segundo refuerzo debe quedar bajo la segunda base de gaveta');
  assert.ok(Math.abs(golas[0].z-(refuerzos[0].z-golas[0].h))<.1,'la Gola superior debe quedar debajo de su refuerzo');
  assert.ok(Math.abs(golas[1].z-(refuerzos[1].z-golas[1].h))<1,'la Gola inferior debe quedar debajo de su refuerzo');
});

test('DB-2-SM: dos gavetas grandes y el segundo par de Gola queda entre ambas',()=>{
  const m=member('DB',{n_cajones:2,n_cajones_pequenos:0,gola:1});
  m.pref='DB-2-SM';
  const refuerzo=m.calc.piezas.find(p=>p.nombre==='refuerzo_delantero')!;
  refuerzo.formula_cantidad='2';
  const gola=m.calc.piezas.find(p=>p.nombre==='gola_perfil')!;
  gola.nombre='gola_madera';
  gola.formula_cantidad='2';
  const scene=construirVisualizacion([m],calcularGrupoFisico([m]));
  const frentes=scene.paneles.filter(p=>p.funcion==='frente_gaveta').sort((a,b)=>b.z-a.z);
  const bases=scene.paneles.filter(p=>p.funcion==='base_gaveta').sort((a,b)=>b.z-a.z);
  const refuerzos=scene.paneles.filter(p=>p.nombre==='refuerzo_delantero');
  const golas=scene.paneles.filter(p=>p.nombre==='gola_madera');
  assert.equal(frentes.length,2);
  assert.ok(frentes.every(p=>Math.abs(p.h-351)<.1),'ambos frentes deben medir 351 mm de alto');
  assert.equal(bases.length,2);
  assert.equal(refuerzos.length,2);
  assert.equal(golas.length,2);
  assert.ok(Math.abs(refuerzos[1].z+refuerzos[1].h-bases[0].z)<.1,'el segundo refuerzo debe quedar bajo la base de la gaveta superior');
  assert.ok(Math.abs(golas[1].z-(refuerzos[1].z-golas[1].h))<1,'la Gola intermedia debe quedar debajo del segundo refuerzo');
});

test('los entrepaños se apoyan contra el fondo del mueble',()=>{
  const m=member('B');
  const scene=construirVisualizacion([m],calcularGrupoFisico([m]));
  const estante=scene.paneles.find(p=>p.funcion==='estante')!;
  assert.ok(estante,'B debe incluir el entrepaño');
  assert.ok(Math.abs(estante.y+estante.d-24*25.4)<.1,'el borde posterior del entrepaño debe coincidir con el fondo');
});

test('el cajón se monta arriba junto a su frente de cajón',()=>{
  const m=member('B');
  const frente=m.calc.piezas.find(p=>p.nombre==='frente_cajon')!;
  frente.visualizacion={version:1,funcion:'frente_gaveta',plano:'XZ',intercambiar:false,confirmado:false};
  const scene=construirVisualizacion([m],calcularGrupoFisico([m]));
  const frenteCajon=scene.paneles.find(p=>p.nombre==='frente_cajon')!;
  const base=scene.paneles.find(p=>p.funcion==='base_gaveta')!;
  const trasero=scene.paneles.find(p=>p.funcion==='trasero_gaveta')!;
  assert.ok(frenteCajon.z>24*25.4/2,'el frente de cajón debe estar en la mitad superior');
  assert.equal(base.cajon,frenteCajon.cajon);
  assert.equal(trasero.cajon,frenteCajon.cajon);
  assert.ok(base.z>24*25.4/2 && trasero.z>24*25.4/2,'base y trasero deben seguir el cajón superior');
});

test('los refuerzos horizontales enmarcan la gaveta superior sobre las puertas',()=>{
  const m=member('B');
  const frente=m.calc.piezas.find(p=>p.nombre==='frente_cajon')!;
  frente.visualizacion={version:1,funcion:'frente_gaveta',plano:'XZ',intercambiar:false,confirmado:false};
  const scene=construirVisualizacion([m],calcularGrupoFisico([m]));
  const frenteCajon=scene.paneles.find(p=>p.nombre==='frente_cajon')!;
  const refuerzos=scene.paneles.filter(p=>p.nombre==='refuerzo_horizontal').sort((a,b)=>b.z-a.z);
  assert.equal(refuerzos.length,2);
  assert.ok(Math.abs(refuerzos[0].z-(frenteCajon.z+frenteCajon.h-refuerzos[0].h))<.1,'primer refuerzo sobre el cajón');
  assert.ok(Math.abs(refuerzos[1].z-(frenteCajon.z-refuerzos[1].h))<.1,'segundo refuerzo bajo el cajón');
});
