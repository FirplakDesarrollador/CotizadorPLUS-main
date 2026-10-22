import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { CalcInput, Pieza } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { codigoComercial } from '../src/lib/module-groups';
import {
  DB_SMG_TIPOLOGIAS,
  DB_SMG_FE_TIPOLOGIAS,
  esTipologiaDbSm,
  esTipologiaDbSmFe,
  esTipologiaDbSmG,
  esTipologiaDbSmGFe,
  esTipologiaDbSmGSf,
  esTipologiaDbSmSf,
  obtenerTipologiasDbSmGSf,
} from '../src/lib/muebles';
import { construirVisualizacion } from '../src/lib/visualizacion';

const migration = fs.readFileSync('db/migrations/0213_db_smg.sql', 'utf8');
const adjustmentMigration = fs.readFileSync('db/migrations/0214_db_smg_refuerzo_y_doble_mecanizado.sql', 'utf8');
const simulator = fs.readFileSync('src/app/cotizador/CotizadorForm.tsx', 'utf8');
const quotes = fs.readFileSync('src/app/cotizaciones/[id]/AddLineForm.tsx', 'utf8');

const base = ['DB-2S-SMG','DB-2-SMG','DB-2-1INT-SMG','DB-3-SMG'];
const fe = ['DB-2S-SMG-FE','DB-2-SMG-FE','DB-2-1INT-SMG-FE','DB-3-SMG-FE'];
const sf = ['DB-2S-SMG-SF','DB-2-SMG-SF','DB-2-1INT-SMG-SF','DB-3-SMG-SF'];
const expected = [...base,...fe,...sf];

test('DB-SMG expone tres familias independientes en ambos formularios', () => {
  assert.deepEqual(DB_SMG_TIPOLOGIAS.map((item) => item.pref), base);
  assert.deepEqual(DB_SMG_FE_TIPOLOGIAS.map((item) => item.pref), fe);
  for (const source of [simulator, quotes]) {
    assert.equal((source.match(/DB-SMG — Cajoneras con Gola metálica/g) ?? []).length, 1);
    assert.equal((source.match(/DB-SMG-FE — Cajoneras con Gola metálica y riel Full Extension/g) ?? []).length, 1);
    assert.equal((source.match(/DB-SMG-SF — Cajoneras con Gola metálica sin fondo/g) ?? []).length, 1);
    assert.match(source, /DB_SMG_GROUP_VALUE = '__DB_SMG__'/);
    assert.match(source, /DB_SMG_FE_GROUP_VALUE = '__DB_SMG_FE__'/);
    assert.match(source, /DB_SMG_SF_GROUP_VALUE = '__DB_SMG_SF__'/);
    for (const label of ['DB-SMG','DB-SMG-FE','DB-SMG-SF']) {
      assert.match(source, new RegExp(`<[^>]+label="Tipología ${label}"`));
    }
    assert.match(source, /DB_SMG_TIPOLOGIAS\.map/);
    assert.match(source, /DB_SMG_FE_TIPOLOGIAS\.map/);
    assert.match(source, /tipologiasDbSmgSf\.map/);
  }
});

test('las tres convenciones DB-SMG son mutuamente excluyentes y no colisionan con DB-SM', () => {
  for (const pref of base) {
    assert.equal(esTipologiaDbSmG(pref), true, pref);
    assert.equal(esTipologiaDbSmGFe(pref), false, pref);
    assert.equal(esTipologiaDbSmGSf(pref), false, pref);
  }
  for (const pref of fe) {
    assert.equal(esTipologiaDbSmG(pref), false, pref);
    assert.equal(esTipologiaDbSmGFe(pref), true, pref);
    assert.equal(esTipologiaDbSmGSf(pref), false, pref);
  }
  for (const pref of sf) {
    assert.equal(esTipologiaDbSmG(pref), false, pref);
    assert.equal(esTipologiaDbSmGFe(pref), false, pref);
    assert.equal(esTipologiaDbSmGSf(pref), true, pref);
  }
  for (const pref of expected) {
    assert.equal(esTipologiaDbSm(pref), false, pref);
    assert.equal(esTipologiaDbSmFe(pref), false, pref);
    assert.equal(esTipologiaDbSmSf(pref), false, pref);
  }
  for (const pref of ['DB-2S-SM','DB-2-SM-FE','DB-3-SM-SF','DB-SMG','BFD-SMG','']) {
    assert.equal(esTipologiaDbSmG(pref), false, pref);
    assert.equal(esTipologiaDbSmGFe(pref), false, pref);
    assert.equal(esTipologiaDbSmGSf(pref), false, pref);
  }
});

test('DB-SMG-SF se descubre dinámicamente y cada pref resuelve su id existente', () => {
  const tipos = [
    { pref:'DB-3-SMG-SF',id:'id-3' },
    { pref:'BFD-SMG',id:'otro' },
    { pref:'DB-2S-SMG-SF',id:'id-2s' },
    { pref:'DB-2-SMG-SF',id:'id-2' },
    { pref:'DB-2-1INT-SMG-SF',id:'id-int' },
  ];
  assert.deepEqual(obtenerTipologiasDbSmGSf(tipos).map((tipo)=>tipo.pref),[
    'DB-2-1INT-SMG-SF','DB-2-SMG-SF','DB-2S-SMG-SF','DB-3-SMG-SF',
  ]);
  for (const tipo of obtenerTipologiasDbSmGSf(tipos)) {
    assert.equal(tipos.find((loaded)=>loaded.pref===tipo.pref)?.id,tipo.id);
  }
  for (const source of [simulator,quotes]) {
    assert.match(source,/tipos\.find\(\(item\) => item\.pref === pref\)/);
  }
});

const code = (pref: string, box = 15, front = 18, conFondo = true) => codigoComercial({
  pref,largo:36,alto:30,prof:24,unidad:'in',sistema:'imperial',
  espesorCajaMm:box,espesorFrenteMm:front,conFondo,
});

test('código comercial conserva variante y aplica SMG18 por convención', () => {
  assert.equal(code('DB-2S-SMG'), 'DB36-2S-SMG');
  assert.equal(code('DB-2S-SMG',18,18), 'DB36-2S-SMG18');
  assert.equal(code('DB-2-SMG-FE'), 'DB36-2-SMG-FE');
  assert.equal(code('DB-2-SMG-FE',18,18), 'DB36-2-SMG18-FE');
  assert.equal(code('DB-3-SMG-SF'), 'DB36-3-SMG-SF');
  assert.equal(code('DB-3-SMG-SF',18,18), 'DB36-3-SMG18-SF');
  assert.equal(code('DB-3-SMG',15,18,false), 'DB36-3-SMG-SF');
  assert.equal(code('DB-3-SMG-SF',15,18,false), 'DB36-3-SMG-SF');
});

test('migración clona pares, retira gola de madera y configura FE/SF', () => {
  for (const pref of expected) assert.match(migration, new RegExp(`'${pref}'`));
  assert.match(migration, /lower\(p\.nombre\) not in \('gola','gola_madera','gola_perfil'\)/);
  assert.match(migration, /m\.variant='sf' and lower\(p\.nombre\)='fondo'/);
  assert.match(migration, /then 'P-TC'/);
  assert.match(migration, /RIELFE500/);
  assert.match(migration, /formula_cantidad='n_cajones'/);
  assert.match(migration, /perfil SMG pendiente de definición comercial/i);
  assert.doesNotMatch(migration, /insert into public\.cot_herrajes\s/i);
});

test('0214 define un refuerzo horizontal y dos mecanizados por lateral', () => {
  for (const pref of expected) assert.match(adjustmentMigration, new RegExp(`'${pref}'`));
  assert.match(adjustmentMigration, /formula_cantidad = '1'/);
  assert.match(adjustmentMigration, /'plano','XY'/);
  assert.match(adjustmentMigration, /'y','27'/);
  assert.match(adjustmentMigration, /frontal_superior/);
  assert.match(adjustmentMigration, /frontal_nivel_gaveta/);
  assert.match(adjustmentMigration, /jsonb_array_length\(p\.visualizacion->'recortes'\)=2/);
});

const pieces: Pieza[] = [
  { nombre:'base',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'P-0.70866-TB',cantos:{} },
  { nombre:'lateral',rol_tablero:'caja',formula_cantidad:'2',formula_largo:'A',formula_ancho:'P',cantos:{},visualizacion:{version:1,funcion:'lateral',plano:'YZ',intercambiar:false,x:'I*(L-TC)',y:'0',z:'0',confirmado:true,nota:'Par lateral con mecanizado frontal superior para gola metálica.',recorte:{borde:'frontal_superior',profundidad:'27',alto:'73'}} },
  { nombre:'refuerzo_delantero',rol_tablero:'refuerzo',formula_cantidad:'1',formula_largo:'L-2*TC',formula_ancho:'80/25.4',cantos:{} },
  { nombre:'frente',rol_tablero:'frente',formula_cantidad:'2',formula_largo:'L-RV',formula_ancho:'(A-2*RV-gola*2.11024)/2',cantos:{},visualizacion:{version:1,funcion:'frente_gaveta',plano:'XZ',intercambiar:false,confirmado:true} },
  { nombre:'fondo',rol_tablero:'fondo',formula_cantidad:'1',formula_largo:'A-0.07874',formula_ancho:'L-0.62992',cantos:{} },
];
const calc: CalcInput={dims:{L:36,A:30,P:24},piezas:pieces,reglas:[],preset:{caja:'C',refuerzo:'C',frente:'F',fondo:'B'},tablerosByCode:{C:{codigo:'C',precio_m2:1,espesor_mm:15},F:{codigo:'F',precio_m2:1,espesor_mm:18},B:{codigo:'B',precio_m2:1,espesor_mm:6}},cantosByCalibre:{},herrajesByCode:{},consumiblesBySelector:{},etiquetasUnd:0,margen:0,margenHerraje:0,trm:1,desperdicio:0,overrides:{gola:1}};

test('las doce visualizaciones recortan ambos laterales y nunca dibujan gola de madera', () => {
  for (const pref of expected) {
    const member: PreparedGroupMember={pref,permiteAgrupacion:true,calc:{...calc,piezas:pref.endsWith('-SF')?pieces.filter((p)=>p.nombre!=='fondo'):pieces}};
    const scene=construirVisualizacion([member],calcularGrupoFisico([member]));
    const sides=scene.paneles.filter((panel)=>panel.nombre==='lateral');
    assert.equal(sides.length,2,pref);
    for(const side of sides) {
      assert.equal(side.recortes?.length,2,pref);
      assert.deepEqual(side.recortes?.[0],{borde:'frontal_superior',profundidad:27,alto:73},pref);
      assert.equal(side.recortes?.[1].borde,'frontal',pref);
      assert.equal(side.recortes?.[1].profundidad,27,pref);
      assert.equal(side.recortes?.[1].alto,73,pref);
      assert.ok(Number.isFinite(side.recortes?.[1].z),pref);
      if (pref.includes('DB-2-1INT-SMG')) {
        assert.ok((side.recortes?.[1].z ?? 0) > 300, `${pref}: el mecanizado debe quedar justo bajo la base_gaveta`);
      }
    }
    const refuerzos=scene.paneles.filter((panel)=>panel.nombre==='refuerzo_delantero');
    assert.equal(refuerzos.length,1,pref);
    assert.equal(refuerzos[0].funcion,'travesano_frontal',pref);
    assert.equal(refuerzos[0].y,27,pref);
    assert.ok(refuerzos[0].w>refuerzos[0].h,pref);
    assert.equal(scene.paneles.some((panel)=>panel.nombre==='gola_madera'),false,pref);
    if(pref.endsWith('-SF')) assert.equal(scene.paneles.some((panel)=>panel.nombre==='fondo'),false,pref);
  }
});

test('DB-SMG hereda la omisión de fondo y la base P-TC al agrupar', () => {
  const member=(pref:string):PreparedGroupMember=>({pref,permiteAgrupacion:true,omiteFondoSoloAgrupado:true,calc});
  const individual=calcularGrupoFisico([member('DB-2S-SMG')]);
  assert.ok(individual.lineas[0].piezas.some((piece)=>piece.pieza==='fondo'));
  const grouped=calcularGrupoFisico([member('DB-2S-SMG'),member('DB-3-SMG')]);
  assert.ok(grouped.lineas.every((line)=>!line.piezas.some((piece)=>piece.pieza==='fondo')));
  assert.ok(grouped.lineas.every((line)=>Math.abs(line.piezas.find((piece)=>piece.pieza==='base')!.anchoIn-(24-15/25.4))<0.0001));
});

test('familias DB-SM existentes conservan reconocimiento y códigos', () => {
  assert.equal(esTipologiaDbSm('DB-2S-SM'),true);
  assert.equal(esTipologiaDbSmFe('DB-2S-SM-FE'),true);
  assert.equal(esTipologiaDbSmSf('DB-2S-SM-SF'),true);
  assert.equal(code('DB-2S-SM'),'DB36-2S-SM');
  assert.equal(code('DB-2S-SM-FE'),'DB36-2S-SM-FE');
  assert.equal(code('DB-2S-SM-SF'),'DB36-2S-SM-SF');
});
