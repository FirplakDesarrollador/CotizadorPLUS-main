import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { calcularGrupoFisico, type PreparedGroupMember } from '@/lib/group-engine';
import { construirVisualizacion } from '@/lib/visualizacion';
import type { Pieza } from '@/lib/engine';
import { orientarPieza } from '@/lib/muebles';

const migration = readFileSync('db/migrations/0220_pc_entrepanos_visualizacion_puertas.sql', 'utf8');

const pieza = (nombre: string, rol_tablero: string, formula_cantidad: string, formula_largo: string, formula_ancho: string): Pieza => ({
  nombre,
  rol_tablero,
  formula_cantidad,
  formula_largo,
  formula_ancho,
  cantos: {},
  tarugos: 0,
  soportes: 0,
  visualizacion: {
    version: 1,
    funcion: nombre === 'lateral' ? 'lateral' : nombre.startsWith('base_tapa') ? 'base_tapa' : nombre.startsWith('entrepano') ? 'estante' : nombre === 'fondo' ? 'respaldo' : 'frente',
    plano: nombre === 'lateral' ? 'YZ' : nombre.startsWith('base_tapa') || nombre.startsWith('entrepano') ? 'XY' : 'XZ',
    intercambiar: false,
    confirmado: false,
  },
});

function calcularPc() {
  const piezas = [
    pieza('lateral', 'caja', '2', 'A-zocalo', 'P'),
    pieza('base_tapa', 'caja', '3', 'L-2*TC', 'P'),
    pieza('entrepano', 'refuerzo', '4', 'L-2*TC', 'P-1.5'),
    pieza('puerta_superior', 'frente', 'n_puertas', '(L-n_puertas*RV)/n_puertas', 'PUERTA_SUP-RV'),
    pieza('puerta_inferior', 'frente', 'n_puertas', '(L-n_puertas*RV)/n_puertas', 'A-zocalo-PUERTA_SUP-RV'),
  ];
  const member: PreparedGroupMember = {
    pref: 'PC',
    permiteAgrupacion: false,
    calc: {
      dims: { L: 30, A: 96, P: 24 },
      piezas,
      reglas: [],
      overrides: { n_entrepanos: 5, n_puertas: 2, zocalo: 4, PUERTA_SUP: 15, RV: 0.125 },
      preset: { caja: 'CAJA', refuerzo: 'CAJA', frente: 'FRENTE' },
      tablerosByCode: {
        CAJA: { codigo: 'CAJA', espesor_mm: 15, precio_m2: 1 },
        FRENTE: { codigo: 'FRENTE', espesor_mm: 18, precio_m2: 1 },
      },
      cantosByCalibre: {},
      herrajesByCode: {},
      consumiblesBySelector: {},
      etiquetasUnd: 0,
      usaCarton: false,
      margen: 0,
      trm: 1,
      desperdicio: 0,
    },
  };
  const group = calcularGrupoFisico([member]);
  return { result: group.lineas[0], scene: construirVisualizacion([member], group) };
}

function calcularPcfd() {
  const piezas = [
    pieza('lateral', 'caja', '2', 'A-zocalo', 'P'),
    pieza('base_tapa_division', 'caja', '3', 'L-2*TC', 'P-0.9'),
    pieza('entrepano', 'refuerzo', 'n_entrepanos-1', 'L-2*TC-0.03937', 'P-1.54'),
    pieza('fondo', 'fondo', '1', 'L-TC', 'A-zocalo'),
  ];
  const member: PreparedGroupMember = {
    pref: 'PCFD',
    permiteAgrupacion: false,
    calc: {
      dims: { L: 30, A: 96, P: 24 },
      piezas,
      reglas: [],
      overrides: { n_entrepanos: 5, zocalo: 0 },
      preset: { caja: 'CAJA', refuerzo: 'CAJA', fondo: 'FONDO' },
      tablerosByCode: {
        CAJA: { codigo: 'CAJA', espesor_mm: 15, precio_m2: 1 },
        FONDO: { codigo: 'FONDO', espesor_mm: 6, precio_m2: 1 },
      },
      cantosByCalibre: {},
      herrajesByCode: {},
      consumiblesBySelector: {},
      etiquetasUnd: 0,
      usaCarton: false,
      margen: 0,
      trm: 1,
      desperdicio: 0,
    },
  };
  const group = calcularGrupoFisico([member]);
  return { result: group.lineas[0], scene: construirVisualizacion([member], group) };
}

function calcularPcfdMo() {
  const piezas = [
    pieza('lateral', 'caja', '2', 'A-zocalo', 'P'),
    pieza('base_tapa', 'caja', '2', 'L-2*TC', 'P-0.70866-TB'),
    pieza('entrepano_fijo', 'frente', '2', 'L-2*TC', 'P-0.70866-TB'),
    pieza('entrepano', 'refuerzo', '3', 'L-2*TC-0.03937', 'P-1.54'),
    pieza('puerta_superior', 'frente', 'n_puertas', '(L-n_puertas*RV)/n_puertas', 'PUERTA_SUP-RV'),
    pieza('puerta_inferior', 'frente', 'n_puertas', '(L-n_puertas*RV)/n_puertas', 'A-zocalo-PUERTA_SUP-MO-2*TF-RV'),
    pieza('fondo', 'fondo', '1', 'L-TC', 'A-zocalo'),
  ];
  const member: PreparedGroupMember = {
    pref: 'PCFD-MO',
    permiteAgrupacion: false,
    calc: {
      dims: { L: 30, A: 96, P: 24 },
      piezas,
      reglas: [],
      overrides: { n_puertas: 2, zocalo: 4, PUERTA_SUP: 20, MO: 18, RV: 0.125 },
      preset: { caja: 'CAJA', refuerzo: 'CAJA', frente: 'FRENTE18', fondo: 'FONDO' },
      tablerosByCode: {
        CAJA: { codigo: 'CAJA', espesor_mm: 15, precio_m2: 1 },
        FRENTE18: { codigo: 'FRENTE18', espesor_mm: 18, precio_m2: 1 },
        FONDO: { codigo: 'FONDO', espesor_mm: 6, precio_m2: 1 },
      },
      cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {},
      etiquetasUnd: 0, usaCarton: false, margen: 0, trm: 1, desperdicio: 0,
    },
  };
  const group = calcularGrupoFisico([member]);
  return { result: group.lineas[0], scene: construirVisualizacion([member], group) };
}

test('PC corta cuatro entrepaños ajustables porque base_tapa incluye el fijo', () => {
  assert.match(migration, /formula_cantidad = '4'/);
  const entrepano = calcularPc().result.piezas.find((p) => p.pieza === 'entrepano');
  assert.equal(entrepano?.cant, 4);
});

test('PC visualiza las puertas superiores arriba y las inferiores desde TK', () => {
  const { scene } = calcularPc();
  const superiores = scene.paneles.filter((p) => p.nombre === 'puerta_superior');
  const inferiores = scene.paneles.filter((p) => p.nombre === 'puerta_inferior');
  assert.equal(superiores.length, 2);
  assert.equal(inferiores.length, 2);
  assert.ok(superiores.every((p) => Math.abs(p.z + p.h - (96 * 25.4 - 3.175)) < 0.1));
  assert.ok(inferiores.every((p) => Math.abs(p.z - 4 * 25.4) < 0.1));
  assert.ok(Math.max(...inferiores.map((p) => p.z + p.h)) < Math.min(...superiores.map((p) => p.z)));
});

test('PCFD corta tres base_tapa_division y cuatro entrepaños móviles', () => {
  const sql = readFileSync('db/migrations/0221_pcfd_division_fija_entrepanos.sql', 'utf8');
  assert.match(sql, /when 'base_tapa_division' then '3'/);
  assert.match(sql, /when 'entrepano' then 'n_entrepanos-1'/);
  const { result } = calcularPcfd();
  assert.equal(result.piezas.find((p) => p.pieza === 'base_tapa_division')?.cant, 3);
  assert.equal(result.piezas.find((p) => p.pieza === 'entrepano')?.cant, 4);
});

test('PCFD visualiza la división fija entre base y tapa y delante del fondo', () => {
  const { scene } = calcularPcfd();
  const divisiones = scene.paneles
    .filter((p) => p.nombre === 'base_tapa_division')
    .sort((a, b) => a.z - b.z);
  const fondo = scene.paneles.find((p) => p.nombre === 'fondo');
  assert.equal(divisiones.length, 3);
  assert.ok(fondo);
  assert.ok(divisiones[0].z < divisiones[1].z && divisiones[1].z < divisiones[2].z);
  assert.equal(divisiones[0].w, divisiones[1].w);
  assert.equal(divisiones[0].d, divisiones[1].d);
  assert.ok(divisiones[1].y + divisiones[1].d <= fondo.y + 0.1,
    'la división fija debe terminar delante de la cara frontal del fondo');
});

test('PCFD-MO usa PUERTA_SUP y asigna los fijos al material de frente', () => {
  const sql = readFileSync('db/migrations/0222_pcfd_mo_puerta_sup_material_frente.sql', 'utf8');
  assert.match(sql, /variable = 'PUERTA_SUP'/);
  assert.match(sql, /rol_tablero = 'frente'/);
  assert.match(sql, /formula_ancho = 'PUERTA_SUP-RV'/);
  assert.match(sql, /formula_ancho = 'A-zocalo-PUERTA_SUP-MO-2\*TF-RV'/);
  const { result } = calcularPcfdMo();
  const fijos = result.piezas.find((p) => p.pieza === 'entrepano_fijo');
  assert.equal(fijos?.cant, 2);
  assert.equal(fijos?.rol, 'frente');
  const orientado = orientarPieza(fijos!);
  assert.ok(Math.abs(orientado.largoIn * 25.4 - 732) < 0.1);
  assert.ok(Math.abs(orientado.anchoIn * 25.4 - 585.6) < 0.1);
});

test('PCFD-MO visualiza arriba, MO abierto entre fijos y puertas inferiores abajo', () => {
  const { scene } = calcularPcfdMo();
  const fijos = scene.paneles.filter((p) => p.nombre === 'entrepano_fijo').sort((a, b) => a.z - b.z);
  const superiores = scene.paneles.filter((p) => p.nombre === 'puerta_superior');
  const inferiores = scene.paneles.filter((p) => p.nombre === 'puerta_inferior');
  assert.equal(fijos.length, 2);
  assert.equal(superiores.length, 2);
  assert.equal(inferiores.length, 2);
  assert.ok(fijos.every((p) => p.material === 'FRENTE18' && p.h === 18),
    JSON.stringify(fijos.map((p) => ({ material: p.material, w: p.w, d: p.d, h: p.h, rol: p.rol }))));
  assert.ok(Math.abs((fijos[1].z - (fijos[0].z + fijos[0].h)) - 18 * 25.4) < 0.1,
    'MO debe ser la luz libre entre las caras de los dos fijos');
  assert.ok(inferiores.every((p) => p.z + p.h < fijos[0].z));
  assert.ok(superiores.every((p) => p.z >= fijos[1].z + fijos[1].h - 0.1));
});

test('PCFD-MO distribuye un entrepaño móvil arriba y dos en la zona inferior', () => {
  const { scene } = calcularPcfdMo();
  const fijos = scene.paneles.filter((p) => p.nombre === 'entrepano_fijo').sort((a, b) => a.z - b.z);
  const moviles = scene.paneles.filter((p) => p.nombre === 'entrepano').sort((a, b) => a.z - b.z);
  assert.equal(moviles.length, 3);
  assert.equal(moviles.filter((p) => p.z + p.h < fijos[0].z).length, 2);
  assert.equal(moviles.filter((p) => p.z > fijos[1].z + fijos[1].h).length, 1);
  assert.ok(moviles[1].z - moviles[0].z > moviles[0].h * 2,
    'los dos entrepaños inferiores deben quedar claramente distribuidos');
});

test('PCFD-MO calcula base_tapa y entrepano_fijo con el espesor real del fondo', () => {
  const sql = readFileSync('db/migrations/0223_pcfd_mo_ancho_con_fondo.sql', 'utf8');
  assert.match(sql, /p\.nombre in \('base_tapa', 'entrepano_fijo'\)/);
  assert.match(sql, /formula_ancho = 'P-0\.70866-TB'/);
  const { result } = calcularPcfdMo();
  for (const nombre of ['base_tapa', 'entrepano_fijo']) {
    const piezaCalculada = result.piezas.find((p) => p.pieza === nombre);
    assert.ok(piezaCalculada);
    assert.ok(Math.abs(piezaCalculada.anchoIn * 25.4 - 585.6) < 0.1, nombre);
  }
});
