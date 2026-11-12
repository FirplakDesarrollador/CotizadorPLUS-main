import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularValoresCotizacion } from '@/lib/valores-cotizacion';

test('calcula costos, precios, herrajes y multiplicador de sección para Valores', () => {
  const totals = calcularValoresCotizacion([{
    cantidad: 3,
    lineas: [{
      cantidad: 2, precio_unit_usd: 100, precio_total_cop: 840_000,
      costo_sin_herrajes_cop: 200_000, costo_herrajes_cop: 20_000, costo_total_cop: 220_000,
      breakdown: { precioUsd: 100, precioCop: 400_000, precioConHerrajesUsd: 110, precioConHerrajesCop: 440_000 },
    }],
  }], 4_000);
  assert.deepEqual(totals, {
    costoSinUsd: 300, costoSinCop: 1_200_000, costoConUsd: 330, costoConCop: 1_320_000,
    precioSinUsd: 600, precioSinCop: 2_400_000, precioConUsd: 660, precioConCop: 2_640_000,
  });
});
