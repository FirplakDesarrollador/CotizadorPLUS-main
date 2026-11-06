import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';
import { piezasConTableroGaveta } from '../src/lib/gavetas';
import { calcularMueble, type Pieza } from '../src/lib/engine';
const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(id,...args){return id==='server-only'?{}:original.call(this,id,...args);};
const { prepararCotizacion } = createRequire(import.meta.url)('../src/lib/cotizar.ts') as typeof import('../src/lib/cotizar');
loader._load=original;
test('las tres piezas usan su material de 15 mm y se cuentan una sola vez con su precio',async()=>{
  const piezas: Pieza[]=['base_gaveta','trasero_gaveta_pequena','trasero_gaveta_grande','refuerzo_trasero'].map(nombre=>({nombre,rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'10',formula_ancho:nombre==='trasero_gaveta_grande'?'183/25.4':'5',cantos:{}}));
  for(const pref of ['DB','DB-SM','DB-SM-SF','DB-SMG','DB-2-1INT-SMG-SF']){
    const catalogo: import('../src/lib/cotizar').CatalogoPrecompilado={params:{},tiposById:{db:{id:'db',pref,pref_imperial:pref,pref_metrico:pref,permite_agrupacion:true,margen_key:'muebles',categoria:'inferior',etiquetas_und:0,usa_carton:false}},piezasByTipoId:{db:piezas},reglasByTipoId:{},reglasGlobales:[],herrajesPlantByTipoId:{db:[{rol:'riel',herraje_codigo:'RIELTANDEM',selector_key:null,formula_cantidad:'2'},{rol:'barra',herraje_codigo:'BARRAEST',selector_key:null,formula_cantidad:'0'}]},cantosByCalibre:{},consumiblesBySelector:{},tablerosByCode:{C18:{codigo:'C18',espesor_mm:18,precio_m2:100},G15:{codigo:'G15',espesor_mm:15,precio_m2:250}},herrajesByCode:{RIELTANDEM:{codigo:'RIELTANDEM',precio:10},RIELSLIMCHI:{codigo:'RIELSLIMCHI',precio:70},BARRAEST:{codigo:'BARRAEST',precio:5},BARRAESTMCTO:{codigo:'BARRAESTMCTO',precio:30}}};
    const input={tipoId:'db',largo:30,alto:30,prof:24,unidad:'in' as const,preset:{caja:'C18',refuerzo:'C18',gaveta:'G15'},conHerrajes:true,rielCodigo:'RIELSLIMCHI',barraCodigo:'BARRAESTMCTO',tarifaMadera:0};
    const prepared=await prepararCotizacion(input,catalogo),r=calcularMueble(prepared.calc);
    assert.deepEqual(r.piezas.map(p=>p.rol),['gaveta','gaveta','gaveta','refuerzo']);
    const madera=r.maderaPorRol.find(m=>m.rol==='gaveta')!;assert.equal(madera.codigo,'G15');assert(Math.abs(madera.costo-madera.m2*250)<.02);
    assert(Math.abs(r.costoMadera-r.maderaPorRol.reduce((s,m)=>s+m.costo,0))<.02);
    assert.deepEqual(r.herrajes.map(h=>[h.codigo,h.cant,h.precio]),[['RIELSLIMCHI',2,70],['BARRAESTMCTO',1,30]]);
    const excluido=calcularMueble({...prepared.calc,herrajesExcluidos:['riel','barra']});assert.equal(excluido.costoHerrajes,0);
    assert.throws(()=>calcularMueble({...prepared.calc,preset:{...prepared.calc.preset,gaveta:'C18'}}),/15 mm/);
    assert.throws(()=>calcularMueble({...prepared.calc,barraCodigo:''}),/Selecciona el tipo de barra/);
    catalogo.herrajesByCode.RIELFE500={codigo:'RIELFE500',precio:31};
    catalogo.tiposById.db.pref=pref==='DB'?'DB-FE':`${pref.replace(/-SF$/,'')}-FE${pref.endsWith('-SF')?'-SF':''}`;
    const fe=calcularMueble((await prepararCotizacion(input,catalogo)).calc);
    assert.equal(fe.herrajes.find(h=>h.rol==='riel')?.codigo,'RIELFE500');assert(!fe.herrajes.some(h=>h.rol==='barra'));
    catalogo.tiposById.db.pref=pref;
    assert.equal(piezas[0].rol_tablero,'refuerzo');
    await assert.rejects(prepararCotizacion({...input,preset:{...input.preset,gaveta:'C18'}},catalogo),/15 mm/);
    await assert.rejects(prepararCotizacion({...input,rielCodigo:'NOEXISTE'},catalogo),/no disponible/);
  }
  assert.equal(piezasConTableroGaveta(piezas,'B')[0].rol_tablero,'refuerzo');
});
