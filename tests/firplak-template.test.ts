import assert from 'node:assert/strict';
import test from 'node:test';
import { conProveedor, normalizarFirplakTemplate, FIRPLAK_TEMPLATE_DEFAULTS, PROVEEDORES_VACIOS } from '../src/lib/firplak-template';

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

test('la plantilla trae el campo de materiales vacio y editable', () => {
  // Antes se rellenaba con un volcado de la configuracion interna del proyecto.
  assert.equal(FIRPLAK_TEMPLATE_DEFAULTS.projectMaterials, '');
  assert.equal(normalizarFirplakTemplate(null).projectMaterials, '');
  assert.equal(normalizarFirplakTemplate({ projectMaterials: 'Texto nuevo' }).projectMaterials, 'Texto nuevo');
});

test('normalizarFirplakTemplate completa los campos que falten en lo guardado', () => {
  // Las plantillas ya guardadas no tienen `projectMaterials`; deben leerlo como
  // cadena vacia sin necesidad de migracion.
  const guardada = { upperBoard: 'Tablero X' } as Parameters<typeof normalizarFirplakTemplate>[0];
  const t = normalizarFirplakTemplate(guardada);
  assert.equal(t.upperBoard, 'Tablero X', 'conserva lo guardado');
  assert.equal(t.projectMaterials, '', 'completa lo que falta');
  assert.equal(t.lowerBoard, FIRPLAK_TEMPLATE_DEFAULTS.lowerBoard);
});
