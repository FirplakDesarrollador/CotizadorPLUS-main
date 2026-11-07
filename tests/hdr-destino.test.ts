import test from 'node:test';
import assert from 'node:assert/strict';
import { crearDestinoHdr, crearZipHdr, nombreCarpetaHdr, type DirectorioHdr } from '../src/app/hdr/destinoExportacion';

test('crea la carpeta del proyecto en el destino elegido y no sobrescribe referencias repetidas', async () => {
  const carpetas: string[] = [], files = new Map<string,string>();
  const directorio: DirectorioHdr = {
    getDirectoryHandle: async (nombre, opciones) => { assert.equal(opciones.create,true); carpetas.push(nombre); return directorio; },
    getFileHandle: async nombre => ({ createWritable: async () => ({ write: async blob => { files.set(nombre,await blob.text()); }, close: async () => {} }) }),
  };
  const destino=await crearDestinoHdr('Condominio V',{seleccionar:async opciones=>{assert.deepEqual(opciones,{startIn:'downloads',mode:'readwrite'});return directorio;}});
  await destino.guardar('HDR_B30.pdf',new Blob(['primero']));
  await destino.guardar('HDR_B30.pdf',new Blob(['segundo']));
  await destino.finalizar();
  assert.deepEqual(carpetas,['Condominio V - HDR']);
  assert.deepEqual([...files],[['HDR_B30.pdf','primero'],['HDR_B30 (2).pdf','segundo']]);
});

test('ZIP conserva carpeta, Unicode, datos originales y CRC estándar', async () => {
  const zip=await crearZipHdr('Proyecto Bogotá - HDR',[{nombre:'Módulo.pdf',contenido:new Blob(['123456789'])}]);
  const bytes=new Uint8Array(await zip.arrayBuffer()),view=new DataView(bytes.buffer);
  assert.equal(view.getUint32(0,true),0x04034b50);
  assert.equal(view.getUint32(14,true),0xcbf43926);
  assert.equal(new TextDecoder().decode(bytes.slice(30,30+view.getUint16(26,true))),'Proyecto Bogotá - HDR/Módulo.pdf');
  assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
  assert.equal(view.getUint16(bytes.length-12,true),1);
});

test('sin selector descarga un ZIP; cancelar y fallar al escribir no se anuncian como éxito', async () => {
  const descargas: string[]=[];
  const destino=await crearDestinoHdr('Casa A',{seleccionar:null,descargar:(_blob,nombre)=>{descargas.push(nombre);}});
  await destino.guardar('HDR.xlsx',new Blob(['excel']));await destino.finalizar();
  assert.deepEqual(descargas,['Casa A - HDR.zip']);
  await assert.rejects(crearDestinoHdr('Casa A',{seleccionar:async()=>{throw new DOMException('Cancelado','AbortError');}}),{name:'AbortError'});
  let cerrado=false;
  const sinEspacio: DirectorioHdr={getDirectoryHandle:async()=>sinEspacio,getFileHandle:async()=>({createWritable:async()=>({write:async()=>{throw new Error('Sin espacio');},close:async()=>{cerrado=true;}})})};
  const fallido=await crearDestinoHdr('Casa A',{seleccionar:async()=>sinEspacio});
  await assert.rejects(fallido.guardar('HDR.pdf',new Blob(['pdf'])),/Sin espacio/);
  assert.equal(cerrado,true);
  await assert.rejects(crearZipHdr('Vacío - HDR',[]),/entre 1 y/);
  assert.equal(nombreCarpetaHdr('../CON: /Casa?'),'.._CON_ _Casa_ - HDR');
});
