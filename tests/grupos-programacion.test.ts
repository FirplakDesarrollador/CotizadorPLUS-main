import assert from 'node:assert/strict';
import test from 'node:test';
import { bloquesDeProgramacion, grupoDeLinea, type FilaProgramacion } from '../src/lib/grupos-programacion';

// La "Programacion de modulos" era una lista plana de SKU. Ahora va separada por
// bloques con su total, que es lo que se lee de esa pagina.

const fila = (sku: string, pref: string | null, quantity: number): FilaProgramacion =>
  ({ sku, description: '', quantity, grupo: grupoDeLinea(pref) });

test('los paneles y los fillers se reconocen por su prefijo', () => {
  assert.equal(grupoDeLinea('PN'), 'paneles');
  assert.equal(grupoDeLinea('PN2496'), 'paneles', 'tambien con el codigo completo');
  assert.equal(grupoDeLinea('F'), 'filler');
  assert.equal(grupoDeLinea('F628'), 'filler');
  assert.equal(grupoDeLinea('F628 3/4'), 'filler');
});

test('un prefijo que empieza igual no se confunde', () => {
  // FPK no es un filler aunque empiece por F.
  assert.equal(grupoDeLinea('FPK12'), 'muebles');
  assert.equal(grupoDeLinea('PCFD'), 'muebles', 'PC no es PN');
});

test('todo lo demas es mueble, zocalos incluidos', () => {
  for (const pref of ['B18', 'DB24', 'SBFD33', 'W1830', 'UDV15', 'CC', 'TK4 1/296']) {
    assert.equal(grupoDeLinea(pref), 'muebles', pref);
  }
});

test('una linea sin prefijo es material suelto y va a herrajes', () => {
  assert.equal(grupoDeLinea(null), 'herrajes');
  assert.equal(grupoDeLinea(''), 'herrajes');
  assert.equal(grupoDeLinea('   '), 'herrajes');
});

test('cada bloque suma su propio total', () => {
  const bloques = bloquesDeProgramacion([
    fila('B18', 'B18', 20), fila('DB24', 'DB24', 600),
    fila('PN2496', 'PN2496', 600),
    fila('F628', 'F628', 4),
    fila('W1830', 'W1830', 20),
  ]);
  assert.deepEqual(bloques.map((b) => b.titulo), ['Muebles', 'Paneles', 'Filler']);
  assert.deepEqual(bloques.map((b) => b.total), [640, 600, 4]);
});

test('el orden es el del documento, no el de llegada', () => {
  const bloques = bloquesDeProgramacion([
    fila('X', null, 3), fila('F1', 'F1', 1), fila('PN1', 'PN1', 2), fila('B1', 'B1', 5),
  ]);
  assert.deepEqual(bloques.map((b) => b.grupo), ['muebles', 'paneles', 'filler', 'herrajes']);
});

test('un bloque sin filas no se imprime', () => {
  const bloques = bloquesDeProgramacion([fila('B18', 'B18', 1)]);
  assert.deepEqual(bloques.map((b) => b.titulo), ['Muebles'], 'nada de bloques vacios en cero');
});

test('una programacion vacia no produce bloques', () => {
  assert.deepEqual(bloquesDeProgramacion([]), []);
});

test('una cantidad invalida no rompe el total', () => {
  const bloques = bloquesDeProgramacion([
    { sku: 'A', description: '', quantity: Number.NaN, grupo: 'muebles' },
    { sku: 'B', description: '', quantity: 7, grupo: 'muebles' },
  ]);
  assert.equal(bloques[0].total, 7);
});
