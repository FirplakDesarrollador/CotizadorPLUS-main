import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

// Plantilla de puertas tras 0028_geometria_espesor_reveal.sql (extendida por
// 0036_reveal_puerta_b_ub_v.sql).
// Regla de ANCHO confirmada como universal en las hojas de ruta (W, UW, B, BFD,
// SBFD, PC): las puertas reparten L menos un reveal por puerta.
// Regla de ALTO: A - 3.2mm (puerta sobrepuesta) — verificada en W/BFD/SBFD/SVFD/UBFD/
// VFD/WBL (0028/0032) y confirmada por el usuario como regla general de "muebles de
// puertas" en B/UB/V (0036, antes excluidas por falta de evidencia).
const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {} },
  {
    nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas',
    formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-RV',
    cantos: { calibre: '22x1', largos: 2, anchos: 2 },
  },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
  { tipo_mueble_id: null, variable: 'gola', condicion: 'true', valor: '0', prioridad: 5 },
];

function input(dims: { L: number; A: number; P: number }): CalcInput {
  return {
    dims,
    piezas,
    reglas,
    preset: { caja: 'CAJA', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
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

const mm = (inches: number) => inches * 25.4;
const puerta = (r: ReturnType<typeof calcularMueble>) => r.piezas.find((p) => p.pieza === 'frente')!;

test('puerta doble: reparte L menos un reveal por puerta (BFD30 -> 377.8mm)', () => {
  const r = calcularMueble(input({ L: 30, A: 30, P: 24 }));
  const p = puerta(r);
  assert.equal(p.cant, 2);
  // Hoja real "BFD30 MBLE INF COC 2 PUERTAS": 758.8 x 377.8.
  assert.ok(Math.abs(mm(p.largoIn) - 377.8) < 0.1, `ancho puerta ${mm(p.largoIn).toFixed(2)}mm ≈ 377.8mm`);
  assert.ok(Math.abs(mm(p.anchoIn) - 758.8) < 0.1, `alto puerta ${mm(p.anchoIn).toFixed(2)}mm ≈ 758.8mm`);
});

test('puerta simple: L menos un solo reveal', () => {
  const r = calcularMueble(input({ L: 15, A: 30, P: 24 }));
  const p = puerta(r);
  assert.equal(p.cant, 1);
  // L = 381mm -> 381 - 3.2 = 377.8mm.
  assert.ok(Math.abs(mm(p.largoIn) - 377.8) < 0.1, `ancho puerta ${mm(p.largoIn).toFixed(2)}mm ≈ 377.8mm`);
});

test('el reveal no se pierde al cambiar el ancho del mueble', () => {
  // Para cualquier L con 2 puertas, la suma de anchos + 2 reveals debe dar L exacto.
  for (const L of [24, 27, 30, 33, 36]) {
    const p = puerta(calcularMueble(input({ L, A: 30, P: 24 })));
    const suma = 2 * mm(p.largoIn) + 2 * 3.2;
    assert.ok(Math.abs(suma - mm(L)) < 0.01, `L=${L}": ${suma.toFixed(2)}mm ≈ ${mm(L).toFixed(2)}mm`);
  }
});

test('el ancho de puerta es 3.2mm menor que el reparto ingenuo L/n', () => {
  const p = puerta(calcularMueble(input({ L: 30, A: 30, P: 24 })));
  const ingenuo = mm(30) / 2; // comportamiento anterior a 0028
  assert.ok(Math.abs((ingenuo - mm(p.largoIn)) - 3.2) < 0.01,
    `diferencia contra L/n = ${(ingenuo - mm(p.largoIn)).toFixed(2)}mm ≈ 3.2mm`);
});
