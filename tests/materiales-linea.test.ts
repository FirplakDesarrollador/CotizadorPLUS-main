import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularPrecioMaterial, descripcionMaterial, margenDeMaterial,
  grupoSeSaltaElMotor, UNIDAD_MATERIAL, type MaterialLinea,
} from '../src/lib/materiales-linea';

// Lineas de material suelto anadidas a una cocina sin pasar por un modulo.
// Decidido con el usuario: cantidad en la unidad natural de cada catalogo, y el
// margen segun lo que se agregue (herraje -> margen_herraje; tablero y canto ->
// margen_muebles, igual que dentro de un modulo).

const OPC = { margenMuebles: 0.6, margenHerraje: 0.35, trm: 4000 };

test('cada tipo se cobra en la unidad de su catalogo', () => {
  assert.equal(UNIDAD_MATERIAL.tablero, 'm²', 'cot_tableros.precio_m2');
  assert.equal(UNIDAD_MATERIAL.canto, 'm', 'cot_cantos.precio es por metro lineal');
  assert.equal(UNIDAD_MATERIAL.herraje, 'und', 'cot_herrajes.precio es por unidad');
});

test('el margen depende de lo que se agregue', () => {
  assert.equal(margenDeMaterial('herraje', 0.6, 0.35), 0.35);
  assert.equal(margenDeMaterial('tablero', 0.6, 0.35), 0.6);
  assert.equal(margenDeMaterial('canto', 0.6, 0.35), 0.6);
});

test('un herraje usa el margen de herraje y suma a la columna con herrajes', () => {
  const r = calcularPrecioMaterial({ tipo: 'herraje', codigo: 'BISAGRAPAR', cantidad: 12, precioUnitarioCop: 9800 }, OPC);
  assert.equal(r.costoHerrajes, 117_600, '12 x 9.800');
  assert.equal(r.costoSinHerrajes, 0, 'no es madera: la columna s/H queda en cero');
  // Margen sobre precio, como en engine.ts: costo / (1 - margen).
  assert.ok(Math.abs(r.precioConHerrajesCop - 117_600 / 0.65) < 0.01);
  assert.equal(r.precioCop, 0, 'el precio s/H de un herraje es cero');
});

test('un tablero usa el margen de muebles y suma a la columna sin herrajes', () => {
  const r = calcularPrecioMaterial({ tipo: 'tablero', codigo: 'ECOCARB15COLOR', cantidad: 2.5, precioUnitarioCop: 42_000 }, OPC);
  assert.equal(r.costoSinHerrajes, 105_000, '2,5 m2 x 42.000');
  assert.equal(r.costoHerrajes, 0);
  assert.ok(Math.abs(r.precioCop - 105_000 / 0.4) < 0.01, 'margen de muebles, 60%');
  assert.ok(Math.abs(r.precioConHerrajesCop - r.precioCop) < 0.01, 'sin herrajes que sumar, ambos coinciden');
});

test('un canto se cobra por metro lineal con el margen de muebles', () => {
  const r = calcularPrecioMaterial({ tipo: 'canto', codigo: '19x0,45', cantidad: 25, precioUnitarioCop: 400 }, OPC);
  assert.equal(r.costoSinHerrajes, 10_000, '25 m x 400');
  assert.ok(Math.abs(r.precioCop - 10_000 / 0.4) < 0.01);
});

test('el descuento del proyecto se aplica al valor en USD, como en el motor', () => {
  const linea: MaterialLinea = { tipo: 'herraje', codigo: 'X', cantidad: 1, precioUnitarioCop: 1000 };
  const sin = calcularPrecioMaterial(linea, OPC);
  const con = calcularPrecioMaterial(linea, { ...OPC, descuento: 0.1 });
  assert.equal(con.precioConHerrajesCop, sin.precioConHerrajesCop, 'el COP no lleva el descuento');
  assert.ok(Math.abs(con.precioConHerrajesUsd - sin.precioConHerrajesUsd * 0.9) < 1e-9, 'el USD si');
});

test('una TRM de cero no produce Infinity', () => {
  const r = calcularPrecioMaterial({ tipo: 'herraje', codigo: 'X', cantidad: 1, precioUnitarioCop: 1000 }, { ...OPC, trm: 0 });
  assert.equal(r.precioConHerrajesUsd, 0);
  assert.ok(Number.isFinite(r.precioConHerrajesCop));
});

test('cantidades o precios negativos no restan del total', () => {
  for (const linea of [
    { tipo: 'herraje' as const, codigo: 'X', cantidad: -5, precioUnitarioCop: 1000 },
    { tipo: 'herraje' as const, codigo: 'X', cantidad: 5, precioUnitarioCop: -1000 },
  ]) {
    assert.equal(calcularPrecioMaterial(linea, OPC).costoConHerrajes, 0, JSON.stringify(linea));
  }
});

test('un margen de 100% no divide por cero', () => {
  const r = calcularPrecioMaterial({ tipo: 'tablero', codigo: 'X', cantidad: 1, precioUnitarioCop: 1000 },
    { ...OPC, margenMuebles: 1 });
  assert.ok(Number.isFinite(r.precioCop));
  assert.equal(r.precioCop, 1000, 'se trata como sin margen en vez de dar Infinity');
});

test('la descripcion nombra el tipo, el codigo y la cantidad con su unidad', () => {
  assert.equal(descripcionMaterial({ tipo: 'herraje', codigo: 'BISAGRAPAR', cantidad: 12 }), 'Herraje BISAGRAPAR · 12 und');
  assert.equal(descripcionMaterial({ tipo: 'canto', codigo: '19x0,45', cantidad: 25 }), 'Canto 19x0,45 · 25 m');
  assert.equal(descripcionMaterial({ tipo: 'tablero', codigo: 'ECOCARB15COLOR', cantidad: 2.5 }), 'Tablero ECOCARB15COLOR · 2.5 m²');
});

test('la descripcion no arrastra ceros de relleno', () => {
  assert.equal(descripcionMaterial({ tipo: 'tablero', codigo: 'X', cantidad: 2.5000 }), 'Tablero X · 2.5 m²');
  assert.equal(descripcionMaterial({ tipo: 'tablero', codigo: 'X', cantidad: 3 }), 'Tablero X · 3 m²');
  assert.equal(descripcionMaterial({ tipo: 'tablero', codigo: 'X', cantidad: 1.23456 }), 'Tablero X · 1.235 m²');
});

// ---------------------------------------------------------------------------
// grupoSeSaltaElMotor: el guardia que impide que una linea de material pase por
// el motor. Es la pieza con mas consecuencias de todo esto: sin el,
// `recalcularGrupo` lanzaria "Tipo de mueble no encontrado" y tumbaria el
// recalculo de la cotizacion entera.
// ---------------------------------------------------------------------------

const mod = (id: string) => ({ tipo_mueble_id: id });
const mat = { tipo_mueble_id: null };

test('un grupo de modulos si pasa por el motor', () => {
  assert.equal(grupoSeSaltaElMotor([mod('a')]), false);
  assert.equal(grupoSeSaltaElMotor([mod('a'), mod('b'), mod('c')]), false);
});

test('un grupo con material se salta el motor', () => {
  assert.equal(grupoSeSaltaElMotor([mat]), true);
});

test('un grupo mezclado tambien se salta, para fallar del lado seguro', () => {
  // No deberia ocurrir —el material va solo en su grupo— pero si ocurriera,
  // dejar el grupo intacto es preferible a tumbar el recalculo entero.
  assert.equal(grupoSeSaltaElMotor([mod('a'), mat]), true);
  assert.equal(grupoSeSaltaElMotor([mat, mod('a')]), true);
});

test('un grupo vacio no se salta: lo gestiona la rama que lo elimina', () => {
  assert.equal(grupoSeSaltaElMotor([]), false);
});
