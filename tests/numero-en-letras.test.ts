import assert from 'node:assert/strict';
import test from 'node:test';
import { enLetrasYCifra, numeroEnLetras } from '../src/lib/numero-en-letras';

// El plazo de la propuesta se redacta "noventa (90) dias": convencion de los
// documentos comerciales en Colombia. Como el plazo se edita, no puede ir escrito
// a mano en la plantilla.

test('los plazos habituales se escriben bien', () => {
  assert.equal(numeroEnLetras(30), 'treinta');
  assert.equal(numeroEnLetras(45), 'cuarenta y cinco');
  assert.equal(numeroEnLetras(60), 'sesenta');
  assert.equal(numeroEnLetras(90), 'noventa');
  assert.equal(numeroEnLetras(120), 'ciento veinte');
});

test('los casos irregulares del espanol', () => {
  assert.equal(numeroEnLetras(15), 'quince');
  assert.equal(numeroEnLetras(16), 'dieciséis');
  assert.equal(numeroEnLetras(21), 'veintiuno');
  assert.equal(numeroEnLetras(22), 'veintidós');
  assert.equal(numeroEnLetras(29), 'veintinueve');
  assert.equal(numeroEnLetras(31), 'treinta y uno');
  assert.equal(numeroEnLetras(100), 'cien', 'cien, no "ciento"');
  assert.equal(numeroEnLetras(101), 'ciento uno');
  assert.equal(numeroEnLetras(200), 'doscientos');
  assert.equal(numeroEnLetras(500), 'quinientos', 'quinientos, no "cincocientos"');
  assert.equal(numeroEnLetras(700), 'setecientos');
  assert.equal(numeroEnLetras(900), 'novecientos');
  assert.equal(numeroEnLetras(999), 'novecientos noventa y nueve');
});

test('el cero y los bordes', () => {
  assert.equal(numeroEnLetras(0), 'cero');
  assert.equal(numeroEnLetras(1), 'uno');
  assert.equal(numeroEnLetras(10), 'diez');
});

test('fuera de rango devuelve el numero, no una frase inventada', () => {
  assert.equal(numeroEnLetras(1000), '1000');
  assert.equal(numeroEnLetras(-5), '-5');
  assert.equal(numeroEnLetras(Number.NaN), '');
});

test('los decimales se truncan: los dias son enteros', () => {
  assert.equal(numeroEnLetras(90.7), 'noventa');
});

test('la forma del documento junta letras y cifra', () => {
  assert.equal(enLetrasYCifra(90), 'noventa (90)');
  assert.equal(enLetrasYCifra(45), 'cuarenta y cinco (45)');
  assert.equal(enLetrasYCifra(0), 'cero (0)');
});
