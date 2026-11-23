import assert from 'node:assert/strict';
import test from 'node:test';
import { CEMA_TEMPLATE_DEFAULTS, normalizarCemaTemplate } from '../src/lib/cema-template';
import { FIRPLAK_TEMPLATE_DEFAULTS, normalizarFirplakTemplate } from '../src/lib/firplak-template';

test('normalizarCemaTemplate aplica valores por defecto cuando recibe null o undefined', () => {
  assert.deepEqual(normalizarCemaTemplate(null), CEMA_TEMPLATE_DEFAULTS);
  assert.deepEqual(normalizarCemaTemplate(undefined), CEMA_TEMPLATE_DEFAULTS);
});

test('normalizarCemaTemplate mezcla overrides parciales sin mutar los defaults', () => {
  const res = normalizarCemaTemplate({
    projectAddress: '1200 Brickell Ave',
    validityDays: 45,
    countertopAmountUsd: 3500,
  });

  assert.equal(res.projectAddress, '1200 Brickell Ave');
  assert.equal(res.validityDays, 45);
  assert.equal(res.countertopAmountUsd, 3500);
  assert.equal(res.leadTimeDays, CEMA_TEMPLATE_DEFAULTS.leadTimeDays);
  assert.equal(CEMA_TEMPLATE_DEFAULTS.projectAddress, '');
  assert.equal(CEMA_TEMPLATE_DEFAULTS.validityDays, 30);
});

test('normalizarFirplakTemplate aplica valores por defecto cuando recibe null o undefined', () => {
  assert.deepEqual(normalizarFirplakTemplate(null), FIRPLAK_TEMPLATE_DEFAULTS);
  assert.deepEqual(normalizarFirplakTemplate(undefined), FIRPLAK_TEMPLATE_DEFAULTS);
});

test('normalizarFirplakTemplate mezcla overrides vigentes y preserva condiciones comerciales base', () => {
  const res = normalizarFirplakTemplate({
    projectAddress: 'Medellín, El Poblado',
    depositPercent: 60,
    balancePercent: 40,
    showModuleSchedule: false,
  });

  assert.equal(res.projectAddress, 'Medellín, El Poblado');
  assert.equal(res.depositPercent, 60);
  assert.equal(res.balancePercent, 40);
  assert.equal(res.showModuleSchedule, false);
  assert.equal(res.deliveryScope, FIRPLAK_TEMPLATE_DEFAULTS.deliveryScope);
  assert.equal(FIRPLAK_TEMPLATE_DEFAULTS.depositPercent, 50);
  assert.equal(FIRPLAK_TEMPLATE_DEFAULTS.showModuleSchedule, true);
});
