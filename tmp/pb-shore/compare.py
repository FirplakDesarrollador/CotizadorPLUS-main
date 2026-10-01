import json,re,pathlib,collections
root=pathlib.Path('tmp/pb-shore'); hdr=json.loads((root/'hdr-textos.json').read_text(encoding='utf8'));fast=json.loads((root/'hdr-fast.json').read_text(encoding='utf8')); data=json.loads((root/'cotizacion.json').read_text(encoding='utf8'))
num=r'(\d+(?:[.,]\d+)?)';pat=re.compile(r'^([A-Z]) (.+?) '+r'\s+'.join([num]*8)+r'(?:\s|$)')
for h,f in zip(hdr,fast):
 rows=[]
 for page in h['pages']:
  for line in page.splitlines():
   m=pat.match(line)
   if not m:continue
   vals=list(map(lambda x:float(x.replace(',','.')),m.groups()[2:]));L,W,T,lc,wc,lb,wb,ct=vals
   rows.append(dict(letter=m[1],name=m[2],L=L,W=W,T=T,lc=lc,wc=wc,lb=lb,wb=wb,ct=ct,q=1,area=L*W/1e6,edge=(L*(lc+lb)+W*(wc+wb))/1000))
 assert rows,h['file']
 # Check independent PDFium extraction column order against every numeric source cell.
 if len(rows)==1:
  m=pat.match(f['pages'][0].splitlines()[0]); assert m and list(map(lambda x:float(x.replace(',','.')),m.groups()[2:]))==[rows[0][k] for k in ['L','W','T','lc','wc','lb','wb','ct']]
  h['rows']=rows
  continue
 tokens=[t.strip() for t in f['pages'][0].splitlines() if t.strip()]; n=len(rows); first=next(i for i,t in enumerate(tokens) if re.fullmatch(num,t)); assert first==n,(h['file'],first,n)
 values=[float(t.replace(',','.')) for t in tokens[n:n+n*8]]
 cols=['wc','lc','ct','T','lb','wb','L','W']
 for col,key in enumerate(cols):
  assert [r[key] for r in rows]==values[col*n:(col+1)*n],(h['file'],key)
 h['rows']=rows

def cat(name):
 s=name.lower()
 if 'side' in s or 'lateral' in s:return 'Lateral'
 if 'rail del' in s or 'refuerzo_delantero' in s:return 'Ref. delantero'
 if 'rail tras' in s or 'rear rail' in s or 'refuerzo_trasero' in s:return 'Ref. trasero'
 if 'shelf' in s or 'shlef' in s or 'entrepano' in s:return 'Entrepaño'
 if 'fondo gaveta' in s or 'base_gaveta' in s:return 'Base gaveta'
 if 'trasero cajon' in s or 'trasero_gaveta' in s:return 'Trasero gaveta'
 if 'frente gaveta' in s or 'frente_gaveta' in s:return 'Frente gaveta'
 if 'door' in s or s=='frente':return 'Puerta'
 if 'backing' in s or s=='fondo':return 'Fondo'
 if 'base' in s:return 'Base'
 if 'tapa' in s:return 'Tapa'
 return 'Panel / filler / zócalo'
records=[]
for line in data['lineas']:
 code=line['codigo_modulo'];prefix=code.replace('/','_');special=code.startswith('PN21 ')
 candidates=[h for h in hdr if pathlib.Path(h['file']).name.startswith('PN21 ' if special else prefix+' ')]
 assert len(candidates)==1,(code,len(candidates));h=candidates[0];app=[]
 for p in line['breakdown']['piezas']:
  if p['cant']<=0:continue
  L=p['largoIn']*25.4;W=p['anchoIn']*25.4;q=p['cant'];T={'caja':15,'refuerzo':15,'frente':18,'fondo':6}[p['rol']]
  a=dict(name=p['pieza'],q=q,L=L,W=W,T=T,ct=float(p['cantoCalibre'].split('x')[1].replace(',','.')) if p['cantoCalibre'] else 0,lc=p['cantoLargos'],wc=p['cantoAnchos'],area=L*W*q/1e6,edge=q*(L*p['cantoLargos']+W*p['cantoAnchos'])/1000)
  app.append(a)
 # Expand quantities and pair by function plus nearest dimensions; dimensions can be rotated.
 expanded=[dict(p,q=1,area=p['area']/p['q'],edge=p['edge']/p['q']) for p in app for _ in range(int(p['q']))];pairs=[];available=list(range(len(expanded)))
 for r in h['rows']:
  same=[i for i in available if cat(expanded[i]['name'])==cat(r['name'])]
  if same:
   def dist(i):
    a=expanded[i];return min(abs(a['L']-r['L'])+abs(a['W']-r['W']),abs(a['W']-r['L'])+abs(a['L']-r['W']))
   idx=min(same,key=dist); a=expanded[idx];available.remove(idx);delta_dim=dist(idx)
  else:a=None;delta_dim=None
  pairs.append(dict(hdr=r,app=a,dim_delta=delta_dim))
 for i in available:pairs.append(dict(hdr=None,app=expanded[i],dim_delta=None))
 b=line['breakdown']; rec=dict(code=code,line=line,hdr=h,app=app,pairs=pairs,special=special,hq=len(h['rows']),aq=sum(p['q'] for p in app),ha=sum(r['area'] for r in h['rows']),aa=sum(r['area'] for r in app),he=sum(r['edge'] for r in h['rows']),ae=sum(r['edge'] for r in app),ab=sum(r['m2'] for r in b['maderaPorRol']),eb=sum(r['metros'] for r in b['cantoPorCalibre']))
 assert abs(rec['aa']-sum(p['areaCm2'] for p in b['piezas'])/10000)<.00001
 records.append(rec)
(root/'comparison.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
for r in records:print(r['code'], 'pzs',r['hq'],r['aq'],'m2',round(r['ha'],6),round(r['aa'],6),'canto',round(r['he'],4),round(r['ae'],4),'fact',round(r['ab'],6),r['eb'])
print('TOTAL', {k:sum(r[k] for r in records) for k in ['hq','aq','ha','aa','he','ae','ab','eb']})
print('ALL PDF CELLS VALIDATED',sum(len(h['rows'])*8 for h in hdr))

