import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '../src/lib/engine';

// Hoja de ruta real "DB18-1S MBLE INF COC 3 GAVETAS 1 PEQUEÑA": la pieza BACKING
// (fondo trasero delgado, 6mm) mide 760 x 441,2mm para L=18",A=30". La fórmula
// anterior (largo=A, ancho=L-TC) daba 762 x 442,2mm — 2mm y 1mm de más, el único
// desvío real entre las 18 piezas de esa hoja (las otras 17 ya cerraban <0.3mm).
// Confirmado independiente: UDB/USVFD/UVFD (tipologías generadas por
// scripts/generar_tipologias.py directo desde hojas reales de familias de cajones
// emparentadas) ya usan exactamente esta misma fórmula para su pieza `fondo`.
const piezas: Pieza[] = [
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

function input(dims: { L: number; A: number; P: number }): CalcInput {
  return {
    dims,
    piezas,
    reglas: [],
    preset: { fondo: 'FONDO' },
    tablerosByCode: { FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 } },
    cantosByCalibre: {},
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

test('BACKING de DB18-1S: 760 x 441.2mm exacto contra la hoja de ruta real', () => {
  const r = calcularMueble(input({ L: 18, A: 30, P: 24 }));
  const fondo = r.piezas.find((p) => p.pieza === 'fondo')!;
  assert.ok(Math.abs(mm(fondo.largoIn) - 760) < 0.1, `largo ${mm(fondo.largoIn).toFixed(2)}mm ≈ 760mm`);
  assert.ok(Math.abs(mm(fondo.anchoIn) - 441.2) < 0.1, `ancho ${mm(fondo.anchoIn).toFixed(2)}mm ≈ 441.2mm`);
});

test('BACKING escala con L y A: se mantiene A-2mm / L-16mm en otro tamaño', () => {
  const r = calcularMueble(input({ L: 24, A: 30, P: 24 }));
  const fondo = r.piezas.find((p) => p.pieza === 'fondo')!;
  assert.ok(Math.abs(mm(fondo.largoIn) - (mm(30) - 2)) < 0.1, 'largo sigue siendo A-2mm');
  assert.ok(Math.abs(mm(fondo.anchoIn) - (mm(24) - 16)) < 0.1, 'ancho sigue siendo L-16mm');
});
