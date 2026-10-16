import assert from 'node:assert/strict';
import test from 'node:test';
import { IVA_COLOMBIA, aplicaIva, calcularIva, etiquetaIva, totalConIva } from '../src/lib/iva';
import { monedasVisibles } from '../src/lib/monedas-visibles';

// IVA colombiano. Solo se liquida en cotizaciones en pesos: una venta en dolares
// es exportacion y sale sin IVA.

test('la tarifa general es 19%', () => {
  assert.equal(IVA_COLOMBIA, 0.19);
  assert.equal(etiquetaIva(), 'IVA 19%');
});

test('solo se liquida en pesos', () => {
  assert.equal(aplicaIva('COP'), true);
  assert.equal(aplicaIva('USD'), false);
});

test('el IVA y el total con IVA salen de la base', () => {
  assert.equal(calcularIva(1_000_000), 190_000);
  assert.equal(totalConIva(1_000_000), 1_190_000);
  // Un caso real: el total de la cotizacion "camila".
  assert.ok(Math.abs(calcularIva(924_449) - 175_645.31) < 0.01);
  assert.ok(Math.abs(totalConIva(924_449) - 1_100_094.31) < 0.01);
});

test('el total con IVA es siempre la base mas el IVA', () => {
  for (const base of [0, 1, 1234.56, 924_449, 5_020_203]) {
    assert.ok(Math.abs(totalConIva(base) - (base + calcularIva(base))) < 1e-9, String(base));
  }
});

test('una base invalida no produce NaN ni IVA negativo', () => {
  assert.equal(calcularIva(0), 0);
  assert.equal(calcularIva(-100), 0, 'una base negativa no genera IVA a favor');
  assert.equal(calcularIva(Number.NaN), 0);
  assert.equal(totalConIva(Number.NaN), 0);
  assert.equal(totalConIva(-100), -100, 'la base se respeta: el IVA es lo que se anula');
});

test('la tarifa se puede cambiar sin tocar el resto', () => {
  // Por si alguna linea quedara exenta o con tarifa distinta.
  assert.equal(calcularIva(1_000_000, 0.05), 50_000);
  assert.equal(etiquetaIva(0.05), 'IVA 5%');
  assert.equal(etiquetaIva(0), 'IVA 0%');
});

// ---------------------------------------------------------------------------
// La moneda del documento sale de lo elegido en el detalle, y de ella depende si
// se liquida IVA. Es la regla que pidio el usuario: en dolares, solo TOTAL.
// ---------------------------------------------------------------------------

const monedaDelDocumento = (usd: boolean, cop: boolean, proyecto: 'USD' | 'COP') =>
  monedasVisibles({ usd, cop }, proyecto)[0];

test('elegir solo dolares deja el documento sin IVA, aunque el proyecto sea en pesos', () => {
  const moneda = monedaDelDocumento(true, false, 'COP');
  assert.equal(moneda, 'USD');
  assert.equal(aplicaIva(moneda), false, 'en dolares va solo TOTAL');
});

test('elegir solo pesos liquida IVA, aunque el proyecto sea en dolares', () => {
  const moneda = monedaDelDocumento(false, true, 'USD');
  assert.equal(moneda, 'COP');
  assert.equal(aplicaIva(moneda), true);
});

test('con las dos monedas marcadas manda la del proyecto', () => {
  assert.equal(aplicaIva(monedaDelDocumento(true, true, 'COP')), true);
  assert.equal(aplicaIva(monedaDelDocumento(true, true, 'USD')), false);
});

test('sin eleccion explicita manda la del proyecto', () => {
  // Al abrir la pagina de impresion directa no llegan las casillas.
  assert.equal(monedaDelDocumento(true, true, 'COP'), 'COP');
  assert.equal(monedaDelDocumento(true, true, 'USD'), 'USD');
});
