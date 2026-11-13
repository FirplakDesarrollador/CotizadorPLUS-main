import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';
import { firmaDespiece, grupoDeTipo, resumenPorGrupo, unidadesFisicas } from '../src/lib/corte/clasificacion';

// Separación del optimizador en Muebles / Paneles / Fillers / Zócalos y conteo de unidades
// físicas (cantidad de la línea × repeticiones del área), para cotizaciones
// existentes y nuevas. El grupo sale de cot_tipos_mueble (migración 0260).

test('grupoDeTipo usa la columna del catálogo y, si falta, el margen', () => {
  assert.equal(grupoDeTipo({ grupo_optimizador: 'panel', margen_key: 'muebles' }), 'panel');
  assert.equal(grupoDeTipo({ margen_key: 'pn_tk' }), 'panel');
  assert.equal(grupoDeTipo({ margen_key: 'fillers' }), 'filler');
  assert.equal(grupoDeTipo({ margen_key: 'muebles' }), 'mueble');
  assert.equal(grupoDeTipo({ grupo_optimizador: 'otro', margen_key: 'fillers' }), 'filler');
  assert.equal(grupoDeTipo({ categoria: 'zocalo', margen_key: 'pn_tk' }), 'zocalo', 'TK va aparte aunque comparta margen con PN');
  assert.equal(grupoDeTipo({ grupo_optimizador: 'zocalo' }), 'zocalo');
  assert.equal(grupoDeTipo(undefined), 'mueble');
});

test('unidadesFisicas multiplica por las repeticiones del área', () => {
  assert.equal(unidadesFisicas(3, 6), 18);
  assert.equal(unidadesFisicas(2, undefined), 2);
  assert.equal(unidadesFisicas(2, 0), 2);
  assert.equal(unidadesFisicas(0, 6), 6, 'una línea sin cantidad cuenta como 1');
});

test('resumenPorGrupo devuelve siempre los cuatro grupos con sus totales', () => {
  const r = resumenPorGrupo(
    [
      { grupo: 'mueble', cantidad: 6, piezasPorModulo: 14 },
      { grupo: 'panel', cantidad: 12, piezasPorModulo: 1 },
      { cantidad: 1, piezasPorModulo: 10 },
      { grupo: 'mueble', cantidad: 2, piezasPorModulo: 20, mueblesPorModulo: 3 },
    ],
    [{ grupo: 'filler' }],
  );
  assert.deepEqual(r, [
    { grupo: 'mueble', lineas: 3, unidades: 13, piezas: 134, errores: 0 },
    { grupo: 'panel', lineas: 1, unidades: 12, piezas: 12, errores: 0 },
    { grupo: 'filler', lineas: 0, unidades: 0, piezas: 0, errores: 1 },
    { grupo: 'zocalo', lineas: 0, unidades: 0, piezas: 0, errores: 0 },
  ]);
});

test('firmaDespiece distingue medidas y no depende del orden de las piezas', () => {
  const a = [{ pieza: 'PN', cant: 1, largoIn: 35.5, anchoIn: 24 }, { pieza: 'X', cant: 2, largoIn: 10, anchoIn: 5 }];
  assert.equal(firmaDespiece(a), firmaDespiece([...a].reverse()));
  assert.notEqual(firmaDespiece(a), firmaDespiece([{ ...a[0], anchoIn: 12 }, a[1]]));
});

// ---------- Acción del optimizador con una cotización simulada ----------

const linea = (id: string, tipo: string | null, pref: string | null, codigo: string, cantidad: number, extra: Record<string, unknown> = {}) => ({
  id, cotizacion_id: 'cot-1', grupo_id: null, posicion_grupo: 1, tipo_mueble_id: tipo, pref, codigo_modulo: codigo,
  largo: 30, alto: 34.5, prof: 24, unidad_dim: 'in', cantidad, config: {}, ...extra,
});

const mockCotizacion = {
  cocinas: [
    {
      nombre: 'APTO A COCINA 1', cantidad: 6,
      lineas: [
        linea('l-b', 't-b', 'B', 'B30', 1),
        linea('l-pn1', 't-pn', 'PN', 'PN2435', 2, { largo: 24 }),
        linea('l-pn2', 't-pn', 'PN', 'PN2435', 1, { largo: 12 }),
        linea('l-tk', 't-tk', 'TK', 'TK96', 1),
        linea('l-f', 't-f', 'F', 'F3', 2),
        linea('l-herraje', null, null, 'BISAGRA', 4, { config: { clasificacionPdf: 'herrajes_otros', material: { tipo: 'herraje' } } }),
      ],
    },
    { nombre: 'APTO C BAÑO 2', cantidad: 12, lineas: [linea('l-v', 't-v', 'V', 'V24', 1), linea('l-roto', 't-f', 'F', 'F-ROTO', 1)] },
  ],
  lineasSinCocina: [linea('l-w', 't-w', 'W', 'W2430', 3)],
};

const tipos = [
  { id: 't-b', grupo_optimizador: 'mueble', margen_key: 'muebles' },
  { id: 't-v', grupo_optimizador: 'mueble', margen_key: 'muebles' },
  { id: 't-w', margen_key: 'muebles' },
  { id: 't-pn', grupo_optimizador: 'panel', margen_key: 'pn_tk' },
  { id: 't-tk', grupo_optimizador: 'zocalo', categoria: 'zocalo', margen_key: 'pn_tk' },
  { id: 't-f', grupo_optimizador: 'filler', margen_key: 'fillers' },
];

const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function (name: string, ...args: unknown[]) {
  const n = name.replace(/\\/g, '/');
  if (n === 'server-only') return {};
  if (n.includes('/lib/auth')) return { getUserAndRole: async () => ({ user: { id: 'u1' }, rol: 'admin' }) };
  if (n.includes('/lib/cotizaciones')) {
    return {
      getCotizacion: async () => mockCotizacion,
      listarCotizaciones: async () => [],
      inputDesdeLinea: (l: Record<string, unknown>) => ({ tipoId: l.tipo_mueble_id, codigo: l.codigo_modulo, largo: l.largo }),
    };
  }
  if (n.includes('/lib/cotizar')) {
    return {
      cotizar: async (input: { codigo: string; largo: number }) => {
        if (input.codigo === 'F-ROTO') throw new Error('Fórmula inválida');
        return {
          piezas: [{ pieza: 'P', rol: 'caja', cant: 1, largoIn: input.largo, anchoIn: 24, cantoLargos: 1, cantoAnchos: 0, cantoCalibre: '0.45' }],
          maderaPorRol: [{ rol: 'caja', codigo: 'ECO15' }],
          trm: 4200, margen: 0.6,
        };
      },
      cotizarGrupo: async () => { throw new Error('sin grupos en esta prueba'); },
    };
  }
  if (n.includes('/lib/supabase/server')) {
    return { createClient: async () => ({ from: () => ({ select: async () => ({ data: tipos, error: null }) }) }) };
  }
  return original.call(this, name, ...args);
};
const req = createRequire(import.meta.url);
const acciones = req('../src/app/optimizador/actions.ts') as typeof import('../src/app/optimizador/actions');
loader._load = original;

test('proyectoDesdeCotizacionAction separa grupos y cuenta las repeticiones del área', async () => {
  const p = await acciones.proyectoDesdeCotizacionAction('cot-1');
  const por = Object.fromEntries(p.modulos.map((m) => [m.lineaId, m]));

  assert.equal(por['l-herraje'], undefined, 'herrajes/otros no son módulos');
  assert.deepEqual(
    p.modulos.map((m) => [m.lineaId, m.grupo, m.cantidad]),
    [['l-b', 'mueble', 6], ['l-pn1', 'panel', 12], ['l-pn2', 'panel', 6], ['l-tk', 'zocalo', 6], ['l-f', 'filler', 12], ['l-v', 'mueble', 12], ['l-w', 'mueble', 3]],
  );
  assert.equal(por['l-pn1'].cantidadLinea, 2);
  assert.equal(por['l-pn1'].repeticionesArea, 6);
  assert.equal(por['l-pn1'].medidas, '24x34.5x24 in');
  assert.notEqual(por['l-pn1'].firma, por['l-pn2'].firma, 'dos PN de distinta medida no se confunden');

  assert.deepEqual(p.errores, [{ codigo: 'F-ROTO', error: 'Fórmula inválida', grupo: 'filler', unidades: 12 }], 'la línea que falla queda visible con su grupo');

  const r = resumenPorGrupo(p.modulos, p.errores);
  assert.deepEqual(r.map((x) => [x.grupo, x.unidades, x.piezas, x.errores]), [['mueble', 21, 21, 0], ['panel', 18, 18, 0], ['filler', 12, 12, 1], ['zocalo', 6, 6, 0]]);
  assert.equal(r.reduce((n, x) => n + x.piezas, 0), 57, 'la sumatoria de piezas cubre los cuatro grupos');
});
