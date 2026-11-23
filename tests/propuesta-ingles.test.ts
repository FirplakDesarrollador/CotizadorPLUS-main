import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  idiomaDeConsulta, inWordsAndDigits, numberInWords, paymentTerms, traducirEspecificaciones,
  traducirTexto, traducirUnidad, traducirValorMaterial,
} from '../src/lib/propuesta-ingles';
import { FIRPLAK_TEMPLATE_DEFAULTS, normalizarFirplakTemplate } from '../src/lib/firplak-template';

test('lang=en activa el inglés; cualquier otro valor deja español', () => {
  assert.equal(idiomaDeConsulta('en'), 'en');
  assert.equal(idiomaDeConsulta(['en']), 'en');
  assert.equal(idiomaDeConsulta(undefined), 'es');
  assert.equal(idiomaDeConsulta('fr'), 'es');
});

test('contadores generados por el cotizador con singular y plural', () => {
  assert.equal(traducirTexto('UBFD 36x28.75x24 in · 2 puerta(s) · 1 entrepaño(s) · Removible'),
    'UBFD 36x28.75x24 in · 2 doors · 1 shelf · Removable');
  assert.equal(traducirTexto('UDB 18x28.75x24 in · 3 gaveta(s) · Sink'), 'UDB 18x28.75x24 in · 3 drawers · Sink');
  assert.equal(traducirTexto('UB 12x28.75x24 in · 1 puerta(s) · 1 gaveta(s) · 2 entrepaño(s)'),
    'UB 12x28.75x24 in · 1 door · 1 drawer · 2 shelves');
});

test('frases de mobiliario se traducen antes que sus palabras sueltas', () => {
  assert.equal(traducirTexto('Mueble Inferior Lavaplatos.'), 'Base cabinet Sink.');
  assert.equal(traducirTexto('Mueble Superior - 1 puerta. (Apertura hacia la Izquierda)'), 'Wall cabinet - 1 door. (Opens left)');
  assert.equal(traducirTexto('Torre de Gavetas para Closet.'), 'Drawer tower for Closet.');
  assert.equal(traducirTexto('PN - Panel nevera'), 'PN - Refrigerator panel');
  assert.equal(traducirTexto('Panel Posterior Isla 1 de 2'), 'Back panel Island 1 of 2');
  assert.equal(traducirTexto('Zócalo Delantero/Posterior'), 'Front/rear toe kick');
  assert.equal(traducirTexto('Mueble Elevado de LVM. Sin fondo.'), 'Floating vanity cabinet. No back panel.');
});

test('respeta mayúsculas y deja intactos códigos y medidas', () => {
  assert.equal(traducirTexto('BISAGRA PAR (CIERRE LENTO)'), 'HINGE PAIR (SOFT-CLOSE)');
  assert.equal(traducirTexto('FILLER 3x33.25x24 in · Removible'), 'FILLER 3x33.25x24 in · Removable');
  assert.equal(traducirTexto('UBFD36-18MM'), 'UBFD36-18MM');
  assert.equal(traducirTexto('Bathroom B21.6'), 'Bathroom B21.6');
  // "der" dentro de otra palabra no se toca.
  assert.equal(traducirTexto('Border'), 'Border');
});

test('herrajes del catálogo y material suelto', () => {
  assert.equal(traducirTexto('Riel cajón Tandem (par)'), 'Drawer slide Tandem (pair)');
  assert.equal(traducirTexto('Herraje PERALM12 TUBO · 1 und'), 'Hardware PERALM12 ROD · 1 pcs');
  assert.equal(traducirUnidad('und'), 'pcs');
  assert.equal(traducirUnidad('m²'), 'm²');
});

test('especificaciones de materiales: títulos, filas y sustrato', () => {
  const [bloque] = traducirEspecificaciones([{ familia: 'inferior', titulo: 'Muebles inferiores cocina', filas: [
    ['Caja / refuerzos', 'RH15 · RH · 15 mm · BLANCO · Proveedor X'],
    ['Canto de frentes', 'Sin canto (tablero de 6 mm)'],
    ['Fondo general (solo donde lleva espaldar; los abiertos usan el fondo indicado arriba)', 'No configurado'],
  ] }]);
  assert.equal(bloque.titulo, 'Kitchen base cabinets');
  assert.deepEqual(bloque.filas, [
    ['Cabinet box / rails', 'RH15 · Moisture-resistant (RH) · 15 mm · BLANCO · Proveedor X'],
    ['Front edge banding', 'No edge banding (6 mm board)'],
    ['General back panel (only where a back is used; open cabinets use the back panel listed above)', 'Not configured'],
  ]);
  assert.equal(traducirValorMaterial('X · Referencia no encontrada en catálogo'), 'X · Reference not found in catalog');
});

test('números en palabras y forma de pago', () => {
  assert.equal(numberInWords(0), 'zero');
  assert.equal(numberInWords(45), 'forty-five');
  assert.equal(numberInWords(120), 'one hundred twenty');
  assert.equal(numberInWords(1500), '1500');
  assert.equal(inWordsAndDigits(90), 'ninety (90)');
  assert.equal(paymentTerms(50, 50), '50% deposit and 50% balance prior to shipment');
});

test('la plantilla FIRPLAK trae textos en inglés y conserva los guardados', () => {
  assert.ok(FIRPLAK_TEMPLATE_DEFAULTS.packagingNotesEn.length > 0);
  assert.ok(FIRPLAK_TEMPLATE_DEFAULTS.exclusionsEn.length > 0);
  const vieja = normalizarFirplakTemplate({ exclusions: 'Texto propio' });
  assert.equal(vieja.exclusions, 'Texto propio');
  assert.equal(vieja.exclusionsEn, FIRPLAK_TEMPLATE_DEFAULTS.exclusionsEn, 'plantillas viejas reciben el texto en inglés por defecto');
  assert.equal(normalizarFirplakTemplate({ deliveryScopeEn: 'FOB Miami' }).deliveryScopeEn, 'FOB Miami');
});
