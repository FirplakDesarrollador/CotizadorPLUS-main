import json,csv,pathlib
p=pathlib.Path('artifacts/comparacion-prueba1')
e=json.loads((p/'excel.json').read_text(encoding='utf-8')); data=json.loads((p/'results.json').read_text(encoding='utf-8'))
out=[]
def add(x,label,a,b,unit):
 out.append([x['sku'],x['sheet'],x['row'],label,unit,a,b,b-a,(b-a)/a*100 if a else None])
for x in data:
 r=e[x['sheet']][x['row']-1]; c=x['calc']
 if x['sheet'].startswith('MADERA'):
  actual={m['rol']:m['m2'] for m in c['maderaPorRol']}
  for role,j in [('caja',40),('frente',42),('refuerzo',46),('fondo',36)]:add(x,'Madera '+role,r[j] or 0,actual.get(role,0),'m²')
  add(x,'Madera total',sum(r[j] or 0 for j in [36,40,42,44,46,48]),sum(actual.values()),'m²')
 else:
  actual={m['calibre'].lower():m['metros'] for m in c['cantoPorCalibre']}
  add(x,'Canto frente 22 mm',r[69] or 0,actual.get('22x1',0),'m')
  add(x,'Canto caja + polar 19 mm',(r[71] or 0)+(r[73] or 0),actual.get('19x0,45',0),'m')
  for label,j in [('tarugos',78),('soportes',77),('carton',79),('etiquetas',80)]:add(x,label,r[j] or 0,c['cantidadesConsumibles'][label],'und')
  for role,j in [('pata',76),('bisagra',81),('barra',82),('riel',83),('manija',87),('tornillo',119)]:add(x,role,r[j] or 0,sum(h['cant'] for h in c['herrajes'] if h['rol']==role),'pares' if role in ['bisagra','barra','riel'] else 'und')
with (p/'comparacion.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(['SKU','Hoja Excel','Fila','Consumo','Unidad','Excel','Proyecto','Diferencia proyecto menos Excel','Diferencia %']);w.writerows(out)
lines=['# Comparación de consumos PRUEBA 1', '', 'Consulta de Supabase: 2026-09-23. Se utilizaron las plantillas vigentes y el motor local src/lib/engine.ts, incluidos sus cambios locales existentes. No se modificó la base de datos ni el motor.', '', '## Criterios', '', '- Consumos por una unidad de mueble, con las medidas de cada hoja en pulgadas. No se suman las cantidades de pedido de MADERA (AY), pues no coinciden con una unidad por referencia.', '- Espesores de caja/refuerzos 15 mm, frentes 18 mm y fondo 6 mm; el fondo de 6 mm es un supuesto de comparación. Merma del motor: 15 %. Se comparan directamente los m² consolidados de Excel (AK, AO, AQ, AS, AU, AW), sin volver a aplicarles merma. No se suman columnas de tableros AZ:BD, que incorporan cantidades de pedido y formatos.', '- Gavetas DB según sufijo: 2, 3 o 4; variantes 1s y 2s con tres gavetas y una o dos pequeñas. Las demás reglas se resuelven desde la base de datos.', '- El motor agrupa el canto de caja y polar por calibre: se compara su suma BT + BV. Excel rotula 0,5 mm y el catálogo 0,45 mm; se trata como equivalencia funcional para comparar longitud, no como identidad de producto.', '- No se comparan precios, perforaciones ni mecanizados. Los campos de herrajes sin consumo en el listado se revisaron como ausencia, sin asignarles equivalencias nuevas.', '', '## Inconsistencia del archivo', '', 'COSTOS MUEBLES!C11 y CANTOS Y OTROS!C10 contienen DB19-1s, ancho 19 pulgadas. MADERA!B11 contiene DB12-1s, ancho 12 pulgadas. Son referencias distintas: se comparan por separado y no se reemplaza una por la otra.', '', '## Madera por referencia', '', '| Referencia | Excel m² | Proyecto m² | Diferencia m² | Diferencia % |','|---|---:|---:|---:|---:|']
for row in out:
 if row[3]=='Madera total':lines.append(f'| {row[0]} | {row[5]:.4f} | {row[6]:.4f} | {row[7]:+.4f} | {row[8]:+.2f}% |')
lines+=['','## Cantos por referencia','','| Referencia | Frente Excel / proyecto (m) | Caja + polar Excel / proyecto (m) |','|---|---:|---:|']
for x in data:
 if x['sheet']!='CANTOS Y OTROS':continue
 a=[r for r in out if r[0]==x['sku'] and r[3].startswith('Canto')]
 lines.append(f'| {x["sku"]} | {a[0][5]:.4f} / {a[0][6]:.4f} | {a[1][5]:.4f} / {a[1][6]:.4f} |')
lines+=['','## Diferencias de consumibles y herrajes','','| Referencia | Consumo | Excel | Proyecto | Diferencia |','|---|---|---:|---:|---:|']
for r in out:
 if not r[3].startswith(('Madera','Canto')) and abs(r[7])>0.00001:lines.append(f'| {r[0]} | {r[3]} ({r[4]}) | {r[5]} | {r[6]} | {r[7]:+g} |')
lines+=['','Los demás consumibles y herrajes comparados coinciden. Se detectaron diferencias en madera para las 15 filas. La diferencia por sí sola no demuestra un error de la aplicación: el motor incorpora descuentos de fabricación y reglas actuales que pueden diferir del listado.', '', '## Interpretación', '', '- UW1236 y UW3036: el patrón de +8 tarugos y −4 soportes es compatible con un entrepaño fijo en el proyecto frente a tres entrepaños soportados en el Excel. Debe validarse contra la hoja de ruta aplicable.', '- DB12-3: el motor deriva tres pares de barras de sus tres traseros altos de gaveta. Excel registra cero pares.', '- Las diferencias de frentes son compatibles con los descuentos de fabricación del motor (reveal de 3,2 mm). No se atribuyen todas las diferencias de tablero a esta causa: revisar el desglose por rol en el CSV.', '- No hay referencias sin familia correspondiente en la base. La falta de correspondencia entre hojas afecta únicamente DB19-1s / DB12-1s.', '', 'Detalle completo: [comparacion.csv](comparacion.csv).']
(p/'informe.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines[lines.index('## Madera por referencia'):]))
