import assert from 'node:assert/strict';
import test from 'node:test';
import { argumentosDashboard, desplazarDia, enlaceDashboard, escalaLineal, fechaBogota, filtrosDashboardExportacion, normalizarFiltrosDashboard, opcionesFiltro, puntosSerie, variacionPorcentual } from '../src/lib/dashboard-cotizaciones';

const ahora = new Date('2026-10-30T02:00:00Z'); // Aún es 29 de octubre en Bogotá.

test('los rangos rápidos usan Bogotá e incluyen el día completo, no el huso del servidor', () => {
  assert.equal(fechaBogota(ahora), '2026-10-29');
  const siete = normalizarFiltrosDashboard({ rango: '7' }, ahora);
  assert.equal(siete.desde, '2026-10-23');
  assert.equal(siete.hasta, '2026-10-29');
  assert.equal(argumentosDashboard(siete).p_hasta, '2026-10-30T00:00:00-05:00');
  const treinta = normalizarFiltrosDashboard({}, ahora);
  assert.equal(treinta.desde, '2026-09-30');
  assert.equal(normalizarFiltrosDashboard({ rango: 'anio' }, ahora).desde, '2026-01-01');
});

test('el rango personalizado valida fechas reales, año bisiesto y extremos invertidos', () => {
  assert.equal(desplazarDia('2024-02-28', 1), '2024-02-29');
  const invertido = normalizarFiltrosDashboard({ rango: 'personalizado', desde: '2026-10-20', hasta: '2026-10-01' }, ahora);
  assert.equal(invertido.desde, '2026-10-01');
  assert.equal(invertido.hasta, '2026-10-20');
  const invalido = normalizarFiltrosDashboard({ rango: 'personalizado', desde: '2026-02-30', hasta: 'no-fecha' }, ahora);
  assert.equal(invalido.desde, '2026-09-30');
  assert.equal(invalido.hasta, '2026-10-29');
});

test('todos los filtros combinados viajan al mismo RPC y se conservan en los enlaces de orden y página', () => {
  const f = normalizarFiltrosDashboard({ rango: 'anio', pais: '  México ', mes: '10', anio: '2026', cotizador: 'CEMA', estado: 'enviada', q: ' Torres 100% ', tamano: '50' }, ahora);
  assert.deepEqual(argumentosDashboard(f), { p_desde: '2026-01-01T00:00:00-05:00', p_hasta: '2026-10-30T00:00:00-05:00', p_pais: 'México', p_mes: 10, p_anio: 2026, p_empresa: 'CEMA', p_estado: 'enviada', p_busqueda: 'Torres 100%' });
  const url = new URL(enlaceDashboard(f, { pagina: 3, orden: 'cop', direccion: 'asc' }), 'https://cotizador.test');
  const regreso = normalizarFiltrosDashboard(Object.fromEntries(url.searchParams), ahora);
  assert.equal(regreso.pais, 'México');
  assert.equal(regreso.q, 'Torres 100%');
  assert.equal(regreso.pagina, 3);
  assert.equal(regreso.tamano, 50);
  assert.equal(regreso.orden, 'cop');
});

test('orden, paginación, empresa y fechas arbitrarias no se convierten en SQL ni en rangos ilimitados', () => {
  const f = normalizarFiltrosDashboard({ orden: 'nombre;drop table', pagina: '-20', tamano: '9999', cotizador: 'OTRA', mes: '13', anio: 'abc', direccion: 'invalid' }, ahora);
  assert.equal(f.orden, 'fecha'); assert.equal(f.pagina, 1); assert.equal(f.tamano, 25);
  assert.equal(f.cotizador, ''); assert.equal(f.mes, ''); assert.equal(f.anio, '');
  assert.equal(f.direccion, 'desc');
  assert.equal(argumentosDashboard(f).p_pais, null);
});

test('variación mensual distingue ausencia de base de un crecimiento de cero', () => {
  assert.equal(variacionPorcentual(15, 10), 50);
  assert.equal(variacionPorcentual(0, 10), -100);
  assert.equal(variacionPorcentual(0, 0), 0);
  assert.equal(variacionPorcentual(10, 0), null);
});

test('el CSV conserva las fechas visibles aunque se descargue al día siguiente', () => {
  const f = normalizarFiltrosDashboard({ rango: '7' }, ahora);
  const params = Object.fromEntries(new URL(enlaceDashboard(f), 'https://cotizador.test').searchParams);
  const exportacion = filtrosDashboardExportacion(params, new Date('2026-10-31T12:00:00Z'));
  assert.equal(exportacion.desde, f.desde);
  assert.equal(exportacion.hasta, f.hasta);
});

test('un enlace compartido a un país o año sin filas mantiene el filtro visible y no aparenta Todos', () => {
  const opciones = ['Colombia'];
  assert.deepEqual(opcionesFiltro(opciones, 'México'), ['Colombia', 'México']);
  assert.deepEqual(opcionesFiltro(opciones, 'Colombia'), ['Colombia']);
  assert.deepEqual(opcionesFiltro([], ''), []);
  assert.deepEqual(opciones, ['Colombia']);
});

test('escalas SVG admiten rangos invertidos, dominio constante, ceros y valores negativos', () => {
  assert.equal(escalaLineal([0, 100], [200, 0])(25), 150);
  assert.equal(escalaLineal([5, 5], [0, 100])(5), 50);
  assert.deepEqual(puntosSerie([]), []);
  const p = puntosSerie([0, -100, 200]);
  assert.equal(p[0].x, 48);
  assert.equal(p[2].x, 700);
  assert.equal(p[1].y, 188);
  assert.equal(p[2].y, 16);
  for (const punto of [...p, ...puntosSerie([0, 0])]) assert.ok(Number.isFinite(punto.x) && Number.isFinite(punto.y));
});
