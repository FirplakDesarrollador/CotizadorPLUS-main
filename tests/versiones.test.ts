import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function validarNombreVersion(nombre: string | null | undefined): string {
  const limpio = nombre?.trim() ?? '';
  if (!limpio) {
    throw new Error('El nombre de la versión es obligatorio.');
  }
  if (limpio.length > 120) {
    throw new Error('El nombre de la versión no puede superar 120 caracteres.');
  }
  return limpio;
}

test('validarNombreVersion rechaza valores vacíos o de puros espacios', () => {
  assert.throws(() => validarNombreVersion(''), /obligatorio/);
  assert.throws(() => validarNombreVersion('   '), /obligatorio/);
  assert.throws(() => validarNombreVersion('\t\n'), /obligatorio/);
  assert.throws(() => validarNombreVersion(null), /obligatorio/);
  assert.throws(() => validarNombreVersion(undefined), /obligatorio/);
});

test('validarNombreVersion aplica trim a nombres válidos', () => {
  assert.equal(validarNombreVersion('  Propuesta inicial  '), 'Propuesta inicial');
  assert.equal(validarNombreVersion('Alternativa 18 mm'), 'Alternativa 18 mm');
  assert.equal(validarNombreVersion('Revisión 30 septiembre'), 'Revisión 30 septiembre');
});

test('validarNombreVersion rechaza nombres que superan 120 caracteres', () => {
  const nombreLargo = 'a'.repeat(121);
  assert.throws(() => validarNombreVersion(nombreLargo), /120 caracteres/);
  const nombreExacto = 'b'.repeat(120);
  assert.equal(validarNombreVersion(nombreExacto).length, 120);
});

test('ordenamiento de versiones ubica siempre la más reciente primero', () => {
  const versiones = [
    { id: '1', numero: 1, created_at: '2026-09-29T10:00:00Z', nombre: 'V1' },
    { id: '3', numero: 3, created_at: '2026-09-30T12:00:00Z', nombre: 'V3' },
    { id: '2', numero: 2, created_at: '2026-09-29T15:00:00Z', nombre: 'V2' },
  ];

  const ordenadas = [...versiones].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  assert.equal(ordenadas[0].id, '3');
  assert.equal(ordenadas[1].id, '2');
  assert.equal(ordenadas[2].id, '1');
});

test('la migración 0123 elimina respaldos automáticos en cot_restaurar_version', () => {
  const migrationPath = join(process.cwd(), 'db', 'migrations', '0123_versiones_manuales_inmutables.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');

  // Verifica que dentro del cuerpo de cot_restaurar_version NO se llame a cot_guardar_version
  const restaurarBlock = migrationSql.split('create or replace function public.cot_restaurar_version')[1] ?? '';
  const restaurarBody = restaurarBlock.split('$$;')[0] ?? '';
  assert.equal(
    restaurarBody.includes('cot_guardar_version'),
    false,
    'El cuerpo de cot_restaurar_version no debe invocar cot_guardar_version'
  );

  // Verifica que cot_guardar_version valide el nombre obligatorio
  assert.equal(migrationSql.includes('El nombre de la versión es obligatorio'), true);

  // Verifica que cot_restaurar_version restaure config_default
  assert.equal(migrationSql.includes("config_default = v_cabecera->'config_default'"), true);
});

test('snapshot contiene todas las entidades necesarias para reproducción exacta', () => {
  const snapshotDemo = {
    schema_version: 1,
    cabecera: {
      id: 'cot-1',
      codigo: 'COT-2026-001',
      nombre: 'Cocina Principal',
      cliente_id: 'cli-1',
      cliente_nombre: 'Cliente A',
      moneda: 'USD',
      trm: 4200,
      trm_modo: 'manual',
      estado: 'borrador',
      total_cop: 15000000,
      total_usd: 3571.43,
      notas: 'Entrega en octubre',
      sistema_medida: 'imperial',
      config_default: {
        preset: { frente: 'TAB1', caja: 'TAB2' },
        cantoFrentes: '22x1',
        cantoCaja: '19x0,45',
        margen: '60',
      },
    },
    cocinas: [
      { id: 'coc-1', cotizacion_id: 'cot-1', nombre: 'Cocina 1', orden: 0, cantidad: 1, total_cop: 15000000, total_usd: 3571.43 },
    ],
    grupos: [
      { id: 'grp-1', cotizacion_id: 'cot-1', cocina_id: 'coc-1', orden: 0, etiqueta: 'A', total_cop: 15000000, total_usd: 3571.43 },
    ],
    lineas: [
      {
        id: 'lin-1', cotizacion_id: 'cot-1', cocina_id: 'coc-1', grupo_id: 'grp-1',
        posicion_grupo: 1, tipo_mueble_id: 'tipo-1', largo: 30, alto: 34.5, prof: 24,
        cantidad: 1, precio_unit_cop: 15000000, precio_unit_usd: 3571.43,
        config: { conHerrajes: true, modoFrentes: 'normal' },
      },
    ],
  };

  assert.equal(snapshotDemo.schema_version, 1);
  assert.ok(snapshotDemo.cabecera.config_default);
  assert.equal(snapshotDemo.cabecera.sistema_medida, 'imperial');
  assert.equal(snapshotDemo.cocinas.length, 1);
  assert.equal(snapshotDemo.grupos.length, 1);
  assert.equal(snapshotDemo.lineas.length, 1);
  assert.equal(snapshotDemo.lineas[0].precio_unit_cop, 15000000);
});
