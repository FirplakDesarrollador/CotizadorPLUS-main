import assert from 'node:assert/strict';
import test from 'node:test';
import { aplicarMaterialesProyecto, familiaMaterialDelArea, materialesDelDespieceCoinciden, resolverCodigoTablero, descripcionTableroProyecto, presetMaterialesTipologia, especificacionesProyecto } from '../src/lib/materiales-proyecto';

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

test('solo los abiertos solicitados asignan caja y refuerzos al frente global de su familia', () => {
  const input = { preset: { caja: 'ANTERIOR', refuerzo: 'ANTERIOR', frente: 'HISTORICO', fondo: 'F6' }, cantoCaja: '19x0,45', largo: 60 };
  const config = {
    materialesInferiores: { preset: { caja: 'I15', refuerzo: 'I15', frente: 'I18' } },
    materialesSuperiores: { preset: { caja: 'S15', refuerzo: 'S15', frente: 'S18' } },
    materialesCloset: { preset: { caja: 'C15', refuerzo: 'C15', frente: 'C18' } },
  };
  for (const pref of ['OBFD', 'OBFD-SM', 'OSBFD-SM', 'OW', 'OBFD-SM-SF', ' obfd ']) {
    for (const area of ['Cocina', 'Clóset principal']) {
      const esperado = area.includes('Clóset') ? 'C18' : pref.trim() === 'OW' ? 'S18' : 'I18';
      const r = aplicarMaterialesProyecto(input, config, pref, area);
      assert.equal(r.preset.caja, esperado);
      assert.equal(r.preset.refuerzo, esperado);
      assert.equal(r.preset.frente, esperado);
      assert.equal(r.preset.fondo, esperado.replace('18', '6'));
      assert.equal(r.cantoCaja, '19x0,45');
      assert.equal(r.largo, 60);
    }
  }
  for (const pref of ['BFD', 'BFD-SM', 'OSBFD', 'W', 'TW', null]) {
    assert.deepEqual(presetMaterialesTipologia(input.preset, pref), input.preset);
  }
  assert.equal(input.preset.caja, 'ANTERIOR', 'no muta el snapshot original');
});

test('abiertos históricos usan su frente conocido si no hay selección global y no inventan uno ausente', () => {
  const input = { preset: { caja: 'C15', refuerzo: 'R15', frente: 'F18', fondo: 'F6' } };
  assert.deepEqual(aplicarMaterialesProyecto(input, {}, 'OW').preset, { caja: 'F18', refuerzo: 'F18', frente: 'F18', fondo: 'F6' });
  assert.deepEqual(presetMaterialesTipologia({ caja: 'C15' }, 'OW'), { caja: 'C15' });
});

test('el PDF describe la excepción únicamente en las familias donde hay abiertos', () => {
  const config = { materialesSuperiores: { preset: { caja: 'C15', frente: 'F18' } }, materialesCloset: { preset: { caja: 'CC15', frente: 'FC18' } } };
  const bloques = especificacionesProyecto(config, [], [{ nombre: 'Closet', lineas: [{ pref: 'OW' }] }, { nombre: 'Cocina', lineas: [{ pref: 'W' }] }]);
  assert.equal(bloques.find(b => b.familia === 'superior')!.filas.some(([rol]) => rol.includes('OBFD')), false);
  assert.equal(bloques.find(b => b.familia === 'closet')!.filas.find(([rol]) => rol.includes('OBFD'))![1], 'FC18 · Referencia no encontrada en catálogo');
});


test('OW-MO usa frente en caja y refuerzos y el mismo color en fondo de 6 mm', () => {
  const preset = { caja: 'OTRO', refuerzo: 'OTRO', frente: 'PRIRH15CONSTRUCTOR', fondo: 'BLANCO' };
  for (const pref of ['OW', 'OW-SF', 'OW-MO', 'OW-MO-SF', 'OBFD', 'OBFD-SM', 'OSBFD-SM']) {
    assert.deepEqual(presetMaterialesTipologia(preset, pref), {
      caja: 'PRIRH15CONSTRUCTOR', refuerzo: 'PRIRH15CONSTRUCTOR',
      frente: 'PRIRH15CONSTRUCTOR', fondo: 'PRIRH6CONSTRUCTOR',
    });
  }
  assert.equal(preset.fondo, 'BLANCO');
});
