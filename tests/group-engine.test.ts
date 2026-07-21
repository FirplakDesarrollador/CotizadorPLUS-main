import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '@/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '@/lib/group-engine';

const TC = 15 / 25.4;

const lateral: Pieza = {
  nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P',
  tarugos: 0, soportes: 0, modo_agrupacion: 'lateral_compartido',
};
const base: Pieza = {
  nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: `L-${2 * TC}`, formula_ancho: 'P-0.9',
  tarugos: 8, soportes: 0, modo_agrupacion: 'continua', clave_fusion: 'base', formula_largo_grupo: 'LG-(2*TC)',
};
const rear: Pieza = {
  nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: `L-${2 * TC}`, formula_ancho: '3.25',
  tarugos: 4, soportes: 0, modo_agrupacion: 'continua', clave_fusion: 'refuerzo_trasero', formula_largo_grupo: 'LG-(2*TC)',
};
const shelf: Pieza = {
  nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: `L-${2 * TC}`, formula_ancho: 'P-1.5',
  tarugos: 0, soportes: 4, modo_agrupacion: 'local',
};
const back: Pieza = {
  nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: `L-${TC}`, formula_ancho: 'A',
  tarugos: 0, soportes: 0, modo_agrupacion: 'continua', clave_fusion: 'fondo', formula_largo_grupo: 'LG-TC',
};

function frontReinforcement(name: string, role: string, quantity: number): Pieza {
  return {
    nombre: name, rol_tablero: role, formula_cantidad: String(quantity), formula_largo: `L-${2 * TC}`, formula_ancho: '3.25',
    tarugos: 4, soportes: 0, modo_agrupacion: 'continua', clave_fusion: 'refuerzo_frontal', formula_largo_grupo: 'LG-(2*TC)',
  };
}

function member(options: {
  pref: string;
  width: number;
  frontName?: string;
  frontRole?: string;
  frontQuantity?: number;
  frontBoard?: string;
  height?: number;
  permiteAgrupacion?: boolean;
  refuerzoBoard?: string;
  omitBack?: boolean;
}): PreparedGroupMember {
  const pieces = [
    lateral,
    base,
    rear,
    frontReinforcement(options.frontName ?? 'refuerzo_horizontal', options.frontRole ?? 'refuerzo', options.frontQuantity ?? 2),
    shelf,
    ...(options.omitBack ? [] : [back]),
  ];
  const boards = {
    C15: { codigo: 'C15', precio_m2: 100_000, espesor_mm: 15, formato: '183X244' },
    R15: { codigo: 'R15', precio_m2: 80_000, espesor_mm: 15, formato: '183X244' },
    R2: { codigo: 'R2', precio_m2: 80_000, espesor_mm: 15, formato: '183X244' },
    F6: { codigo: 'F6', precio_m2: 50_000, espesor_mm: 6, formato: '183X244' },
    FRONT_A: { codigo: 'FRONT_A', precio_m2: 120_000, espesor_mm: 18, formato: '183X244' },
    FRONT_B: { codigo: 'FRONT_B', precio_m2: 130_000, espesor_mm: 18, formato: '183X244' },
    FRONT_THIN: { codigo: 'FRONT_THIN', precio_m2: 110_000, espesor_mm: 15, formato: '183X244' },
  };
  const calc: CalcInput = {
    dims: { L: options.width, A: options.height ?? 30, P: 24 },
    piezas: pieces,
    reglas: [],
    preset: {
      caja: 'C15', refuerzo: options.refuerzoBoard ?? 'R15', fondo: 'F6', frente: options.frontBoard ?? 'FRONT_A',
    },
    tablerosByCode: boards,
    cantosByCalibre: {},
    herrajesByCode: {},
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    usaCarton: false,
    margen: 0.5,
    trm: 4_000,
    desperdicio: 0,
    modoFrentes: 'normal',
  };
  return { calc, pref: options.pref, permiteAgrupacion: options.permiteAgrupacion ?? true };
}

function pieceTotal(result: ReturnType<typeof calcularGrupoFisico>, name: string) {
  return result.lineas.flatMap((line) => line.piezas).filter((piece) => piece.pieza === name)
    .reduce((sum, piece) => sum + piece.cant, 0);
}

test('fusiona B12.DB10.BFD20 con cuatro laterales y código físico continuo', () => {
  const members = [
    member({ pref: 'B', width: 12, frontBoard: 'FRONT_A' }),
    member({ pref: 'DB', width: 10, frontQuantity: 2, frontBoard: 'FRONT_B' }),
    member({ pref: 'BFD', width: 20, frontName: 'refuerzo_delantero', frontRole: 'caja', frontQuantity: 1, frontBoard: 'FRONT_A' }),
  ];
  // BFD usa caja para el refuerzo delantero; para homologarlo, caja/refuerzo deben ser el mismo tablero físico.
  for (const m of members) m.calc.preset.refuerzo = 'C15';

  const grouped = calcularGrupoFisico(members);
  assert.equal(grouped.largoTotalIn, 42);
  assert.equal(grouped.laterales, 4);
  assert.equal(grouped.uniones, 2);
  assert.deepEqual(new Set(grouped.piezasContinuas), new Set(['base', 'refuerzo_trasero', 'refuerzo_frontal', 'fondo']));
  assert.equal(pieceTotal(grouped, 'lateral'), 4);
  assert.equal(pieceTotal(grouped, 'base'), 1);
  assert.equal(pieceTotal(grouped, 'refuerzo_trasero'), 2);
  assert.equal(pieceTotal(grouped, 'refuerzo_horizontal') + pieceTotal(grouped, 'refuerzo_delantero'), 2);

  const baseLengths = grouped.lineas.flatMap((line) => line.piezas).filter((piece) => piece.pieza === 'base');
  assert.ok(baseLengths.every((piece) => Math.abs(piece.largoIn - (42 - 2 * TC)) < 0.001));

  const shelves = grouped.lineas.map((line) => line.piezas.find((piece) => piece.pieza === 'entrepano')!);
  assert.ok(Math.abs(shelves[0].largoIn - (12 - 2 * TC + TC / 2)) < 0.001);
  assert.ok(Math.abs(shelves[1].largoIn - (10 - 2 * TC + TC)) < 0.001);
  assert.ok(Math.abs(shelves[2].largoIn - (20 - 2 * TC + TC / 2)) < 0.001);

  const individualCost = members.reduce((sum, m) => sum + calcularMueble(m.calc).costoSinHerrajes, 0);
  const groupedCost = grouped.lineas.reduce((sum, line) => sum + line.costoSinHerrajes, 0);
  assert.ok(groupedCost < individualCost, `${groupedCost} debe ser menor que ${individualCost}`);
});

test('permite materiales de frente distintos cuando conservan el espesor', () => {
  assert.doesNotThrow(() => calcularGrupoFisico([
    member({ pref: 'B', width: 12, frontBoard: 'FRONT_A', refuerzoBoard: 'C15' }),
    member({ pref: 'DB', width: 10, frontBoard: 'FRONT_B', refuerzoBoard: 'C15' }),
  ]));
});

test('bloquea incompatibilidades antes de transformar el despiece', () => {
  assert.throws(() => calcularGrupoFisico([
    member({ pref: 'B', width: 12, frontBoard: 'FRONT_A' }),
    member({ pref: 'DB', width: 10, frontBoard: 'FRONT_THIN' }),
  ]), /mismo espesor/);

  assert.throws(() => calcularGrupoFisico([
    member({ pref: 'B', width: 12 }),
    member({ pref: 'DB', width: 10, permiteAgrupacion: false }),
  ]), /no admite agrupación/);

  assert.throws(() => calcularGrupoFisico([
    member({ pref: 'B', width: 12 }),
    member({ pref: 'DB', width: 10, omitBack: true }),
  ]), /mismo conjunto/);
});

test('permite combinar módulos con diferente altura y quita el lateral del módulo menos alto', () => {
  const tall = member({ pref: 'B', width: 12, height: 30, omitBack: true });
  const short = member({ pref: 'DB', width: 10, height: 20, omitBack: true });

  const grouped = calcularGrupoFisico([tall, short]);
  assert.equal(grouped.laterales, 3);

  // Módulo alto (índice 0, height 30): conserva sus 2 laterales
  const tallLaterals = grouped.lineas[0].piezas.find((p) => p.pieza === 'lateral')?.cant;
  assert.equal(tallLaterals, 2);

  // Módulo bajo (índice 1, height 20): descuenta su lateral en la unión (conserva 1)
  const shortLaterals = grouped.lineas[1].piezas.find((p) => p.pieza === 'lateral')?.cant;
  assert.equal(shortLaterals, 1);
});

test('bloquea grupos que exceden el largo del tablero', () => {
  assert.throws(() => calcularGrupoFisico([
    member({ pref: 'B', width: 50 }),
    member({ pref: 'DB', width: 50 }),
  ]), /supera el largo disponible/);
});

