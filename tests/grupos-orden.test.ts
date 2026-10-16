import assert from 'node:assert/strict';
import test from 'node:test';
import { siguienteOrdenGrupo } from '../src/lib/grupos-orden';

// `cot_grupos_modulos` tiene unica (cocina_id, orden). Lo que se fija aqui es la
// regla que reventaba: el orden de un grupo nuevo sale del mayor que ya existe,
// no del conteo de grupos ni de una constante.

test('la primera cocina empieza en cero', () => {
  assert.equal(siguienteOrdenGrupo(null), 0);
  assert.equal(siguienteOrdenGrupo(undefined), 0, 'sin grupos la consulta no devuelve fila');
});

test('el siguiente es el mayor mas uno', () => {
  assert.equal(siguienteOrdenGrupo(0), 1);
  assert.equal(siguienteOrdenGrupo(24), 25);
});

test('con huecos sigue sin colisionar, que es el punto', () => {
  // 26 grupos con ordenes 0..24 y 99999: el conteo daria 26, que puede existir.
  // El mayor mas uno nunca choca.
  assert.equal(siguienteOrdenGrupo(99999), 100_000);
  // Una cocina con un solo grupo en el orden 7 (los anteriores se borraron).
  assert.equal(siguienteOrdenGrupo(7), 8);
});

test('insertar varios seguidos da valores distintos', () => {
  // Es el caso que fallaba: desagrupar un grupo de tres modulos inserta dos
  // grupos en un bucle. Con un valor fijo el segundo chocaba contra el primero.
  let max = 24;
  const asignados: number[] = [];
  for (let i = 0; i < 3; i++) {
    const orden = siguienteOrdenGrupo(max);
    asignados.push(orden);
    max = orden; // el insert anterior ya es el nuevo maximo
  }
  assert.deepEqual(asignados, [25, 26, 27]);
  assert.equal(new Set(asignados).size, asignados.length, 'ninguno se repite');
});

test('un valor absurdo no propaga NaN ni decimales', () => {
  assert.equal(siguienteOrdenGrupo(Number.NaN), 0);
  assert.equal(siguienteOrdenGrupo(Number.POSITIVE_INFINITY), 0);
  assert.equal(siguienteOrdenGrupo(3.7), 4, 'el orden es entero');
});
