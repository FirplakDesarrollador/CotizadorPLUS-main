import assert from 'node:assert/strict';
import test from 'node:test';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { inferirMontaje } from '../src/lib/visualizacion-config';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';

test('B-FE: visualización monta gaveta arriba, puerta abajo y fondo_gaveta adentro sin piezas sueltas', () => {
  const piezas = [
    { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB' },
    { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P' },
    { nombre: 'refuerzo_delantero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961' },
    { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961' },
    { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-2*TC-0.03937', formula_ancho: '11.81102' },
    { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-3.38583', formula_ancho: '3.14961' },
    { nombre: 'lateral_gaveta_der', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: '3.93701', formula_ancho: '19.68504' },
    { nombre: 'lateral_gaveta_izq', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: '3.93701', formula_ancho: '19.68504' },
    { nombre: 'contraparche', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-4.38583', formula_ancho: '3.93701' },
    { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'A-alto_frente_gaveta-2*RV' },
    { nombre: 'frente_cajon', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'alto_frente_gaveta' },
    { nombre: 'fondo_gaveta', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-2.83465', formula_ancho: '19.37008' },
    { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992' },
  ].map((p, i) => ({
    ...p,
    id: `p-${i}`,
    orden: i * 10,
    modo_agrupacion: 'local',
    clave_fusion: null,
    formula_largo_grupo: null,
    cantos: {},
    tarugos: 0,
    soportes: 0,
    visualizacion: inferirMontaje(p),
  }));

  const boards = {
    caja: { codigo: 'caja', espesor_mm: 15, precio_m2: 50000, formato: '183X244' },
    refuerzo: { codigo: 'refuerzo', espesor_mm: 15, precio_m2: 50000, formato: '183X244' },
    frente: { codigo: 'frente', espesor_mm: 18, precio_m2: 80000, formato: '183X244' },
    fondo: { codigo: 'fondo', espesor_mm: 6, precio_m2: 30000, formato: '183X244' },
  };

  const member: PreparedGroupMember = {
    pref: 'B-FE',
    permiteAgrupacion: true,
    calc: {
      dims: { L: 12, A: 30, P: 24 },
      piezas: piezas as any,
      reglas: [{ tipo_mueble_id: null, variable: 'alto_frente_gaveta', condicion: 'true', valor: '6', prioridad: 5 }],
      preset: { caja: 'caja', refuerzo: 'refuerzo', frente: 'frente', fondo: 'fondo' },
      tablerosByCode: boards as any,
      cantosByCalibre: {},
      herrajesByCode: {},
      consumiblesBySelector: {},
      etiquetasUnd: 0,
      usaCarton: false,
      margen: 0.5,
      trm: 4000,
      desperdicio: 0,
      modoFrentes: 'normal',
    },
  };

  const group = calcularGrupoFisico([member]);
  const scene = construirVisualizacion([member], group);

  // 1. Ninguna pieza debe quedar como "suelto" (fuera del mueble)
  const sueltas = scene.paneles.filter((p) => p.funcion === 'suelto');
  assert.equal(sueltas.length, 0, 'No debe haber piezas sueltas fuera del mueble');

  // 2. fondo_gaveta debe reconocerse como base_gaveta
  const fondoGav = scene.paneles.find((p) => p.nombre === 'fondo_gaveta');
  assert.ok(fondoGav, 'fondo_gaveta debe existir');
  assert.equal(fondoGav.funcion, 'base_gaveta');
  assert.ok(fondoGav.x >= 0 && fondoGav.x < 12 * 25.4, 'fondo_gaveta debe estar dentro del ancho');

  // 3. El frente del cajón debe estar ARRIBA de la puerta
  const frenteCajon = scene.paneles.find((p) => p.nombre === 'frente_cajon')!;
  const puerta = scene.paneles.find((p) => p.nombre === 'frente')!;
  assert.ok(frenteCajon, 'frente_cajon debe existir');
  assert.ok(puerta, 'puerta debe existir');
  assert.ok(frenteCajon.z > puerta.z, 'frente_cajon debe estar ubicado arriba de la puerta');

  // 4. El cajón debe estar a la altura del frente_cajon
  assert.ok(Math.abs(fondoGav.z - frenteCajon.z - 30) < 1, 'fondo_gaveta debe estar alineado con su frente de cajón');
});

test('B-FE y B combinan correctamente compartiendo laterales y bases/fondos continuos', () => {
  const piezasFE = [
    { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', modo_agrupacion: 'continua', clave_fusion: 'base', formula_largo_grupo: 'LG-(2*TC)' },
    { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', modo_agrupacion: 'lateral_compartido' },
    { nombre: 'refuerzo_delantero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', modo_agrupacion: 'continua', clave_fusion: 'refuerzo_frontal', formula_largo_grupo: 'LG-(2*TC)' },
    { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', modo_agrupacion: 'continua', clave_fusion: 'refuerzo_trasero', formula_largo_grupo: 'LG-(2*TC)' },
    { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-2*TC-0.03937', formula_ancho: '11.81102', modo_agrupacion: 'local' },
    { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-3.38583', formula_ancho: '3.14961', modo_agrupacion: 'local' },
    { nombre: 'lateral_gaveta_der', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: '3.93701', formula_ancho: '19.68504', modo_agrupacion: 'local' },
    { nombre: 'lateral_gaveta_izq', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: '3.93701', formula_ancho: '19.68504', modo_agrupacion: 'local' },
    { nombre: 'contraparche', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-4.38583', formula_ancho: '3.93701', modo_agrupacion: 'local' },
    { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'A-alto_frente_gaveta-2*RV', modo_agrupacion: 'local' },
    { nombre: 'frente_cajon', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'alto_frente_gaveta', modo_agrupacion: 'local' },
    { nombre: 'fondo_gaveta', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-2.83465', formula_ancho: '19.37008', modo_agrupacion: 'local' },
    { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', modo_agrupacion: 'continua', clave_fusion: 'fondo', formula_largo_grupo: 'LG-TC' },
  ];

  const piezasB = [
    { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', modo_agrupacion: 'continua', clave_fusion: 'base', formula_largo_grupo: 'LG-(2*TC)' },
    { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', modo_agrupacion: 'lateral_compartido' },
    { nombre: 'refuerzo_horizontal', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', modo_agrupacion: 'continua', clave_fusion: 'refuerzo_frontal', formula_largo_grupo: 'LG-(2*TC)' },
    { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', modo_agrupacion: 'continua', clave_fusion: 'refuerzo_trasero', formula_largo_grupo: 'LG-(2*TC)' },
    { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC-0.03937', formula_ancho: '11.81102', modo_agrupacion: 'local' },
    { nombre: 'trasero_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-4.607', formula_ancho: '2.6875', modo_agrupacion: 'local' },
    { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-4.13386', formula_ancho: 'P-4.63', modo_agrupacion: 'local' },
    { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'A-alto_frente_gaveta-2*RV', modo_agrupacion: 'local' },
    { nombre: 'frente_cajon', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'alto_frente_gaveta', modo_agrupacion: 'local' },
    { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', modo_agrupacion: 'continua', clave_fusion: 'fondo', formula_largo_grupo: 'LG-TC' },
  ];

  const boards = {
    caja: { codigo: 'caja', espesor_mm: 15, precio_m2: 50000, formato: '183X244' },
    refuerzo: { codigo: 'refuerzo', espesor_mm: 15, precio_m2: 50000, formato: '183X244' },
    frente: { codigo: 'frente', espesor_mm: 18, precio_m2: 80000, formato: '183X244' },
    fondo: { codigo: 'fondo', espesor_mm: 6, precio_m2: 30000, formato: '183X244' },
  };

  const mFE: PreparedGroupMember = {
    pref: 'B-FE',
    permiteAgrupacion: true,
    calc: {
      dims: { L: 12, A: 30, P: 24 },
      piezas: piezasFE as any,
      reglas: [{ tipo_mueble_id: null, variable: 'alto_frente_gaveta', condicion: 'true', valor: '6', prioridad: 5 }],
      preset: { caja: 'caja', refuerzo: 'refuerzo', frente: 'frente', fondo: 'fondo' },
      tablerosByCode: boards as any,
      cantosByCalibre: {},
      herrajesByCode: {},
      consumiblesBySelector: {},
      etiquetasUnd: 0,
      usaCarton: false,
      margen: 0.57,
      trm: 4000,
      desperdicio: 0,
      modoFrentes: 'normal',
    },
  };

  const mB: PreparedGroupMember = {
    pref: 'B',
    permiteAgrupacion: true,
    calc: {
      dims: { L: 11, A: 30, P: 24 },
      piezas: piezasB as any,
      reglas: [{ tipo_mueble_id: null, variable: 'alto_frente_gaveta', condicion: 'true', valor: '6', prioridad: 5 }],
      preset: { caja: 'caja', refuerzo: 'refuerzo', frente: 'frente', fondo: 'fondo' },
      tablerosByCode: boards as any,
      cantosByCalibre: {},
      herrajesByCode: {},
      consumiblesBySelector: {},
      etiquetasUnd: 0,
      usaCarton: false,
      margen: 0.57,
      trm: 4000,
      desperdicio: 0,
      modoFrentes: 'normal',
    },
  };

  const group = calcularGrupoFisico([mFE, mB]);
  assert.equal(group.largoTotalIn, 23);
  assert.equal(group.laterales, 3);
  assert.equal(group.uniones, 1);

  const scene = construirVisualizacion([mFE, mB], group);
  assert.equal(scene.modulos.length, 2);
  assert.equal(scene.paneles.filter(p => p.funcion === 'suelto').length, 0);
});
