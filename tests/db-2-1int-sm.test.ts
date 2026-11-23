import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { calcularMueble, evalExpr, REVEAL_IN } from '@/lib/engine';

const sql = readFileSync(new URL('../db/migrations/0188_db_2_1int_sm.sql', import.meta.url), 'utf8');
const cantoSql = readFileSync(new URL('../db/migrations/0189_db_2_1int_sm_canto_frentes.sql', import.meta.url), 'utf8');
const feSql = readFileSync(new URL('../db/migrations/0190_db_2_1int_sm_fe.sql', import.meta.url), 'utf8');
const feCajasSql = readFileSync(new URL('../db/migrations/0191_db_2_1int_sm_fe_cajas_pequenas.sql', import.meta.url), 'utf8');

test('DB-2-1INT-SM se deriva de DB-2S-SM con dos frentes y una gaveta interior', () => {
  assert.match(sql, /'DB-2-1INT-SM'/);
  assert.match(sql, /origen\.pref = 'DB-2S-SM'/);
  assert.match(sql, /when 'n_cajones' then '3'/);
  assert.match(sql, /when 'n_cajones_pequenos' then '2'/);
  assert.match(sql, /when 'n_cajones_ocultos' then '1'/);
  assert.match(sql, /when p\.nombre = 'refuerzo_delantero' then '1'/);
  assert.match(sql, /when p\.nombre = 'gola_madera' then '1'/);
});

test('DB-2-1INT-SM evita duplicar las plantillas de frente de DB-2S-SM', () => {
  assert.match(sql, /'frente','frente_gaveta_pequena','frente_gaveta_grande'/);
  assert.match(sql, /nombre='frente_gaveta_exterior'/);
  assert.match(sql, /nombre='frente_gaveta_interior'/);
});

test('las formulas reproducen la hoja DB22-2+INT SM en milimetros', () => {
  const vars = {
    L: 22,
    A: 30,
    P: 24,
    TC: 15 / 25.4,
    TB: 6 / 25.4,
    RV: REVEAL_IN,
    gola: 1,
    n_cajones: 3,
    n_cajones_pequenos: 2,
    n_cajones_ocultos: 1,
  };
  const mm = (formula: string) => Math.round(Number(evalExpr(formula, vars)) * 25.4 * 10) / 10;

  assert.equal(mm('L-2*TC'), 528.8);
  assert.equal(mm('P-0.70866-TB'), 585.6);
  assert.equal(mm('L-4.13386'), 453.8);
  assert.equal(mm('P-4.63'), 492);
  assert.equal(mm('L-4.607'), 441.8);
  assert.equal(mm('L-RV'), 555.6);
  assert.equal(mm('(A-(n_cajones-n_cajones_ocultos)*RV-gola*2.11024)/(n_cajones-n_cajones_ocultos)'), 351);
  assert.equal(mm('L-2*TC-RV'), 525.6);
  assert.equal(mm('A-0.07874'), 760);
  assert.equal(mm('L-0.62992'), 542.8);
});

test('los frentes exterior e interior activan el consumo de canto 22x1', () => {
  assert.match(cantoSql, /'frente_gaveta_exterior', 'frente_gaveta_interior'/);
  assert.match(cantoSql, /"calibre":"22x1"/);
  assert.match(cantoSql, /p\.cantos->>'largos'.*= 2/);
  assert.match(cantoSql, /p\.cantos->>'anchos'.*= 2/);
});

test('el resumen calcula 5,5376 m de canto 22x1 para DB22-2-1INT-SM', () => {
  const result = calcularMueble({
    dims: { L: 22, A: 30, P: 24 },
    piezas: [
      {
        nombre: 'frente_gaveta_exterior', rol_tablero: 'frente',
        formula_cantidad: '2', formula_largo: 'L-RV',
        formula_ancho: '(A-2*RV-2.11024)/2',
        cantos: { calibre: '22x1', largos: 2, anchos: 2 },
      },
      {
        nombre: 'frente_gaveta_interior', rol_tablero: 'frente',
        formula_cantidad: '1', formula_largo: 'L-2*TC-RV', formula_ancho: '100/25.4',
        cantos: { calibre: '22x1', largos: 2, anchos: 2 },
      },
    ],
    reglas: [],
    preset: { frente: 'F18' },
    tablerosByCode: { F18: { codigo: 'F18', precio_m2: 1, espesor_mm: 18 } },
    cantosByCalibre: { '22X1': { calibre: '22x1', precio: 1 } },
    herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0,
    usaCarton: false, margen: 0, trm: 1, desperdicio: 0,
    cantoFrentes: '22x1',
  });

  assert.deepEqual(result.cantoPorCalibre.map((canto) => canto.calibre), ['22x1']);
  assert.equal(result.cantoPorCalibre[0].metros, 5.5376);
});

test('DB-2-1INT-SM-FE usa dos cajas grandes, una interior pequeña y tres rieles FE', () => {
  assert.match(feSql, /'DB-2-1INT-SM-FE'/);
  assert.match(feSql, /'lateral_gaveta_grande','refuerzo','4'/);
  assert.match(feSql, /'lateral_gaveta_pequena','refuerzo','2'/);
  assert.match(feSql, /'base_gaveta','fondo','3','492\/25\.4'/);
  assert.match(feSql, /'n_cajones_ocultos','1'/);
  assert.match(feSql, /'n_barras','0'/);
  assert.match(feSql, /'riel','RIELFE500','riel_fe','n_cajones'/);
  assert.doesNotMatch(feSql, /\('(manija|bisagra)'/i);
});

test('DB-2-1INT-SM-FE corrige la superior exterior a caja pequeña sin cambiar su frente', () => {
  assert.match(feCajasSql, /when p\.nombre in \('lateral_gaveta_grande'\) then '2'/);
  assert.match(feCajasSql, /when p\.nombre in \('lateral_gaveta_pequena'\) then '4'/);
  assert.match(feCajasSql, /r\.variable='n_cajones_pequenos'/);
  assert.match(feCajasSql, /set valor='2'/);
  assert.doesNotMatch(feCajasSql, /frente_gaveta_exterior[\s\S]*formula_cantidad/);
});
