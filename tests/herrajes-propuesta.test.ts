import assert from 'node:assert/strict';
import test from 'node:test';
import { etiquetaRol, herrajesDeLaCotizacion, type LineaConHerrajes } from '../src/lib/herrajes-propuesta';

// La propuesta traia una lista fija de herrajes con "N/A" en los que no aplicaban:
// anunciaba al cliente herrajes que su proyecto no incluye. Ahora sale del
// despiece de cada modulo.

const linea = (cantidad: number, herrajes: { rol: string; codigo: string; cant: number }[]): LineaConHerrajes =>
  ({ cantidad, herrajes });

const NOMBRES = { BISAGRAPAR: 'Bisagra par cierre suave', PATA10AJUST: 'Pata niveladora 10 cm' };

test('solo aparecen los herrajes de los modulos cotizados', () => {
  const r = herrajesDeLaCotizacion([
    linea(1, [{ rol: 'bisagra', codigo: 'BISAGRAPAR', cant: 2 }]),
  ], NOMBRES);
  assert.deepEqual(r.map((h) => h.codigo), ['BISAGRAPAR']);
  assert.equal(r.length, 1, 'nada de rieles, golas ni plateros que el proyecto no lleva');
});

test('la cantidad multiplica por las unidades de la linea', () => {
  const r = herrajesDeLaCotizacion([linea(4, [{ rol: 'pata', codigo: 'PATA10AJUST', cant: 4 }])]);
  assert.equal(r[0].cantidad, 16, '4 patas por 4 modulos');
});

test('y por las veces que se repite el area', () => {
  const r = herrajesDeLaCotizacion([linea(2, [{ rol: 'pata', codigo: 'PATA10AJUST', cant: 4 }])], {}, 3);
  assert.equal(r[0].cantidad, 24, '4 x 2 modulos x 3 cocinas');
});

test('el mismo herraje en varias lineas se suma en un renglon', () => {
  const r = herrajesDeLaCotizacion([
    linea(1, [{ rol: 'bisagra', codigo: 'BISAGRAPAR', cant: 2 }]),
    linea(3, [{ rol: 'bisagra', codigo: 'BISAGRAPAR', cant: 2 }]),
  ]);
  assert.equal(r.length, 1);
  assert.equal(r[0].cantidad, 8);
});

test('el mismo rol con dos referencias son dos renglones', () => {
  // Al cliente se le entregan las dos: no se pueden fundir.
  const r = herrajesDeLaCotizacion([
    linea(1, [{ rol: 'bisagra', codigo: 'BISAGRAPAR', cant: 2 }, { rol: 'bisagra', codigo: 'BISAGRA35', cant: 1 }]),
  ]);
  assert.deepEqual(r.map((h) => h.codigo), ['BISAGRA35', 'BISAGRAPAR']);
});

test('la descripcion sale del catalogo, no de un texto fijo', () => {
  const r = herrajesDeLaCotizacion([
    linea(1, [{ rol: 'bisagra', codigo: 'BISAGRAPAR', cant: 2 }, { rol: 'raro', codigo: 'SINREGISTRO', cant: 1 }]),
  ], NOMBRES);
  assert.equal(r.find((h) => h.codigo === 'BISAGRAPAR')?.descripcion, 'Bisagra par cierre suave');
  assert.equal(r.find((h) => h.codigo === 'SINREGISTRO')?.descripcion, '', 'sin registro no se inventa nombre');
});

test('una cotizacion sin herrajes devuelve una lista vacia', () => {
  assert.deepEqual(herrajesDeLaCotizacion([]), []);
  assert.deepEqual(herrajesDeLaCotizacion([linea(2, [])]), []);
});

test('cantidades invalidas o en cero no entran a la lista', () => {
  const r = herrajesDeLaCotizacion([
    linea(1, [{ rol: 'pata', codigo: 'P', cant: 0 }, { rol: 'riel', codigo: 'R', cant: -2 }]),
  ]);
  assert.deepEqual(r, []);
});

test('un herraje sin rol ni codigo se descarta en vez de salir en blanco', () => {
  const r = herrajesDeLaCotizacion([linea(1, [{ rol: '', codigo: '', cant: 5 }])]);
  assert.deepEqual(r, []);
});

test('la lista va ordenada por rol y codigo', () => {
  const r = herrajesDeLaCotizacion([
    linea(1, [{ rol: 'tornillo', codigo: 'T858', cant: 16 }, { rol: 'bisagra', codigo: 'B', cant: 2 }, { rol: 'pata', codigo: 'P', cant: 4 }]),
  ]);
  assert.deepEqual(r.map((h) => h.rol), ['bisagra', 'pata', 'tornillo']);
});

test('el rol se muestra con la inicial en mayuscula', () => {
  assert.equal(etiquetaRol('bisagra'), 'Bisagra');
  assert.equal(etiquetaRol('riel'), 'Riel');
  assert.equal(etiquetaRol(''), '—');
});
