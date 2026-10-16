// Números escritos en letras, para los documentos de cliente.
//
// En la propuesta el plazo se redacta "noventa (90) días": es la convención de
// los documentos comerciales en Colombia y evita que un dígito mal leído cambie
// el compromiso. Como el plazo se edita en la plantilla, el texto no puede ir
// escrito a mano.

const UNIDADES = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
  'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
  'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];

const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
];

/**
 * Un entero de 0 a 999 en letras. Fuera de ese rango devuelve el número tal cual:
 * un plazo de más de mil días no existe, y es mejor imprimir el dígito que una
 * frase inventada.
 */
export function numeroEnLetras(n: number): string {
  if (!Number.isFinite(n)) return '';
  const entero = Math.trunc(n);
  if (entero < 0 || entero > 999) return String(entero);
  if (entero < 30) return UNIDADES[entero];
  if (entero < 100) {
    const d = Math.floor(entero / 10);
    const u = entero % 10;
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
  }
  if (entero === 100) return 'cien';
  const c = Math.floor(entero / 100);
  const resto = entero % 100;
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${numeroEnLetras(resto)}`;
}

/** "noventa (90)", como se redacta en los documentos de cliente. */
export function enLetrasYCifra(n: number): string {
  const entero = Number.isFinite(n) ? Math.trunc(n) : 0;
  return `${numeroEnLetras(entero)} (${entero})`;
}
