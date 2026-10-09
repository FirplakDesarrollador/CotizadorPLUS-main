import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONFIG_OPTIMIZADOR_DEFAULT, dimsDesdeCodigoFormato, formatoConfigurado, laminasPorPila,
  normalizarConfig, normalizarFormato, repartoDiario,
} from '../src/lib/corte/config';
import { construirListaCorte, SIN_TABLERO, type ModuloEntrada, type TableroInfo } from '../src/lib/corte/lista';

const cfg = normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, piezasPorDia: 10 });

test('los parámetros confirmados por planta son el valor por defecto', () => {
  const d = normalizarConfig(undefined);
  assert.equal(d.discoMm, 4.4);
  assert.equal(d.refiladoMm, 5);
  assert.equal(d.refiladoMaxMm, 9);
  assert.equal(d.sobranteMinLargoMm, 1000);
  assert.equal(d.sobranteMinAnchoMm, 500);
  assert.equal(d.desperdicioMaxPct, 15);
  assert.equal(laminasPorPila(d, 15), 4);
  assert.equal(laminasPorPila(d, 18), 3);
  assert.equal(laminasPorPila(d, 6), null);
  assert.deepEqual(formatoConfigurado(d, '183x244'), { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true });
  assert.deepEqual(formatoConfigurado(d, '124X246'), { codigo: '124X246', largoMm: 2460, anchoMm: 1240, activo: true });
});

test('normalizarConfig corrige valores inválidos sin perder los válidos', () => {
  const c = normalizarConfig({
    discoMm: '4,6', refiladoMm: 20, refiladoMaxMm: 9, piezasPorDia: -3, nivelesCorte: 2.6,
    pilas: [{ espesorMm: 18, laminas: 3 }, { espesorMm: 'x', laminas: 2 }],
    formatos: [{ codigo: ' 183x244 ', largoMm: 1830, anchoMm: 2440 }, { codigo: '183X244', largoMm: 1, anchoMm: 1 }],
    criterio: ['cortes', 'inventado', 'cortes'],
  });
  assert.equal(c.discoMm, 4.6);
  assert.equal(c.refiladoMm, 9, 'el refilado no puede pasar del máximo');
  assert.equal(c.piezasPorDia, 0);
  assert.equal(c.nivelesCorte, 3);
  assert.deepEqual(c.pilas, [{ espesorMm: 18, laminas: 3 }]);
  assert.deepEqual(c.formatos, [{ codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true }], 'largo = lado mayor y sin duplicados');
  assert.deepEqual(c.criterio, ['cortes', 'desperdicio', 'laminas', 'sobrante_ultima']);
});

test('formato del catálogo en cm → mm', () => {
  assert.equal(normalizarFormato(' 183x244 '), '183X244');
  assert.deepEqual(dimsDesdeCodigoFormato('124X246'), { largoMm: 2460, anchoMm: 1240 });
  assert.equal(dimsDesdeCodigoFormato('sin medida'), null);
});

test('reparto diario: días llenos y el resto en el último', () => {
  assert.deepEqual(repartoDiario(25, 10), [10, 10, 5]);
  assert.deepEqual(repartoDiario(20, 10), [10, 10]);
  assert.deepEqual(repartoDiario(25, 0), [], 'sin ritmo definido no hay días');
  assert.deepEqual(repartoDiario(0, 10), []);
});

const tableros: TableroInfo[] = [
  { codigo: 'CAJA15', espesor_mm: 15, formato: '183X244', proveedor: 'ECOFORT' },
  { codigo: 'FONDO6', espesor_mm: 6, formato: '183x244', proveedor: 'PRIMADERA' },
];

const in2 = (mm: number) => mm / 25.4;
const modulo = (codigo: string, cantidad: number, lateralCant = 2): ModuloEntrada => ({
  codigo,
  cantidad,
  tableroPorRol: { caja: 'CAJA15', fondo: 'FONDO6' },
  piezas: [
    { pieza: 'lateral', rol: 'caja', cant: lateralCant, largoIn: in2(762), anchoIn: in2(609.6), cantoLargos: 2, cantoAnchos: 2, cantoCalibre: '19x0,45' },
    { pieza: 'base', rol: 'caja', cant: 1, largoIn: in2(274.8), anchoIn: in2(585.6), cantoLargos: 2, cantoAnchos: 0, cantoCalibre: '19x0,45' },
    { pieza: 'fondo', rol: 'fondo', cant: 1, largoIn: in2(760), anchoIn: in2(288.8), cantoLargos: 0, cantoAnchos: 0, cantoCalibre: null },
    { pieza: 'tapa', rol: 'refuerzo', cant: 1, largoIn: in2(274.8), anchoIn: in2(80), cantoLargos: 2, cantoAnchos: 0, cantoCalibre: '19x0,45' },
  ],
});

test('lista de corte: agrupa por material y medida, multiplica por cantidad y cuenta piezas', () => {
  const l = construirListaCorte([modulo('B12', 3), modulo('B12', 1)], tableros, cfg);
  const lateral = l.filas.find((f) => f.pieza === 'lateral');
  assert.equal(lateral?.cantidad, 8);
  assert.equal(lateral?.largoMm, 762);
  assert.equal(lateral?.anchoMm, 609.6);
  assert.equal(l.totalPiezas, 4 * 5);
  assert.deepEqual(l.reparto, [10, 10]);
  const sinTablero = l.materiales.find((m) => m.material === SIN_TABLERO);
  assert.ok(sinTablero?.alertas.some((a) => a.includes('sin tablero')), 'el rol sin tablero se avisa');
  const fondo = l.materiales.find((m) => m.material === 'FONDO6');
  assert.ok(fondo?.alertas.some((a) => a.includes('6 mm')), 'falta la pila de 6 mm');
});

test('lista de corte: las fracciones de módulos agrupados se suman antes de redondear', () => {
  const l = construirListaCorte([modulo('DB12', 1, 1.5), modulo('DB30', 1, 1.5), modulo('DB19', 1, 1)], tableros, cfg);
  assert.equal(l.filas.find((f) => f.pieza === 'lateral')?.cantidad, 4);
});

test('láminas mínimas y meta de desperdicio por material', () => {
  const l = construirListaCorte([modulo('B12', 10)], tableros, cfg);
  const caja = l.materiales.find((m) => m.material === 'CAJA15');
  assert.ok(caja);
  const util = (2440 - 10) * (1830 - 10);
  const conSierra = 20 * (762 + 4.4) * (609.6 + 4.4) + 10 * (274.8 + 4.4) * (585.6 + 4.4);
  assert.equal(caja.laminasMinimas, Math.ceil(conSierra / util));
  const neta = 20 * 762 * 609.6 + 10 * 274.8 * 585.6;
  assert.equal(caja.laminasMaxDesperdicio, Math.floor(neta / (2440 * 1830 * 0.85)));
  assert.equal(caja.piezas, 30);
  assert.equal(caja.laminasPorPila, 4);
});
