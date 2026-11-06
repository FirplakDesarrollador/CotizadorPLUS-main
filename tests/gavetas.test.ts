import assert from 'node:assert/strict';
import test from 'node:test';
import { tableroGaveta15, usaTableroGaveta } from '../src/lib/gavetas';
test('identifica toda la familia DB y exige equivalencia exacta de 15 mm',()=>{
  for(const p of ['DB','DB-SM','DB-SM-SF','DB-SMG','DB-2-1INT-SMG-SF','DB-SM-FE'])assert(usaTableroGaveta(p));
  for(const p of ['B','DVE','DBX'])assert(!usaTableroGaveta(p));
  const boards=[{codigo:'RH18COLOR',espesor_mm:18},{codigo:'RH15COLOR',espesor_mm:15}];
  assert.equal(tableroGaveta15('RH18COLOR',boards),'RH15COLOR');
  assert.equal(tableroGaveta15('RH15COLOR',boards),'RH15COLOR');
  assert.equal(tableroGaveta15('RH18OTRO',boards),'');
});
