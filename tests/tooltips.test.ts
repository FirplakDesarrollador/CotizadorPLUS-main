import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TIPS_ACTIVOS_POR_DEFECTO, resetTooltips, suscribirTooltips, toggleTooltips, tooltipsActivos,
} from '../src/lib/useTooltips';

// Los tips emergentes de los campos. Lo que se fija aqui es la regla que pidio el
// usuario: al abrir la app estan apagados, siempre.

test('los tips arrancan apagados', () => {
  assert.equal(TIPS_ACTIVOS_POR_DEFECTO, false);
  assert.equal(tooltipsActivos(), false, 'el estado inicial del modulo es el defecto');
});

test('el boton los enciende y los vuelve a apagar', () => {
  resetTooltips();
  toggleTooltips();
  assert.equal(tooltipsActivos(), true);
  toggleTooltips();
  assert.equal(tooltipsActivos(), false);
});

test('encenderlos vale para la sesion: al abrir de nuevo vuelven a estar apagados', () => {
  // La preferencia no se guarda a proposito: cada carga de la app parte del defecto.
  resetTooltips();
  toggleTooltips();
  assert.equal(tooltipsActivos(), true, 'encendidos en la sesion en curso');

  resetTooltips(); // equivale a volver a cargar la app
  assert.equal(tooltipsActivos(), TIPS_ACTIVOS_POR_DEFECTO);
});

test('el cambio se avisa a quien este escuchando', () => {
  resetTooltips();
  const vistos: boolean[] = [];
  const baja = suscribirTooltips((v) => vistos.push(v));

  toggleTooltips();
  resetTooltips();
  assert.deepEqual(vistos, [true, false], 'cada cambio llega una sola vez');

  baja();
  toggleTooltips();
  assert.deepEqual(vistos, [true, false], 'tras darse de baja ya no llegan avisos');
  resetTooltips();
});
