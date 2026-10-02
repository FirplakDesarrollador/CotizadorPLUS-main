import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMargenGlobalProyecto } from '../src/lib/module-groups';

test('margen global ponderado: un proyecto donde todos los módulos tienen el mismo margen da exactamente ese margen', () => {
  // Módulo 1 (cant 1): costo 40.000, precio 100.000 -> margen (100-40)/100 = 60%
  // Módulo 2 (cant 2): costo unit 40.000 (total 80.000), precio total 200.000 -> margen (200-80)/200 = 60%
  const cocinas = [
    {
      cantidad: 1,
      lineas: [
        { cantidad: 1, costo_total_cop: 40_000, precio_total_cop: 100_000 },
        { cantidad: 2, costo_total_cop: 40_000, precio_total_cop: 200_000 },
      ],
    },
  ];
  // Costo total = 120.000, Precio total = 300.000 -> margen = (300-120)/300 = 60%
  const margen = calcularMargenGlobalProyecto(cocinas, 300_000);
  assert.ok(margen.conHerrajes !== null);
  assert.equal(Math.round(margen.conHerrajes), 60);
});

test('margen global ponderado: módulos al 60% mezclados con paneles y fillers al 50% bajan el margen global', () => {
  // Mueble: costo 40.000, precio 100.000 (margen 60%)
  // Paneles y fillers: costo 50.000, precio 100.000 (margen 50%)
  const cocinas = [
    {
      cantidad: 1,
      lineas: [
        { cantidad: 1, costo_total_cop: 40_000, precio_total_cop: 100_000 }, // Mueble 60%
        { cantidad: 2, costo_total_cop: 50_000, precio_total_cop: 200_000 }, // Paneles/fillers 50%
      ],
    },
  ];
  // Costo total = 40.000 + 100.000 = 140.000
  // Precio total = 100.000 + 200.000 = 300.000
  // Margen global = (300.000 - 140.000) / 300.000 = 160.000 / 300.000 = 53.33%
  const margen = calcularMargenGlobalProyecto(cocinas, 300_000);
  assert.ok(margen.conHerrajes !== null);
  assert.ok(margen.conHerrajes < 60, 'El margen debe ser menor al 60% debido a paneles y fillers');
  assert.ok(margen.conHerrajes > 50, 'El margen debe ser mayor al 50%');
  assert.equal(margen.conHerrajes.toFixed(1), '53.3');
});

test('margen global ponderado: calcula con y sin herrajes para PB SHORE PRUEBA (55.9% s/H y 52.2% c/H)', () => {
  // Datos reales de tmp/pb-shore/cotizacion.json
  const totalCostoSin = 1352804.17;
  const totalCostoCon = 1789138.57;
  const totalPrecioSin = 3068428.34;
  const totalPrecioCon = 3739712.05;

  const cocinas = [
    {
      cantidad: 1,
      lineas: [
        {
          cantidad: 1,
          costo_sin_herrajes_cop: totalCostoSin,
          costo_total_cop: totalCostoCon,
          precio_total_cop: totalPrecioCon,
          breakdown: {
            precioCop: totalPrecioSin,
            precioConHerrajesCop: totalPrecioCon,
            costoSinHerrajes: totalCostoSin,
            costoConHerrajes: totalCostoCon,
          },
        },
      ],
    },
  ];
  const margen = calcularMargenGlobalProyecto(cocinas, totalPrecioCon);
  assert.ok(margen.sinHerrajes !== null);
  assert.ok(margen.conHerrajes !== null);
  assert.equal(margen.sinHerrajes.toFixed(1), '55.9');
  assert.equal(margen.conHerrajes.toFixed(1), '52.2');
});

test('margen global ponderado: maneja proyectos vacíos devolviendo null en ambos', () => {
  assert.deepEqual(calcularMargenGlobalProyecto([]), { sinHerrajes: null, conHerrajes: null });
  assert.deepEqual(calcularMargenGlobalProyecto([{ cantidad: 1, lineas: [] }]), { sinHerrajes: null, conHerrajes: null });
});

test('margen global ponderado: cuando todos los elementos (muebles, paneles, herrajes) están al 35%, ambos márgenes dan exactamente 35.0%', () => {
  // Mueble 1 con herrajes
  const costoMadera1 = 100_000;
  const costoH1 = 20_000;
  const precioSinH1 = costoMadera1 / (1 - 0.35);
  const precioH1 = costoH1 / (1 - 0.35);
  const precioConH1 = precioSinH1 + precioH1;

  // Panel (sin herrajes)
  const costoPanel = 50_000;
  const precioPanel = costoPanel / (1 - 0.35);

  const cocinas = [
    {
      cantidad: 1,
      lineas: [
        {
          cantidad: 1,
          costo_sin_herrajes_cop: costoMadera1,
          costo_herrajes_cop: costoH1,
          costo_total_cop: costoMadera1 + costoH1,
          precio_total_cop: precioConH1,
          breakdown: {
            precioCop: precioSinH1,
            precioConHerrajesCop: precioConH1,
            costoSinHerrajes: costoMadera1,
            costoConHerrajes: costoMadera1 + costoH1,
          },
        },
        {
          cantidad: 1,
          costo_sin_herrajes_cop: costoPanel,
          costo_herrajes_cop: 0,
          costo_total_cop: costoPanel,
          precio_total_cop: precioPanel,
          breakdown: {
            precioCop: precioPanel,
            precioConHerrajesCop: precioPanel,
            costoSinHerrajes: costoPanel,
            costoConHerrajes: costoPanel,
          },
        },
      ],
    },
  ];

  const totalCabecera = precioConH1 + precioPanel;
  const margen = calcularMargenGlobalProyecto(cocinas, totalCabecera);
  assert.ok(margen.sinHerrajes !== null);
  assert.ok(margen.conHerrajes !== null);
  assert.equal(margen.sinHerrajes.toFixed(1), '35.0');
  assert.equal(margen.conHerrajes.toFixed(1), '35.0');
});

