import assert from 'node:assert/strict';
import test from 'node:test';
import {nombreProyectoPipeline} from '../src/lib/pipeline-referencias';
test('solo elimina el código exacto al principio seguido de un separador',()=>{
 assert.equal(nombreProyectoPipeline('26098 - Ramstack CR - Casa Poro','26098'),'Ramstack CR - Casa Poro');
 assert.equal(nombreProyectoPipeline('A.5+ — Proyecto','A.5+'),'Proyecto');
 assert.equal(nombreProyectoPipeline('26098-B - Proyecto','26098-B'),'Proyecto');
 assert.equal(nombreProyectoPipeline('Proyecto 26098 - Modelo','26098'),'Proyecto 26098 - Modelo');
 assert.equal(nombreProyectoPipeline('260980 - Proyecto','26098'),'260980 - Proyecto');
 assert.equal(nombreProyectoPipeline(null,'X'),null);assert.equal(nombreProyectoPipeline('X -','X'),'X -');
});
