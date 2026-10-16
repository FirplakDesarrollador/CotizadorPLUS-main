import assert from 'node:assert/strict';
import test from 'node:test';
import { conProveedor, formaDePago, normalizarFirplakTemplate, FIRPLAK_TEMPLATE_DEFAULTS, PROVEEDORES_VACIOS, importePropuesta, formatearImporte } from '../src/lib/firplak-template';

// Las tablas de especificaciones de la propuesta FIRPLAK nombran el material de
// cada bloque; produccion pide ver ademas de quien es el tablero (PRIMADERA,
// DURATEX, CHINO...). El mapeo de fila a rol se decidio con el usuario:
// "Tablero" y "Caja" -> tablero de caja, "Puertas" y "Rellenos" -> frente,
// "Espaldar" -> fondo.

test('conProveedor agrega el proveedor al final del texto', () => {
  assert.equal(conProveedor('Tablero 15 mm, canto 0.45 mm, blanco', 'ECOFORT'),
    'Tablero 15 mm, canto 0.45 mm, blanco · ECOFORT');
  assert.equal(conProveedor('MDF 5.5 mm, blanco', 'PRIMADERA'), 'MDF 5.5 mm, blanco · PRIMADERA');
});

test('conProveedor devuelve el texto intacto si no hay proveedor', () => {
  // Un proyecto sin presets, o un tablero sin proveedor registrado, no debe
  // dejar un separador huerfano al final de la fila.
  for (const vacio of ['', '   ', null, undefined]) {
    assert.equal(conProveedor('Tablero STANDARD', vacio), 'Tablero STANDARD', String(vacio));
  }
});

test('conProveedor tolera un texto vacio', () => {
  assert.equal(conProveedor('', 'DURATEX'), 'DURATEX');
  assert.equal(conProveedor('', ''), '');
});

test('conProveedor recorta los espacios de ambos lados', () => {
  assert.equal(conProveedor('  Tablero RH  ', '  CHINO  '), 'Tablero RH · CHINO');
});

test('PROVEEDORES_VACIOS deja las seis casillas en blanco', () => {
  // Es el valor por defecto cuando el proyecto no trae presets: las filas se
  // renderizan como antes del cambio.
  for (const bloque of [PROVEEDORES_VACIOS.superiores, PROVEEDORES_VACIOS.inferiores]) {
    for (const rol of ['caja', 'frente', 'fondo'] as const) assert.equal(bloque[rol], '');
  }
});

test('normalizarFirplakTemplate completa los campos que falten en lo guardado', () => {
  // Una plantilla guardada hace meses no trae los campos nuevos: se completan con
  // el defecto, sin necesidad de migracion. Y los campos retirados que siguen en el
  // JSON guardado simplemente se ignoran.
  const guardada = { upperBoard: 'Tablero X', projectMaterials: 'texto retirado' } as Parameters<typeof normalizarFirplakTemplate>[0];
  const t = normalizarFirplakTemplate(guardada);
  assert.equal(t.upperBoard, 'Tablero X', 'conserva lo guardado');
  assert.equal(t.lowerBoard, FIRPLAK_TEMPLATE_DEFAULTS.lowerBoard, 'completa lo que falta');
  assert.ok(!('projectMaterials' in t), 'lo retirado no vuelve por la puerta de atras');
});

test('formaDePago se redacta completa, no como "50% / 50%"', () => {
  assert.equal(formaDePago(50, 50), '50% de anticipo y 50% antes del despacho');
});

test('formaDePago sigue los porcentajes de la plantilla', () => {
  // Son editables en la propuesta: el texto tiene que moverse con ellos.
  assert.equal(formaDePago(30, 70), '30% de anticipo y 70% antes del despacho');
  assert.equal(formaDePago(100, 0), '100% de anticipo y 0% antes del despacho');
  assert.equal(formaDePago(FIRPLAK_TEMPLATE_DEFAULTS.depositPercent, FIRPLAK_TEMPLATE_DEFAULTS.balancePercent),
    '50% de anticipo y 50% antes del despacho', 'los valores por defecto de la plantilla');
});

// ---------------------------------------------------------------------------
// Closet/walk in closet y banos/auxiliares: sus tablas solo salen en la propuesta
// cuando el proyecto configuro esas familias.
// ---------------------------------------------------------------------------

test('la plantilla trae textos por defecto para closet y banos', () => {
  for (const campo of ['closetBoard', 'closetBack', 'closetCase', 'closetDoors', 'closetPanels',
    'bathBoard', 'bathBack', 'bathCase', 'bathDoors', 'bathPanels'] as const) {
    assert.ok(FIRPLAK_TEMPLATE_DEFAULTS[campo].length > 0, `${campo} sin texto por defecto`);
  }
});

test('una plantilla guardada sin los campos nuevos los completa', () => {
  // Las cotizaciones creadas antes de que existieran estas familias no los traen.
  const normalizada = normalizarFirplakTemplate({ upperBoard: 'Tablero del cliente' });
  assert.equal(normalizada.upperBoard, 'Tablero del cliente', 'lo guardado manda');
  assert.equal(normalizada.closetBoard, FIRPLAK_TEMPLATE_DEFAULTS.closetBoard);
  assert.equal(normalizada.bathPanels, FIRPLAK_TEMPLATE_DEFAULTS.bathPanels);
});

test('sin closet ni banos configurados, esos bloques no existen', () => {
  // La ausencia de la llave es lo que la propuesta usa para no imprimir la tabla.
  assert.equal(PROVEEDORES_VACIOS.closet, undefined);
  assert.equal(PROVEEDORES_VACIOS.banos, undefined);
  assert.deepEqual(PROVEEDORES_VACIOS.superiores, { caja: '', frente: '', fondo: '' });
  assert.deepEqual(PROVEEDORES_VACIOS.inferiores, { caja: '', frente: '', fondo: '' });
});

test('el proveedor se agrega a las filas de closet y banos igual que a las demas', () => {
  assert.equal(conProveedor('Tablero 15 mm', 'PRIMADERA'), 'Tablero 15 mm · PRIMADERA');
  assert.equal(conProveedor('Tablero 15 mm', ''), 'Tablero 15 mm', 'sin proveedor no queda separador huerfano');
});

// ---------------------------------------------------------------------------
// Moneda de la propuesta. La cotizacion "camila" estaba en COP y el PDF salia en
// dolares igual: el cliente tenia que convertir para saber que iba a pagar.
// ---------------------------------------------------------------------------

test('la propuesta toma el importe de la moneda de la cotizacion', () => {
  assert.equal(importePropuesta('USD', 288.9, 924449), 288.9);
  assert.equal(importePropuesta('COP', 288.9, 924449), 924449);
});

test('el valor en pesos sale de la linea, no de multiplicar el dolar por la TRM', () => {
  // Con TRM 3200, 288,9 x 3200 = 924.480, pero la linea dice 924.449: la diferencia
  // es el redondeo de cada modulo. Manda el valor de la linea.
  const porTrm = 288.9 * 3200;
  assert.notEqual(porTrm, 924449);
  assert.equal(importePropuesta('COP', 288.9, 924449), 924449);
});

test('cada moneda se formatea con su convencion', () => {
  assert.ok(formatearImporte('USD', 288.9).includes('288.90'), formatearImporte('USD', 288.9));
  const cop = formatearImporte('COP', 924449);
  assert.ok(cop.includes('924'), cop);
  assert.ok(!cop.includes(',00'), 'los pesos no llevan decimales');
});
