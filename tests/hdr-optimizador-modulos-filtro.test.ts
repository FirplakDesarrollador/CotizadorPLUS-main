import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';

const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;

const mockCotizacion = {
  cocinas: [
    {
      nombre: 'Cocina Principal',
      lineas: [
        // Módulo 1 (módulo real)
        {
          id: 'lin-mod-1',
          cotizacion_id: 'cot-1',
          cocina_id: 'coc-1',
          grupo_id: null,
          posicion_grupo: 1,
          tipo_mueble_id: 'tipo-b',
          pref: 'B',
          codigo_modulo: 'B30',
          largo: 30,
          alto: 30,
          prof: 24,
          unidad_dim: 'in',
          cantidad: 1,
          config: { conHerrajes: true },
        },
        // Elemento 2: agregado por "+ Agregar herrajes/otros" (herraje suelto)
        {
          id: 'lin-mat-herraje',
          cotizacion_id: 'cot-1',
          cocina_id: 'coc-1',
          grupo_id: 'grp-mat-1',
          posicion_grupo: 1,
          tipo_mueble_id: null,
          pref: null,
          sku: 'BISAGRAPAR',
          codigo_modulo: 'BISAGRAPAR',
          largo: 0,
          alto: 0,
          prof: 0,
          unidad_dim: 'in',
          cantidad: 1,
          config: {
            clasificacionPdf: 'herrajes_otros',
            material: { tipo: 'herraje', codigo: 'BISAGRAPAR', cantidad: 6, precioUnitarioCop: 9800 },
          },
        },
        // Elemento 3: agregado por "+ Agregar herrajes/otros" (tablero suelto)
        {
          id: 'lin-mat-tablero',
          cotizacion_id: 'cot-1',
          cocina_id: 'coc-1',
          grupo_id: 'grp-mat-2',
          posicion_grupo: 1,
          tipo_mueble_id: null,
          pref: null,
          sku: 'ECOCARB15COLOR',
          codigo_modulo: 'ECOCARB15COLOR',
          largo: 0,
          alto: 0,
          prof: 0,
          unidad_dim: 'in',
          cantidad: 1,
          config: {
            clasificacionPdf: 'herrajes_otros',
            material: { tipo: 'tablero', codigo: 'ECOCARB15COLOR', cantidad: 2.5, precioUnitarioCop: 42000 },
          },
        },
      ],
    },
  ],
  lineasSinCocina: [
    // Elemento 4: agregado en lineasSinCocina por "+ Agregar herrajes/otros" (canto suelto)
    {
      id: 'lin-mat-canto',
      cotizacion_id: 'cot-1',
      cocina_id: null,
      grupo_id: 'grp-mat-3',
      posicion_grupo: 1,
      tipo_mueble_id: null,
      pref: null,
      sku: '19x0,45',
      codigo_modulo: '19x0,45',
      largo: 0,
      alto: 0,
      prof: 0,
      unidad_dim: 'in',
      cantidad: 1,
      config: {
        clasificacionPdf: 'herrajes_otros',
        material: { tipo: 'canto', codigo: '19x0,45', cantidad: 20, precioUnitarioCop: 400 },
      },
    },
    // Módulo 2 en lineasSinCocina (módulo suelto)
    {
      id: 'lin-mod-2',
      cotizacion_id: 'cot-1',
      cocina_id: null,
      grupo_id: null,
      posicion_grupo: 1,
      tipo_mueble_id: 'tipo-w',
      pref: 'W',
      codigo_modulo: 'W2430',
      largo: 24,
      alto: 30,
      prof: 12,
      unidad_dim: 'in',
      cantidad: 2,
      config: { conHerrajes: true },
    },
  ],
};

let cotizarLlamadas = 0;
loader._load = function(name: string, ...args: unknown[]) {
  const n = name.replace(/\\/g, '/');
  if (n === 'server-only') return {};
  if (n.includes('/lib/auth')) {
    return { getUserAndRole: async () => ({ user: { id: 'u1', email: 'admin@test.com' }, rol: 'admin' }) };
  }
  if (n.includes('/lib/cotizaciones')) {
    return {
      getCotizacion: async () => mockCotizacion,
      listarCotizaciones: async () => [],
      inputDesdeLinea: (l: Record<string, unknown>) => ({ tipoId: l.tipo_mueble_id, largo: l.largo, alto: l.alto, prof: l.prof }),
    };
  }
  if (n.includes('/lib/cotizar')) {
    return {
      cotizar: async (input: { tipoId: string }) => {
        cotizarLlamadas++;
        if (!input.tipoId) throw new Error('Tipo de mueble no encontrado');
        return {
          piezas: [
            { pieza: 'SIDE L', rol: 'caja', cant: 1, largoIn: 30, anchoIn: 24, cantoLargos: 1, cantoAnchos: 0, cantoCalibre: '0.45' },
            { pieza: 'BASE', rol: 'caja', cant: 1, largoIn: 28, anchoIn: 24, cantoLargos: 1, cantoAnchos: 0, cantoCalibre: '0.45' },
          ],
          maderaPorRol: [{ rol: 'caja', codigo: 'ECO15' }],
          trm: 4200,
          margen: 0.6,
        };
      },
      cotizarGrupo: async (inputs: { tipoId: string }[]) => {
        return {
          lineas: inputs.map(() => ({
            piezas: [{ pieza: 'SIDE L', rol: 'caja', cant: 1, largoIn: 30, anchoIn: 24, cantoLargos: 1, cantoAnchos: 0, cantoCalibre: '0.45' }],
            maderaPorRol: [{ rol: 'caja', codigo: 'ECO15' }],
          })),
          preparados: inputs.map(() => ({ margen: 0.6 })),
        };
      },
    };
  }
  if (n.includes('/lib/supabase/server')) {
    return {
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'admin@test.com' } } }) },
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
      }),
    };
  }
  return original.call(this, name, ...args);
};

const req = createRequire(import.meta.url);
const hdrActions = req('../src/app/hdr/actions.ts') as typeof import('../src/app/hdr/actions');
const optimizadorActions = req('../src/app/optimizador/actions.ts') as typeof import('../src/app/optimizador/actions');
loader._load = original;

test('modulosDeCotizacionAction en HDR retira elementos de agregar herrajes y solo devuelve módulos', async () => {
  cotizarLlamadas = 0;
  const modulos = await hdrActions.modulosDeCotizacionAction('cot-1');

  // De las 5 líneas totales en la cotización:
  // - lin-mod-1 (B30) -> módulo real
  // - lin-mat-herraje -> herraje suelto (debe ser excluido)
  // - lin-mat-tablero -> tablero suelto (debe ser excluido)
  // - lin-mat-canto -> canto suelto (debe ser excluido)
  // - lin-mod-2 (W2430) -> módulo real
  assert.equal(modulos.length, 2, 'solo deben salir los 2 módulos');
  assert.deepEqual(modulos.map((m) => m.lineaId), ['lin-mod-1', 'lin-mod-2']);
  assert.deepEqual(modulos.map((m) => m.codigoModulo), ['B30', 'W2430']);
  assert.ok(modulos.every((m) => m.ok), 'ningún módulo debe tener error');
  assert.equal(cotizarLlamadas, 2, 'cotizar solo debió llamarse 2 veces (solo para los módulos)');
});

test('proyectoDesdeCotizacionAction en Optimizador solo incluye módulos y no tiene errores de herrajes', async () => {
  const proyecto = await optimizadorActions.proyectoDesdeCotizacionAction('cot-1');

  assert.equal(proyecto.errores.length, 0, 'no deben existir errores de herrajes u otros');
  assert.equal(proyecto.modulos.length, 2, 'solo deben salir los 2 módulos');
  assert.deepEqual(proyecto.modulos.map((m) => m.lineaId), ['lin-mod-1', 'lin-mod-2']);
  assert.deepEqual(proyecto.modulos.map((m) => m.codigo), ['B30', 'W2430']);
  assert.equal(proyecto.modulos[0].piezas.length, 2);
  assert.equal(proyecto.modulos[1].piezas.length, 2);
});
