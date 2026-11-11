import assert from 'node:assert/strict';
import test from 'node:test';
import { CAMPOS_PIPELINE, PRODUCTOS_PIPELINE, validarRegistroPipeline } from '../src/lib/pipeline-campos';

function formulario() {
  const f = new FormData();
  for (const c of CAMPOS_PIPELINE) {
    if (c.key === 'productos') { f.append(c.key, PRODUCTOS_PIPELINE[0]); f.append(c.key, PRODUCTOS_PIPELINE[1]); }
    else if (c.key === 'tipo_tablero') {
      f.set('tipo_tablero_0', c.opciones?.[0] ?? '');
      f.set('tipo_tablero_1', c.opciones?.[1] ?? '');
    } else f.set(c.key, c.opciones?.[0] ?? (c.tipo === 'url' ? 'https://example.com/plano' : c.tipo === 'date' ? '2026-12-31' : c.tipo === 'number' ? '150' : 'Dato QA'));
  }
  return f;
}

test('el registro admite campos vacíos y guarda tablero separado por producto', () => {
  const f = formulario();
  const result = validarRegistroPipeline(f);
  assert.equal(result.estado, 'borrador');
  assert.equal(result.productos, `${PRODUCTOS_PIPELINE[0]} | ${PRODUCTOS_PIPELINE[1]}`);
  assert.equal(result.tipo_tablero, JSON.stringify({ [PRODUCTOS_PIPELINE[0]]: 'CARB2', [PRODUCTOS_PIPELINE[1]]: 'RH' }));
  const empty = validarRegistroPipeline(new FormData());
  assert.equal(empty.cliente, null);
  assert.equal(empty.productos, null);
  assert.equal(empty.tarifa, null);
  assert.ok(!CAMPOS_PIPELINE.some(c => c.obligatorio));
});

test('mantiene validación de URL, fecha, opciones, productos y tarifa opcional', () => {
  for (const key of ['link_documentos', 'adjunto_url']) {
    const bad = formulario(); bad.set(key, 'javascript:alert(1)');
    assert.throws(() => validarRegistroPipeline(bad), /http/);
  }
  const badDate = formulario(); badDate.set('fecha_limite_envio', '2026-02-30');
  assert.throws(() => validarRegistroPipeline(badDate), /Fecha/);
  const badProduct = formulario(); badProduct.append('productos', 'Producto inexistente');
  assert.throws(() => validarRegistroPipeline(badProduct), /productos/i);
  const badBoard = formulario(); badBoard.set('tipo_tablero_0', 'No válido');
  assert.throws(() => validarRegistroPipeline(badBoard), /tablero/i);
  const badTarifa = formulario(); badTarifa.set('pais', 'USA'); badTarifa.set('tarifa', 'Infinity');
  assert.throws(() => validarRegistroPipeline(badTarifa), /Tarifa/);
  const negativeTarifa = formulario(); negativeTarifa.set('pais', 'USA'); negativeTarifa.set('tarifa', '-1');
  assert.throws(() => validarRegistroPipeline(negativeTarifa), /Tarifa/);
});

test('restringe zócalo a madera o PVC, elimina margen adicional y solo conserva tarifa para USA', () => {
  assert.deepEqual(CAMPOS_PIPELINE.find(c => c.key === 'tipo_zocalo')?.opciones, ['Zócalo de madera', 'Zócalo de PVC']);
  assert.ok(!CAMPOS_PIPELINE.some(c => c.key === 'margen_adicional'));
  assert.deepEqual(CAMPOS_PIPELINE.map(c => Number(c.label.match(/^(\d+)\./)?.[1])).filter(Number.isFinite), Array.from({ length: 25 }, (_, i) => i + 1));
  const f = formulario(); f.set('pais', 'Colombia'); f.set('tarifa', '150');
  assert.equal(validarRegistroPipeline(f).tarifa, null);
  f.set('pais', 'Estados Unidos');
  assert.equal(validarRegistroPipeline(f).tarifa, 150);
  f.set('pais', 'USA');
  assert.equal(validarRegistroPipeline(f).tarifa, 150);
});

test('solo persiste campos permitidos y limita longitud de ubicación', () => {
  const f = formulario(); f.set('creado_por', 'intruso'); f.set('cotizacion_id', 'otra'); f.set('origen_excel', '{}');
  const result = validarRegistroPipeline(f);
  assert.equal('cotizacion_id' in result, false);
  assert.equal('creado_por' in result, false);
  assert.equal('origen_excel' in result, false);
  const bad = formulario(); bad.set('pais', 'x'.repeat(101));
  assert.throws(() => validarRegistroPipeline(bad), /Ubicación/);
});
