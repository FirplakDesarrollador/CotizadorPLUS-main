// Qué monedas muestra el encabezado del proyecto.
//
// Hay dos controles y significan cosas distintas: las casillas de columna eligen
// **qué monedas se ven**, y la moneda del proyecto decide **cuál manda** cuando se
// ven las dos. Vive aparte del componente para poder probarlo.

export type MonedaProyecto = 'USD' | 'COP';
export type ColumnasMoneda = { usd: boolean; cop: boolean };

/**
 * Monedas a mostrar, en orden: la primera es la cifra grande.
 *
 * - Solo una casilla marcada → solo esa moneda. Marcar únicamente pesos y seguir
 *   viendo dólares sería contradecir lo que se pidió.
 * - Las dos marcadas → primero la del proyecto, que es en la que se cotiza, y la
 *   otra debajo como referencia.
 * - Ninguna marcada no deberían permitirlo las casillas; por si acaso, se cae a la
 *   moneda del proyecto en vez de dejar el encabezado en blanco.
 */
export function monedasVisibles(columnas: ColumnasMoneda, moneda: MonedaProyecto): MonedaProyecto[] {
  const otra: MonedaProyecto = moneda === 'COP' ? 'USD' : 'COP';
  if (columnas.usd && columnas.cop) return [moneda, otra];
  if (columnas.usd) return ['USD'];
  if (columnas.cop) return ['COP'];
  return [moneda];
}
