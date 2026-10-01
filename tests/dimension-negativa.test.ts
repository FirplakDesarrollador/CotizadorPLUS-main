import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '../src/lib/engine';

// Una fórmula de pieza puede volverse negativa cuando el mueble se cotiza por debajo
// del rango para el que esa geometría fue escrita. El caso real es BBL (esquinero
// ciego): su gaveta usa `L-30.70` / `L-30.427` / `L-27.75`, que solo tienen sentido
// por encima de ~31". Por debajo, `area = cant * largo * ancho` salía NEGATIVA y le
// RESTABA tablero y canto al mueble, abaratándolo — un BBL de 24" cotizaba más barato
// de lo que cuesta. Ahora las dimensiones se acotan a 0: la pieza no aporta nada.
const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  // Réplica de la gaveta de BBL: negativa por debajo de 30.7".
  { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-30.70', formula_ancho: 'P-4.63', cantos: { largos: 2, anchos: 2, calibre: '22x1' } },
];

function input(L: number): CalcInput {
  return {
    dims: { L, A: 30, P: 24 },
    piezas,
    reglas: [],
    preset: { caja: 'TAB', refuerzo: 'TAB' },
    tablerosByCode: { TAB: { codigo: 'TAB', precio_m2: 10000, espesor_mm: 18 } },
    // El motor remapea el calibre por espesor y rol: 18mm no-frente -> 22x0,45.
    cantosByCalibre: { '22X1': { calibre: '22x1', precio: 100 }, '22X0,45': { calibre: '22x0,45', precio: 80 } },
    herrajesByCode: {},
    consumiblesBySelector: {},
    etiquetasUnd: 0,
    margen: 0,
    margenHerraje: 0,
    trm: 1,
    desperdicio: 0,
  };
}

test('una pieza cuya fórmula da negativo no resta área ni canto', () => {
  const r = calcularMueble(input(24)); // 24" < 30.7" -> base_gaveta negativa
  const gaveta = r.piezas.find((p) => p.pieza === 'base_gaveta')!;
  assert.equal(gaveta.largoIn, 0, 'la dimensión negativa se acota a 0');
  assert.equal(gaveta.areaCm2, 0, 'no aporta área');
  // El refuerzo no debe existir como consumo de tablero.
  const refuerzo = r.maderaPorRol.find((m) => m.rol === 'refuerzo');
  assert.ok(!refuerzo || refuerzo.cm2 === 0, 'el rol refuerzo no acumula área negativa');
  // Y el mueble nunca puede costar menos que su caja sola.
  const soloCaja = calcularMueble({ ...input(24), piezas: [piezas[0]] });
  assert.ok(r.costoMadera >= soloCaja.costoMadera, 'la pieza inaplicable no abarata el mueble');
  assert.ok(r.costoCanto >= soloCaja.costoCanto, 'ni descuenta canto');
});

test('por encima del rango la misma pieza sí aporta normalmente', () => {
  const r = calcularMueble(input(36)); // 36" > 30.7"
  const gaveta = r.piezas.find((p) => p.pieza === 'base_gaveta')!;
  assert.ok(Math.abs(gaveta.largoIn - 5.3) < 1e-9, 'largo = 36 - 30.70');
  assert.ok(gaveta.areaCm2 > 0, 'aporta área positiva');
});
