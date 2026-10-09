import assert from 'node:assert/strict';
import test from 'node:test';
import { ajustarPiezasSinFondo, ALTO_INFERIOR_IN, ALTO_LINEA_U_IN, altoPorDefectoIn, DB_TIPOLOGIAS, etiquetaTipologiaDb, PREFS_CON_TIPOLOGIA_DB, esElementoPlano, esMuebleSuperior, etiquetaDescripcion, familiaMaterialPorPrefijo } from '../src/lib/muebles';

// `muebles.ts` es el modulo de dominio compartido por formularios y motor. Las
// dos piezas que se prueban aqui deciden cosas con efecto en el precio, asi que
// conviene fijar sus bordes.

// ---------------------------------------------------------------------------
// esMuebleSuperior: manda la PRIMERA B o W del prefijo, leida de izquierda a
// derecha, con TW como excepcion explicita.
// ---------------------------------------------------------------------------

test('esMuebleSuperior: la primera B o W decide, no la presencia de la letra', () => {
  // W antes que B -> superior.
  assert.equal(esMuebleSuperior('W'), true);
  assert.equal(esMuebleSuperior('WBL'), true, 'WBL lleva ambas letras, pero la W va primero');
  assert.equal(esMuebleSuperior('WBL-D-L/R-SM'), true);
  // B antes que W -> inferior.
  assert.equal(esMuebleSuperior('BBL'), false);
  assert.equal(esMuebleSuperior('BW'), false, 'la B va primero aunque despues haya W');
  assert.equal(esMuebleSuperior('BBLFD-D-L/R-SM'), false);
});

test('esMuebleSuperior: TW y sus variantes son superiores por excepcion', () => {
  // Sin la excepcion, TW no tiene B y su W decidiria igual; lo que la regla
  // protege es que las variantes con guion no se escapen.
  assert.equal(esMuebleSuperior('TW'), true);
  assert.equal(esMuebleSuperior('TW-SM-PUSH'), true);
});

test('esMuebleSuperior: sin B ni W cae a inferior, que es el fallback compatible', () => {
  for (const pref of ['DB', 'V', 'PN', 'TK', 'F', 'SDB']) {
    assert.equal(esMuebleSuperior(pref), false, pref);
  }
});

test('esMuebleSuperior: tolera nulo, vacio y minusculas', () => {
  assert.equal(esMuebleSuperior(null), false);
  assert.equal(esMuebleSuperior(undefined), false);
  assert.equal(esMuebleSuperior(''), false);
  assert.equal(esMuebleSuperior('w-sm'), true, 'debe normalizar a mayusculas');
  assert.equal(esMuebleSuperior('bbl'), false);
});

test('familiaMaterialPorPrefijo es la misma decision, con otro nombre', () => {
  assert.equal(familiaMaterialPorPrefijo('W'), 'superior');
  assert.equal(familiaMaterialPorPrefijo('B'), 'inferior');
  assert.equal(familiaMaterialPorPrefijo(null), 'inferior');
});

// ---------------------------------------------------------------------------
// ajustarPiezasSinFondo: "Sin fondo" describe los modulos INFERIORES. Los
// superiores siempre llevan fondo, asi que elegirla no debe dejar un W sin
// respaldo: lo cotizaria de menos, y el tablero de fondo de superiores que el
// formulario sigue pidiendo no se consumiria.
//
// La regla vive aqui y no en `cotizar.ts` para poder probarla: aquel importa
// `server-only` y no se puede cargar desde un test.
// ---------------------------------------------------------------------------

const piezas = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P' },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB' },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992' },
];

const fondo = (r: typeof piezas) => r.find((p) => p.rol_tablero === 'fondo')!;
const base = (r: typeof piezas) => r.find((p) => p.nombre === 'base')!;

test('un mueble superior conserva su fondo aunque el proyecto sea "Sin fondo"', () => {
  const r = ajustarPiezasSinFondo(piezas, 'W', false);
  assert.equal(fondo(r).formula_cantidad, '1', 'el fondo de un W no debe anularse');
  assert.equal(base(r).formula_ancho, 'P-0.70866-TB', 'la base de un W tampoco se recalcula');
  assert.equal(r, piezas, 'si nada aplica se devuelve el mismo arreglo, sin copiar');
});

test('un modulo inferior si pierde el fondo con "Sin fondo"', () => {
  const r = ajustarPiezasSinFondo(piezas, 'B', false);
  assert.equal(fondo(r).formula_cantidad, '0', 'el fondo de un B queda en cantidad cero');
  assert.equal(base(r).formula_ancho, 'P-TC', 'y su base pasa a Profundidad menos un espesor de caja');
  assert.equal(r.find((p) => p.nombre === 'lateral')!.formula_ancho, 'P', 'el resto del despiece no se toca');
});

test('con "Con fondo" no se toca nada, sea superior o inferior', () => {
  for (const pref of ['B', 'W']) {
    const r = ajustarPiezasSinFondo(piezas, pref, true);
    assert.equal(fondo(r).formula_cantidad, '1', `${pref} conserva el fondo`);
    assert.equal(base(r).formula_ancho, 'P-0.70866-TB', `${pref} conserva su base`);
  }
});

test('conFondo sin definir se trata como "Con fondo"', () => {
  // El motor compara contra `false` explicitamente: una cotizacion antigua sin el
  // campo no debe perder su respaldo.
  assert.equal(ajustarPiezasSinFondo(piezas, 'B', undefined), piezas);
});

test('la regla de fondo usa el mismo criterio de superior que el reparto de materiales', () => {
  // Si la UI y el motor divergieran aqui, el formulario pediria un tablero que el
  // precio no consume, o al reves.
  for (const [pref, superior] of [['W', true], ['WBL', true], ['TW-SM-PUSH', true], ['B', false], ['BBL', false], ['DB', false]] as const) {
    const r = ajustarPiezasSinFondo(piezas, pref, false);
    assert.equal(fondo(r).formula_cantidad, superior ? '1' : '0', `fondo de ${pref}`);
    assert.equal(esMuebleSuperior(pref), superior, `clasificacion de ${pref}`);
  }
});

test('la base solo se recalcula sobre el eje donde aparece la profundidad', () => {
  // Hay plantillas cuya base lleva P en el largo y no en el ancho.
  const porLargo = [{ nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'P-0.9', formula_ancho: 'L-2*TC' }];
  const r = ajustarPiezasSinFondo(porLargo, 'B', false);
  assert.equal(r[0].formula_largo, 'P-TC');
  assert.equal(r[0].formula_ancho, 'L-2*TC', 'el otro eje se conserva');
});

test('una base sin P en ninguna formula se deja intacta', () => {
  const fija = [{ nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: '17.72441', formula_ancho: '19.15354' }];
  const r = ajustarPiezasSinFondo(fija, 'B', false);
  assert.equal(r[0].formula_largo, '17.72441');
  assert.equal(r[0].formula_ancho, '19.15354');
});

// ---------------------------------------------------------------------------
// etiquetaDescripcion: con que texto empieza `descripcion_es` de una linea.
// ---------------------------------------------------------------------------

test('etiquetaDescripcion: los elementos planos llevan su nombre de produccion', () => {
  // Las tres son la unica tipologia de su categoria (`filler`, `panel`,
  // `zocalo`) y produccion las lee escritas. Misma grafia para las tres:
  // mayusculas, sin parentesis ni acentos.
  const casos: [string, string][] = [
    ['F', 'FILLER'], ['PN', 'PANEL'], ['TK', 'TOEKICK'],
  ];
  for (const [pref, etiqueta] of casos) assert.equal(etiquetaDescripcion(pref), etiqueta, pref);
});

test('etiquetaDescripcion: resuelve igual el codigo completo que el prefijo base', () => {
  // `prefLabel` es el codigo completo al agregar la linea y el prefijo base tras
  // el primer recalculo; ambos deben dar lo mismo.
  assert.equal(etiquetaDescripcion('F636'), 'FILLER');
  assert.equal(etiquetaDescripcion('PN2486'), 'PANEL');
  assert.equal(etiquetaDescripcion('TK5 1/496'), 'TOEKICK', 'codigo con fraccion imperial');
  assert.equal(etiquetaDescripcion('f636'), 'FILLER', 'no debe depender de la caja');
});

test('etiquetaDescripcion: no arrastra otros prefijos que empiecen igual', () => {
  // Compara contra las letras iniciales completas, de modo que `FPK` no cae en
  // la regla de `F` ni `PCFD` en la de `PN`.
  for (const pref of ['FPK', 'FPK12', 'PC', 'PCFD12', 'TW', 'TW-SM-PUSH']) {
    assert.equal(etiquetaDescripcion(pref), pref, pref);
  }
});

test('etiquetaDescripcion: cualquier otro prefijo se devuelve tal cual', () => {
  for (const pref of ['B', 'B12', 'W2936-SM', 'DB18-1S', 'PCFD12-2OP-PUSH']) {
    assert.equal(etiquetaDescripcion(pref), pref, pref);
  }
});

test('esElementoPlano: solo F, PN y TK omiten los contadores', () => {
  // Son de una sola pieza: los `· N puerta(s)` y `· N entrepaño(s)` que
  // arrastraban venian de reglas globales y no significan nada para ellas.
  for (const pref of ['F', 'F636', 'PN', 'PN2486', 'TK', 'TK5 1/496', 'tk5']) {
    assert.equal(esElementoPlano(pref), true, pref);
  }
  for (const pref of ['B', 'B22', 'W2936-SM', 'DB18-1S', 'FPK', 'PCFD12', 'TW', null, undefined, '']) {
    assert.equal(esElementoPlano(pref), false, String(pref));
  }
});

test('etiquetaDescripcion: nulo, vacio y espacios dan cadena vacia', () => {
  // `construirFilaLinea` hace `.trim()` sobre el resultado, asi que una etiqueta
  // vacia no debe dejar un espacio al principio de la descripcion.
  assert.equal(etiquetaDescripcion(null), '');
  assert.equal(etiquetaDescripcion(undefined), '');
  assert.equal(etiquetaDescripcion(''), '');
  assert.equal(etiquetaDescripcion('   '), '');
});

// ---------------------------------------------------------------------------
// DB_TIPOLOGIAS: el numero de pares de barra estabilizadora. Es un dato de
// precio —cada barra es un herraje (`BARRAEST`)— y alimenta el override
// `n_barras` del motor, asi que conviene atarlo a la regla y no a un numero
// suelto en una tabla.
// ---------------------------------------------------------------------------

// Cantidad de traseros grande/pequeno que el catalogo da a cada configuracion
// (formulas de `trasero_gaveta_grande` y `_pequena` del tipo DB).
const cajonesGrandes = (nc: number, npeq: number) => (npeq > 0 ? nc - npeq : (nc === 4 ? 0 : nc));

test('DB_TIPOLOGIAS: las barras van en los cajones grandes', () => {
  // DB2-1OP queda fuera: lleva un cajon oculto y su conteo de barras no sigue
  // esta regla (tiene 1 donde la cuenta de grandes daria 3). Es una discrepancia
  // conocida, sin resolver, y no se asume aqui una respuesta.
  for (const t of DB_TIPOLOGIAS.filter((x) => x.noculto == null)) {
    assert.equal(t.nb, cajonesGrandes(t.nc, t.npeq),
      `${t.key}: ${t.nc} cajones, ${t.npeq} pequenos -> ${cajonesGrandes(t.nc, t.npeq)} pares de barra`);
  }
});

test('DB-3 lleva tres pares de barra, no cero', () => {
  // El caso concreto que estaba mal: tres cajones grandes y ninguna barra, de
  // modo que el selector decia "sin barras" y el modulo se cotizaba sin ellas.
  const db3 = DB_TIPOLOGIAS.find((t) => t.key === 'DB-3')!;
  assert.equal(db3.nc, 3);
  assert.equal(db3.npeq, 0, 'sus tres cajones son grandes');
  assert.equal(db3.nb, 3);
  assert.match(db3.desc, /3 pares de barra/);
});

test('DB-4 si va sin barras: sus cuatro cajones son pequenos', () => {
  const db4 = DB_TIPOLOGIAS.find((t) => t.key === 'DB-4')!;
  assert.equal(cajonesGrandes(db4.nc, db4.npeq), 0, 'el catalogo le da cuatro traseros pequenos');
  assert.equal(db4.nb, 0);
});

test('la descripcion de cada tipologia concuerda con su numero de barras', () => {
  for (const t of DB_TIPOLOGIAS) {
    if (t.nb === 0) { assert.match(t.desc, /sin barras/, t.key); continue; }
    const esperado = t.nb === 1 ? '1 par de barra' : `${t.nb} pares de barra`;
    assert.ok(t.desc.includes(esperado), `${t.key}: la descripcion deberia decir "${esperado}" y dice "${t.desc}"`);
  }
});

// ---------------------------------------------------------------------------
// altoPorDefectoIn: la linea U y la pareja Sink Vanity se arman a 28,75".
// ---------------------------------------------------------------------------

const LINEA_U = ['UB', 'UB-FE', 'UBFD', 'UDB', 'UDV', 'USVFD', 'UV', 'UVFD'];
const SINK_VANITY = ['SV', 'SVFD'];

test('altoPorDefectoIn: la linea U y Sink Vanity arrancan en 28,75 pulgadas', () => {
  // Se pasa la categoria real: los cuatro primeros son `inferior` y los demas
  // `vanity`. En ambos casos manda la lista, no la categoria.
  for (const pref of LINEA_U) assert.equal(altoPorDefectoIn(pref, 'inferior'), ALTO_LINEA_U_IN, pref);
  for (const pref of SINK_VANITY) assert.equal(altoPorDefectoIn(pref, 'vanity'), ALTO_LINEA_U_IN, pref);
  assert.equal(ALTO_LINEA_U_IN, 28.75);
});

test('altoPorDefectoIn: los demas inferiores arrancan en 30 pulgadas', () => {
  for (const pref of ['B', 'B-FE', 'BFD', 'BFD-SM', 'SBFD', 'DB', 'DB-2-SM', 'BBL', 'BLS', 'SDB', 'POD', 'DD']) {
    assert.equal(altoPorDefectoIn(pref, 'inferior'), ALTO_INFERIOR_IN, pref);
  }
  assert.equal(ALTO_INFERIOR_IN, 30);
});

test('altoPorDefectoIn: las torres no reciben 30 pulgadas aunque sean "inferior"', () => {
  // `AL`, `PC`, `PCFD` y `OVPC` estan en categoria `inferior` pero son alacenas
  // y torres: se arman a la altura de un mueble alto. Prefieren quedarse sin
  // valor por defecto a recibir uno equivocado.
  for (const pref of ['AL', 'PC', 'PCFD', 'OVPC']) {
    assert.equal(altoPorDefectoIn(pref, 'inferior'), null, pref);
  }
});

test('altoPorDefectoIn: la prioridad de la linea U va antes que la regla general', () => {
  // `UB` y `UDB` son de categoria `inferior`; si la regla general se evaluara
  // primero recibirian 30" en vez de 28,75".
  assert.equal(altoPorDefectoIn('UB', 'inferior'), 28.75);
  assert.equal(altoPorDefectoIn('UDB', 'inferior'), 28.75);
  assert.equal(altoPorDefectoIn('UBFD', 'inferior'), 28.75);
});

test('altoPorDefectoIn: superiores y demas categorias no reciben nada', () => {
  assert.equal(altoPorDefectoIn('W', 'superior'), null);
  assert.equal(altoPorDefectoIn('UW', 'superior'), null, 'empieza por U pero es superior');
  assert.equal(altoPorDefectoIn('F', 'filler'), null);
  assert.equal(altoPorDefectoIn('PN', 'panel'), null);
  assert.equal(altoPorDefectoIn('TK', 'zocalo'), null);
  assert.equal(altoPorDefectoIn('WCC', 'closet'), null);
  assert.equal(altoPorDefectoIn('KD', 'kit'), null);
});

test('altoPorDefectoIn: las vanities fuera de la linea U quedan sin valor', () => {
  // Deuda conocida: `V`, `DV`, `DVE`, `V-FE`, `VFD` y `VPC` son vanity y no se
  // nombraron al definir la regla, asi que no reciben alto por defecto.
  for (const pref of ['V', 'DV', 'DVE', 'V-FE', 'VFD', 'VPC']) {
    assert.equal(altoPorDefectoIn(pref, 'vanity'), null, pref);
  }
});

test('altoPorDefectoIn: sin categoria solo resuelve la lista de la linea U', () => {
  assert.equal(altoPorDefectoIn('UV'), ALTO_LINEA_U_IN);
  assert.equal(altoPorDefectoIn('B'), null, 'sin categoria no se puede saber que es inferior');
});

test('las conversiones que usa el formulario de cotizaciones son las de 28,75 in', () => {
  // AddLineForm escribe los valores por unidad a mano; aqui se fija que
  // correspondan al mismo alto.
  assert.ok(Math.abs(ALTO_LINEA_U_IN * 2.54 - 73.025) < 1e-9, 'cm');
  assert.ok(Math.abs(ALTO_LINEA_U_IN * 25.4 - 730.25) < 1e-9, 'mm');
});

// ---------------------------------------------------------------------------
// etiquetaTipologiaDb: el selector de tipologia lo comparten DB, UDB y UDV, y
// debe rotularse con el tipo elegido. La clave NO cambia: se persiste en
// `config.dbTipo` y de ella sale el sufijo del codigo comercial.
// ---------------------------------------------------------------------------

test('etiquetaTipologiaDb: un UDV ofrece UDV-1S, no DB-1S', () => {
  assert.equal(etiquetaTipologiaDb('DB-1S', 'UDV'), 'UDV-1S');
  assert.equal(etiquetaTipologiaDb('DB-2S', 'UDV'), 'UDV-2S');
  assert.equal(etiquetaTipologiaDb('DB-3', 'UDV'), 'UDV-3');
  assert.equal(etiquetaTipologiaDb('DB2-1OP', 'UDV'), 'UDV2-1OP', 'la clave sin guion tambien se adapta');
});

test('etiquetaTipologiaDb: cubre los tres tipos que comparten el selector', () => {
  // Si se anade uno a `PREFS_CON_TIPOLOGIA_DB`, su rotulo sale solo.
  for (const pref of PREFS_CON_TIPOLOGIA_DB) {
    for (const t of DB_TIPOLOGIAS) {
      const etiqueta = etiquetaTipologiaDb(t.key, pref);
      assert.ok(etiqueta.startsWith(pref), `${pref} / ${t.key} -> ${etiqueta}`);
    }
  }
});

test('etiquetaTipologiaDb: un DB se queda como estaba', () => {
  for (const t of DB_TIPOLOGIAS) assert.equal(etiquetaTipologiaDb(t.key, 'DB'), t.key, t.key);
});

test('etiquetaTipologiaDb: sin tipo elegido devuelve la clave intacta', () => {
  assert.equal(etiquetaTipologiaDb('DB-1S', null), 'DB-1S');
  assert.equal(etiquetaTipologiaDb('DB-1S', undefined), 'DB-1S');
  assert.equal(etiquetaTipologiaDb('DB-1S', ''), 'DB-1S');
});

test('etiquetaTipologiaDb: solo sustituye el DB inicial', () => {
  // No debe tocar un `DB` que aparezca mas adelante en la clave.
  assert.equal(etiquetaTipologiaDb('DB-DB', 'UDB'), 'UDB-DB');
  assert.equal(etiquetaTipologiaDb('udv', 'UDV'), 'udv', 'sin DB inicial no hay nada que sustituir');
});
