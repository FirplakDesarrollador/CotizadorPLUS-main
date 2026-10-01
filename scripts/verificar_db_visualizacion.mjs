// Domain checks for the interpretation, without a browser or modifying sources.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../artifacts/interpretacion-db/vistas-db.html',import.meta.url),'utf8');
const payload=html.match(/<script type="application\/json" id="db-evidence">([\s\S]*?)<\/script>/)[1];
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(js);
const values={'#db-model':{value:'0',append(){}},'#db-opening':{value:'0'}};
const root={querySelector:s=>values[s]};
const context={document:{getElementById:id=>id==='db-evidence'?{textContent:payload}:root,
  createElement:()=>({})},Intl};
vm.createContext(context);
// Execute the actual build function; omit the DOM event registration.
const boundary=js.indexOf("  $('#db-model').addEventListener");
assert.ok(boundary>0);
vm.runInContext(js.slice(0,boundary)+
  '\n globalThis.inspect = () => { build(); return {model,panels,metadata}; };\n})();',context);
const examples=JSON.parse(payload).examples;
const expectedCounts=[18,18,14,18,22,19,16];
let checked=0;
for(let i=0;i<examples.length;i++) {
  values['#db-model'].value=String(i);
  values['#db-opening'].value='0';
  const closed=context.inspect();
  assert.equal(closed.panels.length,expectedCounts[i]);
  const seen=new Set();
  for(const p of closed.panels) {
    assert.ok(!seen.has(p.row),'Source row represented more than once'); seen.add(p.row);
    assert.ok([p.x,p.y,p.z,p.w,p.d,p.h].every(Number.isFinite));
    assert.ok([p.w,p.d,p.h].every(v=>v>0));
    const physical=[p.w,p.d,p.h].sort((a,b)=>a-b);
    const source=[p.l,p.a,p.t].sort((a,b)=>a-b);
    physical.forEach((v,k)=>assert.ok(Math.abs(v-source[k])<1e-8,'Changed cutting dimensions'));
    assert.ok(p.x>=-1e-8 && p.x+p.w<=closed.model.W+1e-8,'Outside lateral envelope');
    assert.ok(p.z>=-1e-8 && p.z+p.h<=closed.model.H+1e-8,'Outside vertical envelope');
    checked++;
  }
  values['#db-opening'].value='300';
  const opened=context.inspect();
  const movingDrawer=closed.model.hidden?99:0;
  for(let j=0;j<closed.panels.length;j++) {
    const a=closed.panels[j], b=opened.panels[j];
    assert.ok(Math.abs(b.y-a.y+(a.drawer===movingDrawer?300:0))<1e-8);
    assert.equal(b.x,a.x); assert.equal(b.z,a.z);
  }
}
assert.equal(examples[4].closure,1.6,'Keep source DB24-4 discrepancy visible');
console.log(`${examples.length} models; ${checked} panels preserve cutting dimensions, source identity and cabinet bounds; drawer travel verified.`);
