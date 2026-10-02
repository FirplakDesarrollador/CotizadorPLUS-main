import csv,json,re,collections,sys
sys.path.insert(0,'scripts')
from validar_hojas_ruta import estimar_dims
rows=list(csv.DictReader(open('Query App 2-10.csv',encoding='utf-8-sig',newline='')))
groups=collections.defaultdict(list)
for i,r in enumerate(rows,2):
 r['row']=i;groups[r['DESCRIPCION SKU'].strip()].append(r)
def num(s):return float(s.replace(',','')) if s.strip() else 0
def code(s):
 s=re.sub(r'^(HRJ|HJR)\s+','',s.upper().strip())
 return re.split(r'\s+(?:MBLE|MBL|MUEBLE|PANEL|FILLER|FRENTE|KIT|FONDO MBLE|ZOCALO|EXPOCAMACOL|CLOSET|REFUERZO|CARB2|\d+\s*PUERTA)\b',s)[0].strip()
def family(c):
 m=re.match(r'([A-Z]+)',c);p=m[1] if m else '?'
 if p=='DB':
  m=re.search(r'-(\d+S?)',c);p+='-'+(m[1] if m else '?')
 return p
out=[]
for desc,rs in groups.items():
 c=code(desc); ps=[]; seen={};duplicates=[]
 for r in rs:
  signature=tuple(r[k] for k in ['LETRA','PIEZA','LARGO','ANCHO','Espesor','Enchape lado largo','Enchape lado Ancho','Enchape largo blanco','Enchape ancho blanco','Canto'])
  if signature in seen:
   duplicates.append({'row':r['row'],'same_as':seen[signature]});continue
  seen[signature]=r['row']
  ps.append(dict(pieza=r['PIEZA'].strip(),letra=r['LETRA'],largo=num(r['LARGO']),ancho=num(r['ANCHO']),esp=num(r['Espesor']),formula=r['Formula'],row=r['row'],id=r['ID'],cl=num(r['Enchape lado largo']),ca=num(r['Enchape lado Ancho']),bl=num(r['Enchape largo blanco']),ba=num(r['Enchape ancho blanco']),canto=num(r['Canto'])))
 dims,conf=estimar_dims(ps)
 out.append(dict(desc=desc,code=c,family=family(c),piezas=ps,dims=dims,conflicts=conf,duplicates=duplicates,dates=list(set(r['Creado'] for r in rs))))
json.dump(out,open('outputs/query-210/source.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print('familias',dict(collections.Counter(x['family'] for x in out)))
print('varias fechas',sum(len(x['dates'])>1 for x in out))
print('dimensiones completas',sum(len(x['dims'])==3 for x in out))
print('ultimo',out[-1]['desc'],len(out[-1]['piezas']))
