import assert from 'node:assert/strict';
import test from 'node:test';
import { aplicarMaterialesProyecto, familiaMaterialDelArea, materialesDelDespieceCoinciden, resolverCodigoTablero, descripcionTableroProyecto } from '../src/lib/materiales-proyecto';

test('cualquier módulo de un área closet usa closet: KUNDARA, walk-in, mayúsculas y paneles', () => {
  for (const nombre of ['Casa D - Closet M-07', 'CLOSET CL1A LINEAL ', 'Walk-in closet', 'clóset principal']) {
    for (const pref of ['W', 'BFD', 'PN', 'F', 'TK', 'PCFD']) assert.equal(familiaMaterialDelArea(pref, nombre), 'closet');
  }
  assert.equal(familiaMaterialDelArea('W', 'Cocina'), 'superior');
  assert.equal(familiaMaterialDelArea('BFD', 'Cocina'), 'inferior');
});

test('prevalecen los materiales y cantos de características sin alterar herrajes, geometría o márgenes', () => {
  const input = { preset: { caja: 'cocina', frente: 'cocina' }, cantoCaja: 'viejo', conHerrajes: true, largo: 60, margenOverride: 0.6 };
  const r = aplicarMaterialesProyecto(input, { materialesCloset: { preset: { caja: 'closet', frente: 'closet' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' } }, 'W', 'Casa D - Closet M-07');
  assert.deepEqual(r.preset, { caja: 'closet', frente: 'closet' });
  assert.equal(r.cantoCaja, '19x0,45');
  assert.equal(r.largo, 60);
  assert.equal(r.margenOverride, 0.6);
  assert.deepEqual(input.preset, { caja: 'cocina', frente: 'cocina' }, 'no muta el original');
});

test('las referencias antiguas se resuelven solo a una referencia inequívoca del catálogo', () => {
  const catalogo = [{ codigo: 'PRIRH15CONSTRUCTOR' }, { codigo: 'PRIRH18TENDENCIA ' }];
  assert.equal(resolverCodigoTablero('PRIRH15COLOR CONSTRUCTOR', catalogo), 'PRIRH15CONSTRUCTOR');
  assert.equal(resolverCodigoTablero('PRIRH18TENDENCIA', catalogo), 'PRIRH18TENDENCIA ');
  assert.equal(resolverCodigoTablero('NO_EXISTE', catalogo), 'NO_EXISTE');
  assert.equal(resolverCodigoTablero('PRICARB6CANDELARIA (POLAR)', [{ codigo: 'PRICARB6CANDELARIA ' }]), 'PRICARB6CANDELARIA ');
  assert.match(descripcionTableroProyecto('NO_EXISTE', []), /Referencia no encontrada/);
});

test('sin materiales de proyecto no inventa un tablero ni un espesor', () => {
  const input = { preset: { caja: 'EXISTENTE' } };
  assert.deepEqual(aplicarMaterialesProyecto(input, {}, 'W', 'Closet').preset, input.preset);
  assert.equal(descripcionTableroProyecto(undefined, []), 'No configurado');
});

test('un preset correcto no oculta un despiece calculado con otro material', () => {
  const despiece = { maderaPorRol: [{ rol: 'caja', codigo: 'COCINA' }] };
  assert.equal(materialesDelDespieceCoinciden(despiece, { caja: 'CLOSET' }), false);
  assert.equal(materialesDelDespieceCoinciden(despiece, { caja: 'COCINA' }), true);
});
