import json,pathlib,csv,collections,html
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
root=pathlib.Path('tmp/pb-shore'); out=pathlib.Path('output/pdf');out.mkdir(parents=True,exist_ok=True)
R=json.loads((root/'comparison.json').read_text(encoding='utf8'));D=json.loads((root/'cotizacion.json').read_text(encoding='utf8'))
font=pathlib.Path('C:/Windows/Fonts');pdfmetrics.registerFont(TTFont('Arial',str(font/'arial.ttf')));pdfmetrics.registerFont(TTFont('Arial-Bold',str(font/'arialbd.ttf')))
styles=getSampleStyleSheet();styles.add(ParagraphStyle(name='BodyA',fontName='Arial',fontSize=9,leading=13,spaceAfter=7,textColor=colors.HexColor('#243447')));styles.add(ParagraphStyle(name='TitleA',fontName='Arial-Bold',fontSize=23,leading=27,spaceAfter=13,textColor=colors.HexColor('#133c53')));styles.add(ParagraphStyle(name='HeadA',fontName='Arial-Bold',fontSize=13,leading=17,spaceAfter=9,textColor=colors.HexColor('#133c53')));styles.add(ParagraphStyle(name='CellA',fontName='Arial',fontSize=7.3,leading=9));styles.add(ParagraphStyle(name='SmallA',fontName='Arial',fontSize=7.7,leading=10.5,spaceAfter=5));
P=lambda s,st='BodyA':Paragraph(s,styles[st]);fmt=lambda v,n=3:f'{(0 if abs(v)<0.5*10**(-n) else v):.{n}f}'.replace('.',',');esc=lambda x:html.escape(str(x));story=[]
def table(rows,widths,small=False):
 cells=[[P(('<font color=' + chr(34) + '#ffffff' + chr(34) + '>' + esc(x).replace(chr(10),'<br/>') + '</font>') if ri==0 else esc(x).replace(chr(10),'<br/>'),'CellA') for x in row] for ri,row in enumerate(rows)];t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#173f55')),('TEXTCOLOR',(0,0),(-1,0),colors.white),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0f5f7'),colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),('LINEBELOW',(0,0),(-1,0),.5,colors.HexColor('#173f55'))]));
 for c in cells[0]:c.style=ParagraphStyle('wh',parent=styles['CellA'],textColor=colors.white,fontName='Arial-Bold')
 return t
T={k:sum(r[k] for r in R) for k in ['hq','aq','ha','aa','he','ae','ab','eb']}
notes={
'BFD15':'Las 9 piezas coinciden en dimensiones y aristas. La descripción guardada dice 2 entrepaños, pero el despiece tiene 1, igual que la HDR; el cálculo de este informe utiliza las piezas.',
'BFD24':'Las 10 piezas coinciden en dimensiones y aristas. Se compara el despiece guardado, no la cantidad de entrepaños escrita en la descripción.',
'DB15-1S':'Las 18 piezas corresponden. Los 3 traseros de gaveta llevan 2 cantos largos en PLUS y 1 en HDR: aproximadamente +0,792 m. Los frentes grandes miden 300,00 mm en PLUS frente a 300,08 mm en HDR. Los traseros tienen 263,982 frente a 264 mm y las bases 491,998 frente a 492 mm; son diferencias menores de precisión.',
'SBFD33':'Las 9 piezas coinciden en dimensiones y aristas, incluido el refuerzo delantero de 128 mm.',
'WLD1530':'Coinciden las 10 piezas y sus dimensiones. PLUS asigna 0 aristas a los 2 refuerzos traseros y los 2 entrepaños. HDR exige 2 cantos largos por refuerzo y las 4 aristas por entrepaño.',
'WLD2430':'Coinciden las 11 piezas y sus dimensiones. PLUS asigna 0 aristas a los 2 refuerzos traseros y los 2 entrepaños. HDR exige 2 cantos largos por refuerzo y las 4 aristas por entrepaño.',
'WLD2730':'Coinciden las 11 piezas y sus dimensiones. PLUS asigna 0 aristas a los 2 refuerzos traseros y los 2 entrepaños. HDR exige 2 cantos largos por refuerzo y las 4 aristas por entrepaño.',
'WLD3330':'Coinciden las 11 piezas y sus dimensiones. PLUS asigna 0 aristas a los 2 refuerzos traseros y los 2 entrepaños. HDR exige 2 cantos largos por refuerzo y las 4 aristas por entrepaño.',
'WLD3013':'PLUS añade 2 entrepaños de 731 × 266,7 mm, ausentes en HDR. Los laterales miden 304,8 × 304,8 mm frente a 330,2 × 304,8 mm; el fondo mide 288,8 × 746 frente a 314,2 × 746 mm: 25,4 mm menos de altura. Los 2 refuerzos traseros carecen de canto en PLUS, frente a 2 largos cada uno en HDR. Los entrepaños adicionales tampoco llevan canto.',
'WLD3614':'PLUS añade 2 entrepaños de 883,4 × 266,7 mm, ausentes en HDR. Los laterales miden 330,2 × 304,8 mm frente a 355,6 × 304,8 mm; el fondo mide 314,2 × 898,4 frente a 339,6 × 898,4 mm: 25,4 mm menos de altura. Los 2 refuerzos traseros carecen de canto en PLUS, frente a 2 largos cada uno en HDR. Los entrepaños adicionales tampoco llevan canto.',
'PN21 7/834 1/2':'REFERENCIA DISTINTA. PLUS: PN21 7/8 × 34 1/2, panel de 555,625 × 876,3 mm. HDR disponible: PN21 7/8 × 33 1/4, panel de 555,63 × 844,55 mm. PLUS tiene 31,75 mm más de altura. La comparación es indicativa; se debe confirmar cuál altura corresponde al proyecto.',
'TK5 1/496':'Misma pieza y dimensiones. HDR pide únicamente los 2 cantos de 2438,4 mm. PLUS añade los 2 extremos de 133,35 mm: +0,2667 m netos.'}
for r in R:notes.setdefault(r['code'],'Pieza equivalente en cantidad, dimensiones y aristas. Las diferencias inferiores a 0,01 mm corresponden a la precisión decimal de las medidas en pulgadas frente a la HDR en milímetros.')
story += [P('PB SHORE PRUEBA','TitleA'),P('Comparativo de piezas, tablero y canto','HeadA'),P('Cotizador PLUS frente a HDR PDF · Corte: 30 de septiembre de 2026'),P('20 módulos cotizados, una unidad de cada uno. Se cotejaron sus piezas con 20 HDR: 19 referencias exactas y un panel de referencia distinta. Otras 3 HDR no tienen módulo en la cotización.')]
story.append(table([['Magnitud neta','HDR de referencia','Cotizador PLUS','Diferencia PLUS - HDR'],['Piezas',T['hq'],T['aq'],f"+{T['aq']-T['hq']}"],['Tablero (m²)',fmt(T['ha'],6),fmt(T['aa'],6),fmt(T['aa']-T['ha'],6)],['Canto (m)',fmt(T['he'],4),fmt(T['ae'],4),fmt(T['ae']-T['he'],4)]],[116,117,117,161]));story += [Spacer(1,12),P('Hallazgos que requieren revisión','HeadA')]
for s in ['WLD3013 y WLD3614: 4 piezas adicionales en total y laterales/fondos 25,4 mm más bajos que las HDR.','Los seis WLD omiten canto de refuerzos traseros; los WLD de 30 pulgadas de alto también omiten el canto de sus entrepaños.','DB15-1S: un canto largo adicional por cada uno de los tres traseros de gaveta. TK5 1/4 × 96: dos extremos enchapados adicionales.','Panel PN21 7/8: el cotizador usa 34 1/2 pulgadas de alto y la HDR 33 1/4. Es necesario confirmar la referencia correcta.']:
 story.append(P('• '+s))
story += [P('Lectura de los totales','HeadA'),P('Los totales anteriores incluyen la comparación indicativa del panel de distinta altura. Al excluirlo de ambos lados: HDR '+fmt(T['ha']-R[15]['ha'],6)+' m² / PLUS '+fmt(T['aa']-R[15]['aa'],6)+' m²; HDR '+fmt(T['he']-R[15]['he'],4)+' m / PLUS '+fmt(T['ae']-R[15]['ae'],4)+' m.'),P('El consumo guardado con suplementos en PLUS es '+fmt(T['ab'],6)+' m² de tablero y '+fmt(T['eb'],4)+' m de canto. Estas cifras no son directamente comparables con el neto de las HDR.'),P('No se modificaron la cotización, las plantillas ni las HDR. Este informe refleja el despiece persistido consultado, sin recalcularlo con plantillas posteriores.'),PageBreak()]
story += [P('Comparativo neto por módulo','TitleA'),P('H = HDR · P = PLUS · Δ = PLUS menos HDR. Consumo por una unidad. * Referencia distinta. Las cantidades son piezas físicas, no filas de plantilla.','SmallA')]
rows=[['Módulo','Pzs H / P','m² H','m² P','Δ m²','m H','m P','Δ m']]
for r in R:rows.append([r['code']+('*' if r['special'] else ''),f"{r['hq']} / {r['aq']}",fmt(r['ha'],4),fmt(r['aa'],4),fmt(r['aa']-r['ha'],4),fmt(r['he'],3),fmt(r['ae'],3),fmt(r['ae']-r['he'],3)])
rows.append(['TOTAL',f"{T['hq']} / {T['aq']}",fmt(T['ha'],4),fmt(T['aa'],4),fmt(T['aa']-T['ha'],4),fmt(T['he'],3),fmt(T['ae'],3),fmt(T['ae']-T['he'],3)])
story += [table(rows,[104,44,61,61,60,60,60,61]),Spacer(1,10),P('* PN21 7/8 × 34 1/2 se coteja provisionalmente con PN21 7/8 × 33 1/4. La suma describe esta pareja de documentos; no demuestra cuál referencia es correcta.','SmallA'),P('Redondeo: las diferencias se calculan antes de redondear; los paneles con octavos de pulgada pueden diferir de la HDR en 0,005 mm.','SmallA'),PageBreak()]
story += [P('Consumo con suplementos','TitleA'),P('Valores guardados en el cotizador. El tablero incluye 15 % de merma. El canto incluye sus suplementos propios; no se le aplica el 15 % del tablero.')]
rows=[['Módulo','m² netos PLUS','m² con 15 %','m netos PLUS','m guardados PLUS']]
for r in R:rows.append([r['code'],fmt(r['aa'],4),fmt(r['ab'],4),fmt(r['ae'],4),fmt(r['eb'],4)])
rows.append(['TOTAL',fmt(T['aa'],4),fmt(T['ab'],4),fmt(T['ae'],4),fmt(T['eb'],4)])
story += [table(rows,[131,110,110,100,100]),Spacer(1,10),P('La diferencia entre el canto neto y el guardado es '+fmt(T['eb']-T['ae'],4)+' m. El motor agrega 5 cm por arista de desperdicio y 8 cm por pieza cuyo nombre contiene “refuerzo”, cuando entra al cálculo de canto. Se toman aquí los consumos guardados, sin aplicar suplementos a las HDR.'),PageBreak()]
story += [P('Método y alcance','TitleA')]
for s in ['Fuente PLUS: cotización PB SHORE PRUEBA, ID d41e0343-9acc-49e9-83ad-88a3be70c279; Cocina 1, cantidad 1, 20 líneas con cantidad 1. Se utilizaron las piezas y consumos del breakdown guardado de cada línea.','Fuente HDR: carpeta PB SHORE PRUEBA / PROYECTO PB SHORE. Los PDF tienen una tabla en la primera página y una segunda página sin texto extraído. Cada fila con letra representa una pieza; el campo “Cantidad” de cabecera está vacío. Se compara una unidad de cada módulo, sin inferir un volumen de producción.','Tablero neto HDR = suma de largo × ancho / 1.000.000, con medidas en mm. Tablero neto PLUS = suma de cantidad × largoIn × anchoIn × 25,4² / 1.000.000. Se verificó que reproduce el área guardada, salvo redondeo.','Canto neto = suma de cantidad × [largo × cantos largos + ancho × cantos anchos] / 1.000. En HDR se suman los cantos Color y Blanco. No se confunde número de aristas con metros.','Se permite rotación de largo/ancho para emparejar piezas equivalentes; los metros de canto se calculan siempre con las aristas del eje original de cada fuente. En el detalle, L/A significa número de cantos largos/anchos y el tamaño se muestra en el orden original.','Se verificaron por dos extracciones independientes 1.104 celdas numéricas de las 23 HDR, incluyendo dimensiones, espesores y aristas. La revisión visual confirma las tablas. Los ceros de cantidad del cotizador no se cuentan como piezas.','El desglose de tablero por espesor utiliza el preset guardado: caja/refuerzo 15 mm, frente 18 mm y fondo 6 mm. Las HDR indican estos mismos espesores. El informe compara cantidades físicas; no certifica equivalencia de marca, color o acabado.','La HDR indica TAURI AMAZONAS para los frentes y Blanco/POLAR para interiores; PLUS utiliza ECOCARB15COLOR, ECOCARB18COLOR y PRICARB6CANDELARIA (POLAR). Para compras debe confirmarse el acabado exacto, además del área.']:
 story.append(P(s))
story.append(P('HDR sin contraparte en la cotización','HeadA'))
extra=[h for h in json.loads((root/'hdr-textos.json').read_text(encoding='utf8')) if not any(h['file']==r['hdr']['file'] for r in R)]
for h in extra:story.append(P('• '+esc(pathlib.Path(h['file']).name),'SmallA'))
story += [P('No se suman al comparativo. Son F628 3/4, USVFD NR3628 3/4 y USVFDR3628 3/4.','SmallA'),PageBreak()]
# Detailed audit: one page per module.
for ix,r in enumerate(R):
 story += [P(r['code'],'TitleA'),P('Detalle por módulo · 1 unidad · '+('referencia distinta' if r['special'] else 'referencia localizada'),'HeadA'),P(esc(notes[r['code']]))]
 summary=[['Magnitud','HDR','PLUS neto','Δ neta','PLUS con suplementos'],['Piezas',r['hq'],r['aq'],r['aq']-r['hq'],'-'],['Tablero m²',fmt(r['ha'],6),fmt(r['aa'],6),fmt(r['aa']-r['ha'],6),fmt(r['ab'],6)],['Canto m',fmt(r['he'],4),fmt(r['ae'],4),fmt(r['ae']-r['he'],4),fmt(r['eb'],4)]]
 story += [table(summary,[96,97,97,97,164]),Spacer(1,10)]
 rows=[['HDR letra / pieza','HDR mm / L-A','PLUS pieza','PLUS mm / L-A','m² H / P','m canto H / P']]
 for pair in r['pairs']:
  h=pair['hdr'];a=pair['app'];dim=lambda p:f"{fmt(p['L'],2)} × {fmt(p['W'],2)}\n{int(p.get('lc',0)+p.get('lb',0))}/{int(p.get('wc',0)+p.get('wb',0))}" if p else '-'
  rows.append([h['letter']+' '+h['name'] if h else 'Sin pieza HDR',dim(h),a['name'] if a else 'Sin pieza PLUS',dim(a),f"{fmt(h['area'],4) if h else '-'} / {fmt(a['area'],4) if a else '-'}",f"{fmt(h['edge'],4) if h else '-'} / {fmt(a['edge'],4) if a else '-'}"])
 story += [table(rows,[109,87,110,87,79,79]),Spacer(1,9)]
 # Material split compact
 splits=[]
 for thickness in [15,18,6]:
  h=sum(p['area'] for p in r['hdr']['rows'] if p['T']==thickness);a=sum(p['area'] for p in r['app'] if p['T']==thickness)
  if h or a:splits.append(f'{thickness} mm: {fmt(h,4)} / {fmt(a,4)} m²')
 story.append(P('Tablero por espesor (HDR / PLUS neto): '+'; '.join(splits)+'.','SmallA'))
 splits=[]
 for thick in [.45,1]:
  h=sum(p['edge'] for p in r['hdr']['rows'] if p['ct']==thick);a=sum(p['edge'] for p in r['app'] if p['ct']==thick)
  if h or a:splits.append(f'{fmt(thick,2)} mm: {fmt(h,4)} / {fmt(a,4)} m')
 story.append(P('Canto por espesor (HDR / PLUS neto): '+'; '.join(splits)+'.','SmallA'))
 story.append(P('Fuente HDR, página 1: '+esc(pathlib.Path(r['hdr']['file']).name),'SmallA'))
 story.append(P('Cada renglón del detalle equivale a una pieza física. Dimensiones en mm; L/A = aristas enchapadas a lo largo / ancho. La rotación de ejes por sí sola no es una diferencia.','SmallA'))
 if ix<len(R)-1:story.append(PageBreak())
def footer(c,doc):
 c.setStrokeColor(colors.HexColor('#bccbd1'));c.line(22,32,573,32);c.setFont('Arial',7);c.setFillColor(colors.HexColor('#526675'));c.drawString(22,20,'PB SHORE PRUEBA | Auditoría de consumos | 30/09/2026');c.drawRightString(573,20,str(doc.page))
# Wide A4 usable width 551pt.
pdf=out/'Informe_comparativo_PB_SHORE_PRUEBA.pdf';SimpleDocTemplate(str(pdf),pagesize=A4,rightMargin=22,leftMargin=22,topMargin=28,bottomMargin=43).build(story,onFirstPage=footer,onLaterPages=footer)
with (out/'PB_SHORE_PRUEBA_resumen.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(['Modulo','Piezas_HDR','Piezas_PLUS','Delta_piezas','Tablero_HDR_m2','Tablero_PLUS_neto_m2','Delta_tablero_m2','Tablero_PLUS_con_merma_m2','Canto_HDR_m','Canto_PLUS_neto_m','Delta_canto_m','Canto_PLUS_guardado_m','Observacion'])
 for r in R:w.writerow([r['code'],r['hq'],r['aq'],r['aq']-r['hq'],fmt(r['ha'],6),fmt(r['aa'],6),fmt(r['aa']-r['ha'],6),fmt(r['ab'],6),fmt(r['he'],6),fmt(r['ae'],6),fmt(r['ae']-r['he'],6),fmt(r['eb'],6),notes[r['code']]])
with (out/'PB_SHORE_PRUEBA_detalle_piezas.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(['Modulo','Letra_HDR','Pieza_HDR','Largo_HDR_mm','Ancho_HDR_mm','Cantos_largos_HDR','Cantos_anchos_HDR','Pieza_PLUS','Largo_PLUS_mm','Ancho_PLUS_mm','Cantos_largos_PLUS','Cantos_anchos_PLUS','m2_HDR','m2_PLUS','m_canto_HDR','m_canto_PLUS','PDF_fuente'])
 for r in R:
  for pair in r['pairs']:
   h=pair['hdr'] or {};a=pair['app'] or {};w.writerow([r['code'],h.get('letter',''),h.get('name',''),fmt(h.get('L',0),4),fmt(h.get('W',0),4),h.get('lc',0)+h.get('lb',0),h.get('wc',0)+h.get('wb',0),a.get('name',''),fmt(a.get('L',0),4),fmt(a.get('W',0),4),a.get('lc',0),a.get('wc',0),fmt(h.get('area',0),6),fmt(a.get('area',0),6),fmt(h.get('edge',0),6),fmt(a.get('edge',0),6),pathlib.Path(r['hdr']['file']).name])
print(pdf)


