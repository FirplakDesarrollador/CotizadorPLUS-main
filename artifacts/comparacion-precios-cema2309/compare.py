import openpyxl,json,csv,pathlib,re
p=pathlib.Path('artifacts/comparacion-precios-cema2309'); db=json.loads((p/'catalogos.json').read_text(encoding='utf-8'))
w=openpyxl.load_workbook('Simulador CEMA 23_09.xlsx',data_only=True,read_only=True)
m=list(w['Materiales'].values);u=list(w['costos unitarios'].values)
norm=lambda s:re.sub(r'\s+',' ',str(s or '').strip()).upper()
ex={norm(r[4]):(i,r) for i,r in enumerate(m,1) if 3<=i<=99 and r[4]}
rows=[]
def add(cat,code,name,source,a,b,unit,status=None,note=''):
 diff=b-a if isinstance(a,(int,float)) and isinstance(b,(int,float)) else None
 state='Coincide' if diff is not None and abs(diff)<=.01 else ('Redondeo al peso' if cat=='Tablero' and diff is not None and abs(diff)<=.5 else 'Diferente')
 rows.append(dict(categoria=cat,codigo=code,nombre=name,fuente=source,excel=a,plus=b,unidad=unit,diferencia=diff,porcentaje=diff/a*100 if diff is not None and a else None,estado=status or state,nota=note))
seen=set()
for t in db['cot_tableros']:
 code=norm(t['codigo']); pair=ex.get(code)
 if not pair:add('Tablero',t['codigo'],t.get('color_nombre'),'Materiales',None,t['precio_m2'],'COP/m²','Solo PLUS');continue
 seen.add(code);i,r=pair
 add('Tablero',t['codigo'],t.get('color_nombre'),f'Materiales!M{i}',r[12],t['precio_m2'],'COP/m²',note=f'Excel lámina {r[9]}, área {r[6]}; PLUS lámina {t["precio_real"]}, área {t["area_m2"]}; activo {t["activo"]}')
for code,(i,r) in ex.items():
 if code not in seen:add('Tablero',r[4],r[3],f'Materiales!M{i}',r[12],None,'COP/m²','Solo Excel')
for c in db['cot_cantos']:
 pair=next(((i,r) for i,r in enumerate(m,1) if 104<=i<=110 and norm(r[1])==norm(c['codigo'])),None)
 i,r=pair;add('Canto',c['codigo'],c['referencia'],f'Materiales!C{i}',r[2],c['precio'],'COP/m')
mapping={'TARUGO8x30':31,'CARTON':29,'ETIQUETA':30,'PATA10AJUST':28,'BISAGRAPAR':33,'MANIJA415':70,'TORNILLO858':83,'RIELTANDEM':84,'BARRAEST':37,'BONUITMX500':90,'RIELMETALBOX':43,'RIELSLIMCHI':85,'SLIMBOXALTO':125,'SLIMBOXBAJO':126,'RIELFE500':76,'PUSHOPENHBM237':105,'SOPORTE5x9':32}
for h in db['cot_herrajes']:
 i=mapping.get(h['codigo']);a=u[i-1][1] if i else None
 add('Herraje/consumible',h['codigo'],h['nombre'],f'costos unitarios!B{i}' if i else '',a,h['precio'],'COP/'+h['unidad'],status='Inactivo; coincide' if not h['activo'] else ('Sin equivalencia exacta' if i is None else None),note='Activo' if h['activo'] else 'Inactivo')
# Retain all unmatched source entries as candidates, not assumed absent by fuzzy name.
covered=set(mapping.values())|{36,42,44}
for i in range(28,131):
 r=u[i-1]
 if i in covered or i in {34,35,63,80,81,82} or not isinstance(r[1],(int,float)):continue
 add('Referencia Excel pendiente',str(i),r[0],f'costos unitarios!B{i}',r[1],None,'Unidad/moneda según referencia','Sin equivalencia confirmada')
with (p/'comparacion.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');writer.writeheader();writer.writerows(rows)
(p/'comparacion.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
for cat in ['Tablero','Canto','Herraje/consumible']:
 a=[r for r in rows if r['categoria']==cat];print(cat,{s:sum(r['estado']==s for r in a) for s in set(r['estado'] for r in a)})
 for r in a:
  if r['estado'] not in ['Coincide','Solo Excel','Redondeo al peso']:print(r)
lines=['# Comparación de precios: Simulador CEMA 23_09 y Cotizador PLUS','','Consulta Supabase: '+db['consultado']+'. Fuente: Simulador CEMA 23_09.xlsx, hojas Materiales y costos unitarios. Comparación de costos de insumos, no de precios de venta ni márgenes. No se modificó el Excel ni la base de datos.','','## Tableros','','Se compararon Materiales!M3:M99 (COP/m²) y cot_tableros.precio_m2 mediante código, normalizando mayúsculas y espacios. De los 48 tableros activos de PLUS, 40 tienen el mismo código: 37 coinciden al peso más cercano y 3 presentan diferencias mayores. Los 8 restantes no tienen el mismo código en Excel. Hay 57 códigos de Excel sin coincidencia exacta en PLUS; esto no demuestra ausencia del material, pues existen variantes de formato y nombres diferentes.','','| Código | Excel COP/m² | PLUS COP/m² | PLUS menos Excel | Diferencia % | Fuente |','|---|---:|---:|---:|---:|---|']
for r in rows:
 if r['categoria']=='Tablero' and r['estado']=='Diferente':lines.append(f'| {r["codigo"]} | {r["excel"]:,.2f} | {r["plus"]:,.2f} | {r["diferencia"]:+,.2f} | {r["porcentaje"]:+.2f}% | {r["fuente"]} |')
lines+=['','También se revisó el precio neto por lámina (Materiales J frente a precio_real). Las tres diferencias anteriores existen igualmente por lámina: blanco americano 4 mm 115.805 vs 38.400 COP; Arlington 15 mm 145.070 vs 132.371 COP; Arlington 9 mm dos lados 124.440 vs 129.320 COP. Adicionalmente, CHIRHCARB18H4001 MD133 DARK 183 tiene una diferencia de 1 COP por lámina (116.882 vs 116.881), aunque coincide por m² al peso.','','## Cantos','','Los siete códigos coinciden exactamente, incluyendo NA. Precio por metro lineal:','','| Referencia | Excel y PLUS COP/m | Fuente |','|---|---:|---|']
for r in rows:
 if r['categoria']=='Canto':lines.append(f'| {r["nombre"]} | {r["plus"]:,.2f} | {r["fuente"]} |')
lines+=['','El bloque costos unitarios!B25:B27 conserva 900 / 368 / 368 COP/m, frente a 980 / 400 / 400 en el catálogo. Las fórmulas inspeccionadas de Costos Muebles!T4:V4 referencian B11/B12 (980 y 400), no B25:B27. Por tanto, esos valores antiguos no se presentan como diferencias de catálogo con PLUS.','','## Herrajes y consumibles','','De 19 registros activos en PLUS, 16 tienen equivalencia identificada en costos unitarios y coinciden con tolerancia de 0,01 COP. Riel Slim China difiere solo 0,004 COP por redondeo. La correspondencia se hizo por referencia/nombre y se conserva en el CSV con la celda original.','','| Código | Excel COP | PLUS COP | Unidad PLUS | Fuente |','|---|---:|---:|---|---|']
for r in rows:
 if r['categoria']=='Herraje/consumible' and r['estado']=='Coincide':lines.append(f'| {r["codigo"]} | {r["excel"]:,.2f} | {r["plus"]:,.2f} | {r["unidad"]} | {r["fuente"]} |')
lines+=['','El soporte 5x9 del Excel vale 47 COP y existe con ese mismo precio en PLUS, pero está inactivo. El selector activo de soporte usa SOPORTEMET 5MM a 45,70 COP: −1,30 COP (−2,77 %) respecto al soporte del Excel. Es un cambio de referencia, no una discrepancia del mismo producto.','','Sin equivalencia exacta confirmada en el Excel: barra estabilizadora Madecentro 11.800 COP/par, soporte metálico 5 mm 45,70 COP/und y grapas J-08 48,76 COP/und. No se equipara la barra Madecentro con la barra genérica de 9.800 COP.','','Hay además precios alternativos de riel en Materiales!B114:B115 (Bonuit MAX 56.074 y Full Extension 6.000), distintos de costos unitarios!B90/B76 (57.000 y 31.064), que sí coinciden con PLUS. No se asume que las referencias específicas de Materiales sean idénticas a las genéricas. El selector B36 usa B44 para Bonuit MAX y B76 para Full Extension; B44 y B90 valen 57.000.','','## Alcance y pendientes','','No se hicieron equivalencias automáticas entre variantes de tablero ni entre accesorios parecidos. El CSV incluye todos los tableros, los siete cantos, los veinte registros de herrajes (incluido el soporte inactivo) y referencias adicionales de costos unitarios sin equivalencia confirmada. Algunas referencias adicionales son accesorios o productos con distinta unidad/moneda; no se agregan en un total monetario.','','[Detalle de comparación](comparacion.csv).']
(p/'informe.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
assert len([r for r in rows if r['categoria']=='Tablero' and r['plus'] is not None])==48
assert len([r for r in rows if r['categoria']=='Canto' and r['estado']=='Coincide'])==7
