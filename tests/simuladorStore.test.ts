import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMedida } from '../src/lib/module-groups';

test('recupera medidas opcionales ausentes sin perder los módulos guardados', async (t) => {
  const data=new Map<string,string>();
  const memory:Storage={get length(){return data.size;},clear:()=>data.clear(),
    getItem:(key)=>data.get(key)??null,setItem:(key,value)=>{data.set(key,value);},
    removeItem:(key)=>{data.delete(key);},key:(index)=>[...data.keys()][index]??null};
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
  Object.defineProperty(globalThis,'localStorage',{value:memory,configurable:true});
  Object.defineProperty(globalThis,'window',{value:{localStorage:memory},configurable:true});
  const {useSimuladorStore:store,getModuloValues,moduloFromValues,initialModuloValues}=await import('../src/store/simuladorStore');
  const legacy={tipoId:'tipo-guardado',largo:'65',alto:'70',prof:'35',
    preset:{caja:'C15',frente:'F18',fondo:'B6',refuerzo:'C15'},conHerrajes:false,hood:'35'};
  const optional=['npuertas','ncajones','nentrepanos','zocalo','puertaSup','nbarras','door','hornoLargo','hornoAlto','mo','free'] as const;
  try {
    await t.test('migra versión anterior, conserva dimensiones, materiales e IDs',async()=>{
      memory.setItem('simulador-storage',JSON.stringify({version:8,state:{...legacy,
        modulos:[{...legacy,id:'m1'},{...legacy,id:'m2',largo:'60'}],result:{anterior:true}}}));
      await store.persist.rehydrate();
      const state=store.getState();
      assert.equal(state.result,null);
      assert.deepEqual(state.modulos.map(m=>m.id),['m1','m2']);
      assert.deepEqual(state.preset,legacy.preset);assert.equal(state.conHerrajes,false);
      for(const values of [state,...state.modulos]) {
        for(const key of optional) assert.equal(values[key],'',key);
        assert.equal(values.alto,'70');assert.equal(values.hood,'35');
        assert.deepEqual(values.preset,legacy.preset);
      }
      assert.equal(state.modulos[1].largo,'60');
    });
    await t.test('normaliza también un snapshot incompleto de la versión actual',async()=>{
      memory.setItem('simulador-storage',JSON.stringify({version:9,state:{...legacy,
        modulos:[{...legacy,id:'m1'}],pendingDraft:legacy}}));
      await store.persist.rehydrate();
      assert.equal(store.getState().puertaSup,'');
      assert.equal(store.getState().modulos[0].free,'');
      assert.equal(store.getState().pendingDraft?.free,'');
      assert.equal(store.getState().pendingDraft?.alto,'70');
    });
    await t.test('Fast Refresh y deshacer no reintroducen undefined',()=>{
      const partial={...initialModuloValues,...legacy,puertaSup:undefined,free:undefined};
      const savedModule=moduloFromValues(partial,'hot');
      assert.equal(savedModule.puertaSup,'');assert.equal(savedModule.free,'');
      assert.equal(savedModule.puertaSup!=='',false,'no debe generar override de una medida ausente');
      assert.equal(Number.isNaN(parseMedida(savedModule.free)),true,'no inventar FREE=0');
      store.setState({puertaSup:undefined,free:undefined});
      store.getState().setSimuladorState({free:'10'});
      store.getState().undo();assert.equal(store.getState().puertaSup,'');
      store.getState().redo();assert.equal(store.getState().free,'10');
      assert.equal(getModuloValues({}).largo,'','una dimensión obligatoria ausente debe quedar incompleta');
    });
  } finally {
    store.persist.clearStorage();
    if(previous)Object.defineProperty(globalThis,'localStorage',previous);
    else Reflect.deleteProperty(globalThis,'localStorage');
    if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);
    else Reflect.deleteProperty(globalThis,'window');
  }
});
