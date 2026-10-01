import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calcularMueble, type Pieza, type Regla, type Tablero, type Canto, type CalcInput } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { inferirMontaje } from '../src/lib/visualizacion-config';

const data = JSON.parse(fs.readFileSync('tests/fixtures/catalogo-visualizacion.json', 'utf8')) as {
  tipos: { id: string; pref: string; permite_agrupacion: boolean }[];
  piezas: (Pieza & { tipo_mueble_id: string })[];
  reglas: Regla[];
  preset: Record<string, string>;
  tableros: Tablero[];
};

test('DB2-1OP despiece: 2 frentes exteriores, 1 frente interior de 100mm, 2 traseros de 68mm y 1 de 183mm', () => {
  const db = data.tipos.find((t) => t.pref === 'DB')!;
  const piezas = data.piezas.filter((p) => p.tipo_mueble_id === db.id);
  const reglas = data.reglas.filter((r) => !r.tipo_mueble_id || r.tipo_mueble_id === db.id);
  const tablerosByCode = Object.fromEntries(data.tableros.map((t) => [t.codigo, t]));

  const dims = { L: 30, A: 30, P: 24 };
  const overrides = { n_cajones: 3, n_barras: 1, n_cajones_pequenos: 0, n_cajones_ocultos: 1 };

  const calc = calcularMueble({
    dims,
    piezas,
    reglas,
    preset: data.preset,
    tablerosByCode,
    cantosByCalibre: new Proxy({}, { get: () => ({ calibre: '0.5', precio: 1000 }) }) as Record<string, Canto>,
    consumiblesBySelector: { tarugo: 50, soporte: 200, tornillo_ensamble: 30 },
    herrajesPlantilla: [],
    herrajesByCode: {},
    overrides,
    usaCarton: true,
    etiquetasUnd: 4,
    modoFrentes: 'normal',
    margen: 0,
    trm: 1,
    desperdicio: 0,
  });

  const pFrenteExt = calc.piezas.find((p) => p.pieza === 'frente_gaveta_exterior')!;
  const pFrenteInt = calc.piezas.find((p) => p.pieza === 'frente_gaveta_interior')!;
  const pFrenteGen = calc.piezas.find((p) => p.pieza === 'frente')!;
  const pTrasPeq = calc.piezas.find((p) => p.pieza === 'trasero_gaveta_pequena')!;
  const pTrasGrd = calc.piezas.find((p) => p.pieza === 'trasero_gaveta_grande')!;
  const pBaseGav = calc.piezas.find((p) => p.pieza === 'base_gaveta')!;

  // 2 frentes exteriores de fachada
  assert.equal(pFrenteExt.cant, 2, 'Debe generar exactamente 2 frentes exteriores');
  assert.ok(Math.abs(pFrenteExt.anchoIn - (30 - 2 * (3.2 / 25.4)) / 2) < 0.05, 'Cada frente exterior debe medir la mitad de la altura útil');

  // 1 frente interior de 100mm (3.937 in)
  assert.equal(pFrenteInt.cant, 1, 'Debe generar 1 frente interior');
  assert.ok(Math.abs(pFrenteInt.anchoIn - 100 / 25.4) < 0.01, 'El alto del frente interior debe ser 100 mm (3.937 in)');

  // Frentes genéricos apagados
  assert.equal(pFrenteGen.cant, 0, 'Frente genérico debe estar en 0');

  // Traseros: 2 de 68mm (superior exterior e interior) y 1 de 183mm (inferior grande)
  assert.equal(pTrasPeq.cant, 2, '2 traseros de 68mm');
  assert.equal(pTrasGrd.cant, 1, '1 trasero de 183mm');
  assert.equal(pBaseGav.cant, 3, '3 fondos de gaveta');
});

test('DB2-1OP visualización 3 vistas: 2 frentes en fachada, gaveta oculta en interior y 3 slots de gaveta', () => {
  const db = data.tipos.find((t) => t.pref === 'DB')!;
  const piezas = data.piezas.filter((p) => p.tipo_mueble_id === db.id).map((p) => ({ ...p, visualizacion: p.visualizacion ?? inferirMontaje(p) }));
  const reglas = data.reglas.filter((r) => !r.tipo_mueble_id || r.tipo_mueble_id === db.id);
  const tablerosByCode = Object.fromEntries(data.tableros.map((t) => [t.codigo, t]));

  const dims = { L: 30, A: 30, P: 24 };
  const overrides = { n_cajones: 3, n_barras: 1, n_cajones_pequenos: 0, n_cajones_ocultos: 1 };

  const calcInput: CalcInput = {
    dims,
    piezas,
    reglas,
    preset: data.preset,
    tablerosByCode,
    cantosByCalibre: new Proxy({}, { get: () => ({ calibre: '0.5', precio: 1000 }) }) as Record<string, Canto>,
    consumiblesBySelector: { tarugo: 50, soporte: 200, tornillo_ensamble: 30 },
    herrajesPlantilla: [],
    herrajesByCode: {},
    overrides,
    usaCarton: true,
    etiquetasUnd: 4,
    modoFrentes: 'normal',
    margen: 0,
    trm: 1,
    desperdicio: 0,
  };

  const member: PreparedGroupMember = {
    pref: 'DB',
    permiteAgrupacion: true,
    calc: calcInput,
  };

  const group = calcularGrupoFisico([member]);
  const scene = construirVisualizacion([member], group);

  // Paneles de frente exterior
  const extFronts = scene.paneles.filter((p) => p.funcion === 'frente_gaveta');
  assert.equal(extFronts.length, 2, 'Debe haber exactamente 2 frentes exteriores');
  assert.ok(extFronts.every((p) => p.y < 0), 'Los frentes exteriores deben estar en la fachada exterior (Y < 0)');

  // Panel de frente interior
  const intFronts = scene.paneles.filter((p) => p.funcion === 'frente_interior');
  assert.equal(intFronts.length, 1, 'Debe haber 1 frente interior');
  assert.ok(intFronts[0].y > 0, 'El frente interior debe estar dentro del mueble (Y > 0)');
  assert.ok(intFronts[0].cajon?.includes('int'), 'El frente interior debe pertenecer a la gaveta interna');

  // Slots de gaveta
  const cajones = [...new Set(scene.paneles.map((p) => p.cajon).filter(Boolean))];
  assert.equal(cajones.length, 3, 'Deben existir 3 grupos de cajón (2 exteriores + 1 interior)');
  assert.ok(cajones.some((c) => c!.includes('int')), 'Debe existir la clave de gaveta interna');

  // Coordenadas válidas
  for (const p of scene.paneles) {
    assert.ok([p.x, p.y, p.z, p.w, p.d, p.h].every(Number.isFinite), `${p.nombre} coordenadas finitas`);
  }
});
