#!/usr/bin/env python3
"""
Validador sistematico de hojas de ruta de produccion (export SharePoint "Hojas de ruta").

Uso:
    python scripts/validar_hojas_ruta.py "Hojas de ruta 2.xlsx"          # resumen global
    python scripts/validar_hojas_ruta.py "..." --familia DB              # detalle de una familia
    python scripts/validar_hojas_ruta.py "..." --sku "DB30-2S"           # detalle de una hoja

Requiere openpyxl.

--------------------------------------------------------------------------------
DSL de la columna `Formula`
--------------------------------------------------------------------------------
Nomenclatura (antigua) del mueble:  L = Largo   A = Ancho   P = Profundo
La pieza solo tiene dos dimensiones: Largo y Ancho.

Cada token declara de CUAL de las tres dimensiones del MUEBLE proviene el Largo o
el Ancho de la PIEZA. La forma es `<pieza>x<mueble>{offset}<mueble>y<pieza>`: la
relacion se enuncia dos veces, de ida y de vuelta.

    LxL{-30}LyL     Largo(pieza)  <- Largo(mueble)    - 30 mm
    LxA{0}AyL       Largo(pieza)  <- Ancho(mueble)
    AxP{-24}PyA     Ancho(pieza)  <- Profundo(mueble) - 24 mm
    AxL[0,4958]LyA  Ancho(pieza)  <- Largo(mueble)    x 0,4958

`{}` = offset aditivo en mm, `[]` = factor multiplicativo, coma = separador decimal.

OJO — falso amigo con el cotizador: la app usa las mismas letras L/A/P pero expande
`A` como "Alto". Verificado sobre 419 hojas W/UW/OW contra las medidas codificadas
en el propio SKU, la correspondencia fisica es 1:1 y no hay que reordenar nada:

    L (Largo, hoja de ruta)    = L (Largo, app)          dimension horizontal
    A (Ancho, hoja de ruta)    = A (Alto, app)           dimension vertical
    P (Profundo, hoja de ruta) = P (Profundidad, app)    fondo

Es decir, cambia la palabra, no la dimension.

Como cada pieza aporta una ecuacion, el conjunto de piezas de una hoja esta
sobredeterminado: se puede recuperar el Largo/Ancho/Profundo del mueble por consenso y marcar como
sospechosa cualquier pieza que no concuerde. Esa es la base de las tres
validaciones que corre este script:

  1. coherencia interna  : todas las piezas deben apuntar al mismo L/A/P.
  2. cierre de frentes   : una pila de frentes de gaveta debe cubrir el Ancho
                           del mueble (la vertical) menos un reveal (3.2mm)
                           por frente.
  3. constante de caja   : el descuento interior debe ser Largo - 2*espesor_lateral.
"""
import argparse
import collections
import re
import sys

TOK = re.compile(r'(?P<dest>[LA])x(?P<src>[LAP])(?P<ob>[{\[])(?P<val>[+-]?[\d.,]+)(?P<cb>[}\]])')
TOK_DEG = re.compile(r'(?<![xyA-Z])(?P<dest>[LAP])(?P<ob>[{\[])(?P<val>[+-]?[\d.,]+)(?P<cb>[}\]])(?P=dest)')

REVEAL = 3.2  # separacion estandar entre frentes, mm


def _num(s):
    return float(s.strip().replace(',', '.'))


def parse_formula(f):
    """-> [(dest, src, kind, val)] con kind en {'off','fac'}"""
    out, seen = [], []
    for m in TOK.finditer(f or ''):
        out.append((m.group('dest'), m.group('src'),
                    'off' if m.group('ob') == '{' else 'fac', _num(m.group('val'))))
        seen.append(m.span())
    for m in TOK_DEG.finditer(f or ''):
        if any(a <= m.start() < b for a, b in seen):
            continue
        d = m.group('dest')
        out.append(('L' if d == 'L' else 'A', d,
                    'off' if m.group('ob') == '{' else 'fac', _num(m.group('val'))))
    return out


def _f(x):
    if x is None:
        return None
    s = str(x).strip().replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return None


def cargar(path):
    import openpyxl
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    it = ws.iter_rows(values_only=True)
    cab = [str(c or '').strip() for c in next(it)]
    idx = {n: i for i, n in enumerate(cab)}

    def get(row, n):
        return row[idx[n]] if n in idx and idx[n] < len(row) else None

    filas = []
    for row in it:
        filas.append(dict(
            sku=str(get(row, 'DESCRIPCION SKU') or '').strip(),
            letra=str(get(row, 'LETRA') or '').strip(),
            pieza=str(get(row, 'PIEZA') or '').strip(),
            largo=_f(get(row, 'LARGO')),
            ancho=_f(get(row, 'ANCHO')),
            esp=_f(get(row, 'Espesor')),
            formula=str(get(row, 'Formula') or '').strip(),
            creado=str(get(row, 'Created') or '')[:10],
            # aristas enchapadas: alimentan cantos.largos / cantos.anchos
            cl=int(_f(get(row, 'Enchape lado largo')) or 0),
            ca=int(_f(get(row, 'Enchape lado Ancho')) or 0),
        ))
    by = collections.OrderedDict()
    for r in filas:
        by.setdefault(r['sku'], []).append(r)
    return filas, by


def familia(sku):
    s = re.sub(r'^HRJ\s+', '', sku.strip(), flags=re.I)
    m = re.match(r'^([A-Za-z]{1,6})[\s\-]?\d', s) or re.match(r'^([A-Za-z]{1,6})\b', s)
    return m.group(1).upper() if m else '(sin codigo)'


def estimar_dims(piezas, tol=0.6):
    """Recupera Largo/Ancho/Profundo del mueble por consenso. -> (dims, conflictos)"""
    votos = collections.defaultdict(list)
    for r in piezas:
        for dest, src, kind, val in parse_formula(r['formula']):
            med = r['largo'] if dest == 'L' else r['ancho']
            if med is None:
                continue
            if kind == 'off':
                est = med - val
            else:
                est = med / val if val else None
            if est is None or not (0 < est <= 4000):
                continue
            votos[src].append((round(est, 2), r['pieza'], r['formula']))

    dims, conf = {}, {}
    for var, vs in votos.items():
        vals = [v[0] for v in vs]
        best, bestn = None, -1
        for cand in set(vals):
            n = sum(1 for v in vals if abs(v - cand) <= tol)
            if n > bestn:
                best, bestn = cand, n
        dims[var] = best
        fuera = [v for v in vs if abs(v[0] - best) > tol]
        if fuera:
            conf[var] = (best, bestn, len(vals), fuera)
    return dims, conf


def cierre_frentes(piezas, dims):
    """Una pila de frentes de gaveta debe cubrir el Ancho del mueble (la dimension
    vertical) menos un reveal por frente.
    -> (n, suma, esperado, dif) o None si no aplica."""
    A = dims.get('A')
    tiene_gavetas = any('GAVETA' in p['pieza'].upper() for p in piezas)
    if not A or not tiene_gavetas:
        return None
    fr = [r['largo'] for r in piezas
          if 'FRENTE' in r['pieza'].upper() and r['largo']]
    if not fr:
        return None
    suma = sum(fr)
    esperado = A - len(fr) * REVEAL
    return len(fr), suma, esperado, suma - esperado


def constante_caja(filas):
    """La constante interior debe ser Largo - 2*espesor_lateral."""
    agg = collections.defaultdict(collections.Counter)
    for r in filas:
        m = re.match(r'^LxL\{(-?[\d.,]+)\}LyL', r['formula'])
        p = r['pieza'].upper()
        if not m or not re.search(r'BASE|TAPA|RAIL|REF ', p):
            continue
        if re.search(r'GAVETA|CAJON', p):
            continue
        agg[r['esp']][_num(m.group(1))] += 1
    return agg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx')
    ap.add_argument('--familia')
    ap.add_argument('--sku')
    ap.add_argument('--tol', type=float, default=3.0,
                    help='mm a partir de los cuales se reporta (default 3)')
    a = ap.parse_args()

    filas, by = cargar(a.xlsx)
    sel = {s: p for s, p in by.items()
           if (not a.familia or familia(s) == a.familia.upper())
           and (not a.sku or a.sku.lower() in s.lower())}
    print('%d piezas / %d hojas   (seleccionadas: %d)\n' % (len(filas), len(by), len(sel)))

    if a.sku:
        for sku, piezas in sel.items():
            dims, _ = estimar_dims(piezas)
            print('### %s' % sku)
            print('    mueble mm: %s   pulg: %s' % (
                dims, {k: round(v / 25.4, 4) for k, v in dims.items() if v}))
            for r in piezas:
                print('    %-3s %-30s %9s x %8s  esp=%5s  %s' % (
                    r['letra'], r['pieza'][:30], r['largo'], r['ancho'], r['esp'], r['formula']))
            print()
        return 0

    incoh, no_cierran = [], []
    for sku, piezas in sel.items():
        dims, conf = estimar_dims(piezas)
        peor = max((abs(v[0] - best)
                    for best, _, _, fuera in conf.values() for v in fuera), default=0.0)
        if peor > a.tol:
            incoh.append((peor, sku, conf))
        c = cierre_frentes(piezas, dims)
        if c and abs(c[3]) > a.tol:
            no_cierran.append((sku, c))

    print('--- Hojas internamente incoherentes (>%gmm): %d ---' % (a.tol, len(incoh)))
    for peor, sku, conf in sorted(incoh, key=lambda x: -x[0])[:25]:
        print('  [%8.1f mm] %s' % (peor, sku[:66]))
        for var, (best, n, tot, fuera) in conf.items():
            print('       %s: consenso %s (%d/%d piezas)' % (var, best, n, tot))
            for val, pieza, form in fuera[:3]:
                print('          %-28s -> %-9s %s' % (pieza[:28], val, form[:40]))

    print('\n--- Pilas de frentes que no cierran contra el Ancho del mueble (>%gmm): %d ---'
          % (a.tol, len(no_cierran)))
    for sku, (n, suma, esp, dif) in sorted(no_cierran, key=lambda x: -abs(x[1][3]))[:25]:
        print('  %+9.1f mm  (%d frentes suman %.1f, esperado %.1f)  %s'
              % (dif, n, suma, esp, sku[:56]))

    print('\n--- Constante interior por espesor (debe ser Largo - 2*espesor) ---')
    for esp, c in sorted(constante_caja(filas).items(), key=lambda x: -sum(x[1].values())):
        if esp is None or sum(c.values()) < 5:
            continue
        esperado = -2 * esp
        det = '  '.join('L%+g:%d' % (n, v) for n, v in c.most_common(4))
        ok = 'OK' if c.most_common(1)[0][0] == esperado else 'ESPERADO L%+g' % esperado
        print('  esp %5g mm -> %-44s [%s]' % (esp, det, ok))

    return 0


if __name__ == '__main__':
    sys.exit(main())
