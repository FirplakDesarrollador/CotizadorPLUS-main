import assert from 'node:assert/strict';
import test from 'node:test';
import { precioUnitario } from '../src/lib/module-groups';

// res-como-el-motor: un mueble donde el herraje sí cuesta plata real.
const res = {
  precioCop: 100_000,
  precioUsd: 25,
  precioConHerrajesCop: 140_000, // precioCop + precioHerrajesCop (40.000 de herrajes)
  precioConHerrajesUsd: 35,
};

test('un módulo con herrajes cuesta más que uno sin herrajes', () => {
  const con = precioUnitario(true, res);
  const sin = precioUnitario(false, res);
  assert.equal(con.cop, 140_000);
  assert.equal(sin.cop, 100_000);
  assert.notEqual(con.cop, sin.cop, 'con herrajes y sin herrajes no pueden costar lo mismo');
});

test('res.precioCop nunca incluye herrajes: precioUnitario(false, ...) siempre descarta el costo del herraje, sea cual sea su magnitud', () => {
  // Esto es justamente lo que rompía la rama "unificada" (margenOverride):
  // devolvía res.precioCop tanto si conHerrajes era true como false.
  const grande = precioUnitario(false, { ...res, precioConHerrajesCop: 1_000_000, precioConHerrajesUsd: 300 });
  assert.equal(grande.cop, 100_000, 'sin herrajes, el precio no debe verse afectado por cuánto cueste el herraje');
});
