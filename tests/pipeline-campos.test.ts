import assert from 'node:assert/strict';
import test from 'node:test';
import {CAMPOS_PIPELINE,PRODUCTOS_PIPELINE,validarRegistroPipeline} from '../src/lib/pipeline-campos';
function formulario(){const f=new FormData();for(const c of CAMPOS_PIPELINE)f.set(c.key,c.key==='productos'?PRODUCTOS_PIPELINE[0]:c.opciones?.[0]??(c.tipo==='url'?'https://example.com/plano':c.tipo==='date'?'2026-12-31':c.tipo==='number'?'150':'Dato QA'));return f;}
test('el registro valida todos sus campos en servidor y no admite enlaces ejecutables',()=>{
 const f=formulario();assert.equal(validarRegistroPipeline(f).estado,'borrador');
 for(const key of ['cliente','moneda','productos','fecha_limite_envio','tipo_cotizacion']){const bad=formulario();bad.delete(key);assert.throws(()=>validarRegistroPipeline(bad),/Completa|Selecciona/);}
 for(const key of ['link_documentos','adjunto_url']){const bad=formulario();bad.set(key,'javascript:alert(1)');assert.throws(()=>validarRegistroPipeline(bad),/http/);}
 const bad=formulario();bad.set('fecha_limite_envio','2026-02-30');assert.throws(()=>validarRegistroPipeline(bad),/Fecha/);
});
test('el servidor limita productos, moneda, tarifa y descarta columnas privilegiadas del payload',()=>{
 const f=formulario();f.append('productos','Closets');f.set('creado_por','intruso');f.set('cotizacion_id','otra');f.set('origen_excel','{}');
 const r=validarRegistroPipeline(f);assert.equal(r.productos,'Gabinetes de cocina | Closets');assert.equal(r.tarifa,150);assert.equal(r.instalado,false);assert.equal('cotizacion_id' in r,false);assert.equal('creado_por' in r,false);assert.equal('origen_excel' in r,false);
 for(const [key,value] of [['moneda','EUR'],['productos','Producto inexistente'],['tarifa','Infinity'],['tarifa','-1']]){const bad=formulario();bad.set(key,value);assert.throws(()=>validarRegistroPipeline(bad));}
});
