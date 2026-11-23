import assert from 'node:assert/strict';
import test from 'node:test';
import {filtrosPipeline,enlacePipeline} from '../src/lib/pipeline';
test('los filtros acotan páginas y textos y rechazan estados y órdenes inexistentes',()=>{
 const f=filtrosPipeline({pq:[' Cliente 100% ','ignorar'],ppagina:'-8',pestado:'cerrada',pdireccion:'drop table',ppais:'X'.repeat(200)});
 assert.equal(f.q,'Cliente 100%');assert.equal(f.pagina,1);assert.equal(f.estado,'');assert.equal(f.direccion,'desc');assert.equal(f.pais.length,120);
 assert.equal(filtrosPipeline({ppagina:'1000000000'}).pagina,1000000);assert.equal(filtrosPipeline({ppagina:'NaN'}).pagina,1);
});
test('los enlaces de páginas conservan todos los filtros y la vista con caracteres especiales',()=>{
 const f=filtrosPipeline({pq:'Muebles & Cía / 100%',pestado:'en_pausa',ppais:'México',pasesor:'Ana + Luis',pestimador:'Estimador',pdireccion:'asc'});
 const url=new URL(enlacePipeline(f,3),'https://test.local');assert.equal(url.pathname,'/cotizaciones');assert.equal(url.searchParams.get('vista'),'pipeline');
 assert.deepEqual(filtrosPipeline(Object.fromEntries(url.searchParams)),{...f,pagina:3});
});
