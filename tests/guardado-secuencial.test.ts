import assert from 'node:assert/strict';
import test from 'node:test';
import { crearGuardadoSecuencial } from '../src/lib/guardado-secuencial';

test('los cambios rápidos de caja, fondo y frente se guardan en orden y prevalece el último', async () => {
  let liberar!: () => void;
  const espera = new Promise<void>(resolve => { liberar = resolve; });
  const guardados: string[] = [];
  const guardar = crearGuardadoSecuencial<{ frente: string }>(async v => {
    if (!guardados.length) await espera;
    guardados.push(v.frente);
  });
  const primero = guardar({ frente: 'RH' });
  const datos = { frente: 'STANDARD' };
  const ultimo = guardar(datos);
  datos.frente = 'MUTACION EXTERNA';
  await Promise.resolve();
  assert.deepEqual(guardados, []);
  liberar();
  await Promise.all([primero, ultimo]);
  assert.deepEqual(guardados, ['RH', 'STANDARD']);
});

test('un fallo se comunica y no bloquea el siguiente guardado', async () => {
  const errores: Array<string | null> = [];
  const guardados: string[] = [];
  const guardar = crearGuardadoSecuencial<string>(async v => {
    if (v === 'error') throw new Error('No se pudo aplicar');
    guardados.push(v);
  }, (_, error) => errores.push(error));
  await assert.rejects(guardar('error'), /No se pudo aplicar/);
  await guardar('STANDARD');
  assert.ok(errores.includes('No se pudo aplicar'));
  assert.deepEqual(guardados, ['STANDARD']);
});
