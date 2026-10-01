#!/usr/bin/env python3
"""
Genera plantillas de `cot_piezas_plantilla` a partir de las hojas de ruta reales.

    python scripts/generar_tipologias.py "Hojas de ruta 2.xlsx" --out db/migrations/0029_tipologias_nuevas.sql
    python scripts/generar_tipologias.py "..." --familia CC --dry     # inspeccionar una familia

Método
------
Para cada familia de SKU se recupera el mueble (Largo/Ancho/Profundo) de cada hoja
por consenso (ver validar_hojas_ruta.py) y se traduce cada pieza al vocabulario de
la app:

  * la dimension de la pieza derivada del LARGO de la hoja  -> formula_largo
  * la derivada del ANCHO de la hoja                        -> formula_ancho
  * `Enchape lado largo` / `Enchape lado Ancho`             -> cantos.largos/anchos

Se conserva la orientacion de la hoja, de modo que los conteos de enchape siguen
apuntando al canto correcto. Los offsets en milimetros se reconocen y se expresan
de forma parametrica cuando corresponden a un espesor:

    L - 2*espesor_lateral  -> 'L-2*TC'
    L - 1*espesor_lateral  -> 'L-TC'
    P - 18mm - espesor_fondo -> 'P-0.70866-TB'
    factor ~ 1/n sobre L   -> '(L-n_puertas*RV)/n_puertas'

El resto queda como constante en pulgadas.

Cada plantilla generada se VALIDA volviendo a aplicarla sobre todas las hojas de
su familia; el reporte indica cuantas piezas reproduce dentro de 1 mm.
"""
import argparse
import collections
import re
import sys

sys.path.insert(0, __file__.rsplit('\\', 1)[0].rsplit('/', 1)[0])
from validar_hojas_ruta import cargar, estimar_dims, familia, parse_formula, REVEAL  # noqa: E402

IN = 25.4

# ---------------------------------------------------------------------------
# Catalogo curado de tipologias NUEVAS (pref -> nombre, categoria).
#
# Deliberadamente NO incluye:
#   * familias ya mapeadas en cot_tipos_mueble (se romperia su plantilla curada,
#     que lleva herrajes, tarugos y modo_agrupacion que las hojas no traen);
#   * prefijos `O…`  -> son el mismo mueble sin puertas: modoFrentes='sin_frentes';
#   * sufijos `…R`   -> variante removible: modificador `removible`;
#   * `WSM`/`…SM`    -> variante de gola: modificador `gola`;
#   * prefijos `I…`  -> nomenclatura metrica de un tipo existente: pref_metrico.
# ---------------------------------------------------------------------------
CATALOGO = {
    # Linea U (vanities y bases) — completa lo que ya existe como UB/UBFD/UDV/UW
    'USVFD': ('Mueble inferior lavamanos puertas (línea U)', 'vanity'),
    'UV':    ('Mueble inferior baño 1 cajón 1 puerta (línea U)', 'vanity'),
    'UVFD':  ('Mueble inferior baño puertas (línea U)', 'vanity'),
    'UDB':   ('Mueble inferior cajonera (línea U)', 'inferior'),

    # Superiores especiales
    'S':     ('Mueble superior de cocina', 'superior'),
    'SA':    ('Mueble superior alto de cocina', 'superior'),
    'SLOC':  ('Mueble superior locero', 'superior'),
    'SMO':   ('Mueble superior abierto para microondas', 'superior'),
    'SBAS':  ('Mueble superior de puerta basculante', 'superior'),
    'WLD':   ('Mueble superior con luz', 'superior'),
    'WER':   ('Mueble superior esquinero', 'superior'),
    'WPC':   ('Alacena superior de cocina', 'superior'),

    # Hornos y microondas
    'BOV':   ('Mueble inferior para horno', 'inferior'),
    'BMW':   ('Mueble inferior para microondas', 'inferior'),

    # Modulos de cajon
    'POD':   ('Módulo de cajón', 'inferior'),
    'DD':    ('Cajón adicional', 'inferior'),
    'SDB':   ('Cajonera con panel removible', 'inferior'),

    # Alacenas y esquineros
    'AL':    ('Alacena de cocina', 'inferior'),
    'BLS':   ('Mueble inferior esquinero giratorio (Lazy Susan)', 'inferior'),

    # Linea de closets
    'CC':    ('Módulo de clóset', 'closet'),
    'WCC':   ('Módulo de clóset con división', 'closet'),
    'CLV':   ('Clóset vertical', 'closet'),
    'DFE':   ('Gavetero de clóset', 'closet'),

    # Piezas sueltas y kits
    'PL':    ('Panel suelto', 'panel'),
    'FL':    ('Relleno (filler) suelto', 'filler'),
    'KF':    ('Kit de frentes', 'kit'),
    'KD':    ('Kit de cajones', 'kit'),
    'BT':    ('Base y tapa sueltas', 'pieza'),
    'DF':    ('Frente de gaveta suelto', 'pieza'),
    'E':     ('Entrepaño suelto', 'pieza'),
    'SC':    ('Panel de clóset sin perforar', 'closet'),
}

# Alias metrico -> prefijo imperial ya existente (llena pref_metrico, no crea tipo).
ALIAS_METRICO = {
    'IP': 'BFD',
    'IC': 'DB',
    'ILVP': 'SBFD',
}


# --------------------------------------------------------------------------
# Normalizacion de nombres de pieza -> nombre canonico + rol de tablero
# --------------------------------------------------------------------------
CANON = [
    (r'\bBLIND\s*DOOR\b',                 'puerta_ciega',      'frente'),
    (r'\bDOOR\b|\bPUERTA\b',              'frente',            'frente'),
    (r'FRENTE\s*GAV|FRENTE\s*CAJ',        'frente_gaveta',     'frente'),
    (r'\bFRENTE\b',                       'frente',            'frente'),
    (r'BACKING|\bFONDO\b(?!\s*GAV)',      'fondo',             'fondo'),
    (r'FONDO\s*GAV|BASE\s*GAVETA',        'base_gaveta',       'refuerzo'),
    (r'TRAS(ERO)?\s*(CAJON|GAVETA)',      'trasero_gaveta',    'refuerzo'),
    (r'LAT(ERAL)?\s*(DE|IZ)?.*CAJ',       'lateral_gaveta',    'refuerzo'),
    (r'\bSIDE\b|\bLAT\b|LATERAL',         'lateral',           'caja'),
    (r'\bBASE\b',                         'base',              'caja'),
    (r'\bTAPA\b|\bTOP\b',                 'tapa',              'caja'),
    (r'RAIL\s*TRAS|REF\s*TRAS|REAR\s*RAIL', 'refuerzo_trasero', 'refuerzo'),
    (r'RAIL\s*DEL|REF\s*DEL|RAIL\b',      'refuerzo_delantero', 'refuerzo'),
    (r'SHELF|ENTREPA|SHEFL',              'entrepano',         'refuerzo'),
    (r'DIVISION|DIVISOR',                 'division',          'caja'),
    (r'\bGOLA\b',                         'gola_perfil',       'caja'),
    (r'ZOCALO|TOE\s*KICK|\bTK\b',         'zocalo',            'caja'),
    (r'BARRA|\bBC\b|COLGAR',              'barra_colgar',      'refuerzo'),
    (r'PANEL',                            'panel',             'frente'),
]


def canon(nombre, espesor):
    n = re.sub(r'\s+', ' ', (nombre or '').strip().upper())
    for pat, canonico, rol in CANON:
        if re.search(pat, n):
            # el espesor manda para el fondo
            if espesor and espesor <= 9 and canonico not in ('fondo',):
                return canonico, 'fondo'
            return canonico, rol
    if espesor and espesor <= 9:
        return 'fondo', 'fondo'
    return re.sub(r'[^A-Z0-9]+', '_', n).strip('_').lower()[:40] or 'pieza', 'caja'


# --------------------------------------------------------------------------
# Traduccion de un termino del DSL a formula de la app
# --------------------------------------------------------------------------
def termino_a_formula(src, kind, val, esp_caja, esp_fondo, n_puertas):
    """src en {L,A,P}; kind en {off,fac}. Devuelve la expresion de la app."""
    if kind == 'fac':
        if src == 'L' and n_puertas and abs(val - 1.0 / n_puertas) < 0.01:
            return '(L-n_puertas*RV)/n_puertas'
        return '%s*%.5f' % (src, val)

    off = -val  # val viene negativo en los descuentos
    if abs(off) < 0.05:
        return src
    if esp_caja:
        for k, expr in ((2, '%s-2*TC' % src), (1, '%s-TC' % src)):
            if abs(off - k * esp_caja) < 0.6:
                return expr
    if src == 'P' and esp_fondo and abs(off - (18 + esp_fondo)) < 0.6:
        return 'P-0.70866-TB'
    if abs(off - REVEAL) < 0.15:
        return '%s-RV' % src
    # Un offset negativo (la pieza es MAYOR que la dimension nominal) no puede
    # emitirse como '%s-%.5f': daria 'A--0.62402', que Python evalua bien pero
    # el motor de la app rechaza — en JavaScript '--' es el operador decremento
    # y lanza SyntaxError. Se emite el signo por separado.
    if off < 0:
        return '%s+%.5f' % (src, -off / IN)
    return '%s-%.5f' % (src, off / IN)


def piezas_de_hoja(piezas, dims, esp_caja, esp_fondo, n_puertas):
    """-> lista de (nombre_canonico, rol, formula_largo, formula_ancho, cantos_l, cantos_a, espesor)"""
    out = []
    for r in piezas:
        terms = parse_formula(r['formula'])
        fl = fa = None
        for dest, src, kind, val in terms:
            expr = termino_a_formula(src, kind, val, esp_caja, esp_fondo, n_puertas)
            if dest == 'L' and fl is None:
                fl = expr
            elif dest == 'A' and fa is None:
                fa = expr
        if fl is None and r['largo']:
            fl = '%.5f' % (r['largo'] / IN)
        if fa is None and r['ancho']:
            fa = '%.5f' % (r['ancho'] / IN)
        if fl is None or fa is None:
            continue
        nom, rol = canon(r['pieza'], r['esp'])
        out.append((nom, rol, fl, fa, r.get('cl', 0), r.get('ca', 0), r['esp']))
    return out


def esp_dominante(piezas, roles):
    c = collections.Counter()
    for r in piezas:
        nom, rol = canon(r['pieza'], r['esp'])
        if rol in roles and r['esp']:
            c[r['esp']] += 1
    return c.most_common(1)[0][0] if c else None


def analizar_familia(skus, by):
    """-> (plantilla, stats). plantilla: lista de dicts listos para SQL."""
    firmas = collections.Counter()      # (nombre,rol,fl,fa) -> veces que aparece la pieza
    hojas_con = collections.Counter()   # en cuantas hojas aparece
    cantos = {}
    espesores = {}
    n_hojas = 0
    for sku in skus:
        piezas = by[sku]
        dims, _ = estimar_dims(piezas)
        if not dims.get('L'):
            continue
        n_hojas += 1
        ec = esp_dominante(piezas, {'caja'})
        ef = esp_dominante(piezas, {'fondo'})
        npu = sum(1 for r in piezas if re.search(r'\bDOOR\b|\bPUERTA\b', r['pieza'].upper())
                  and 'BLIND' not in r['pieza'].upper())
        npu = npu if npu in (1, 2) else 0
        vistos = collections.Counter()
        for nom, rol, fl, fa, cl, ca, esp in piezas_de_hoja(piezas, dims, ec, ef, npu):
            vistos[(nom, rol, fl, fa)] += 1
            cantos[(nom, rol, fl, fa)] = (cl, ca)
            espesores[(nom, rol, fl, fa)] = esp
        for k, v in vistos.items():
            firmas[k] += v
            hojas_con[k] += 1

    if not n_hojas:
        return [], {'hojas': 0}

    plantilla = []
    for (nom, rol, fl, fa), total in firmas.most_common():
        presencia = hojas_con[(nom, rol, fl, fa)] / n_hojas
        if presencia < 0.5:          # pieza minoritaria: no entra en la plantilla base
            continue
        cant = max(1, round(total / hojas_con[(nom, rol, fl, fa)]))
        cl, ca = cantos[(nom, rol, fl, fa)]
        # El perfil de gola solo existe en la variante con gola.
        cantidad = ('gola*%d' % cant) if nom == 'gola_perfil' else str(cant)
        plantilla.append(dict(nombre=nom, rol=rol, cantidad=cantidad,
                              largo=fl, ancho=fa, cl=cl, ca=ca,
                              esp=espesores[(nom, rol, fl, fa)],
                              presencia=presencia))
    # fusiona piezas con el mismo nombre canonico y formulas iguales
    return plantilla, {'hojas': n_hojas}


def validar(plantilla, skus, by):
    """Reaplica la plantilla sobre las hojas y cuenta aciertos dentro de 1mm."""
    ok = tot = 0
    for sku in skus:
        piezas = by[sku]
        dims, _ = estimar_dims(piezas)
        if not dims.get('L'):
            continue
        ec = esp_dominante(piezas, {'caja'}) or 15
        ef = esp_dominante(piezas, {'fondo'}) or 6
        npu = sum(1 for r in piezas if re.search(r'\bDOOR\b|\bPUERTA\b', r['pieza'].upper()))
        ctx = {'L': dims['L'] / IN, 'A': dims.get('A', 0) / IN, 'P': dims.get('P', 0) / IN,
               'TC': ec / IN, 'TB': ef / IN, 'RV': REVEAL / IN,
               'n_puertas': npu if npu in (1, 2) else 1}
        reales = collections.Counter()
        for r in piezas:
            nom, _ = canon(r['pieza'], r['esp'])
            if r['largo'] and r['ancho']:
                reales[(nom, round(r['largo'], 1), round(r['ancho'], 1))] += 1
        for p in plantilla:
            try:
                lg = eval(p['largo'], {'__builtins__': {}}, ctx) * IN     # noqa: S307
                an = eval(p['ancho'], {'__builtins__': {}}, ctx) * IN     # noqa: S307
            except Exception:
                continue
            tot += 1
            if any(k[0] == p['nombre'] and abs(k[1] - lg) < 1 and abs(k[2] - an) < 1
                   for k in reales):
                ok += 1
    return ok, tot


def sql_familia(pref, nombre, categoria, plantilla, stats, aciertos):
    ok, tot = aciertos
    pct = (100.0 * ok / tot) if tot else 0
    L = []
    L.append('-- %s' % ('-' * 74))
    L.append("-- %s — %s" % (pref, nombre))
    L.append('-- Derivado de %d hojas de ruta. La plantilla reproduce %d/%d piezas (%.0f%%) dentro de 1mm.'
             % (stats['hojas'], ok, tot, pct))
    L.append('-- %s' % ('-' * 74))
    L.append("insert into public.cot_tipos_mueble (pref, nombre_es, nombre_en, categoria, margen_key, familia_code)")
    L.append("values ('%s', '%s', '%s', '%s', 'muebles', null)"
             % (pref, nombre.replace("'", "''"), nombre.replace("'", "''"), categoria))
    L.append("on conflict (pref) do update set nombre_es=excluded.nombre_es, updated_at=now();")
    L.append('')
    L.append("delete from public.cot_piezas_plantilla")
    L.append(" where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = '%s');" % pref)
    L.append('')
    L.append("insert into public.cot_piezas_plantilla")
    L.append("  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)")
    L.append("select id, v.* from public.cot_tipos_mueble,")
    L.append("  (values")
    filas = []
    for i, p in enumerate(plantilla):
        cal = '22x1' if p['rol'] == 'frente' else '19x0,45'
        # Aristas enchapadas tomadas de la hoja de ruta, no asumidas.
        cantos = '{"calibre":"%s","largos":%d,"anchos":%d}' % (cal, p['cl'], p['ca'])
        filas.append("    ('%s','%s','%s','%s','%s','%s'::jsonb,%d)"
                     % (p['nombre'], p['rol'], p['cantidad'], p['largo'], p['ancho'], cantos, (i + 1) * 10))
    L.append(',\n'.join(filas))
    L.append("  ) as v(nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)")
    L.append("where pref = '%s';" % pref)
    L.append('')
    return '\n'.join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx')
    ap.add_argument('--familia')
    ap.add_argument('--out')
    ap.add_argument('--min-skus', type=int, default=2)
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    _, by = cargar(a.xlsx)
    porfam = collections.defaultdict(list)
    for s in by:
        porfam[familia(s)].append(s)

    objetivo = [a.familia.upper()] if a.familia else sorted(CATALOGO)

    bloques, resumen = [], []
    for f in objetivo:
        skus = porfam.get(f, [])
        if not skus:
            continue
        plantilla, stats = analizar_familia(skus, by)
        if not plantilla:
            continue
        ok, tot = validar(plantilla, skus, by)
        resumen.append((f, len(skus), len(plantilla), ok, tot))
        if a.dry:
            print('=== %s (%d SKUs, %d hojas) — %d/%d piezas OK ===' % (f, len(skus), stats['hojas'], ok, tot))
            for p in plantilla:
                print('   %-20s %-8s x%-6s L=%-24s A=%-24s  (%.0f%% hojas)'
                      % (p['nombre'], p['rol'], p['cantidad'], p['largo'], p['ancho'], p['presencia'] * 100))
            print()
        else:
            nombre, categoria = CATALOGO.get(f, ('Mueble %s' % f, 'inferior'))
            bloques.append(sql_familia(f, nombre, categoria, plantilla, stats, (ok, tot)))

    print('%-10s %6s %6s %10s' % ('familia', 'SKUs', 'piezas', 'validado'))
    for f, ns, np_, ok, tot in sorted(resumen, key=lambda x: -x[1]):
        pct = (100.0 * ok / tot) if tot else 0
        print('%-10s %6d %6d %6d/%-4d %3.0f%%' % (f, ns, np_, ok, tot, pct))

    if a.out and bloques:
        cabecera = [
            '-- ' + '=' * 74,
            '-- Cotizador PLUS — tipologías derivadas de las hojas de ruta de producción',
            '--',
            '-- GENERADO por scripts/generar_tipologias.py a partir de "Hojas de ruta 2.xlsx".',
            '-- No editar a mano: volver a generar. Ver WikiLLM/wiki/validacion_hojas_de_ruta.md.',
            '--',
            '-- Cada bloque indica qué porcentaje del despiece real reproduce la plantilla',
            '-- dentro de 1 mm. Las plantillas NO traen herrajes, tarugos ni soportes: eso',
            '-- se completa a mano por familia (las hojas de ruta no los modelan como pieza).',
            '--',
            '-- Requiere 0028_geometria_espesor_reveal.sql (variables RV/TC/TB en el motor).',
            '-- ' + '=' * 74,
            '',
        ]
        alias = ['-- ' + '-' * 74,
                 '-- Alias métricos: `I…` es la nomenclatura métrica de un tipo ya existente,',
                 '-- no una tipología nueva. Se registra como pref_metrico.',
                 '-- ' + '-' * 74]
        for metrico, imperial in sorted(ALIAS_METRICO.items()):
            alias.append("update public.cot_tipos_mueble set pref_metrico = '%s' where pref = '%s';"
                         % (metrico, imperial))
        alias.append('')
        with open(a.out, 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(cabecera) + '\n'.join(alias) + '\n' + '\n'.join(bloques))
        print('\n-> %s (%d familias)' % (a.out, len(bloques)))


if __name__ == '__main__':
    sys.exit(main())
