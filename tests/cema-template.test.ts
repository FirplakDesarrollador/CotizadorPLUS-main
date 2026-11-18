import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarCemaTemplate, textoCema } from '../src/lib/cema-template';

test('CEMA localiza valores predeterminados y conserva textos comerciales por idioma', () => {
  const plantilla = normalizarCemaTemplate({
    tariffNotice: 'US tariff notice',
    additionalTerms: 'English terms',
    countertopColor: 'Calacatta',
    textosEs: { additionalTerms: 'Condiciones en español', pricingBasis: 'Instalación incluida' },
  });
  assert.equal(textoCema(plantilla, 'pricingBasis', 'es'), 'Instalación incluida');
  assert.equal(textoCema(plantilla, 'pricingBasis', 'en'), 'Delivered & Installed');
  assert.equal(textoCema(plantilla, 'additionalTerms', 'es'), 'Condiciones en español');
  assert.equal(textoCema(plantilla, 'additionalTerms', 'en'), 'English terms');
  assert.equal(textoCema(plantilla, 'tariffNotice', 'es'), '');
  assert.equal(textoCema(plantilla, 'tariffNotice', 'en'), 'US tariff notice');
  assert.equal(textoCema(plantilla, 'countertopMaterial', 'es'), 'Cuarzo');
  assert.equal(textoCema(plantilla, 'countertopColor', 'es'), 'Calacatta');
});
