import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

// El consumo de tablero de CUALQUIER tipología paga exactamente "neto + desperdicio"
// (15% por defecto, cot_parametros.desperdicio_madera) — sin margen adicional ni
// distinción por rol_tablero. engine.ts aplica esto en un único punto (el loop sobre
// areaPorRol), no por tipo_mueble, así que una plantilla con varios roles de tablero
// alcanza para probar que ninguno se escapa de la regla.
const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'refuerzo', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L', formula_ancho: '3.14961', cantos: {} },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} },
];
const reglas: Regla[] = [];

function input(desperdicio: number): CalcInput {
  return {
    dims: { L: 24, A: 30, P: 24 },
    piezas,
    reglas,
    preset: { caja: 'CAJA', refuerzo: 'CAJA', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 100000, espesor_mm: 15 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 130000, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: 40000, espesor_mm: 6 },
    },
    cantosByCalibre: {},
    herrajesByCode: {},
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    margen: 0,
    margenHerraje: 0,
    trm: 1,
    desperdicio,
  };
}

test('cada rol de tablero paga neto + 15% de desperdicio, ni más ni menos', () => {
  const r = calcularMueble(input(0.15));
  assert.ok(r.maderaPorRol.length >= 3, 'la plantilla de prueba cubre varios roles de tablero');
  for (const m of r.maderaPorRol) {
    const tab = { CAJA: 100000, FRENTE: 130000, FONDO: 40000 }[m.codigo]!;
    const netoCosto = (m.cm2 / 10000) * tab;
    assert.ok(
      Math.abs(m.costo - netoCosto * 1.15) < 0.5, // tolerancia: cm2 y costo vienen redondeados a 2 decimales
      `rol=${m.rol}: costo=${m.costo} debería ser neto(${netoCosto.toFixed(2)}) × 1.15 = ${(netoCosto * 1.15).toFixed(2)}`,
    );
  }
});

test('el desperdicio es el único factor de merma: cambiar la tarifa del proyecto mueve TODOS los roles por igual', () => {
  const r10 = calcularMueble(input(0.10));
  const r15 = calcularMueble(input(0.15));
  for (let i = 0; i < r15.maderaPorRol.length; i++) {
    const m10 = r10.maderaPorRol[i], m15 = r15.maderaPorRol[i];
    assert.equal(m10.rol, m15.rol);
    const ratio = m15.costo / m10.costo;
    assert.ok(Math.abs(ratio - (1.15 / 1.10)) < 0.001, `rol=${m15.rol}: ratio 15%/10% = ${ratio.toFixed(4)} ≈ ${(1.15 / 1.10).toFixed(4)}`);
  }
});

test('con desperdicio=0, el costo de tablero es exactamente el neto (sin markup oculto)', () => {
  const r = calcularMueble(input(0));
  for (const m of r.maderaPorRol) {
    const tab = { CAJA: 100000, FRENTE: 130000, FONDO: 40000 }[m.codigo]!;
    const netoCosto = (m.cm2 / 10000) * tab;
    assert.ok(Math.abs(m.costo - netoCosto) < 0.5, `rol=${m.rol}: sin desperdicio, costo debe ser el neto exacto`);
  }
});
