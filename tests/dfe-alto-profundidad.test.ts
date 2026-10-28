import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { codigoComercial, incluyeAltoEnCodigo } from '@/lib/module-groups';

const migration = readFileSync('db/migrations/0226_dfe_alto_y_profundidad_codigo.sql', 'utf8');

test('la migración 0226 incluye alto y profundidad para líneas DFE y sincroniza grupos', () => {
  assert.match(migration, /upper\(t\.pref\) = 'DFE'/);
  assert.match(migration, /pg_temp\.cot_codigo_medida_dfe\(l\.alto/);
  assert.match(migration, /pg_temp\.cot_codigo_medida_dfe\(l\.prof/);
  assert.match(migration, /update public\.cot_grupos_modulos g/);
});

test('codigoComercial incluye alto y profundidad en DFE', () => {
  assert.equal(incluyeAltoEnCodigo('DFE'), true);

  // Caso exacto de cotización métrica en cm: 56 largo, 17 alto, 45 prof
  assert.equal(
    codigoComercial({
      pref: 'DFE',
      largo: 56,
      alto: 17,
      prof: 45,
      unidad: 'cm',
      sistema: 'metrico',
    }),
    'DFE561745'
  );

  // Caso métrico en mm: 520 mm = 52 cm, 200 mm = 20 cm, 520 mm = 52 cm
  assert.equal(
    codigoComercial({
      pref: 'DFE',
      largo: 520,
      alto: 200,
      prof: 520,
      unidad: 'mm',
      sistema: 'metrico',
    }),
    'DFE522052'
  );

  // Caso imperial en in: 24 largo, 8 alto, 18 prof
  assert.equal(
    codigoComercial({
      pref: 'DFE',
      largo: 24,
      alto: 8,
      prof: 18,
      unidad: 'in',
      sistema: 'imperial',
    }),
    'DFE24818'
  );
});
