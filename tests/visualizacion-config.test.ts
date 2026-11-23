import assert from 'node:assert/strict';
import test from 'node:test';
import { validarMontaje } from '../src/lib/visualizacion-config';

test('acepta el recorte frontal superior parametrizado para mecanizados', () => {
  const config = validarMontaje({
    version: 1,
    funcion: 'lateral',
    plano: 'YZ',
    confirmado: true,
    recorte: {
      borde: 'frontal_superior',
      profundidad: '27',
      alto: '73',
    },
  });

  assert.deepEqual(config?.recorte, {
    borde: 'frontal_superior',
    profundidad: '27',
    alto: '73',
  });
});

test('acepta dos recortes frontales con un segundo nivel de gaveta', () => {
  const config = validarMontaje({
    recortes: [
      { borde: 'frontal_superior', profundidad: '27', alto: '73' },
      { borde: 'frontal_nivel_gaveta', profundidad: '27', alto: '73' },
    ],
  });
  assert.equal(config?.recortes?.length, 2);
  assert.equal(config?.recortes?.[1].borde, 'frontal_nivel_gaveta');
});

test('rechaza bordes y campos de recorte no soportados', () => {
  assert.throws(() => validarMontaje({
    recorte: { borde: 'trasero_superior', profundidad: '27', alto: '73' },
  }), /Borde de recorte no soportado/);
  assert.throws(() => validarMontaje({
    recorte: { borde: 'frontal_superior', profundidad: '27', alto: '73', radio: '3' },
  }), /Campo de recorte desconocido/);
});

test('rechaza fórmulas inseguras o incompletas en el recorte', () => {
  assert.throws(() => validarMontaje({
    recorte: { borde: 'frontal_superior', profundidad: 'alert(1)', alto: '73' },
  }), /Fórmula profundidad de recorte inválida/);
  assert.throws(() => validarMontaje({
    recorte: { borde: 'frontal_superior', profundidad: '27' },
  }), /Fórmula alto de recorte inválida/);
});
