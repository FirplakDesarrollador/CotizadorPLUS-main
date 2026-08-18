import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularMueble,
  type CalcInput,
  type Pieza,
  type Regla,
} from '../src/lib/engine';

// Réplica exacta de cot_piezas_plantilla para el tipo DB tras la migración
// 0027_db_gavetas_mixtas.sql (ver WikiLLM/wiki/rieles_db.md).
const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-1.18', formula_ancho: 'P-0.9', cantos: {} },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-1.18', formula_ancho: '3.25', cantos: {} },
  { nombre: 'refuerzo_horizontal', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-1.18', formula_ancho: '3.25', cantos: {} },
  { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-4.13', formula_ancho: 'P-4.63', cantos: {} },
  { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos>0?0:n_cajones', formula_largo: 'L-3.427', formula_ancho: '2.6875', cantos: {} },
  { nombre: 'trasero_gaveta_pequena', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-4.607', formula_ancho: '68/25.4', cantos: {} },
  { nombre: 'trasero_gaveta_grande', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', formula_largo: 'L-4.607', formula_ancho: '183/25.4', cantos: {} },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos>0?0:n_cajones', formula_largo: 'L', formula_ancho: 'A/n_cajones', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_gaveta_pequena', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L', formula_ancho: '6', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_gaveta_grande', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', formula_largo: 'L', formula_ancho: '(n_cajones-n_cajones_pequenos)>0?(A-n_cajones*3.2/25.4-6*n_cajones_pequenos)/(n_cajones-n_cajones_pequenos):0', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-0.59', formula_ancho: 'A', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: 'db', variable: 'n_cajones', condicion: 'true', valor: '2', prioridad: 5 },
  { tipo_mueble_id: 'db', variable: 'n_puertas', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: 'db', variable: 'n_cajones_pequenos', condicion: 'true', valor: '0', prioridad: 5 },
];

function input(overrides: Record<string, number>): CalcInput {
  return {
    dims: { L: 15, A: 30, P: 24 },
    piezas,
    reglas,
    overrides,
    preset: { caja: 'CAJA', refuerzo: 'REF', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1 },
      REF: { codigo: 'REF', precio_m2: 1 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1 },
      FONDO: { codigo: 'FONDO', precio_m2: 1 },
    },
    cantosByCalibre: { '22X1': { calibre: '22x1', precio: 1 } },
    herrajesByCode: {},
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    margen: 0,
    margenHerraje: 0,
    trm: 1,
    desperdicio: 0,
  };
}

const piece = (result: ReturnType<typeof calcularMueble>, name: string) =>
  result.piezas.find((item) => item.pieza === name)!;

// Milímetros de la lista de corte real "DB15-1S MBLE INF COC 3 GAVETAS 1 PEQUEÑA".
const mm = (inches: number) => inches * 25.4;

test('DB-1S (15x30x24): frentes y traseros de gaveta reproducen la lista de corte real', () => {
  const result = calcularMueble(input({ n_cajones: 3, n_cajones_pequenos: 1 }));

  // El cajón pequeño (SUP) tiene frente fijo de 6" = 152.4mm.
  const frentePeq = piece(result, 'frente_gaveta_pequena');
  assert.equal(frentePeq.cant, 1);
  assert.ok(Math.abs(mm(frentePeq.largoIn) - 381) < 0.5, `largo frente pequeño ${mm(frentePeq.largoIn)} ≈ 381mm`);
  assert.ok(Math.abs(mm(frentePeq.anchoIn) - 152.4) < 0.5, `ancho frente pequeño ${mm(frentePeq.anchoIn)} ≈ 152.4mm`);

  // Los 2 cajones grandes se reparten el resto del Alto (menos 3.2mm de reveal por cajón).
  const frenteGde = piece(result, 'frente_gaveta_grande');
  assert.equal(frenteGde.cant, 2);
  assert.ok(Math.abs(mm(frenteGde.anchoIn) - 300.08) < 0.5, `ancho frente grande ${mm(frenteGde.anchoIn)} ≈ 300.08mm`);

  // El "frente" genérico (uniforme) queda en 0 piezas cuando la tipología es mixta.
  assert.equal(piece(result, 'frente').cant, 0);

  // Traseros de gaveta: 68mm en el pequeño, 183mm en los grandes.
  const traseroPeq = piece(result, 'trasero_gaveta_pequena');
  assert.equal(traseroPeq.cant, 1);
  assert.ok(Math.abs(mm(traseroPeq.anchoIn) - 68) < 0.1, `ancho trasero pequeño ${mm(traseroPeq.anchoIn)} ≈ 68mm`);
  assert.ok(Math.abs(mm(traseroPeq.largoIn) - 264) < 0.5, `largo trasero pequeño ${mm(traseroPeq.largoIn)} ≈ 264mm`);

  const traseroGde = piece(result, 'trasero_gaveta_grande');
  assert.equal(traseroGde.cant, 2);
  assert.ok(Math.abs(mm(traseroGde.anchoIn) - 183) < 0.1, `ancho trasero grande ${mm(traseroGde.anchoIn)} ≈ 183mm`);

  assert.equal(piece(result, 'trasero_gaveta').cant, 0);

  // El fondo de cada cajón (base_gaveta) es igual en los 3, y ahora sí coincide con la lista real.
  const fondoGaveta = piece(result, 'base_gaveta');
  assert.equal(fondoGaveta.cant, 3);
  assert.ok(Math.abs(mm(fondoGaveta.largoIn) - 276) < 0.5, `largo fondo gaveta ${mm(fondoGaveta.largoIn)} ≈ 276mm`);
  assert.ok(Math.abs(mm(fondoGaveta.anchoIn) - 492) < 0.5, `ancho fondo gaveta ${mm(fondoGaveta.anchoIn)} ≈ 492mm`);
});

test('DB-3 (tipología pareja) conserva el comportamiento anterior sin gavetas mixtas', () => {
  const result = calcularMueble(input({ n_cajones: 3 }));
  assert.equal(result.vars.n_cajones_pequenos, 0);
  assert.equal(piece(result, 'frente').cant, 3);
  assert.equal(piece(result, 'frente_gaveta_pequena').cant, 0);
  assert.equal(piece(result, 'frente_gaveta_grande').cant, 0);
  assert.equal(piece(result, 'trasero_gaveta').cant, 3);
  assert.equal(piece(result, 'trasero_gaveta_pequena').cant, 0);
  assert.equal(piece(result, 'trasero_gaveta_grande').cant, 0);
  // Reparto uniforme sin corrección de reveal (comportamiento histórico, sin cambios).
  assert.ok(Math.abs(piece(result, 'frente').anchoIn - 10) < 1e-9);
});
