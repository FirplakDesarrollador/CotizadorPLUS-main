import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularMueble,
  type CalcInput,
  type Pieza,
  type Regla,
} from '../src/lib/engine';

// Réplica exacta de cot_piezas_plantilla para el tipo DB tras las migraciones
// 0027_db_gavetas_mixtas.sql y 0028_geometria_espesor_reveal.sql.
// Ver WikiLLM/wiki/validacion_hojas_de_ruta.md.
const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {} },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.25', cantos: {} },
  { nombre: 'refuerzo_delantero', rol_tablero: 'refuerzo', formula_cantidad: '(n_cajones)-gola', formula_largo: 'L-2*TC', formula_ancho: '3.25', cantos: {} },
  { nombre: 'gola_perfil', rol_tablero: 'caja', formula_cantidad: 'gola*2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {} },
  { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-4.13', formula_ancho: 'P-4.63', cantos: {} },
  { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos>0?0:n_cajones', formula_largo: 'L-3.427', formula_ancho: '2.6875', cantos: {} },
  { nombre: 'trasero_gaveta_pequena', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-4.607', formula_ancho: '68/25.4', cantos: {} },
  { nombre: 'trasero_gaveta_grande', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', formula_largo: 'L-4.607', formula_ancho: '183/25.4', cantos: {} },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos>0?0:n_cajones', formula_largo: 'L-RV', formula_ancho: '(A-n_cajones*RV-gola*2.11024)/n_cajones', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_gaveta_pequena', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-RV', formula_ancho: 'alto_frente_pequeno', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_gaveta_grande', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', formula_largo: 'L-RV', formula_ancho: '(n_cajones-n_cajones_pequenos)>0 ? (A-n_cajones*RV-gola*2.11024-n_cajones_pequenos*alto_frente_pequeno)/(n_cajones-n_cajones_pequenos) : 0', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-TC', formula_ancho: 'A', cantos: {} },
];

// Réplica de cot_reglas_config para DB tras 0028.
const reglas: Regla[] = [
  { tipo_mueble_id: 'db', variable: 'n_cajones', condicion: 'true', valor: '2', prioridad: 5 },
  { tipo_mueble_id: 'db', variable: 'n_puertas', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: 'db', variable: 'n_cajones_pequenos', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: null, variable: 'gola', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: 'db', variable: 'alto_frente_pequeno_base', condicion: 'n_cajones_pequenos>=2', valor: '(A-4*RV)/4', prioridad: 10 },
  { tipo_mueble_id: 'db', variable: 'alto_frente_pequeno_base', condicion: 'n_cajones_pequenos==1', valor: '6', prioridad: 20 },
  { tipo_mueble_id: 'db', variable: 'alto_frente_pequeno_base', condicion: 'true', valor: '0', prioridad: 99 },
  { tipo_mueble_id: 'db', variable: 'alto_frente_pequeno', condicion: 'true', valor: 'alto_frente_pequeno_base*(A-n_cajones*RV-gola*2.11024)/(A-n_cajones*RV)', prioridad: 10 },
];

function input(overrides: Record<string, number>, espesorCajaMm = 15): CalcInput {
  return {
    dims: { L: 15, A: 30, P: 24 },
    piezas,
    reglas,
    overrides,
    preset: { caja: 'CAJA', refuerzo: 'REF', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: espesorCajaMm },
      REF: { codigo: 'REF', precio_m2: 1, espesor_mm: espesorCajaMm },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
    },
    cantosByCalibre: { '22X1': { calibre: '22x1', precio: 1 }, '22X0,45': { calibre: '22x0,45', precio: 1 } },
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

const mm = (inches: number) => inches * 25.4;

// Aproximación en milímetros contra la lista de corte real.
function assertMm(actualIn: number, esperadoMm: number, tol: number, etiqueta: string) {
  const real = mm(actualIn);
  assert.ok(Math.abs(real - esperadoMm) < tol, `${etiqueta}: ${real.toFixed(2)}mm ≈ ${esperadoMm}mm`);
}

// ---------------------------------------------------------------------------
// Tipologías mixtas
// ---------------------------------------------------------------------------

test('DB-1S (15x30x24): frentes y traseros de gaveta reproducen la lista de corte real', () => {
  const result = calcularMueble(input({ n_cajones: 3, n_cajones_pequenos: 1 }));

  // El cajón pequeño (SUP) tiene frente fijo de 6" = 152.4mm.
  const frentePeq = piece(result, 'frente_gaveta_pequena');
  assert.equal(frentePeq.cant, 1);
  assertMm(frentePeq.largoIn, 377.8, 0.5, 'largo frente pequeño');
  assertMm(frentePeq.anchoIn, 152.4, 0.5, 'ancho frente pequeño');

  // Los 2 cajones grandes se reparten el resto del Alto (menos 3.2mm de reveal por cajón).
  const frenteGde = piece(result, 'frente_gaveta_grande');
  assert.equal(frenteGde.cant, 2);
  assertMm(frenteGde.anchoIn, 300.08, 0.5, 'ancho frente grande');

  // El "frente" genérico (uniforme) queda en 0 piezas cuando la tipología es mixta.
  assert.equal(piece(result, 'frente').cant, 0);

  // Traseros de gaveta: 68mm en el pequeño, 183mm en los grandes.
  const traseroPeq = piece(result, 'trasero_gaveta_pequena');
  assert.equal(traseroPeq.cant, 1);
  assertMm(traseroPeq.anchoIn, 68, 0.1, 'ancho trasero pequeño');
  assertMm(traseroPeq.largoIn, 264, 0.5, 'largo trasero pequeño');

  const traseroGde = piece(result, 'trasero_gaveta_grande');
  assert.equal(traseroGde.cant, 2);
  assertMm(traseroGde.anchoIn, 183, 0.1, 'ancho trasero grande');

  assert.equal(piece(result, 'trasero_gaveta').cant, 0);

  // El fondo de cada cajón (base_gaveta) es igual en los 3.
  const fondoGaveta = piece(result, 'base_gaveta');
  assert.equal(fondoGaveta.cant, 3);
  assertMm(fondoGaveta.largoIn, 276, 0.5, 'largo fondo gaveta');
  assertMm(fondoGaveta.anchoIn, 492, 0.5, 'ancho fondo gaveta');

  // La pila de frentes cierra contra el Alto menos un reveal por frente.
  const suma = mm(frentePeq.anchoIn) + 2 * mm(frenteGde.anchoIn);
  assert.ok(Math.abs(suma - (762 - 3 * 3.2)) < 0.5, `pila de frentes ${suma.toFixed(2)}mm ≈ 752.4mm`);
});

test('DB-2S usa la rejilla de 4 unidades, no la regla de 6" fija de DB-1S', () => {
  const result = calcularMueble(input({ n_cajones: 3, n_cajones_pequenos: 2 }));

  // Hoja de ruta real DB16-2S / DB30-2S: 187.3 / 187.3 / 377.8.
  const peq = piece(result, 'frente_gaveta_pequena');
  assert.equal(peq.cant, 2);
  assertMm(peq.anchoIn, 187.3, 0.5, 'ancho frente pequeño DB-2S');

  const gde = piece(result, 'frente_gaveta_grande');
  assert.equal(gde.cant, 1);
  assertMm(gde.anchoIn, 377.8, 0.5, 'ancho frente grande DB-2S');

  // La grande es exactamente 2 unidades + 1 reveal.
  assertMm(gde.anchoIn, 2 * mm(peq.anchoIn) + 3.2, 0.5, 'grande = 2 unidades + reveal');

  // Cierre exacto contra el Alto.
  const suma = 2 * mm(peq.anchoIn) + mm(gde.anchoIn);
  assert.ok(Math.abs(suma - 752.4) < 0.5, `pila de frentes ${suma.toFixed(2)}mm ≈ 752.4mm`);

  // Traseros: 2 pequeños de 68mm + 1 grande de 183mm.
  assert.equal(piece(result, 'trasero_gaveta_pequena').cant, 2);
  assert.equal(piece(result, 'trasero_gaveta_grande').cant, 1);
});

test('DB-3 y DB-4 (tipologías parejas) reparten con reveal', () => {
  const db3 = calcularMueble(input({ n_cajones: 3 }));
  assert.equal(db3.vars.n_cajones_pequenos, 0);
  assert.equal(piece(db3, 'frente').cant, 3);
  assert.equal(piece(db3, 'frente_gaveta_pequena').cant, 0);
  assert.equal(piece(db3, 'frente_gaveta_grande').cant, 0);
  assert.equal(piece(db3, 'trasero_gaveta').cant, 3);
  // Hoja real DB15-3 / DB30-3: 250.8mm (antes daba 254.0 sin reveal).
  assertMm(piece(db3, 'frente').anchoIn, 250.8, 0.5, 'ancho frente DB-3');
  assertMm(piece(db3, 'frente').largoIn, 377.8, 0.5, 'largo frente DB-3');

  // DB-2: hoja real 377.8 x2.
  const db2 = calcularMueble(input({ n_cajones: 2 }));
  assertMm(piece(db2, 'frente').anchoIn, 377.8, 0.5, 'ancho frente DB-2');

  // DB-4: hoja real 187.7 (la hoja redondea; la fórmula da 187.3).
  const db4 = calcularMueble(input({ n_cajones: 4 }));
  assertMm(piece(db4, 'frente').anchoIn, 187.5, 0.5, 'ancho frente DB-4');
});

// ---------------------------------------------------------------------------
// Variante de frente: gola
// ---------------------------------------------------------------------------

test('gola descuenta 53.6mm de la pila de frentes y cambia los refuerzos', () => {
  const sinGola = calcularMueble(input({ n_cajones: 3, n_cajones_pequenos: 2 }));
  const conGola = calcularMueble(input({ n_cajones: 3, n_cajones_pequenos: 2, gola: 1 }));

  // Hoja real "HRJ DB30-2S SM": 173.9 / 173.9 / 351.0.
  assertMm(piece(conGola, 'frente_gaveta_pequena').anchoIn, 173.9, 0.5, 'ancho frente pequeño con gola');
  assertMm(piece(conGola, 'frente_gaveta_grande').anchoIn, 351.0, 0.5, 'ancho frente grande con gola');

  // La pila pierde exactamente 53.6mm.
  const pila = (r: ReturnType<typeof calcularMueble>) =>
    2 * mm(piece(r, 'frente_gaveta_pequena').anchoIn) + mm(piece(r, 'frente_gaveta_grande').anchoIn);
  assert.ok(Math.abs((pila(sinGola) - pila(conGola)) - 53.6) < 0.5,
    `la gola descuenta ${(pila(sinGola) - pila(conGola)).toFixed(2)}mm ≈ 53.6mm`);

  // Aparecen 2 perfiles de gola y se retira un refuerzo delantero (3 -> 2).
  assert.equal(piece(sinGola, 'gola_perfil').cant, 0);
  assert.equal(piece(conGola, 'gola_perfil').cant, 2);
  assert.equal(piece(sinGola, 'refuerzo_delantero').cant, 3);
  assert.equal(piece(conGola, 'refuerzo_delantero').cant, 2);
});

test('gola en tipología pareja (DB-2 SM): dos frentes de 351mm', () => {
  const result = calcularMueble(input({ n_cajones: 2, gola: 1 }));
  // Hoja real "HRJ DB24-2 SM" / "HRJ DB28-2 SMG": 351.0 x2.
  assertMm(piece(result, 'frente').anchoIn, 351.0, 0.5, 'ancho frente DB-2 con gola');
});

// ---------------------------------------------------------------------------
// Espesor parametrizado
// ---------------------------------------------------------------------------

test('la constante interior sigue el espesor del lateral (15mm -> L-30, 18mm -> L-36)', () => {
  const c15 = calcularMueble(input({ n_cajones: 3 }, 15));
  const c18 = calcularMueble(input({ n_cajones: 3 }, 18));

  // L = 15" = 381mm.
  assertMm(piece(c15, 'base').largoIn, 381 - 30, 0.1, 'largo base con caja de 15mm');
  assertMm(piece(c18, 'base').largoIn, 381 - 36, 0.1, 'largo base con caja de 18mm');

  assertMm(piece(c15, 'refuerzo_trasero').largoIn, 381 - 30, 0.1, 'largo refuerzo con caja de 15mm');
  assertMm(piece(c18, 'refuerzo_trasero').largoIn, 381 - 36, 0.1, 'largo refuerzo con caja de 18mm');

  // El fondo topa contra un solo espesor.
  assertMm(piece(c15, 'fondo').largoIn, 381 - 15, 0.1, 'largo fondo con caja de 15mm');
  assertMm(piece(c18, 'fondo').largoIn, 381 - 18, 0.1, 'largo fondo con caja de 18mm');
});

test('el ancho de la base sigue el espesor del fondo (P-18-espesor_fondo)', () => {
  const base = (fondoMm: number) => {
    const inp = input({ n_cajones: 3 });
    inp.tablerosByCode.FONDO = { codigo: 'FONDO', precio_m2: 1, espesor_mm: fondoMm };
    return mm(piece(calcularMueble(inp), 'base').anchoIn);
  };
  // P = 24" = 609.6mm. Fondo 6mm -> P-24 ; fondo 9mm (variante -F9) -> P-27.
  assert.ok(Math.abs(base(6) - (609.6 - 24)) < 0.2, `base con fondo 6mm = ${base(6).toFixed(2)}mm ≈ 585.6mm`);
  assert.ok(Math.abs(base(9) - (609.6 - 27)) < 0.2, `base con fondo 9mm = ${base(9).toFixed(2)}mm ≈ 582.6mm`);
});
