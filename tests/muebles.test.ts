import assert from 'node:assert/strict';
import test from 'node:test';
import { ajustarPiezasSinFondo, esMuebleSuperior, familiaMaterialPorPrefijo } from '../src/lib/muebles';

// `muebles.ts` es el modulo de dominio compartido por formularios y motor. Las
// dos piezas que se prueban aqui deciden cosas con efecto en el precio, asi que
// conviene fijar sus bordes.

// ---------------------------------------------------------------------------
// esMuebleSuperior: manda la PRIMERA B o W del prefijo, leida de izquierda a
// derecha, con TW como excepcion explicita.
// ---------------------------------------------------------------------------

test('esMuebleSuperior: la primera B o W decide, no la presencia de la letra', () => {
  // W antes que B -> superior.
  assert.equal(esMuebleSuperior('W'), true);
  assert.equal(esMuebleSuperior('WBL'), true, 'WBL lleva ambas letras, pero la W va primero');
  assert.equal(esMuebleSuperior('WBL-D-L/R-SM'), true);
  // B antes que W -> inferior.
  assert.equal(esMuebleSuperior('BBL'), false);
  assert.equal(esMuebleSuperior('BW'), false, 'la B va primero aunque despues haya W');
  assert.equal(esMuebleSuperior('BBLFD-D-L/R-SM'), false);
});

test('esMuebleSuperior: TW y sus variantes son superiores por excepcion', () => {
  // Sin la excepcion, TW no tiene B y su W decidiria igual; lo que la regla
  // protege es que las variantes con guion no se escapen.
  assert.equal(esMuebleSuperior('TW'), true);
  assert.equal(esMuebleSuperior('TW-SM-PUSH'), true);
});

test('esMuebleSuperior: sin B ni W cae a inferior, que es el fallback compatible', () => {
  for (const pref of ['DB', 'V', 'PN', 'TK', 'F', 'SDB']) {
    assert.equal(esMuebleSuperior(pref), false, pref);
  }
});

test('esMuebleSuperior: tolera nulo, vacio y minusculas', () => {
  assert.equal(esMuebleSuperior(null), false);
  assert.equal(esMuebleSuperior(undefined), false);
  assert.equal(esMuebleSuperior(''), false);
  assert.equal(esMuebleSuperior('w-sm'), true, 'debe normalizar a mayusculas');
  assert.equal(esMuebleSuperior('bbl'), false);
});

test('familiaMaterialPorPrefijo es la misma decision, con otro nombre', () => {
  assert.equal(familiaMaterialPorPrefijo('W'), 'superior');
  assert.equal(familiaMaterialPorPrefijo('B'), 'inferior');
  assert.equal(familiaMaterialPorPrefijo(null), 'inferior');
});

// ---------------------------------------------------------------------------
// ajustarPiezasSinFondo: "Sin fondo" describe los modulos INFERIORES. Los
// superiores siempre llevan fondo, asi que elegirla no debe dejar un W sin
// respaldo: lo cotizaria de menos, y el tablero de fondo de superiores que el
// formulario sigue pidiendo no se consumiria.
//
// La regla vive aqui y no en `cotizar.ts` para poder probarla: aquel importa
// `server-only` y no se puede cargar desde un test.
// ---------------------------------------------------------------------------

const piezas = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P' },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB' },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992' },
];

const fondo = (r: typeof piezas) => r.find((p) => p.rol_tablero === 'fondo')!;
const base = (r: typeof piezas) => r.find((p) => p.nombre === 'base')!;

test('un mueble superior conserva su fondo aunque el proyecto sea "Sin fondo"', () => {
  const r = ajustarPiezasSinFondo(piezas, 'W', false);
  assert.equal(fondo(r).formula_cantidad, '1', 'el fondo de un W no debe anularse');
  assert.equal(base(r).formula_ancho, 'P-0.70866-TB', 'la base de un W tampoco se recalcula');
  assert.equal(r, piezas, 'si nada aplica se devuelve el mismo arreglo, sin copiar');
});

test('un modulo inferior si pierde el fondo con "Sin fondo"', () => {
  const r = ajustarPiezasSinFondo(piezas, 'B', false);
  assert.equal(fondo(r).formula_cantidad, '0', 'el fondo de un B queda en cantidad cero');
  assert.equal(base(r).formula_ancho, 'P-TC', 'y su base pasa a Profundidad menos un espesor de caja');
  assert.equal(r.find((p) => p.nombre === 'lateral')!.formula_ancho, 'P', 'el resto del despiece no se toca');
});

test('con "Con fondo" no se toca nada, sea superior o inferior', () => {
  for (const pref of ['B', 'W']) {
    const r = ajustarPiezasSinFondo(piezas, pref, true);
    assert.equal(fondo(r).formula_cantidad, '1', `${pref} conserva el fondo`);
    assert.equal(base(r).formula_ancho, 'P-0.70866-TB', `${pref} conserva su base`);
  }
});

test('conFondo sin definir se trata como "Con fondo"', () => {
  // El motor compara contra `false` explicitamente: una cotizacion antigua sin el
  // campo no debe perder su respaldo.
  assert.equal(ajustarPiezasSinFondo(piezas, 'B', undefined), piezas);
});

test('la regla de fondo usa el mismo criterio de superior que el reparto de materiales', () => {
  // Si la UI y el motor divergieran aqui, el formulario pediria un tablero que el
  // precio no consume, o al reves.
  for (const [pref, superior] of [['W', true], ['WBL', true], ['TW-SM-PUSH', true], ['B', false], ['BBL', false], ['DB', false]] as const) {
    const r = ajustarPiezasSinFondo(piezas, pref, false);
    assert.equal(fondo(r).formula_cantidad, superior ? '1' : '0', `fondo de ${pref}`);
    assert.equal(esMuebleSuperior(pref), superior, `clasificacion de ${pref}`);
  }
});

test('la base solo se recalcula sobre el eje donde aparece la profundidad', () => {
  // Hay plantillas cuya base lleva P en el largo y no en el ancho.
  const porLargo = [{ nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'P-0.9', formula_ancho: 'L-2*TC' }];
  const r = ajustarPiezasSinFondo(porLargo, 'B', false);
  assert.equal(r[0].formula_largo, 'P-TC');
  assert.equal(r[0].formula_ancho, 'L-2*TC', 'el otro eje se conserva');
});

test('una base sin P en ninguna formula se deja intacta', () => {
  const fija = [{ nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: '17.72441', formula_ancho: '19.15354' }];
  const r = ajustarPiezasSinFondo(fija, 'B', false);
  assert.equal(r[0].formula_largo, '17.72441');
  assert.equal(r[0].formula_ancho, '19.15354');
});
