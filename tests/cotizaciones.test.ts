import assert from 'node:assert/strict';
import test from 'node:test';
import { resolverTipologiaFondo } from '../src/lib/sin-fondo';

test('Con fondo sustituye una variante SF por la tipología base devuelta', async () => {
  const llamadas: Array<{ nombre: string; argumentos: Record<string, unknown> }> = [];
  const cliente = { rpc: async (nombre: string, argumentos: Record<string, unknown>) => {
    llamadas.push({ nombre, argumentos });
    return { data: 'bfd-sm-id', error: null };
  } };
  const input = { tipoId: 'bfd-sm-sf-id', conFondo: true, cantidad: 1 };
  assert.deepEqual(await resolverTipologiaFondo(cliente, input), { ...input, tipoId: 'bfd-sm-id' });
  assert.deepEqual(llamadas, [{
    nombre: 'cot_resolver_tipologia_fondo',
    argumentos: { p_tipo_actual: 'bfd-sm-sf-id', p_con_fondo: true },
  }]);
});

test('Sin fondo sustituye el tipo fuente por la variante SF devuelta por Supabase', async () => {
  const llamadas: Array<{ nombre: string; argumentos: Record<string, unknown> }> = [];
  const cliente = {
    rpc: async (nombre: string, argumentos: Record<string, unknown>) => {
      llamadas.push({ nombre, argumentos });
      return { data: 'bfd-sm-sf-id', error: null };
    },
  };
  const input = { tipoId: 'bfd-sm-id', conFondo: false, cantidad: 2 };
  const result = await resolverTipologiaFondo(cliente, input);
  assert.deepEqual(llamadas, [{
    nombre: 'cot_resolver_tipologia_fondo',
    argumentos: { p_tipo_actual: 'bfd-sm-id', p_con_fondo: false },
  }]);
  assert.deepEqual(result, { ...input, tipoId: 'bfd-sm-sf-id' });
  assert.notEqual(result, input, 'la entrada del formulario no se muta');
});

test('un error al crear la variante SF impide guardar la línea original', async () => {
  const cliente = { rpc: async () => ({ data: null, error: { message: 'falló SF' } }) };
  await assert.rejects(
    resolverTipologiaFondo(cliente, { tipoId: 'bfd-id', conFondo: false }),
    /falló SF/,
  );
});
