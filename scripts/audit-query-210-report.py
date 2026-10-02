import json,collections,pathlib
p=pathlib.Path('outputs/query-210')
d=json.loads((p/'results.json').read_text(encoding='utf-8'));db=json.loads((p/'catalogo.json').read_text(encoding='utf-8'));src=json.loads((p/'source.json').read_text(encoding='utf-8'))
samples=d['samples'];evaluated=[r for r in samples if r['status']=='evaluado'];cov=d['coverage']
def esc(s):return str(s).replace('|','/').replace('\n',' ')
def table(headers,rows):return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']+['| '+' | '.join(esc(x) for x in r)+' |' for r in rows])
def pair(r,a,b):return f"{r.get(a,'—')} / {r.get(b,'—')}"
upper=lambda r:r['family'].find('W')>=0 and (r['family'].find('B')<0 or r['family'].find('W')<r['family'].find('B'))
equal=lambda r:r['status']=='evaluado' and r['countEqual'] and not r['edgeDiffs'] and not r['unmatchedQuery'] and not r['unmatchedApp']
missing=[c for c in cov if not c['mapped']]
used={r['mapping']['pref'] for r in d['results']};extra=sorted(t['pref'] for t in db['cot_tipos_mueble'] if t['activo'] and t['pref'] not in used)
text=['# Comparación Query App 2-10 frente a Cotizador Plus','',f"Consulta del catálogo activo: {d['date']}. Fuente: `Query App 2-10.csv`, 5.000 filas, 562 descripciones y {len(d['results'])} códigos distintos después de quitar HRJ/HJR y unificar descripciones del mismo código. Plus tiene 81 tipos activos y uno inactivo.",'',
'## Alcance y criterio','',
f"Se seleccionaron **{len(samples)} referencias en {len(cov)} agrupaciones de código**. En {sum(c['available']>=5 for c in cov)} agrupaciones había al menos cinco referencias: se revisaron cinco. En las restantes se tomaron todas las disponibles; no se inventaron muestras. Dos agrupaciones (`TABLERO` y `ACCESORIOS`) son descripciones sin SKU homologable, conservadas como pendientes.",'',
'Las letras iniciales y variantes FE, SM, SMG, PUSH, SHK, MBB, MO, etc. distinguen grupos; los nombres comerciales no determinan la tipología. En DB se conserva el número posterior a la medida y la S: DB-1S, DB-2, DB-2S. Las manos L/R se contrastan con la opción de apertura de la misma plantilla. Espesores 15MM/18MM, ubicaciones de proyecto y medidas no crean tipos. Los sufijos de configuración de puertas/entrepaños se conservan en el SKU de cada muestra, pero no se convierten automáticamente en nuevas plantillas. SMG se conserva separado en Query y se compara explícitamente con SM en Plus, siguiendo la equivalencia documentada de la app; no existe un prefijo activo SMG independiente.','',
'La comparación usa el motor real `src/lib/engine.ts` y una captura de las tablas activas, no solo las migraciones locales. Es una auditoría de plantillas y configuración predeterminada, no de una cotización guardada. Las dimensiones se recuperan por consenso de las fórmulas de producción y, cuando falta un eje, de las piezas; esas inferencias quedan registradas. Se usan los espesores de Query. No se fuerza la cantidad de entrepaños de Query sobre Plus. Las diferencias en configuraciones especiales pueden necesitar un ajuste de parámetros, no necesariamente otra plantilla.','',
'**Conteo:** CANTIDAD está vacía en las 5.000 filas. Cada fila se toma como una pieza; las cantidades de las plantillas se expanden. Se excluyen líneas virtuales de canto sin tablero y piezas de dimensión cero. Se retiraron 12 repeticiones exactas de una misma letra/pieza/medidas/cantos dentro de una descripción; letras diferentes siguen siendo piezas diferentes. Para un mismo código con varias descripciones se conserva la primera del CSV (orden más reciente).','',
'**Cantos:** se suman aristas de color y blancas; se comparan los lados geométricos y el calibre, reorientando largo/ancho cuando la pieza está girada. L×A significa cantidad de aristas sobre el largo y el ancho, no las medidas del tablero. Emparejar piezas con dimensiones diferentes permite localizar diferencias de patrón, pero no certifica identidad geométrica: se marca expresamente. **El color blanco/color no puede certificarse** con `cot_piezas_plantilla.cantos`, porque almacena calibre y número de lados, no una asignación explícita de color por arista. Tampoco se comparan metros facturados ni merma.','',
'## Resultado global','',
f"- {len(evaluated)} referencias calculadas con plantilla o configuración equivalente.",
f"- {sum(r['countEqual'] for r in evaluated)} tienen el mismo total de piezas; {sum(not r['countEqual'] for r in evaluated)} tienen un total diferente.",
f"- {sum(bool(r['edgeDiffs']) for r in evaluated)} presentan diferencias de patrón o calibre en al menos una pieza emparejada. No son todas correcciones confirmadas: incluye datos anómalos del CSV y emparejamientos con geometría distinta.",
f"- {sum(equal(r) for r in evaluated)} coinciden en total y en los patrones/calibres de todas las piezas emparejadas, sin piezas pendientes de emparejar; esto no certifica el color por arista.",
f"- {sum(r['status']=='sin_equivalencia' for r in samples)} referencias quedaron sin equivalente verificado y {sum(r['status']=='dimensiones_incompletas' for r in samples)} sin dimensiones suficientes.",'',
'## Diferencias principales de piezas y cantos','',
table(['Tipología / referencia','Query → Plus','Detalle'],[
['B-FE (5 muestras)','16 → 16 piezas','Trasero de gaveta: 2L×0A → 1L×0A, 0,45 mm.'],
['UVFD (5 muestras)','Mismo total','Entrepaño SHLEF: 2L×2A → 0L×0A.'],
['DB-1S (2 muestras)','18 → 18 piezas','Traseros de gavetas grandes: 1L×0A → 1L×2A.'],
['DB-2-SMG (3 muestras)','13 → 16 piezas','La plantilla DB-2-SM agrega dos golas de madera y un refuerzo delantero.'],
['DB22-2S-SMG','16 → 18 piezas','Plus agrega dos refuerzos delanteros.'],
['DB30/32-2S SM-15MM','19 → 18 piezas','Query contiene golas adicionales frente a la composición vigente; revisar la distribución, no solo el total.'],
['DB12-2S-SM-FE','28 → 28 piezas','Trasero inferior: 2L×0A → 2L×2A.'],
['BBLFD45 D19-L/R SM','14 → 13 piezas','Diferencias de refuerzos, gola y orientación de cantos; ver detalle por pieza.'],
['BBLFD-D-L/R-SMG','11–12 → 13 piezas','Las referencias SMG tienen otra composición frente a la plantilla SM.'],
['BOMH36-1','12 → 13 piezas','Composición de frentes y orientación de cantos diferente; Plus requiere dimensiones de hueco de horno para reproducir una configuración específica.'],
['BOV26-15MM; BOV32','6 → 7; 8 → 7 piezas','Los despieces no coinciden con la plantilla activa de siete piezas.'],
['BOV24/30/36-SMG','6/6/5 → 7 piezas','Comparación con BOV mediante opción gola; faltan/sobran componentes frente a ese patrón.'],
['OW1636, OW2436, OW33 7/836','9 → 9 piezas','Query usa 0,45 mm; la plantilla OW fuerza 1 mm. La base además pasa de 2L×0A a 2L×2A.'],
['TW-PUSH y TW-SM','Calibre de caja: 1 → 0,45 mm','El patrón de aristas puede coincidir, pero no el calibre. Las TW-SM compuestas tienen además más puertas/divisiones que TW básica.'],
['W3128-SM-15MM','11 → 11 piezas','Canto de puertas: Query 2 mm, Plus predeterminado 1 mm; puede depender del canto de frente elegido en la cotización.'],
]),'',
'En las cinco muestras de B, BFD, USVFD-NR, UW y WLD coinciden total de piezas y patrones/calibres. Esto describe la muestra, no certifica todas las medidas o variantes de la familia.','',
'## Entrepaños de superiores','',
'Se cuentan móviles y fijos. UW incluye SHELF 0 y los dos móviles. Además de la muestra principal se revisaron todas las referencias superiores calculables para detectar cambios por altura.','',
table(['SKU','Tipología','Entrepaños Query','Entrepaños Plus','Piezas Query / Plus'],[(r['code'],r['typology'],r['queryShelves'],r['appShelves'],pair(r,'queryCount','appCount')) for r in d['results'] if upper(r) and r['status']=='evaluado' and not r['shelvesEqual']]),'',
'**Coincidencias:** UW: 3 → 3 en las cinco muestras; WLD: 0 → 0 en bajos y 2 → 2 en altos; W estándar: las cinco muestras coinciden. W-SM de 36 pulgadas coincide con dos entrepaños, pero los de 40 pulgadas de Query tienen tres y la plantilla devuelve dos. En TW3334 1/4-PUSH-SM el total de 10 piezas oculta una diferencia: Query tiene una puerta más y un entrepaño menos.','',
'## Tipologías presentes en Query sin equivalente verificado','',
'No se declara una familia inexistente solo por el nombre comercial. Esta lista distingue códigos sin plantilla exacta, variantes pendientes y alias métricos. Para IC/IP hay equivalencia nominal configurada, pero no se fuerza una configuración de cajones a partir del texto descriptivo.','',
table(['Grupo Query','Referencias disponibles','Observación'],[(c['typology'],c['available'], 'Alias métrico de '+('DB' if c['typology']=='IC' else 'BFD')+' en Plus; requiere validar configuración/despiece' if c['typology'] in ['IC','IP'] else 'Descripción sin SKU homologable' if c['typology'] in ['TABLERO','ACCESORIOS'] else 'No hay plantilla/configuración equivalente verificada') for c in missing]),'',
'**Equivalencias configurables, no ausencias:** USVFDR → USVFD removible; UBFDR → UBFD removible; UBR → UB removible. KF-W/KF-WSM → solo frentes del tipo base; OUVFD → UVFD sin frentes; ODB → DB sin frentes. En OUVFD el valor predeterminado de Plus produce un entrepaño y Query tiene tres: la cantidad debe configurarse. USBFDR no se dio por equivalente a USVFD porque sus letras identifican otra familia y no existe USBFD activo.','',
'## Plantillas activas de Plus sin referencia equivalente en este CSV','',
'La ausencia aplica a esta exportación, no demuestra que no existan en el sistema Query completo. Algunas tienen familias relacionadas, pero ninguna referencia equivalente fue vinculada a esa plantilla específica:','',
', '.join('`'+x+'`' for x in extra)+'.','',
'KF sí aparece como concepto mediante kits de frentes, aunque no se usa su plantilla genérica. BBLFD/WBL básicos no equivalen a sus variantes D-L/R-SM. DB tiene además selectores virtuales DB-2, DB-3, DB-4 y DB2-1OP; los selectores no deben confundirse con filas independientes del catálogo. La presencia de DB-2-SMG no es evidencia de DB-2 estándar sin gola. VDF está inactivo y se excluye.','',
'## Anomalías y límites de la fuente','',
'- El CSV tiene exactamente 5.000 filas. La última referencia, IC40-2P, solo tiene seis filas: no puede certificarse la integridad de esa hoja ni que la exportación incluya todo Query.','- DB19-2S-FE-SM-15MM registra 6 cantos largos en FONDO MUEBLE con calibre 0. Ese valor excede las dos aristas posibles: es una anomalía de origen, no una orden para corregir Plus a seis lados.','- Algunas descripciones contradicen el SKU (p. ej., DB22-2 SMG describe tres gavetas). Se respetó el código, no la descripción.','- Filas con el mismo SKU y distintas composiciones históricas necesitan confirmar qué versión se fabrica hoy antes de modificar plantillas.','- Los colores por arista y configuraciones particulares guardadas por proyecto no están certificados por esta revisión.','',
'## Cobertura y muestra completa','',
table(['Tipología Query','Disponibles','Revisadas','Plantilla(s) Plus'],[(c['typology'],c['available'],c['sampled'],', '.join(c['mapped']) or 'Sin equivalente verificado') for c in cov]),'',
'## Detalle por referencia','',
'En cada tabla, Q/P significa Query/Plus. Las filas de origen corresponden a números de línea del CSV (cabecera = 1). El detalle de cantos enumera las discrepancias, no todos los lados coincidentes.','']
for c in cov:
 rs=[r for r in samples if r['typology']==c['typology']]
 text+=['### '+c['typology'],'',table(['SKU','Piezas Q/P','Entrepaños Q/P','Cantos','Estado'],[(r['code'],pair(r,'queryCount','appCount'),pair(r,'queryShelves','appShelves') if upper(r) else 'No aplica',str(len(r.get('edgeDiffs',[])))+' diferencias' if r['status']=='evaluado' else 'No verificado',r['status']) for r in rs]),'']
 for r in rs:
  text += ['**'+r['code']+'**. Filas: '+', '.join(str(x['row']) for x in r['piezas'])+'. Plantilla: '+str(r['mapping']['pref'] or '—')+'. '+r['mapping']['note']+'.','']
  if r.get('inferred'):text+=['Dimensiones inferidas: '+', '.join(r['inferred'])+'.','']
  if r.get('unmatchedQuery') or r.get('unmatchedApp'):text+=['Sin pareja Query: '+(', '.join(r.get('unmatchedQuery',[])) or 'ninguna')+'. Sin pareja Plus: '+(', '.join(r.get('unmatchedApp',[])) or 'ninguna')+'.','']
  if r.get('edgeDiffs'):
   text += [table(['Pieza Query → Plus','Aristas L×A Q → P','Calibre mm Q → P','Emparejamiento'],[(e['query']+' → '+e['app'], '×'.join(str(int(x)) for x in e['edges'])+' → '+'×'.join(str(x) for x in e['appEdges']),str(e['calQuery'])+' → '+str(e['calApp']), 'Dimensiones próximas (≤2 mm acumulados)' if e['dimensionDistance']<=2 else 'Geometría distinta; revisar correspondencia ('+str(round(e['dimensionDistance'],1))+' mm acumulados)') for e in r['edgeDiffs']]),'']
(p/'comparacion-query-210.md').write_text('\n'.join(text),encoding='utf-8')
summary={'groups':len(cov),'samples':len(samples),'evaluated':len(evaluated),'same_count':sum(r['countEqual'] for r in evaluated),'different_count':sum(not r['countEqual'] for r in evaluated),'edge_diff':sum(bool(r['edgeDiffs']) for r in evaluated),'fully_matched':sum(equal(r) for r in evaluated),'five_available':sum(c['available']>=5 for c in cov),'extra':extra}
(p/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
# Verify requested sample sizes and evidence totals.
assert all(sum(r['typology']==c['typology'] for r in samples)==min(5,c['available']) for c in cov)
assert all(r['queryCount']==len(r['piezas']) for r in samples)
assert all(r['appCount']==sum(p['cant'] for p in r['appPieces']) for r in evaluated)
assert len({r['code'] for r in samples})==len(samples)
print('Verificado: tamaños de muestra, unicidad de códigos y sumas de piezas.')
