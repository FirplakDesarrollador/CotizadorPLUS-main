import assert from 'node:assert/strict';
import test from 'node:test';
import { filtrarOpciones, normalizarBusqueda } from '../src/lib/combobox-filtro';

// Filtro del desplegable con buscador. La regla que pidio el usuario: al abrirlo
// salen todas las opciones, y a medida que escribe quedan las relacionadas.

const COTIZACIONES = [
  { value: '1', label: '— · 26084- BH Boynton GS BLDG B (Coastland Construction Management )' },
  { value: '2', label: '— · Carolina Sunset - Cocinas (Constructora Jimenez)' },
  { value: '3', label: 'C-900 · Remodelacion Bogota (Aptos Dinamarca)' },
];

test('sin texto salen todas: abrir el desplegable muestra la lista completa', () => {
  assert.equal(filtrarOpciones(COTIZACIONES, '').length, 3);
  assert.equal(filtrarOpciones(COTIZACIONES, '   ').length, 3, 'solo espacios tampoco filtra');
});

test('filtra por nombre a medida que se escribe', () => {
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'boynton').map((o) => o.value), ['1']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'sunset').map((o) => o.value), ['2']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'co').map((o) => o.value), ['1', '2'],
    'coincide en cualquier parte: "Coastland" y "Cocinas", no "Remodelacion"');
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'cocina').map((o) => o.value), ['2']);
});

test('filtra tambien por codigo y por cliente', () => {
  assert.deepEqual(filtrarOpciones(COTIZACIONES, '26084').map((o) => o.value), ['1']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'C-900').map((o) => o.value), ['3']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'jimenez').map((o) => o.value), ['2']);
});

test('las palabras pueden ir en cualquier orden y separadas', () => {
  // El cliente va despues del nombre en la etiqueta: buscar los dos tiene que servir.
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'boynton coastland').map((o) => o.value), ['1']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'coastland boynton').map((o) => o.value), ['1']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'jimenez sunset').map((o) => o.value), ['2']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'boynton jimenez'), [], 'exige todas las palabras');
});

test('no distingue mayusculas ni tildes', () => {
  assert.equal(normalizarBusqueda('Remodelación BOGOTÁ'), 'remodelacion bogota');
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'REMODELACIÓN').map((o) => o.value), ['3']);
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'bogotá').map((o) => o.value), ['3']);
});

test('el texto de busqueda extra tambien cuenta', () => {
  const herrajes = [
    { value: 'BISAGRAPAR', label: 'BISAGRAPAR', searchText: 'BISAGRAPAR bisagra par cierre suave' },
    { value: 'RIEL45', label: 'RIEL45', searchText: 'RIEL45 riel 45 cm' },
  ];
  assert.deepEqual(filtrarOpciones(herrajes, 'riel').map((o) => o.value), ['RIEL45']);
  assert.deepEqual(filtrarOpciones(herrajes, 'cierre suave').map((o) => o.value), ['BISAGRAPAR']);
});

test('sin coincidencias devuelve vacio, no todas', () => {
  assert.deepEqual(filtrarOpciones(COTIZACIONES, 'inexistente'), []);
});

test('no muta la lista de entrada', () => {
  const copia = [...COTIZACIONES];
  filtrarOpciones(COTIZACIONES, 'boynton');
  assert.deepEqual(COTIZACIONES, copia);
  assert.notEqual(filtrarOpciones(COTIZACIONES, ''), COTIZACIONES, 'devuelve otra lista');
});
