import assert from 'node:assert/strict';
import test from 'node:test';
import { ajustarGavetasFe, piezasConTableroGaveta } from '../src/lib/gavetas';
import { evalExpr, type Pieza } from '../src/lib/engine';
import { codigoComercial } from '../src/lib/module-groups';
import { normalizarPlantillasFabricacion } from '../src/lib/reglas-fabricacion';

const piezas: Pieza[] = ['lateral_gaveta_pequena', 'trasero_gaveta_grande', 'contraparche_pequeno', 'fondo_gaveta', 'refuerzo_trasero'].map(nombre => ({ nombre, rol_tablero: 'caja', formula_cantidad: '1', formula_largo: '1', formula_ancho: '2', cantos: { calibre: '22x0,45', largos: 2 } }));
test('todos los fondos FE usan el material del respaldo sin cambiar paredes ni otras DB', () => {
  const source=[...piezas,{...piezas[0],nombre:'base_gaveta',rol_tablero:'gaveta'}];
  for(const pref of ['DB-FE','DB-FE-SF',...['2S','2','3','2-1INT'].flatMap(v=>['SM','SMG'].flatMap(g=>[`DB-${v}-${g}-FE`,`DB-${v}-${g}-FE-SF`]))]) {
    const resultado=piezasConTableroGaveta(source,pref);
    assert.ok(resultado.filter(p=>['base_gaveta','fondo_gaveta'].includes(p.nombre)).every(p=>p.rol_tablero==='fondo'),pref);
    assert.equal(resultado.find(p=>p.nombre==='lateral_gaveta_pequena')?.rol_tablero,'caja');
  }
  assert.equal(piezasConTableroGaveta(source,'DB')[source.length-1].rol_tablero,'gaveta');
  assert.equal(source[source.length-1].rol_tablero,'gaveta');
  assert.equal(source.find(p=>p.nombre==='fondo_gaveta')?.rol_tablero,'caja');
});
test('FE usa tres tramos exactos; fondo ocho mm menor y dos espesores de lateral en traseros', () => {
  for (const [prof, lateral] of [[609.6,500],[700,500],[609.5,450],[533.4,450],[533.3,350],[440,350]]) {
    const result = ajustarGavetasFe(piezas, 'DB-FE', { caja: 'C18' }, '22x1');
    const vars = { P: prof/25.4, L:500/25.4, TC:18/25.4, TR:15/25.4 };
    const mm = (nombre: string) => Number(evalExpr(result.find(p => p.nombre === nombre)!.formula_largo!, vars))*25.4;
    assert.ok(Math.abs(mm('lateral_gaveta_pequena')-lateral)<0.001);
    assert.ok(Math.abs(mm('fondo_gaveta')-(lateral-8))<0.001);
    assert.ok(Math.abs(mm('trasero_gaveta_grande')-402)<0.001);
    assert.ok(Math.abs(mm('contraparche_pequeno')-402)<0.001);
  }
  assert.deepEqual(ajustarGavetasFe(piezas,'DB',{},'22x1'),piezas);
});
test('FE conserva el material de cada variante y toma el canto elegido cuando refuerzo y caja coinciden', () => {
  const source = piezas.map(p => ({...p, rol_tablero:'refuerzo'}));
  for (const canto of ['22x1','22x0,45','22x2']) {
    const result = ajustarGavetasFe(source,'DB-2S-SM-FE-SF',{caja:'C18',refuerzo:'C18'},canto);
    assert.equal(result[0].rol_tablero,'refuerzo');
    assert.equal(result[0].cantos?.calibre,canto);
    assert.equal(result[0].cantos?.forceCalibre,true);
    assert.ok(Math.abs(Number(evalExpr(result[1].formula_largo!,{L:500/25.4,TC:18/25.4,TR:15/25.4}))*25.4-408)<0.001);
  }
  assert.equal(ajustarGavetasFe(source,'DB-FE',{caja:'C18',refuerzo:'R15'},'22x1')[0].cantos?.calibre,'22x0,45');
  assert.equal(source[0].cantos?.forceCalibre,undefined);
});
test('SVFDH siempre muestra alto y profundidad; SMG solo reduce el frente treinta mm', () => {
  for (const pref of ['SVFDH','SVFDH-SMG']) {
    const code = codigoComercial({pref,largo:24,alto:28.75,prof:24,unidad:'in',sistema:'imperial'});
    assert.equal(code, `SVFDH2428 3/424${pref.endsWith('SMG')?'-SMG':''}`);
    const frente: Pieza={nombre:'frente',rol_tablero:'frente',formula_cantidad:'1',formula_largo:'L-RV',formula_ancho:'A-RV'};
    const result=normalizarPlantillasFabricacion([frente],pref)[0];
    assert.ok(Math.abs(Number(evalExpr(result.formula_ancho!,{A:780/25.4,RV:3.2/25.4}))*25.4-(pref.endsWith('SMG')?750:776.8))<0.001);
  }
});
test('refuerzo delantero SVFDH SMG y SMG-SF mide 80 mm sin alterar largo, material ni cantidad', () => {
  const pieza: Pieza={nombre:'refuerzo_delantero',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'3.77953',cantos:{calibre:'19x0,45',largos:2,anchos:0}};
  for(const pref of ['SVFDH-SMG','SVFDH-SMG-SF']) {
    const resultado=normalizarPlantillasFabricacion([pieza],pref)[0];
    assert.ok(Math.abs(Number(evalExpr(resultado.formula_ancho!,{}))*25.4-80)<0.000001);
    assert.deepEqual({...resultado,formula_ancho:pieza.formula_ancho},pieza);
  }
  for(const pref of ['SVFD','SVFDH','SVFD-SF']) assert.deepEqual(normalizarPlantillasFabricacion([pieza],pref),[pieza]);
  assert.equal(pieza.formula_ancho,'3.77953');
});
test('PN y F solo señalan quince mm según su propio tablero, sin sufijos heredados', () => {
  for (const pref of ['PN','F']) for (const espesorCajaMm of [15,18]) for (const espesorFrenteMm of [6,15,18]) {
    const code=codigoComercial({pref,largo:44,alto:70,prof:2,unidad:'cm',sistema:'metrico',espesorCajaMm,espesorFrenteMm});
    assert.equal(code,`${pref}4470${espesorFrenteMm===15?'-15MM':''}`);
  }
});
